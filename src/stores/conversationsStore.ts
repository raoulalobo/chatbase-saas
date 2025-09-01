"use client"

import * as React from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { 
  ConversationWithMessages,
  ConversationsListResponse,
  ConversationQuery,
  ConversationStats,
  ChatMessage,
  ChatResponse
} from '@/lib/schemas/conversation'
import type { ApiResponse } from '@/lib/utils/api'

/**
 * Store Zustand pour la gestion des conversations
 * - État global des conversations avec persistence
 * - Actions CRUD avec validation et gestion d'erreurs
 * - Cache intelligent pour optimiser les performances
 * - Types sûrs avec Zod
 */

interface ConversationError {
  message: string
  field?: string
}

interface ConversationsState {
  // État
  conversations: ConversationWithMessages[]
  selectedConversation: ConversationWithMessages | null
  stats: ConversationStats | null
  isLoading: boolean
  isDeleting: boolean
  isChatting: boolean // Pour l'état du chat en temps réel
  error: ConversationError | null
  
  // Pagination et filtres
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  } | null
  
  filters: {
    search?: string
    agentId?: string
    visitorId?: string
    sortBy?: 'createdAt' | 'updatedAt'
    sortOrder?: 'asc' | 'desc'
    startDate?: string
    endDate?: string
  }
  
  // Actions
  fetchConversations: (query?: Partial<ConversationQuery>) => Promise<void>
  fetchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<{ success: boolean; error?: string }>
  fetchStats: () => Promise<void>
  sendChatMessage: (agentId: string, message: ChatMessage) => Promise<{ success: boolean; response?: ChatResponse; error?: string }>
  
  // Utilitaires
  setSelectedConversation: (conversation: ConversationWithMessages | null) => void
  clearError: () => void
  setFilters: (filters: Partial<ConversationsState['filters']>) => void
  reset: () => void
}

// État initial
const initialState = {
  conversations: [],
  selectedConversation: null,
  stats: null,
  isLoading: false,
  isDeleting: false,
  isChatting: false,
  error: null,
  pagination: null,
  filters: {
    sortBy: 'updatedAt' as const,
    sortOrder: 'desc' as const,
  },
}

// Helper pour les requêtes API
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    // S'assurer que l'URL est complète avec le domaine
    const fullUrl = url.startsWith('http') 
      ? url 
      : `${window.location.origin}${url}`
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const result: ApiResponse<T> = await response.json()

    if (!result.success) {
      return {
        data: null,
        error: result.error || 'Erreur inconnue',
      }
    }

    return {
      data: result.data || null,
      error: null,
    }
  } catch (error) {
    console.error('API Error:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erreur de réseau',
    }
  }
}

// Store principal
export const useConversationsStore = create<ConversationsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Récupérer la liste des conversations
      fetchConversations: async (query = {}) => {
        set({ isLoading: true, error: null })

        const { filters } = get()
        
        // Combiner filters et query, puis filtrer les valeurs undefined
        const allParams = { ...filters, ...query }
        const filteredParams: Record<string, string> = {}
        
        Object.entries(allParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            filteredParams[key] = String(value)
          }
        })
        
        const params = new URLSearchParams(filteredParams).toString()

        const { data, error } = await apiRequest<ConversationsListResponse>(
          `/api/conversations?${params}`
        )

        if (error) {
          set({ 
            isLoading: false, 
            error: { message: error } 
          })
          return
        }

        if (data) {
          set({
            conversations: data.conversations,
            pagination: data.pagination,
            isLoading: false,
            error: null,
          })
        }
      },

      // Récupérer une conversation spécifique
      fetchConversation: async (id: string) => {
        set({ isLoading: true, error: null })

        const { data, error } = await apiRequest<ConversationWithMessages>(
          `/api/conversations/${id}`
        )

        if (error) {
          set({ 
            isLoading: false, 
            error: { message: error } 
          })
          return
        }

        if (data) {
          // Mettre à jour la conversation dans la liste si elle existe
          const { conversations } = get()
          const updatedConversations = conversations.map(conv => 
            conv.id === data.id ? data : conv
          )
          
          set({
            conversations: updatedConversations,
            selectedConversation: data,
            isLoading: false,
            error: null,
          })
        }
      },

      // Supprimer une conversation
      deleteConversation: async (id: string) => {
        set({ isDeleting: true, error: null })

        const { error } = await apiRequest(
          `/api/conversations/${id}`,
          { method: 'DELETE' }
        )

        if (error) {
          set({ 
            isDeleting: false, 
            error: { message: error } 
          })
          return { success: false, error }
        }

        // Retirer la conversation de la liste
        const { conversations, selectedConversation } = get()
        const filteredConversations = conversations.filter(conv => conv.id !== id)
        
        set({
          conversations: filteredConversations,
          selectedConversation: selectedConversation?.id === id ? null : selectedConversation,
          isDeleting: false,
          error: null,
        })

        return { success: true }
      },

      // Récupérer les statistiques
      fetchStats: async () => {
        const { data, error } = await apiRequest<ConversationStats>(
          '/api/conversations/stats'
        )

        if (!error && data) {
          set({ stats: data })
        }
      },

      // Envoyer un message de chat
      sendChatMessage: async (agentId: string, message: ChatMessage) => {
        set({ isChatting: true, error: null })

        const { data, error } = await apiRequest<ChatResponse>(
          `/api/agents/${agentId}/chat`,
          {
            method: 'POST',
            body: JSON.stringify(message),
          }
        )

        set({ isChatting: false })

        if (error) {
          set({ error: { message: error } })
          return { success: false, error }
        }

        if (data) {
          // Si on a une conversation sélectionnée, la mettre à jour
          const { selectedConversation } = get()
          if (selectedConversation && selectedConversation.id === data.conversationId) {
            // Recharger la conversation pour avoir les nouveaux messages
            get().fetchConversation(data.conversationId)
          }

          return { success: true, response: data }
        }

        return { success: false, error: 'Erreur inconnue' }
      },

      // Sélectionner une conversation
      setSelectedConversation: (conversation: ConversationWithMessages | null) => {
        set({ selectedConversation: conversation })
      },

      // Effacer l'erreur
      clearError: () => {
        set({ error: null })
      },

      // Définir les filtres
      setFilters: (newFilters: Partial<ConversationsState['filters']>) => {
        const { filters } = get()
        set({ 
          filters: { ...filters, ...newFilters } 
        })
        
        // Refetch avec les nouveaux filtres
        get().fetchConversations()
      },

      // Réinitialiser le store
      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'conversations-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Ne persister que certains champs
      partialize: (state) => ({
        selectedConversation: state.selectedConversation,
        filters: state.filters,
      }),
    }
  )
)

// Hooks utilitaires
export const useConversation = (id?: string) => {
  const { selectedConversation, fetchConversation, isLoading } = useConversationsStore()

  // Auto-fetch si l'ID change et qu'on n'a pas la conversation avec useEffect
  React.useEffect(() => {
    if (id && selectedConversation?.id !== id && !isLoading) {
      fetchConversation(id)
    }
  }, [id, selectedConversation?.id, isLoading, fetchConversation])

  return selectedConversation?.id === id ? selectedConversation : null
}

export const useConversationsList = () => {
  const { 
    conversations, 
    pagination, 
    stats,
    isLoading, 
    fetchConversations, 
    fetchStats, 
    filters 
  } = useConversationsStore()
  
  const [hasInitialized, setHasInitialized] = React.useState(false)

  // Auto-fetch au premier rendu si pas de conversations avec useEffect
  React.useEffect(() => {
    if (!hasInitialized && conversations.length === 0 && !isLoading) {
      setHasInitialized(true)
      fetchConversations()
      fetchStats()
    }
  }, [hasInitialized, conversations.length, isLoading, fetchConversations, fetchStats])

  return {
    conversations,
    pagination,
    stats,
    isLoading,
    refetch: fetchConversations,
    filters,
  }
}