const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Corriger le problème de workspace root avec 19 lockfiles détectés
  outputFileTracingRoot: path.join(__dirname, './'),
  // Configuration de tracing des fichiers (sortie d'experimental dans Next.js 15+)
  outputFileTracingIncludes: {
    '/**/*': ['./src/**/*']
  },
  // Alias webpack pour résoudre les imports @/* sur Vercel
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    }
    return config
  },
};

module.exports = nextConfig;
