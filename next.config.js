/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Allow Google profile photos via NextAuth
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Allow Unsplash for destination imagery
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
