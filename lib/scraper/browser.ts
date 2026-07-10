import type { Browser } from "playwright-core";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Reduces the most common headless-detection signals without pulling in
// puppeteer-extra's dependency chain, which breaks Vercel's serverless file
// tracing (a transitive dep, is-plain-object, doesn't make it into the
// deployed bundle no matter how serverExternalPackages is configured).
const STEALTH_ARGS = ["--disable-blink-features=AutomationControlled"];

export async function launchBrowser(): Promise<Browser> {
  if (isServerless) {
    const { chromium } = await import("playwright-core");

    // Bypass Webpack/Turbopack so it doesn't relocate the Sparticuz binaries
    const chromiumModule = typeof require !== "undefined"
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ? require("@sparticuz/chromium")
      : await import("@sparticuz/chromium");
    const chromiumBinary = chromiumModule.default || chromiumModule;
    return chromium.launch({
      args: [...chromiumBinary.args, ...STEALTH_ARGS],
      executablePath: await chromiumBinary.executablePath(),
      headless: true,
    });
  }

  const { chromium } = await import("playwright");
  return chromium.launch({ headless: true, args: STEALTH_ARGS }) as unknown as Browser;
}
