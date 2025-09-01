import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import type { AuthOptions } from 'next-auth'

/**
 * Configuration NextAuth.js avec Drizzle adapter
 * - Provider credentials pour authentification email/password
 * - Intégration avec la base de données PostgreSQL
 * - Gestion sécurisée des sessions et callbacks
 * - Hash des mots de passe avec bcrypt
 */

export const authOptions: AuthOptions = {
  adapter: DrizzleAdapter(db),
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis')
        }

        try {
          // Rechercher l'utilisateur par email
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1)

          if (!user || user.length === 0) {
            throw new Error('Aucun utilisateur trouvé avec cet email')
          }

          const foundUser = user[0]

          // Vérifier si l'utilisateur a un mot de passe (peut être null pour OAuth)
          if (!foundUser.passwordHash) {
            throw new Error('Ce compte utilise une connexion sociale')
          }

          // Vérifier le mot de passe
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            foundUser.passwordHash
          )

          if (!isValidPassword) {
            throw new Error('Mot de passe incorrect')
          }

          // Retourner les données utilisateur (sans le hash du mot de passe)
          return {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
          }
        } catch (error) {
          console.error('Erreur d\'authentification:', error)
          throw error
        }
      }
    })
  ],

  // Pages personnalisées
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/login', // Redirection en cas d'erreur
  },

  // Configuration des sessions
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  },

  // Configuration JWT
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  },

  // Callbacks pour personnaliser le comportement
  callbacks: {
    // Callback JWT - appelé chaque fois qu'un JWT est créé/mis à jour
    async jwt({ token, user, account }) {
      // Si c'est une nouvelle connexion, ajouter les infos user au token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      
      return token
    },

    // Callback Session - appelé chaque fois qu'une session est vérifiée
    async session({ session, token }) {
      // Ajouter les infos du token à la session
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      
      return session
    },

    // Callback de redirection après connexion/déconnexion
    async redirect({ url, baseUrl }) {
      // Si l'URL commence par baseUrl, l'utiliser (URL relative)
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Si l'URL commence par /, c'est une URL relative valide
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Sinon, rediriger vers le dashboard par défaut
      return `${baseUrl}/dashboard`
    }
  },

  // Événements pour logging (optionnel)
  events: {
    async signIn({ user, account, profile }) {
      console.log(`✅ Connexion réussie: ${user.email}`)
    },
    async signOut({ session, token }) {
      console.log(`👋 Déconnexion: ${token?.email || 'utilisateur'}`)
    },
    async createUser({ user }) {
      console.log(`👤 Nouvel utilisateur créé: ${user.email}`)
    }
  },

  // Configuration de debug (seulement en développement)
  debug: process.env.NODE_ENV === 'development',
}

// Handlers pour les méthodes HTTP
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }