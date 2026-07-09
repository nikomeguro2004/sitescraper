import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "playwright", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/**/*": [
      "node_modules/playwright-core/browsers.json",
      "node_modules/@sparticuz/chromium/bin/**/*",
      "lib/scraper/stealth.min.js"
    ],
  },
};

export default nextConfig;
