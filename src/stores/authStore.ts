import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { signIn, signOut, getSession } from 'next-auth/react'
import type { User } from 'next-auth'

/**
 * Store d'authentification Zustand pour gérer l'état global
 * - Intégration avec NextAuth.js pour la sécurité
 * - Actions complètes : login, register, logout
 * - Synchronisation automatique avec les sessions
 * - Persistence optionnelle avec localStorage
 * - TypeScript strict avec inférence complète
 */

export interface AuthUser extends User {
  id: string
  name: string
  email: string
  image?: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginData {
  email: string
  password: string
}

interface AuthState {
  // État de l'authentification
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  // Actions d'authentification
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  
  // Actions de gestion d'état
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearAuth: () => void
  
  // Synchronisation avec NextAuth
  syncWithSession: () => Promise<void>
  initializeAuth: () => Promise<void>
}

const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,

        // Action de connexion
        login: async (data: LoginData) => {
          set({ isLoading: true, error: null })
          
          try {
            const result = await signIn('credentials', {
              email: data.email,
              password: data.password,
              redirect: false,
            })

            if (result?.error) {
              set({ 
                isLoading: false, 
                error: result.error === 'CredentialsSignin' 
                  ? 'Email ou mot de passe incorrect' 
                  : 'Erreur de connexion'
              })
              return { success: false, error: result.error }
            }

            // Synchroniser avec la session après connexion réussie
            await get().syncWithSession()
            set({ isLoading: false, error: null })
            
            return { success: true }
          } catch (error) {
            console.error('Erreur lors de la connexion:', error)
            set({ 
              isLoading: false, 
              error: 'Erreur de connexion. Veuillez réessayer.' 
            })
            return { success: false, error: 'Erreur de connexion' }
          }
        },

        // Action d'inscription
        register: async (data: RegisterData) => {
          set({ isLoading: true, error: null })
          
          try {
            // Validation côté client
            if (data.password !== data.confirmPassword) {
              set({ 
                isLoading: false, 
                error: 'Les mots de passe ne correspondent pas' 
              })
              return { success: false, error: 'Les mots de passe ne correspondent pas' }
            }

            if (data.password.length < 8) {
              set({ 
                isLoading: false, 
                error: 'Le mot de passe doit contenir au moins 8 caractères' 
              })
              return { success: false, error: 'Mot de passe trop court' }
            }

            // Appel API d'inscription
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: data.name,
                email: data.email,
                password: data.password,
              }),
            })

            const result = await response.json()

            if (!response.ok) {
              set({ 
                isLoading: false, 
                error: result.error || 'Erreur lors de l\'inscription' 
              })
              return { success: false, error: result.error }
            }

            // Auto-connexion après inscription réussie
            const loginResult = await signIn('credentials', {
              email: data.email,
              password: data.password,
              redirect: false,
            })

            if (loginResult?.error) {
              set({ 
                isLoading: false, 
                error: 'Compte créé mais erreur de connexion automatique' 
              })
              return { success: false, error: 'Erreur de connexion automatique' }
            }

            // Synchroniser avec la session
            await get().syncWithSession()
            set({ isLoading: false, error: null })
            
            return { success: true }
          } catch (error) {
            console.error('Erreur lors de l\'inscription:', error)
            set({ 
              isLoading: false, 
              error: 'Erreur lors de l\'inscription. Veuillez réessayer.' 
            })
            return { success: false, error: 'Erreur d\'inscription' }
          }
        },

        // Action de déconnexion
        logout: async () => {
          console.log('🔓 Début du logout...')
          set({ isLoading: true })
          
          try {
            console.log('📤 Appel signOut NextAuth...')
            await signOut({ redirect: false })
            console.log('✅ signOut NextAuth terminé')
            
            get().clearAuth()
            console.log('🧹 État local nettoyé')
            
            // Redirection vers la page d'accueil
            if (typeof window !== 'undefined') {
              console.log('🏠 Redirection vers /')
              window.location.href = '/'
            }
          } catch (error) {
            console.error('❌ Erreur lors de la déconnexion:', error)
            // Forcer la déconnexion locale même en cas d'erreur
            get().clearAuth()
            // Redirection forcée même en cas d'erreur
            if (typeof window !== 'undefined') {
              window.location.href = '/'
            }
          }
        },

        // Actions de gestion d'état
        setUser: (user) => set({ 
          user, 
          isAuthenticated: !!user 
        }),

        setLoading: (isLoading) => set({ isLoading }),

        setError: (error) => set({ error }),

        clearAuth: () => set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        }),

        // Synchronisation avec NextAuth session
        syncWithSession: async () => {
          try {
            const session = await getSession()
            
            if (session?.user) {
              set({
                user: session.user as AuthUser,
                isAuthenticated: true,
                isLoading: false,
                error: null
              })
            } else {
              get().clearAuth()
            }
          } catch (error) {
            console.error('Erreur lors de la synchronisation:', error)
            get().clearAuth()
          }
        },

        // Initialisation de l'authentification au démarrage
        initializeAuth: async () => {
          set({ isLoading: true })
          await get().syncWithSession()
        },
      }),
      {
        name: 'auth-storage',
        // Seulement persister les données non-sensibles
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
        // Skip hydration during SSR
        skipHydration: true,
      }
    ),
    {
      name: 'auth-store',
    }
  )
)

export default useAuthStore

// Hook utilitaire pour l'authentification
export const useAuth = () => {
  const store = useAuthStore()
  
  return {
    // État
    user: store.user,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    error: store.error,
    
    // Actions
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: () => store.setError(null),
    
    // Utilitaires
    initializeAuth: store.initializeAuth,
    syncWithSession: store.syncWithSession,
  }
}

// Type helper pour les composants
export type UseAuthReturn = ReturnType<typeof useAuth>