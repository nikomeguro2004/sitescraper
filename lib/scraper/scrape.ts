import { launchBrowser } from "@/lib/scraper/browser";
import { extractPageData } from "@/lib/scraper/extract";
import type { ScrapedPageData } from "@/lib/types/audit";

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
  } catch (err: any) {
    const msg = err?.message || String(err);
    throw new ScrapeError(`Couldn't start the analysis engine. Please try again. Error: ${msg}`, "unknown");
  }

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 SiteElevateBot/1.0",
    });
    const page = await context.newPage();

    let response;
    try {
      response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("timeout")) {
        throw new ScrapeError("The website took too long to respond.", "timeout");
      }
      throw new ScrapeError("Couldn't reach that website. It may be down or blocking automated visits.", "blocked");
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

    const html = await page.content();
    const screenshotBuffer = await page.screenshot({ type: "jpeg", quality: 70, fullPage: true, timeout: 15000 }).catch(() =>
      page.screenshot({ type: "jpeg", quality: 70, timeout: 10000 }),
    );
    const screenshot = `data:image/jpeg;base64,${screenshotBuffer.toString("base64")}`;

    const data = extractPageData(html, url, page.url(), screenshot);
    await context.close();
    return data;
  } finally {
    await browser.close().catch(() => {});
  }
}
