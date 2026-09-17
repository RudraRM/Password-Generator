import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: ["terminal.local"],
  images: { unoptimized: true },
};

export default nextConfig;
