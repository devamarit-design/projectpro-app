
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true, // Enable Gzip compression
  images: {
    // Enable optimization
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow external images (Firebase Storage, etc.)
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // optimizePackageImports: ['lucide-react', 'date-fns'], // Optional: Improve tree-shaking
  },
};

export default nextConfig;
