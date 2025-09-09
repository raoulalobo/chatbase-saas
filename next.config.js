/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Corriger le problème de workspace root sur Vercel
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
