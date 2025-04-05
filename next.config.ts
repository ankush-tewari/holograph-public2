import type { NextConfig } from "next";

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
