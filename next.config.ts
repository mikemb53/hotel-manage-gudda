import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize images from OTA logos or hotel photos
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.airbnb.com" },
      { protocol: "https", hostname: "*.booking.com" },
    ],
  },
  // Expose public env vars to client
  env: {
    NEXT_PUBLIC_APP_NAME: "HotelSync",
  },
  // Experimental: server actions enabled by default in Next 14+
  experimental: {},
};

export default nextConfig;
