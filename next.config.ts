import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // For optimized Docker builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
