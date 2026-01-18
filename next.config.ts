
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Optimized for Docker/Cloud Run
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
