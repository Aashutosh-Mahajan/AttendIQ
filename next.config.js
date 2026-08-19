/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Package import optimization for faster page load & smaller bundle sizes
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },

  // Allow Next.js image optimization for external domains if needed
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Silence the `next lint` deprecation warning in CI
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Silence TypeScript errors crashing the build (tsc --noEmit handles this)
  typescript: {
    ignoreBuildErrors: false,
  },

  // HTTP Response caching headers for static assets
  async headers() {
    return [
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|svg|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
