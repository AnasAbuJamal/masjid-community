import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    DATABASE_URL: "postgresql://neondb_owner:npg_Ocwbk8euACN1@ep-misty-violet-anantp0v-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    AUTH_SECRET: "784afde09214b7e8029c7d428fa69612347eb10b65f7c8ecbdad651ec3bc1b47",
    ADMIN_SEED_EMAIL: "admin@almomineen.org",
    ADMIN_SEED_PASSWORD: "AdminPass123!",
    NEXT_PUBLIC_APP_URL: "https://masjid-community.vercel.app",
    STRIPE_SECRET_KEY: "sk_test_123",
    STRIPE_PUBLISHABLE_KEY: "pk_test_123",
    STRIPE_WEBHOOK_SECRET: "whsec_123",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
    STRIPE_SUCCESS_URL: "https://masjid-community.vercel.app/donate/thank-you",
    STRIPE_CANCEL_URL: "https://masjid-community.vercel.app/donate",
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
