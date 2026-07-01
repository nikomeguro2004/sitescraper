import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "playwright", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/**/*": ["node_modules/playwright-core/browsers.json"],
  },
};

export default nextConfig;
