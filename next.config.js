/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Removed to enable dynamic API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: '/help',
        destination: '/support/help',
        permanent: true,
      },
      {
        source: '/plans',
        destination: '/product/plans',
        permanent: true,
      },
      {
        source: '/pricing',
        destination: '/product/plans',
        permanent: true,
      },
      {
        source: '/product/pricing',
        destination: '/product/plans',
        permanent: true,
      },
      {
        source: '/settings',
        destination: '/#settings',
        permanent: false,
      },
      {
        source: '/upgrade',
        destination: '/product/plans',
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "bufferutil": false,
      "utf-8-validate": false,
    };
    return config;
  },
};

module.exports = nextConfig;
