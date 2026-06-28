import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // On Vercel, bake the full proxy URL into the client bundle so ClerkJS
    // routes through /__clerk instead of calling clerk.accounts.dev directly.
    // VERCEL_URL is always set by Vercel at build time.
    ...(process.env.VERCEL === "1" && process.env.VERCEL_URL
      ? {
          NEXT_PUBLIC_CLERK_PROXY_URL: `https://${process.env.VERCEL_URL}/__clerk`,
        }
      : {}),
  },
};

export default nextConfig;
