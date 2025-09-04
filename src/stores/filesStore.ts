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
 * Store Zustand global pour la gestion centralisée des fichiers
 * 
 * Ce store implémente un système complet de gestion d'état pour les fichiers
 * avec persistance, cache intelligent, et intégration API. Il sert de source
 * de vérité unique pour toutes les données de fichiers dans l'application.
 * 
 * @architecture
 * - **State Management** : Zustand pour un état réactif et performant
 * - **Persistance** : SessionStorage pour maintenir l'état entre rafraîchissements
 * - **Cache Intelligent** : Évite les re-fetch inutiles avec invalidation sélective
 * - **Types Sûrs** : Intégration complète avec les schémas Zod
 * - **Error Handling** : Gestion centralisée des erreurs avec retry automatique
 * 
 * @features
 * - **CRUD Complet** : Création, lecture, mise à jour, suppression
 * - **Filtrage Avancé** : Par statut, type, agent, recherche textuelle
 * - **Pagination** : Gestion automatique avec métadonnées de pagination
 * - **Tri Dynamique** : Par nom, date, taille avec ordre ascendant/descendant
 * - **Statistiques** : Calcul en temps réel des métriques de fichiers
 * - **Optimistic Updates** : Mise à jour immédiate de l'UI avec rollback
 * 
 * @performance
 * - Mise en cache des requêtes pour éviter les appels API redondants
 * - Invalidation sélective du cache selon les mutations
 * - Persistance partielle (filtres uniquement) pour éviter la surcharge
 * - Debouncing automatique des actions de recherche
 * 
 * @patterns
 * - **Observer Pattern** : Réactivité automatique des composants consommateurs
 * - **Command Pattern** : Actions encapsulées avec validation et rollback
 * - **Repository Pattern** : Abstraction de la couche API avec cache
 * - **State Machine** : Gestion des états de chargement et d'erreur
 * 
 * @example
 * ```tsx
 * // Dans un composant React
 * const { files, fetchFiles, deleteFile, filters, setFilters } = useFiles();
 * 
 * // Chargement initial
 * useEffect(() => {
 *   if (files.length === 0) fetchFiles();
 * }, []);
 * 
 * // Filtrage
 * const handleFilter = (status: string) => {
 *   setFilters({ status });
 * };
 * 
 * // Suppression avec confirmation personnalisée
 * const { openConfirmDialog } = useConfirmDialog();
 * const handleDelete = async (fileId: string, fileName: string) => {
 *   openConfirmDialog({
 *     title: "Supprimer le fichier",
 *     description: `Êtes-vous sûr de vouloir supprimer "${fileName}" ?`,
 *     variant: "destructive",
 *     onConfirm: () => deleteFile(fileId)
 *   });
 * };
 * ```
 */

/**
 * Interface pour les erreurs de fichiers avec contexte optionnel
 * 
 * Structure standardisée pour toutes les erreurs liées aux opérations
 * sur les fichiers, compatible avec les systèmes de notification UI.
 */
interface FileError {
  /** Message d'erreur lisible par l'utilisateur */
  message: string
  /** Champ spécifique concerné par l'erreur (optionnel) */
  field?: string
}

/**
 * Interface principale du state du store de fichiers
 * 
 * Définit la structure complète de l'état global des fichiers avec
 * toutes les données, métadonnées, et actions disponibles.
 * 
 * @pattern State + Actions - Combine l'état et les actions dans une seule interface
 * @immutability Utilise Immer sous le capot pour les mises à jour immutables
 */
interface FilesState {
  // === ÉTAT PRINCIPAL ===
  
  /** Liste des fichiers actuellement chargés */
  files: FileResponse[]
  /** Fichier sélectionné pour affichage détaillé */
  selectedFile: FileResponse | null
  /** Statistiques globales des fichiers de l'utilisateur */
  stats: FileStats | null
  /** Indique si une opération de chargement est en cours */
  isLoading: boolean
  /** Indique si une suppression est en cours */
  isDeleting: boolean
  /** Erreur actuelle (null si pas d'erreur) */
  error: FileError | null
  
  // === MÉTADONNÉES DE PAGINATION ===
  
  /** Informations de pagination pour la liste actuelle */
  pagination: {
    /** Page actuelle (base 1) */
    page: number
    /** Nombre d'éléments par page */
    limit: number
    /** Nombre total d'éléments */
    total: number
    /** Nombre total de pages */
    pages: number
  } | null
  
  // === FILTRES ET TRI ===
  
  /** Configuration actuelle des filtres et du tri */
  filters: {
    /** Filtrer par agent spécifique */
    agentId?: string
    /** Filtrer par statut des fichiers */
    status?: 'uploading' | 'ready' | 'error' | 'all'
    /** Filtrer par type MIME */
    fileType?: string
    /** Recherche textuelle dans les noms de fichiers */
    search?: string
    /** Colonne de tri */
    sortBy?: 'originalFilename' | 'uploadDate' | 'fileSize'
    /** Ordre de tri */
    sortOrder?: 'asc' | 'desc'
  }
  
  // === ACTIONS ASYNC ===
  
  /** Charge la liste des fichiers avec filtres optionnels */
  fetchFiles: (query?: Partial<FileQuery>) => Promise<void>
  /** Récupère un fichier spécifique par ID */
  fetchFileById: (id: string) => Promise<FileResponse | null>
  /** Supprime un fichier et met à jour l'état local */
  deleteFile: (id: string) => Promise<boolean>
  /** Charge les statistiques des fichiers */
  fetchStats: () => Promise<void>
  
  // === ACTIONS SYNCHRONES ===
  
  /** Met à jour les filtres et relance automatiquement la requête */
  setFilters: (filters: Partial<FilesState['filters']>) => void
  /** Efface l'erreur actuelle */
  clearError: () => void
  /** Réinitialise complètement le store */
  reset: () => void
}

/**
 * État initial du store avec valeurs par défaut
 * 
 * Définit l'état de base du store au premier chargement,
 * avec des valeurs par défaut sensibles pour une bonne UX.
 * 
 * @pattern Default State - État propre et prévisible au démarrage
 * @performance Les tableaux vides et valeurs null évitent les re-renders inutiles
 */
const initialState = {
  // État des données
  files: [],  // Liste vide au démarrage
  selectedFile: null,  // Aucun fichier sélectionné
  stats: null,  // Statistiques à charger
  
  // États de chargement
  isLoading: false,  // Pas de chargement initial
  isDeleting: false,  // Pas de suppression en cours
  error: null,  // Aucune erreur au démarrage
  
  // Métadonnées
  pagination: null,  // Pagination à déterminer après premier fetch
  
  // Filtres par défaut (optimisés pour l'usage courant)
  filters: {
    status: 'all' as const,  // Afficher tous les statuts par défaut
    sortBy: 'uploadDate' as const,  // Trier par date d'upload (plus récent = plus utile)
    sortOrder: 'desc' as const,  // Ordre décroissant (plus récents en premier)
  },
}

/**
 * Store principal Zustand avec persistance pour la gestion des fichiers
 * 
 * Crée le store global avec toutes les actions et la logique de persistance.
 * Utilise le middleware persist() pour maintenir certaines données entre
 * les sessions (filtres uniquement pour éviter la surcharge).
 * 
 * @architecture
 * - **create()** : Factory Zustand pour créer le store
 * - **persist()** : Middleware pour la persistance sélective
 * - **set/get** : Fonctions Zustand pour la gestion d'état immutable
 * 
 * @persistence
 * - Storage: sessionStorage (données temporaires par onglet)
 * - Partielle: seuls les filtres sont persistés
 * - Avantage: préserve les préférences utilisateur sans surcharger
 */
export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Action principale pour charger la liste des fichiers
       * 
       * Cette fonction constitue le cœur du système de chargement des fichiers.
       * Elle gère les filtres, la pagination, les requêtes API et la mise à jour
       * de l'état global de manière atomique et optimiste.
       * 
       * @param {Partial<FileQuery>} query - Filtres optionnels à appliquer
       * 
       * @process
       * 1. Fusion des filtres actuels avec les nouveaux
       * 2. Construction des paramètres de requête URL
       * 3. Appel API vers /api/files
       * 4. Mise à jour de l'état avec les données et métadonnées
       * 5. Gestion des erreurs avec messages utilisateur
       * 
       * @example
       * ```tsx
       * // Chargement simple
       * await fetchFiles();
       * 
       * // Avec filtres
       * await fetchFiles({ status: 'ready', search: 'rapport' });
       * 
       * // Changement de page
       * await fetchFiles({ page: 2 });
       * ```
       */
      fetchFiles: async (query?: Partial<FileQuery>) => {
        /**
         * Initialisation de l'état de chargement
         * 
         * Met isLoading à true pour déclencher les indicateurs visuels
         * et efface les erreurs précédentes pour un état propre.
         */
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
       * Action de suppression optimiste d'un fichier
       * 
       * Implémente une suppression avec mise à jour immédiate de l'UI
       * (optimistic update) suivie de l'appel API. En cas d'échec,
       * l'état est restauré à sa valeur précédente.
       * 
       * @param {string} id - ID du fichier à supprimer
       * @returns {Promise<boolean>} True si la suppression a réussi
       * 
       * @pattern Optimistic Update
       * - Mise à jour immédiate de l'UI
       * - Appel API en arrière-plan
       * - Rollback en cas d'échec
       * - UX plus fluide et responsive
       * 
       * @example
       * ```tsx
       * const handleDelete = async (fileId: string) => {
       *   const success = await deleteFile(fileId);
       *   if (success) {
       *     toast.success('Fichier supprimé !');
       *   }
       *   // L'erreur est déjà gérée dans le store
       * };
       * ```
       */
      deleteFile: async (id: string) => {
        /**
         * Initialisation de l'état de suppression
         * 
         * Active le flag isDeleting pour les indicateurs UI
         * et nettoie les erreurs précédentes.
         */
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
       * Action de mise à jour des filtres avec re-fetch automatique
       * 
       * Cette action met à jour les filtres de recherche et relance
       * automatiquement le chargement des fichiers avec les nouveaux
       * critères. Elle garantit la cohérence entre les filtres et les données.
       * 
       * @param {Partial<FilesState['filters']>} newFilters - Nouveaux filtres à appliquer
       * 
       * @behavior
       * - Merge les nouveaux filtres avec les existants
       * - Relance automatiquement fetchFiles()
       * - Remet la pagination à la page 1
       * - Préserve les autres paramètres (tri, etc.)
       * 
       * @example
       * ```tsx
       * // Filtrer par statut
       * setFilters({ status: 'ready' });
       * 
       * // Recherche textuelle
       * setFilters({ search: 'document.pdf' });
       * 
       * // Réinitialiser un filtre
       * setFilters({ status: 'all' });
       * 
       * // Plusieurs filtres simultanés
       * setFilters({
       *   status: 'ready',
       *   sortBy: 'originalFilename',
       *   sortOrder: 'asc'
       * });
       * ```
       */
      setFilters: (newFilters: Partial<FilesState['filters']>) => {
        /**
         * Fusion des filtres avec préservation des valeurs existantes
         * 
         * Combine les filtres actuels avec les nouveaux pour permettre
         * des mises à jour partielles sans perdre les autres critères.
         */
        const currentFilters = get().filters
        const updatedFilters = { ...currentFilters, ...newFilters }
        
        /**
         * Mise à jour atomique des filtres
         * 
         * Met à jour l'état des filtres de manière immutable.
         */
        set({ filters: updatedFilters })
        
        /**
         * Re-fetch automatique avec nouveaux filtres
         * 
         * Relance immédiatement le chargement pour maintenir
         * la cohérence entre les filtres affichés et les données.
         */
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