import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next 15: typedRoutes nicht mehr unter "experimental"
  typedRoutes: true,
  // Verhindert, dass ein ESLint-Patch-Problem den Build stoppt
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [],
  },
  webpack(config) {
    return config;
  },
};

export default nextConfig;

