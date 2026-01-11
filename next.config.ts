import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have type declarations
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

const withPWAConfig = withPWA({
  dest: "public",
  disable: false, // Set to true to disable PWA in development
  register: true,
  skipWaiting: false,
  runtimeCaching: [
    // Cache API responses
    {
      urlPattern: /^https:\/\/.*\/api\/.*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
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
          maxEntries: 100,
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
        networkTimeoutSeconds: 10,
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
