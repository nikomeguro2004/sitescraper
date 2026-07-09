import fs from "fs";
import path from "path";
import type { BrowserContext } from "playwright-core";

let cachedStealthScript: string | null = null;

export async function applyStealth(context: BrowserContext): Promise<void> {
  if (!cachedStealthScript) {
    const scriptPath = path.join(process.cwd(), "lib", "scraper", "stealth.min.js");
    cachedStealthScript = fs.readFileSync(scriptPath, "utf8");
  }
  
  await context.addInitScript(cachedStealthScript);
  await context.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
}
