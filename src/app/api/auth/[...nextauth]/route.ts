import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Route handler NextAuth.js
 * Importe la configuration depuis @/lib/auth pour éviter la duplication
 */

// Handlers pour les méthodes HTTP
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }