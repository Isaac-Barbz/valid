import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  async redirects() {
    // Communities moved from c/ to v/ (PR #3); keep old links working.
    return [{ source: "/c/:slug", destination: "/v/:slug", permanent: true }];
  },
  partialPrefetching: true,
  experimental: {
    // Space image uploads: resized to WebP in the browser, capped at 2 MB (+ form overhead).
    serverActions: { bodySizeLimit: "2.5mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
