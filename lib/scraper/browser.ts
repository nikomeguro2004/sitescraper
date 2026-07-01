import type { Browser } from "playwright-core";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export async function launchBrowser(): Promise<Browser> {
  if (isServerless) {
    const { chromium } = await import("playwright-core");
    const chromiumBinary = (await import("@sparticuz/chromium")).default;
    return chromium.launch({
      args: chromiumBinary.args,
      executablePath: await chromiumBinary.executablePath(),
      headless: true,
    });
  }

  const { chromium } = await import("playwright");
  return chromium.launch({ headless: true }) as unknown as Browser;
}
