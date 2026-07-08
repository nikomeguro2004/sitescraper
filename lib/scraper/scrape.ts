import type { BrowserContext } from "playwright-core";
import { launchBrowser } from "@/lib/scraper/browser";
import { extractPageData, extractSubPageData, discoverInternalLinks } from "@/lib/scraper/extract";
import type { ScrapedPageData, SubPageData } from "@/lib/types/audit";

const MAX_SUB_PAGES = 3;
const SUB_PAGE_TIMEOUT_MS = 12_000;

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

export async function scrapeWebsite(rawUrl: string): Promise<ScrapedPageData> {
  const url = normalizeUrl(rawUrl);
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
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      locale: "en-US",
      timezoneId: "Asia/Kolkata",
      colorScheme: "light",
      javaScriptEnabled: true,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
        "Upgrade-Insecure-Requests": "1",
      },
    });
    const page = await context.newPage();

    let response;
    try {
      response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    } catch (firstErr) {
      console.error("[Scrape Error] First attempt failed:", firstErr);
      // One retry — redirect chains and TLS handshakes are often transiently flaky.
      try {
        response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      } catch (secondErr) {
        console.error("[Scrape Error] Second attempt failed:", secondErr);
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

    await page.waitForTimeout(1200).catch(() => {});

    const title = await page.title();
    const html = await page.content();

    if (
      title.includes("Security") ||
      html.includes("Security Checkpoint") ||
      html.includes("__vercel")
    ) {
      throw new ScrapeError("Blocked by website protection.", "blocked");
    }

    // Above-the-fold shot for the vision model (tall full-page images get downscaled to mush).
    const viewportBuffer = await page.screenshot({ type: "jpeg", quality: 80, timeout: 10000 }).catch(() => null);
    const screenshotBuffer = await page.screenshot({ type: "jpeg", quality: 70, fullPage: true, timeout: 15000 }).catch(() =>
      page.screenshot({ type: "jpeg", quality: 70, timeout: 10000 }),
    );
    const screenshot = `data:image/jpeg;base64,${screenshotBuffer.toString("base64")}`;

    const data = extractPageData(html, url, page.url(), screenshot);
    if (viewportBuffer) data.viewportScreenshot = `data:image/jpeg;base64,${viewportBuffer.toString("base64")}`;

    const subPageUrls = discoverInternalLinks(html, page.url(), MAX_SUB_PAGES);
    data.subPages = await crawlSubPages(context, subPageUrls);

    await context.close();
    return data;
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Crawl sub-pages in parallel; failures are skipped, never fatal — the homepage audit still works. */
async function crawlSubPages(context: BrowserContext, urls: string[]): Promise<SubPageData[]> {
  const results = await Promise.all(
    urls.map(async (subUrl) => {
      try {
        const page = await context.newPage();
        try {
          const res = await page.goto(subUrl, { waitUntil: "domcontentloaded", timeout: SUB_PAGE_TIMEOUT_MS });
          if (!res || res.status() >= 400) return null;
          await page.waitForTimeout(600).catch(() => {});
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
