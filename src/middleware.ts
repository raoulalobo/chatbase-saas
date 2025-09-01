import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Middleware de protection des routes avec NextAuth
 * - Protège les routes privées (/dashboard, /agents, /profile)
 * - Redirige vers /login si non authentifié
 * - Redirige vers /dashboard si déjà connecté sur /login ou /register
 * - Gestion des redirections après connexion
 */

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Si l'utilisateur est connecté et essaie d'accéder aux pages auth
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Laisser passer pour toutes les autres routes protégées
    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/login',
      signUp: '/register',
    },
    callbacks: {
      // Autoriser l'accès si l'utilisateur a un token valide
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Pages publiques (toujours accessibles)
        const publicPages = [
          '/',
          '/login', 
          '/register',
          '/api/auth/register',
          '/api/auth',
        ]

        // Vérifier si la page est publique
        const isPublicPage = publicPages.some(page => 
          pathname === page || pathname.startsWith('/api/auth/')
        )

        if (isPublicPage) {
          return true
        }

        // Pour les pages protégées, vérifier la présence du token
        return !!token
      },
    },
  }
)

// Configuration des routes à protéger
export const config = {
  matcher: [
    /*
     * Correspondre à tous les chemins de requête sauf ceux commençant par :
     * - api/auth (API routes NextAuth)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - / (page d'accueil publique)
     * Et inclure spécifiquement :
     * - /dashboard/* (tableau de bord)
     * - /agents/* (gestion des agents)
     * - /profile/* (profil utilisateur)
     * - /login (pour redirection si connecté)
     * - /register (pour redirection si connecté)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    '/dashboard/:path*',
    '/agents/:path*',
    '/profile/:path*',
    '/login',
    '/register',
  ]
}