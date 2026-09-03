import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions cap request bodies at 1MB by default, which makes any
    // real photo upload (avatar, product media) fail with "Failed to fetch".
    // Raise it to match the media library's stated 50MB limit.
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
