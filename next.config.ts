
import type { NextConfig } from "next";
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development to prevent infinite loops
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // @ts-ignore
  turbopack: {},
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
    scrollRestoration: true, // Enable scroll position restoration on iOS back/swipe
    // optimizePackageImports: ['lucide-react', 'date-fns'], // Optional: Improve tree-shaking
  },
};

export default withPWA(nextConfig);
