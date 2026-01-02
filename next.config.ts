import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.wired.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'techcrunch.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.vox-cdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'platform.theverge.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.wired.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.techcrunch.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.theverge.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
