import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "playwright-core",
    "playwright",
    "@sparticuz/chromium",
    "playwright-extra",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin",
  ],
  outputFileTracingIncludes: {
    "/api/**/*": [
      "node_modules/playwright-core/browsers.json",
      "node_modules/@sparticuz/chromium/bin/**/*"
    ],
  },
};

export default nextConfig;
