import type { BrowserContext } from "playwright-core";

/**
 * Patches the handful of headless-Chromium fingerprints that basic bot
 * checks look for. Not a full stealth suite (that was puppeteer-extra's
 * job, which we dropped — see browser.ts) — just the cheap, high-value
 * signals: navigator.webdriver, an empty plugins array, and a missing
 * window.chrome runtime object.
 */
export async function applyStealth(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "webdriver", { get: () => undefined });

    Object.defineProperty(Navigator.prototype, "plugins", {
      get: () => [1, 2, 3, 4, 5].map(() => ({ name: "Chrome PDF Plugin" })),
    });

    Object.defineProperty(Navigator.prototype, "languages", {
      get: () => ["en-US", "en"],
    });

    const win = window as unknown as { chrome?: unknown };
    if (!win.chrome) {
      win.chrome = { runtime: {} };
    }
  });

  await context.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
}
