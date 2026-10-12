import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // pdf.js and mammoth load their own files at runtime; bundling them breaks text extraction.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth"],
  async redirects() {
    return [{ source: "/settings", destination: "/settings/profile", permanent: false }];
  },
  partialPrefetching: true,
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
