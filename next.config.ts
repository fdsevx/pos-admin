import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export for 100% compatibility with Cloudflare Pages
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
