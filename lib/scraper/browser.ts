import type { Browser } from "playwright-core";
import { addExtra } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export async function launchBrowser(): Promise<Browser> {
  if (isServerless) {
    const { chromium } = await import("playwright-core");
    const extraChromium = addExtra(chromium);
    extraChromium.use(StealthPlugin());
    
    // Bypass Webpack/Turbopack so it doesn't relocate the Sparticuz binaries
    const chromiumModule = typeof require !== "undefined" 
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ? require("@sparticuz/chromium") 
      : await import("@sparticuz/chromium");
    const chromiumBinary = chromiumModule.default || chromiumModule;
    return extraChromium.launch({
      args: chromiumBinary.args,
      executablePath: await chromiumBinary.executablePath(),
      headless: true,
    });
  }

  const { chromium } = await import("playwright");
  const extraChromium = addExtra(chromium);
  extraChromium.use(StealthPlugin());
  return extraChromium.launch({ headless: true }) as unknown as Browser;
}
