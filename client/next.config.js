/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Add a rewrite rule to handle API requests
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  // Configure public asset directory
  publicRuntimeConfig: {
    staticFolder: '/public',
  },
};

module.exports = nextConfig;