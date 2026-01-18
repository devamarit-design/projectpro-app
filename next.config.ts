
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Optimized for Docker/Cloud Run
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
