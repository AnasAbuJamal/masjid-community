import type { NextConfig } from "next";

// Secrets belong in deployment environment variables, never in next.config.ts.
// Next.js can otherwise inline these values into generated application bundles.
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
