"use client"

import * as React from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { 
  AgentResponse, 
  AgentsListResponse, 
  CreateAgent, 
  UpdateAgent, 
  AgentQuery 
} from '@/lib/schemas/agent'
import type { ApiResponse } from '@/lib/utils/api'

/**
 * Store Zustand pour la gestion des agents IA
 * - État global des agents avec persistence
 * - Actions CRUD avec validation et gestion d'erreurs
 * - Cache intelligent pour optimiser les performances
 * - Types sûrs avec Zod
 */

interface AgentError {
  message: string
  field?: string
}

interface AgentsState {
  // État
  agents: AgentResponse[]
  selectedAgent: AgentResponse | null
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: AgentError | null
  
  // Pagination et filtres
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  } | null
  
  filters: {
    search?: string
    status?: 'active' | 'inactive' | 'all'
    sortBy?: 'name' | 'createdAt' | 'updatedAt'
    sortOrder?: 'asc' | 'desc'
  }
  
  // Actions
  fetchAgents: (query?: Partial<AgentQuery>) => Promise<void>
  fetchAgent: (id: string) => Promise<void>
  createAgent: (data: CreateAgent) => Promise<{ success: boolean; agent?: AgentResponse; error?: string }>
  updateAgent: (id: string, data: UpdateAgent) => Promise<{ success: boolean; agent?: AgentResponse; error?: string }>
  deleteAgent: (id: string) => Promise<{ success: boolean; error?: string }>
  
  // Utilitaires
  setSelectedAgent: (agent: AgentResponse | null) => void
  clearError: () => void
  setFilters: (filters: Partial<AgentsState['filters']>) => void
  reset: () => void
}

// État initial
const initialState = {
  agents: [],
  selectedAgent: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  pagination: null,
  filters: {
    status: 'all' as const,
    sortBy: 'createdAt' as const,
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
export const useAgentsStore = create<AgentsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Récupérer la liste des agents
      fetchAgents: async (query = {}) => {
        set({ isLoading: true, error: null })

        const { filters } = get()
        const params = new URLSearchParams({
          ...filters,
          ...query,
        }).toString()

        const { data, error } = await apiRequest<AgentsListResponse>(
          `/api/agents?${params}`
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
            agents: data.agents,
            pagination: data.pagination,
            isLoading: false,
            error: null,
          })
        }
      },

      // Récupérer un agent spécifique
      fetchAgent: async (id: string) => {
        set({ isLoading: true, error: null })
        console.log('fetchAgent called with id:', id)

        const { data, error } = await apiRequest<AgentResponse>(
          `/api/agents/${id}`
        )
        console.log('fetchAgent response:', { data, error })

        if (error) {
          console.log('fetchAgent error:', error)
          set({ 
            isLoading: false, 
            error: { message: error } 
          })
          return
        }

        if (data) {
          console.log('fetchAgent success, setting selectedAgent:', data)
          // Mettre à jour l'agent dans la liste si il existe
          const { agents } = get()
          const updatedAgents = agents.map(agent => 
            agent.id === data.id ? data : agent
          )
          
          set({
            agents: updatedAgents,
            selectedAgent: data,
            isLoading: false,
            error: null,
          })
        }
      },

      // Créer un nouvel agent
      createAgent: async (data: CreateAgent) => {
        set({ isCreating: true, error: null })

        const { data: newAgent, error } = await apiRequest<AgentResponse>(
          '/api/agents',
          {
            method: 'POST',
            body: JSON.stringify(data),
          }
        )

        if (error) {
          set({ 
            isCreating: false, 
            error: { message: error } 
          })
          return { success: false, error }
        }

        if (newAgent) {
          // Ajouter le nouvel agent à la liste
          const { agents } = get()
          set({
            agents: [newAgent, ...agents],
            selectedAgent: newAgent,
            isCreating: false,
            error: null,
          })

          return { success: true, agent: newAgent }
        }

        return { success: false, error: 'Erreur inconnue' }
      },

      // Mettre à jour un agent
      updateAgent: async (id: string, data: UpdateAgent) => {
        set({ isUpdating: true, error: null })

        const { data: updatedAgent, error } = await apiRequest<AgentResponse>(
          `/api/agents/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(data),
          }
        )

        if (error) {
          set({ 
            isUpdating: false, 
            error: { message: error } 
          })
          return { success: false, error }
        }

        if (updatedAgent) {
          // Mettre à jour l'agent dans la liste
          const { agents, selectedAgent } = get()
          const updatedAgents = agents.map(agent => 
            agent.id === updatedAgent.id ? updatedAgent : agent
          )
          
          set({
            agents: updatedAgents,
            selectedAgent: selectedAgent?.id === updatedAgent.id ? updatedAgent : selectedAgent,
            isUpdating: false,
            error: null,
          })

          return { success: true, agent: updatedAgent }
        }

        return { success: false, error: 'Erreur inconnue' }
      },

      // Supprimer un agent
      deleteAgent: async (id: string) => {
        set({ isDeleting: true, error: null })

        const { error } = await apiRequest(
          `/api/agents/${id}`,
          { method: 'DELETE' }
        )

        if (error) {
          set({ 
            isDeleting: false, 
            error: { message: error } 
          })
          return { success: false, error }
        }

        // Retirer l'agent de la liste
        const { agents, selectedAgent } = get()
        const filteredAgents = agents.filter(agent => agent.id !== id)
        
        set({
          agents: filteredAgents,
          selectedAgent: selectedAgent?.id === id ? null : selectedAgent,
          isDeleting: false,
          error: null,
        })

        return { success: true }
      },

      // Sélectionner un agent
      setSelectedAgent: (agent: AgentResponse | null) => {
        set({ selectedAgent: agent })
      },

      // Effacer l'erreur
      clearError: () => {
        set({ error: null })
      },

      // Définir les filtres
      setFilters: (newFilters: Partial<AgentsState['filters']>) => {
        const { filters } = get()
        set({ 
          filters: { ...filters, ...newFilters } 
        })
        
        // Refetch avec les nouveaux filtres
        get().fetchAgents()
      },

      // Réinitialiser le store
      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'agents-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Ne persister que certains champs
      partialize: (state) => ({
        selectedAgent: state.selectedAgent,
        filters: state.filters,
      }),
    }
  )
)

// Hooks utilitaires
export const useAgent = (id?: string) => {
  const { selectedAgent, fetchAgent, isLoading } = useAgentsStore()

  // Auto-fetch si l'ID change et qu'on n'a pas l'agent avec useEffect
  React.useEffect(() => {
    if (id && selectedAgent?.id !== id && !isLoading) {
      fetchAgent(id)
    }
  }, [id, selectedAgent?.id, isLoading, fetchAgent])

  return selectedAgent?.id === id ? selectedAgent : null
}

export const useAgentsList = () => {
  const { agents, pagination, isLoading, fetchAgents, filters } = useAgentsStore()
  const [hasInitialized, setHasInitialized] = React.useState(false)

  // Auto-fetch au premier rendu si pas d'agents avec useEffect
  React.useEffect(() => {
    if (!hasInitialized && agents.length === 0 && !isLoading) {
      setHasInitialized(true)
      fetchAgents()
    }
  }, [hasInitialized, agents.length, isLoading, fetchAgents])

  return {
    agents,
    pagination,
    isLoading,
    refetch: fetchAgents,
    filters,
  }
}