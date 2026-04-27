import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gzip responses (helps on shared hosting that doesn't compress)
  compress: true,
  // Don't expose the X-Powered-By: Next.js header
  poweredByHeader: false,
  // React strict mode catches subtle bugs in dev
  reactStrictMode: true,
  // Allow Next/Image to load product/blog images served from /storage on the same domain
  images: {
    // Modern formats — Next/Image will negotiate the best format per browser.
    // AVIF gives the smallest files; WebP is the universal fallback.
    formats: ["image/avif", "image/webp"],
    // 30-day cache for the optimized image responses (browsers + CDN).
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [320, 420, 640, 768, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384, 512],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Long-lived caching headers for static assets (JS/CSS/fonts/images)
  // and a leaner Cache-Control for HTML so users see fresh content.
  // Note: we intentionally do NOT override /_next/static/* — Next.js already
  // applies `public, max-age=31536000, immutable` there, and adding our own
  // header triggers a dev-mode warning and can break HMR.
  async headers() {
    const oneYear = "public, max-age=31536000, immutable";
    return [
      // Storefront static images / fonts / svgs
      { source: "/img/:path*", headers: [{ key: "Cache-Control", value: oneYear }] },
      { source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: oneYear }] },
      { source: "/favicon.ico", headers: [{ key: "Cache-Control", value: oneYear }] },
      { source: "/site.webmanifest", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
      // User-uploaded product/blog assets — long cache, but allow revalidation
      {
        source: "/storage/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      // Sitemap / robots — small, daily-fresh
      { source: "/sitemap.xml", headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400" }] },
      { source: "/robots.txt", headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400" }] },
      // Security headers across the whole site
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
  // Limit parallelism so the build doesn't hit EAGAIN on shared hosts
  // (CloudLinux/cPanel caps concurrent processes per account).
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
