import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gzip responses (helps on shared hosting that doesn't compress)
  compress: true,
  // Don't expose the X-Powered-By: Next.js header
  poweredByHeader: false,
  // Allow Next/Image to load product/blog images served from /storage on the same domain
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
