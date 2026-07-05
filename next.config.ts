import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse uses browser DOM APIs (DOMMatrix) at module load time.
  // Marking it as external tells Next.js to load it as a native Node module
  // instead of bundling it, which avoids the crash on Vercel serverless.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
