import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have type declarations
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  // Optimize images with valid Next.js 16 format
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  // Production source maps disabled for faster builds
  productionBrowserSourceMaps: false,
};

const withPWAConfig = withPWA({
  dest: "public",
  disable: false, // Set to true to disable PWA in development
  register: true,
  skipWaiting: false,
  runtimeCaching: [
    // Cache API responses with NetworkFirst strategy
    {
      urlPattern: /^https:\/\/.*\/api\/.*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 5, // Faster timeout for better UX
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache static files
    {
      urlPattern: /^https:\/\/.*\.(js|css|woff2)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Cache images
    {
      urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Cache HTML pages (Network first for fresh content)
    {
      urlPattern: /^https:\/\/.*\/$|\.html$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "html-cache",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
  ],
  buildExcludes: [
    /middleware-manifest\.json$/,
    /.*\.map$/,
    /hot-update\.(js|json)$/,
  ],
});

export default withPWAConfig(nextConfig);
