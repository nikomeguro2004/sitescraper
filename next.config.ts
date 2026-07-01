import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "playwright", "@sparticuz/chromium"],
};

export default nextConfig;
