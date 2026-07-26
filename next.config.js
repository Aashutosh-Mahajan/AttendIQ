/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow Next.js image optimization for external domains if needed
  images: {
    remotePatterns: [],
  },

  // Silence the `next lint` deprecation warning in CI
  eslint: {
    // We run lint as a separate CI step — don't fail the build on lint errors
    ignoreDuringBuilds: false,
  },

  // Silence TypeScript errors crashing the build (tsc --noEmit handles this)
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
