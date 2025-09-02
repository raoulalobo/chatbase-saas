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
 * Composant principal pour afficher et gérer la liste des fichiers
 * - Recherche et filtres avancés
 * - Tri par différents critères
 * - Actions bulk (futures)
 * - Pagination intégrée
 */

interface FilesListProps {
  onFileView?: (file: FileResponse) => void
  onFileDelete?: (file: FileResponse) => void
  showAgent?: boolean
  className?: string
}

export function FilesList({ 
  onFileView, 
  onFileDelete,
  showAgent = true,
  className = "" 
}: FilesListProps) {
  const {
    files,
    isLoading,
    error,
    filters,
    pagination,
    setFilters,
    fetchFiles,
    deleteFile,
    clearError
  } = useFiles()

  const [searchTerm, setSearchTerm] = React.useState(filters.search || "")
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null)

  // Debounce pour la recherche
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ search: searchTerm || undefined })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, filters.search]) // Retirer setFilters des dépendances

  // Gérer la suppression
  const handleDelete = async (file: FileResponse) => {
    if (onFileDelete) {
      onFileDelete(file)
      return
    }

    setIsDeleting(file.id)
    const success = await deleteFile(file.id)
    if (success) {
      // Optionellement afficher une notification de succès
    }
    setIsDeleting(null)
  }

  // Gérer la vue
  const handleView = (file: FileResponse) => {
    if (onFileView) {
      onFileView(file)
    }
  }

  // Compteurs pour les filtres
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