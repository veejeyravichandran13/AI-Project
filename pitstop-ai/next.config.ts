import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: `npm run build` writes ./out, which any static host (or `npx serve out`) can serve.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
