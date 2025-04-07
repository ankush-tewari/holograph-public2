// nextconfig.ts

import type { NextConfig } from "next";

// ✅ Prevent Prisma from failing during `next build` when env is missing
//process.env.DATABASE_URL ||= "file:skip-prisma-validation";

// ✅ Prevent Prisma + GCS from crashing `next build`  -trying something new
if (process.env.NODE_ENV === "production") {
  process.env.DATABASE_URL ||= "file:skip-prisma-validation";
  process.env.GCS_BUCKET_NAME ||= "fake-bucket-for-build";
  process.env.GOOGLE_CLOUD_PROJECT ||= "fake-project-for-build";
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/holographs",
        destination: "/dashboard",
        permanent: false, // safe for dev, doesn’t get cached by browsers
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Ignore ESLint errors during build
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Ignore TS errors during build
  },
};

export default nextConfig;
