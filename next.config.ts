import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow Google profile photos via NextAuth
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Allow Unsplash for destination imagery
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
