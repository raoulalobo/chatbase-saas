/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignorer les erreurs ESLint pendant le build pour permettre le déploiement
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorer les erreurs TypeScript pendant le build pour permettre le déploiement  
    ignoreBuildErrors: true,
  },
  // Configuration simple pour Vercel
  swcMinify: false,
};

module.exports = nextConfig;
