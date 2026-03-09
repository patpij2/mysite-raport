import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mysite.ai",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
