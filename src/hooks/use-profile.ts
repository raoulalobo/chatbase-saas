import { useState, useCallback } from 'react'
import { useAuth } from '@/stores/authStore'

/**
 * Hook personnalisé pour la gestion du profil utilisateur
 * - Mise à jour des informations personnelles
 * - Changement de mot de passe 
 * - Gestion des préférences
 * - Export des données
 */

export interface ProfileUpdateData {
  name?: string
  email?: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
}

export interface ProfilePreferences {
  emailNotifications: boolean
  securityNotifications: boolean
}

interface ProfileState {
  isUpdating: boolean
  error: string | null
  message: string | null
}

export function useProfile() {
  const { user, syncWithSession } = useAuth()
  const [state, setState] = useState<ProfileState>({
    isUpdating: false,
    error: null,
    message: null
  })

  /**
   * Met à jour les informations du profil
   */
  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    setState(prev => ({ ...prev, isUpdating: true, error: null, message: null }))

    try {
      // Validation côté client
      if (data.name && !data.name.trim()) {
        throw new Error('Le nom ne peut pas être vide')
      }

      if (data.email && !data.email.includes('@')) {
        throw new Error('Email invalide')
      }

      // Appel API
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la mise à jour')
      }

      const result = await response.json()

      // Synchroniser avec la session pour mettre à jour les données utilisateur
      await syncWithSession()

      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        message: result.message || 'Profil mis à jour avec succès',
        error: null 
      }))

      return { success: true, data: result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        error: errorMessage,
        message: null 
      }))

      return { success: false, error: errorMessage }
    }
  }, [syncWithSession])

  /**
   * Change le mot de passe utilisateur
   */
  const changePassword = useCallback(async (data: PasswordChangeData) => {
    setState(prev => ({ ...prev, isUpdating: true, error: null, message: null }))

    try {
      // Validation côté client
      if (!data.currentPassword || !data.newPassword) {
        throw new Error('Tous les champs sont requis')
      }

      if (data.newPassword.length < 8) {
        throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères')
      }

      // Appel API
      const response = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors du changement de mot de passe')
      }

      const result = await response.json()

      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        message: result.message || 'Mot de passe modifié avec succès',
        error: null 
      }))

      return { success: true, data: result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        error: errorMessage,
        message: null 
      }))

      return { success: false, error: errorMessage }
    }
  }, [])

  /**
   * Met à jour les préférences utilisateur
   */
  const updatePreferences = useCallback(async (preferences: ProfilePreferences) => {
    setState(prev => ({ ...prev, isUpdating: true, error: null, message: null }))

    try {
      // Appel API
      const response = await fetch('/api/profile/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la mise à jour des préférences')
      }

      const result = await response.json()

      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        message: result.message || 'Préférences mises à jour avec succès',
        error: null 
      }))

      return { success: true, data: result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        error: errorMessage,
        message: null 
      }))

      return { success: false, error: errorMessage }
    }
  }, [])

  /**
   * Exporte les données utilisateur
   */
  const exportUserData = useCallback(async () => {
    setState(prev => ({ ...prev, isUpdating: true, error: null, message: null }))

    try {
      // Appel API
      const response = await fetch('/api/profile/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de l\'export')
      }

      const result = await response.json()

      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        message: result.message || 'Export en cours, vous recevrez un email',
        error: null 
      }))

      return { success: true, data: result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        error: errorMessage,
        message: null 
      }))

      return { success: false, error: errorMessage }
    }
  }, [])

  /**
   * Supprime le compte utilisateur
   */
  const deleteAccount = useCallback(async (password: string) => {
    setState(prev => ({ ...prev, isUpdating: true, error: null, message: null }))

    try {
      if (!password) {
        throw new Error('Mot de passe requis pour supprimer le compte')
      }

      // Appel API
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la suppression')
      }

      const result = await response.json()

      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        message: result.message || 'Compte supprimé avec succès',
        error: null 
      }))

      // Redirection ou déconnexion automatique après suppression
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }

      return { success: true, data: result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        error: errorMessage,
        message: null 
      }))

      return { success: false, error: errorMessage }
    }
  }, [])

  /**
   * Nettoie les messages d'état
   */
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, message: null }))
  }, [])

  return {
    // État
    user,
    isUpdating: state.isUpdating,
    error: state.error,
    message: state.message,

    // Actions
    updateProfile,
    changePassword,
    updatePreferences,
    exportUserData,
    deleteAccount,
    clearMessages,
  }
}