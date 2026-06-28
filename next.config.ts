import type { NextConfig } from "next";

// No manual proxy config needed — Clerk SDK auto-proxies through /__clerk
// on *.vercel.app when using production keys (pk_live_).
const nextConfig: NextConfig = {};

export default nextConfig;
