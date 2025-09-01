"use client"

import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { useAuth } from '@/stores/authStore'
import type { Session } from 'next-auth'

/**
 * Provider d'authentification qui combine NextAuth et Zustand
 * - Wrapper SessionProvider de NextAuth
 * - Composant AuthSync pour synchroniser les états
 * - Initialisation automatique de l'authentification
 * - Gestion de l'hydration côté client
 */

interface AuthProviderProps {
  children: React.ReactNode
  session?: Session | null
}

// Composant interne pour synchroniser NextAuth avec Zustand
function AuthSync() {
  const { initializeAuth } = useAuth()

  useEffect(() => {
    // Initialiser l'authentification côté client
    initializeAuth()
  }, [initializeAuth])

  return null
}

// Provider principal qui wrap l'application
export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session}>
      <AuthSync />
      {children}
    </SessionProvider>
  )
}

// Hook utilitaire pour vérifier si l'utilisateur est connecté
export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth()

  return {
    isAuthenticated,
    isLoading,
    user,
    // Helper pour vérifier si l'auth est prête (pas en loading)
    isReady: !isLoading,
    // Helper pour vérifier si l'utilisateur doit être redirigé
    shouldRedirectToLogin: !isLoading && !isAuthenticated,
  }
}