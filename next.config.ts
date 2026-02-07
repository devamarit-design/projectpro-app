
import type { NextConfig } from "next";
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development to prevent infinite loops
  workboxOptions: {
    disableDevLogs: true,
  },
});

import packageJson from "./package.json";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  // @ts-ignore
  turbopack: {},
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
  outputFileTracingRoot: process.cwd(),
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    scrollRestoration: true, // Enable scroll position restoration on iOS back/swipe
    optimizePackageImports: ['lucide-react', 'date-fns', 'lodash', 'recharts'], // Optional: Improve tree-shaking
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/workbox-:hash.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          }
        ]
      }
    ]
  },
};

export default withPWA(nextConfig);
