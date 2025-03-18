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
};

export default nextConfig;
