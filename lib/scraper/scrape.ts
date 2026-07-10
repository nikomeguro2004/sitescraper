import type { BrowserContext } from "playwright-core";
import { launchBrowser } from "@/lib/scraper/browser";
import { applyStealth } from "@/lib/scraper/stealth";
import { extractPageData, extractSubPageData, discoverInternalLinks } from "@/lib/scraper/extract";
import type { ScrapedPageData, SubPageData } from "@/lib/types/audit";

const MAX_SUB_PAGES = 2;
const SUB_PAGE_TIMEOUT_MS = 8_000;
// Below this much remaining budget, skip the sub-page crawl entirely —
// better to return a homepage-only audit than blow the route's deadline.
const MIN_BUDGET_FOR_SUBPAGES_MS = 8_000;

export class ScrapeError extends Error {
  constructor(
    message: string,
    public code: "invalid_url" | "timeout" | "blocked" | "unknown",
  ) {
    super(message);
    this.name = "ScrapeError";
  }
}

export function normalizeUrl(input: string): string {
  let value = input.trim();
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const parsed = new URL(value);
    if (!parsed.hostname.includes(".")) {
      throw new ScrapeError("That doesn't look like a valid domain.", "invalid_url");
    }
    return parsed.toString();
  } catch {
    throw new ScrapeError("That doesn't look like a valid URL.", "invalid_url");
  }
}

/**
 * @param deadlineAt Absolute Date.now()-style timestamp the scrape should
 * finish by. Falls back to a fixed 25s budget if not provided.
 */
export async function scrapeWebsite(rawUrl: string, deadlineAt?: number): Promise<ScrapedPageData> {
  const url = normalizeUrl(rawUrl);
  const deadline = deadlineAt ?? Date.now() + 25_000;
  let browser;

  try {
    browser = await launchBrowser();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ScrapeError(`Couldn't start the analysis engine. Please try again. Error: ${msg}`, "unknown");
  }

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    });
    await applyStealth(context);
    const page = await context.newPage();

    // Navigation timeout shrinks with whatever's left of the scrape budget
    // (cold-start browser launches can already eat a big chunk of it), but
    // never drops below a floor where a fast site still has a fair shot.
    const navTimeout = Math.max(5_000, Math.min(15_000, deadline - Date.now() - 4_000));

    let response;
    try {
      response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: navTimeout });
    } catch (firstErr) {
      const retryTimeout = deadline - Date.now() - 2_000;
      // One retry — redirect chains and TLS handshakes are often transiently
      // flaky — but only if there's meaningfully more time to try it in.
      if (retryTimeout < 4_000) {
        throw new ScrapeError("The website took too long to respond.", "timeout");
      }
      try {
        response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: retryTimeout });
      } catch {
        const message = firstErr instanceof Error ? firstErr.message : "";
        if (message.includes("timeout")) {
          throw new ScrapeError("The website took too long to respond.", "timeout");
        }
        throw new ScrapeError("Couldn't reach that website. It may be down or blocking automated visits.", "blocked");
      }
    }

    if (!response) {
      throw new ScrapeError("Couldn't reach that website.", "blocked");
    }

    const status = response.status();
    if (status === 403 || status === 401 || status === 429) {
      throw new ScrapeError("That site is blocking automated visits.", "blocked");
    }
    if (status >= 500) {
      throw new ScrapeError("The website is currently returning server errors.", "blocked");
    }

    await page.waitForTimeout(800).catch(() => {});

    const html = await page.content();

    // Single viewport screenshot first (fast, always attempted) — this is
    // what the vision pass and, if the full-page shot fails, the report
    // header both fall back to. A failed screenshot must never fail the
    // whole audit; serverless cold starts occasionally drop the page mid-shot.
    const viewportTimeout = Math.max(3_000, Math.min(8_000, deadline - Date.now() - 2_000));
    const viewportBuffer = await page.screenshot({ type: "jpeg", quality: 80, timeout: viewportTimeout }).catch(() => null);

    let fullPageBuffer: Buffer | null = null;
    if (deadline - Date.now() > 6_000) {
      fullPageBuffer = await page
        .screenshot({ type: "jpeg", quality: 65, fullPage: true, timeout: Math.min(8_000, deadline - Date.now() - 2_000) })
        .catch(() => null);
    }

    const primaryBuffer = fullPageBuffer ?? viewportBuffer;
    const screenshot = primaryBuffer ? `data:image/jpeg;base64,${primaryBuffer.toString("base64")}` : "";

    const data = extractPageData(html, url, page.url(), screenshot);
    if (viewportBuffer) data.viewportScreenshot = `data:image/jpeg;base64,${viewportBuffer.toString("base64")}`;

    if (deadline - Date.now() > MIN_BUDGET_FOR_SUBPAGES_MS) {
      const subPageUrls = discoverInternalLinks(html, page.url(), MAX_SUB_PAGES);
      data.subPages = await crawlSubPages(context, subPageUrls, deadline);
    }

    await context.close();
    return data;
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Crawl sub-pages in parallel; failures are skipped, never fatal — the homepage audit still works. */
async function crawlSubPages(context: BrowserContext, urls: string[], deadline: number): Promise<SubPageData[]> {
  const timeoutMs = Math.min(SUB_PAGE_TIMEOUT_MS, Math.max(3_000, deadline - Date.now() - 1_500));
  const results = await Promise.all(
    urls.map(async (subUrl) => {
      try {
        const page = await context.newPage();
        try {
          const res = await page.goto(subUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
          if (!res || res.status() >= 400) return null;
          await page.waitForTimeout(400).catch(() => {});
          const html = await page.content();
          return extractSubPageData(html, page.url());
        } finally {
          await page.close().catch(() => {});
        }
      } catch {
        return null;
      }
    }),
  );
  return results.filter((p): p is SubPageData => p !== null);
}
