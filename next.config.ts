import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // The practice app (ky am/sax-tap, built with `npm run player`) is a static
  // site in public/learn: the public folder does not serve index.html by itself.
  async rewrites() {
    return [{ source: "/learn", destination: "/learn/index.html" }];
  },
  async headers() {
    return [
      // the practice app's JS/CSS have a content hash in their names: cache forever
      {
        source: "/learn/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // instrument samples and fonts change rarely: a month, then revalidate
      {
        source: "/learn/:dir(sax|inst|fonts)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      // preview deployments must not be indexed as duplicates
      {
        source: "/:path*",
        has: [{ type: "host", value: ".+\.vercel\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
