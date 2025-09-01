/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour la production
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig