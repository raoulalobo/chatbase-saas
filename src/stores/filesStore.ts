"use client"

import * as React from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { 
  FileResponse,
  FilesListResponse,
  FileQuery,
  FileStats
} from '@/lib/schemas/file'
import type { ApiResponse } from '@/lib/utils/api'

/**
 * Store Zustand pour la gestion des fichiers
 * - État global des fichiers avec persistence
 * - Actions CRUD avec validation et gestion d'erreurs
 * - Cache intelligent pour optimiser les performances
 * - Types sûrs avec Zod
 */

interface FileError {
  message: string
  field?: string
}

interface FilesState {
  // État
  files: FileResponse[]
  selectedFile: FileResponse | null
  stats: FileStats | null
  isLoading: boolean
  isDeleting: boolean
  error: FileError | null
  
  // Pagination et filtres
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  } | null
  
  filters: {
    agentId?: string
    status?: 'uploading' | 'ready' | 'error' | 'all'
    fileType?: string
    search?: string
    sortBy?: 'originalFilename' | 'uploadDate' | 'fileSize'
    sortOrder?: 'asc' | 'desc'
  }
  
  // Actions
  fetchFiles: (query?: Partial<FileQuery>) => Promise<void>
  fetchFileById: (id: string) => Promise<FileResponse | null>
  deleteFile: (id: string) => Promise<boolean>
  fetchStats: () => Promise<void>
  setFilters: (filters: Partial<FilesState['filters']>) => void
  clearError: () => void
  reset: () => void
}

// État initial
const initialState = {
  files: [],
  selectedFile: null,
  stats: null,
  isLoading: false,
  isDeleting: false,
  error: null,
  pagination: null,
  filters: {
    status: 'all' as const,
    sortBy: 'uploadDate' as const,
    sortOrder: 'desc' as const,
  },
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Récupérer la liste des fichiers avec filtres et pagination
       */
      fetchFiles: async (query?: Partial<FileQuery>) => {
        set({ isLoading: true, error: null })

        try {
          const currentFilters = get().filters
          const mergedQuery = { ...currentFilters, ...query }

          // Construire les paramètres URL
          const params = new URLSearchParams()
          
          Object.entries(mergedQuery).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              params.append(key, String(value))
            }
          })

          const response = await fetch(`/api/files?${params.toString()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
            throw new Error(errorData.message || `Erreur ${response.status}`)
          }

          const result: ApiResponse<FilesListResponse> = await response.json()

          if (result.success && result.data) {
            const { files, total } = result.data
            
            // Calculer la pagination
            const limit = mergedQuery.limit || 20
            const page = mergedQuery.page || 1
            const pages = Math.ceil(total / limit)

            set({
              files,
              pagination: { page, limit, total, pages },
              filters: mergedQuery,
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(result.message || 'Erreur lors de la récupération des fichiers')
          }

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
          set({
            error: { message: errorMessage },
            isLoading: false,
          })
        }
      },

      /**
       * Récupérer un fichier par ID
       */
      fetchFileById: async (id: string) => {
        set({ error: null })

        try {
          const response = await fetch(`/api/files/${id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
            throw new Error(errorData.message || `Erreur ${response.status}`)
          }

          const result: ApiResponse<FileResponse> = await response.json()

          if (result.success && result.data) {
            set({ selectedFile: result.data })
            return result.data
          } else {
            throw new Error(result.message || 'Erreur lors de la récupération du fichier')
          }

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
          set({ error: { message: errorMessage } })
          return null
        }
      },

      /**
       * Supprimer un fichier
       */
      deleteFile: async (id: string) => {
        set({ isDeleting: true, error: null })

        try {
          const response = await fetch(`/api/files/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
            throw new Error(errorData.message || `Erreur ${response.status}`)
          }

          const result = await response.json()

          if (result.success) {
            // Retirer le fichier de la liste locale
            const currentFiles = get().files
            const updatedFiles = currentFiles.filter(file => file.id !== id)
            
            // Mettre à jour la pagination
            const currentPagination = get().pagination
            const newTotal = currentPagination ? currentPagination.total - 1 : 0
            const updatedPagination = currentPagination ? {
              ...currentPagination,
              total: newTotal,
              pages: Math.ceil(newTotal / currentPagination.limit)
            } : null

            set({
              files: updatedFiles,
              pagination: updatedPagination,
              selectedFile: get().selectedFile?.id === id ? null : get().selectedFile,
              isDeleting: false,
              error: null,
            })

            return true
          } else {
            throw new Error(result.message || 'Erreur lors de la suppression')
          }

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
          set({
            error: { message: errorMessage },
            isDeleting: false,
          })
          return false
        }
      },

      /**
       * Récupérer les statistiques des fichiers
       */
      fetchStats: async () => {
        try {
          const response = await fetch('/api/files/stats', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
            throw new Error(errorData.message || `Erreur ${response.status}`)
          }

          const result: ApiResponse<FileStats> = await response.json()

          if (result.success && result.data) {
            set({ stats: result.data })
          } else {
            throw new Error(result.message || 'Erreur lors de la récupération des statistiques')
          }

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
          set({ error: { message: errorMessage } })
        }
      },

      /**
       * Mettre à jour les filtres
       */
      setFilters: (newFilters: Partial<FilesState['filters']>) => {
        const currentFilters = get().filters
        const updatedFilters = { ...currentFilters, ...newFilters }
        
        set({ filters: updatedFilters })
        
        // Relancer automatiquement la requête avec les nouveaux filtres
        get().fetchFiles()
      },

      /**
       * Effacer l'erreur
       */
      clearError: () => {
        set({ error: null })
      },

      /**
       * Réinitialiser le store
       */
      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'files-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Ne persister que les filtres, pas les données
        filters: state.filters,
      }),
    }
  )
)

// Hook personnalisé pour utiliser facilement le store
export function useFiles() {
  const store = useFilesStore()
  
  // Charger les fichiers au premier rendu si pas encore fait
  React.useEffect(() => {
    if (store.files.length === 0 && !store.isLoading) {
      store.fetchFiles()
    }
  }, [store.files.length, store.isLoading]) // Retirer fetchFiles des dépendances

  return store
}

// Hook pour récupérer un fichier par ID
export function useFile(id: string | null) {
  const store = useFilesStore()
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (id && (!store.selectedFile || store.selectedFile.id !== id)) {
      setIsLoading(true)
      store.fetchFileById(id).finally(() => setIsLoading(false))
    }
  }, [id, store, store.selectedFile])

  return {
    file: store.selectedFile,
    isLoading: isLoading || store.isLoading,
    error: store.error,
  }
}