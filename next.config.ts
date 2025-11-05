import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  images: { remotePatterns: [] },
  webpack(config) {
    return config;
  },
};

export default nextConfig;
