import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static export: the site can be hosted on any static host (or opened
  // from a folder) with no server runtime. sitemap/robots are generated at
  // build time when NEXT_PUBLIC_SITE_URL is set.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  poweredByHeader: false,
};

export default nextConfig;
