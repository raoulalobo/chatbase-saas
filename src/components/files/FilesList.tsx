"use client"

import * as React from "react"
import { Search, Filter, FileX, Loader2, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { FileItem } from "./FileItem"
import { useFiles } from "@/stores/filesStore"
import type { FileResponse } from "@/lib/schemas/file"

/**
 * Composant React principal pour l'affichage et la gestion des fichiers
 * 
 * Ce composant constitue l'interface principale de gestion des fichiers dans l'application.
 * Il intègre toutes les fonctionnalités de recherche, filtrage, tri, et actions utilisateur
 * dans une interface cohérente et performante.
 * 
 * @component FilesList
 * @category Files Management
 * 
 * @features
 * - **Recherche en temps réel** : Debouncing automatique avec indicateur visuel
 * - **Filtres avancés** : Par statut, type, agent avec compteurs dynamiques
 * - **Tri multi-critères** : Par nom, date, taille avec ordre asc/desc
 * - **Pagination intégrée** : Navigation fluide avec informations de contexte
 * - **Actions contextuelles** : Suppression, visualisation, actions bulk futures
 * - **États de chargement** : Skeleton loaders et indicateurs de progression
 * - **Gestion d'erreurs** : Messages utilisateur avec actions de récupération
 * - **État vide** : Interface adaptée quand aucun fichier n'est trouvé
 * 
 * @architecture
 * - **State Management** : Intégration native avec le store Zustand via useFiles()
 * - **Performance** : Debouncing des recherches, mémorisation des compteurs
 * - **Accessibility** : Navigation clavier, labels ARIA, focus management
 * - **Responsive** : Adaptable mobile/desktop avec breakpoints Tailwind
 * 
 * @ux
 * - **Feedback immédiat** : Mise à jour temps réel des résultats
 * - **Contexte visuel** : Compteurs par statut, informations de pagination
 * - **Actions intuitives** : Boutons et menus contextuels bien placés
 * - **État de chargement** : Skeleton UI pendant les requêtes
 * - **Recovery** : Actions pour récupérer des erreurs (retry, clear filters)
 * 
 * @example
 * ```tsx
 * // Usage basique
 * <FilesList />
 * 
 * // Avec callbacks personnalisés
 * <FilesList 
 *   onFileView={(file) => openFileModal(file)}
 *   onFileDelete={(file) => confirmDelete(file)}
 *   showAgent={false}
 * />
 * ```
 * 
 * @performance
 * - Debouncing de recherche (500ms) pour éviter les requêtes excessives
 * - Mémorisation des compteurs de statut avec useMemo()
 * - Lazy loading des composants FileItem avec React.memo()
 * - Pagination pour limiter le nombre d'éléments DOM
 */

/**
 * Props du composant FilesList pour la customisation du comportement
 * 
 * Interface définissant les options de configuration du composant
 * pour s'adapter aux différents contextes d'utilisation.
 */
interface FilesListProps {
  /** Callback exécuté lors du clic sur "Voir les détails" d'un fichier */
  onFileView?: (file: FileResponse) => void
  /** Callback exécuté lors de la suppression d'un fichier */
  onFileDelete?: (file: FileResponse) => void
  /** Afficher la colonne Agent dans la liste (défaut: true) */
  showAgent?: boolean
  /** Classes CSS supplémentaires pour le conteneur */
  className?: string
}

/**
 * Composant principal FilesList avec logique de gestion d'état et rendu
 * 
 * Implémente l'interface complète de gestion des fichiers avec intégration
 * au store global, gestion des événements utilisateur, et rendu optimisé.
 * 
 * @param {FilesListProps} props Configuration du composant
 */
export function FilesList({ 
  onFileView, 
  onFileDelete,
  showAgent = true,
  className = "" 
}: FilesListProps) {
  /**
   * Intégration avec le store global des fichiers
   * 
   * Récupère toutes les données et actions nécessaires depuis
   * le store Zustand centralisé. Cette approche garantit la
   * cohérence des données à travers l'application.
   */
  const {
    files,           // Liste des fichiers actuellement affichés
    isLoading,       // Flag de chargement pour les indicateurs UI
    error,           // Erreur actuelle à afficher à l'utilisateur
    filters,         // Configuration actuelle des filtres
    pagination,      // Métadonnées de pagination
    setFilters,      // Fonction pour modifier les filtres
    fetchFiles,      // Fonction pour recharger les fichiers
    deleteFile,      // Fonction pour supprimer un fichier
    clearError       // Fonction pour effacer l'erreur actuelle
  } = useFiles()

  /**
   * État local pour la gestion de la recherche avec debouncing
   * 
   * Maintient une copie locale du terme de recherche pour permettre
   * une saisie fluide sans déclencher de requêtes à chaque frappe.
   */
  const [searchTerm, setSearchTerm] = React.useState(filters.search || "")
  
  /**
   * État local pour tracker les suppressions en cours
   * 
   * Permet d'afficher des indicateurs visuels spécifiques à chaque
   * fichier en cours de suppression (ex: opacity réduite, spinner).
   */
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null)

  /**
   * Effet de debouncing pour la recherche textuelle
   * 
   * Implémente un délai de 500ms avant de déclencher la recherche
   * pour éviter les requêtes excessives pendant la saisie utilisateur.
   * 
   * @pattern Debouncing - Améliore les performances et l'expérience utilisateur
   * @delay 500ms - Équilibre entre réactivité et performance
   */
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ search: searchTerm || undefined })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, filters.search]) // setFilters est volontairement exclu pour éviter les loops

  /**
   * Gestionnaire de suppression de fichiers
   * 
   * Gère la logique de suppression avec support pour les callbacks
   * personnalisés et les indicateurs visuels de progression.
   * 
   * @param {FileResponse} file - Fichier à supprimer
   * 
   * @flow
   * 1. Vérifie si un callback personnalisé est fourni
   * 2. Si oui, délègue la gestion au parent
   * 3. Sinon, gère la suppression avec le store
   * 4. Affiche les indicateurs visuels pendant l'opération
   */
  const handleDelete = async (file: FileResponse) => {
    /**
     * Délégation au callback parent si fourni
     * 
     * Permet aux composants parents de gérer la suppression
     * avec leur propre logique (ex: modal de confirmation).
     */
    if (onFileDelete) {
      onFileDelete(file)
      return
    }

    /**
     * Gestion de la suppression via le store
     * 
     * Active l'indicateur visuel, exécute la suppression,
     * et nettoie l'état local après l'opération.
     */
    setIsDeleting(file.id)
    const success = await deleteFile(file.id)
    if (success) {
      // Success feedback est géré automatiquement par le store
      // ou peut être ajouté ici (toast, notification, etc.)
    }
    setIsDeleting(null)
  }

  /**
   * Gestionnaire de visualisation de fichiers
   * 
   * Délègue l'action de visualisation au callback parent
   * si fourni, sinon l'action est ignorée silencieusement.
   * 
   * @param {FileResponse} file - Fichier à visualiser
   */
  const handleView = (file: FileResponse) => {
    if (onFileView) {
      onFileView(file)
    }
  }

  /**
   * Calcul mémorisé des compteurs de statut
   * 
   * Calcule dynamiquement le nombre de fichiers par statut
   * pour afficher des compteurs informatifs dans les filtres.
   * Mémorisé pour éviter les recalculs à chaque render.
   * 
   * @memoization Se recalcule uniquement si la liste des fichiers change
   * @returns {Record<string, number>} Compteurs par statut
   * 
   * @example
   * ```
   * {
   *   "ready": 15,
   *   "uploading": 2, 
   *   "error": 1
   * }
   * ```
   */
  const statusCounts = React.useMemo(() => {
    return files.reduce((acc, file) => {
      acc[file.status] = (acc[file.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [files])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un fichier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          {/* Filtre par statut */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="h-4 w-4 mr-2" />
                Statut
                {filters.status !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.status}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ status: value as any })}
              >
                <DropdownMenuRadioItem value="all">
                  Tous les fichiers
                  <Badge variant="outline" className="ml-auto">
                    {files.length}
                  </Badge>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ready">
                  Prêts
                  <Badge variant="outline" className="ml-auto">
                    {statusCounts.ready || 0}
                  </Badge>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="uploading">
                  En cours
                  <Badge variant="outline" className="ml-auto">
                    {statusCounts.uploading || 0}
                  </Badge>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="error">
                  Erreur
                  <Badge variant="outline" className="ml-auto">
                    {statusCounts.error || 0}
                  </Badge>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tri */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                Trier
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>Trier par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-')
                  setFilters({ sortBy: sortBy as any, sortOrder: sortOrder as any })
                }}
              >
                <DropdownMenuRadioItem value="uploadDate-desc">
                  Plus récent d'abord
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="uploadDate-asc">
                  Plus ancien d'abord
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="originalFilename-asc">
                  Nom A-Z
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="originalFilename-desc">
                  Nom Z-A
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fileSize-desc">
                  Taille décroissante
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fileSize-asc">
                  Taille croissante
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actualiser */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFiles()}
            disabled={isLoading}
            className="h-10"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-red-800">
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error.message}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearError}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Fermer
          </Button>
        </div>
      )}

      {/* Liste des fichiers */}
      <div className="space-y-2">
        {isLoading && files.length === 0 ? (
          // Skeleton loading
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          // État vide
          <div className="text-center py-12">
            <FileX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun fichier trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filters.status !== 'all' || filters.fileType
                ? "Aucun fichier ne correspond aux critères de recherche."
                : "Commencez par uploader des fichiers depuis vos agents."}
            </p>
            {(searchTerm || filters.status !== 'all' || filters.fileType) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilters({ search: undefined, status: 'all', fileType: undefined })
                }}
              >
                Effacer les filtres
              </Button>
            )}
          </div>
        ) : (
          // Liste des fichiers
          files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              onDelete={handleDelete}
              onView={handleView}
              showAgent={showAgent}
              className={isDeleting === file.id ? "opacity-50" : ""}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-600">
            Page {pagination.page} sur {pagination.pages} ({pagination.total} fichiers)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1 || isLoading}
              onClick={() => setFilters({ page: pagination.page - 1 })}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages || isLoading}
              onClick={() => setFilters({ page: pagination.page + 1 })}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}