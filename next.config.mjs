/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Keep server-only deps (bullmq/ioredis/prisma) out of the RSC bundle.
  experimental: {
    serverComponentsExternalPackages: [
      "bullmq",
      "ioredis",
      "@prisma/client",
      "google-trends-api",
    ],
  },
  async rewrites() {
    // Serve the Google News sitemap at a clean .xml URL backed by a non-dotted
    // route (Next doesn't reliably route folders containing a dot).
    return [{ source: "/news-sitemap.xml", destination: "/news-sitemap" }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
