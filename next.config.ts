import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^\/dashboard\/equipment\/[^\/]+\/card$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'emergency-cards-cache',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: /^\/dashboard\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'dashboard-pages-cache',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      {
        urlPattern: /^\/api\/.*/i,
        handler: 'NetworkOnly',
      },
    ],
  },
});

export default withPWA(nextConfig);
