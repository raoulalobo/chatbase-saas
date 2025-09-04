"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { MoreHorizontal, Trash2, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { FileTypeIcon, getFileTypeLabel } from "./FileTypeIcon"
import { FileSizeFormatter } from "./FileSizeFormatter"
import { FileStatusBadge, useFileStatus } from "./FileStatusBadge"
import type { FileResponse } from "@/lib/schemas/file"

/**
 * Composant d'affichage individuel d'un fichier dans une liste
 * 
 * Ce composant représente un fichier unique avec toutes ses métadonnées,
 * actions contextuelles, et indicateurs visuels. Il constitue l'unité
 * de base de l'interface de gestion des fichiers.
 * 
 * @component FileItem
 * @category Files Management
 * 
 * @features
 * - **Informations complètes** : Nom, taille, type, date, statut, agent
 * - **Actions contextuelles** : Menu dropdown avec voir/télécharger/supprimer
 * - **Indicateurs visuels** : Badge de statut, icône de type, progression
 * - **Design adaptatif** : Responsive avec gestion des textes longs
 * - **Interactions fluides** : Hover effects, transitions CSS, focus states
 * - **Accessibilité** : Navigation clavier, lecteurs d'écran, ARIA labels
 * 
 * @design
 * - **Layout** : Flexbox avec icône, détails, actions alignées
 * - **Typography** : Hiérarchie claire avec tailles et couleurs distinctes
 * - **Spacing** : Paddings cohérents avec le design system Tailwind
 * - **Colors** : Palette sémantique pour les statuts et actions
 * - **Icons** : Lucide React pour la cohérence visuelle
 * 
 * @interactions
 * - **Hover** : Mise en évidence avec changement de background
 * - **Focus** : Outline visible pour la navigation clavier
 * - **Actions** : Menu contextuel avec animations fluides
 * - **Feedback** : Indicateurs visuels pour les actions en cours
 * 
 * @variants
 * - **FileItem** : Version complète avec toutes les informations
 * - **FileItemCompact** : Version condensée pour les listes denses
 * 
 * @example
 * ```tsx
 * // Usage basique
 * <FileItem 
 *   file={fileData}
 *   onDelete={handleDelete}
 *   onView={handleView}
 * />
 * 
 * // Version compacte
 * <FileItemCompact
 *   file={fileData}
 *   showAgent={false}
 *   className="border-t"
 * />
 * ```
 * 
 * @accessibility
 * - Labels ARIA pour les actions et états
 * - Navigation clavier complète (Tab, Enter, Space)
 * - Annonces de statut pour les lecteurs d'écran
 * - Contraste suffisant pour tous les éléments
 */

/**
 * Props du composant FileItem pour la configuration et les callbacks
 * 
 * Interface définissant les paramètres de customisation du composant
 * et les gestionnaires d'événements pour l'intégration parent.
 */
interface FileItemProps {
  /** Données du fichier avec informations optionnelles de l'agent */
  file: FileResponse & { agent?: { id: string; name: string } }
  /** Callback exécuté lors de la suppression du fichier */
  onDelete?: (file: FileResponse) => void
  /** Callback exécuté lors de la visualisation des détails */
  onView?: (file: FileResponse) => void
  /** Classes CSS additionnelles pour le conteneur */
  className?: string
  /** Afficher les informations de l'agent (défaut: true) */
  showAgent?: boolean
}

/**
 * Composant FileItem principal avec layout complet
 * 
 * Implémente l'affichage standard d'un fichier avec toutes les
 * métadonnées, actions contextuelles, et interactions utilisateur.
 * 
 * @param {FileItemProps} props Configuration et callbacks du composant
 */
export function FileItem({ 
  file, 
  onDelete, 
  onView, 
  className = "",
  showAgent = true 
}: FileItemProps) {
  /**
   * Récupération du statut du fichier avec métadonnées
   * 
   * Utilise le hook useFileStatus pour obtenir les informations
   * contextuelles sur le statut (couleurs, icônes, actions autorisées).
   */
  const fileStatus = useFileStatus(file.status)
  
  /**
   * Calcul de la date d'upload formattée en temps relatif
   * 
   * Utilise date-fns pour afficher une date lisible par l'utilisateur
   * (ex: "il y a 2 heures", "hier", "il y a 3 jours").
   */
  const uploadDate = new Date(file.uploadDate)
  const timeAgo = formatDistanceToNow(uploadDate, { 
    addSuffix: true,     // Ajoute "il y a" avant la durée
    locale: fr           // Localisation française
  })

  /**
   * Gestionnaire de suppression avec délégation au parent
   * 
   * Transmet l'action de suppression au composant parent
   * qui gèrera la logique métier (confirmation, API, etc.).
   */
  const handleDelete = () => {
    if (onDelete) {
      onDelete(file)
    }
  }

  /**
   * Gestionnaire de visualisation avec délégation au parent
   * 
   * Transmet l'action de visualisation au composant parent
   * pour l'ouverture de modals, navigation, etc.
   */
  const handleView = () => {
    if (onView) {
      onView(file)
    }
  }

  return (
    <div className={`group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors ${className}`}>
      {/* Informations principales */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Icône et type */}
        <div className="flex-shrink-0">
          <FileTypeIcon 
            mimeType={file.fileType} 
            size={24}
            className="group-hover:scale-110 transition-transform"
          />
        </div>

        {/* Détails du fichier */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-slate-900 truncate">
              {file.originalFilename}
            </h3>
            <FileStatusBadge status={file.status} showIcon={false} />
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <span>Type:</span>
              <span className="font-medium">
                {getFileTypeLabel(file.fileType)}
              </span>
            </span>
            
            <span className="flex items-center gap-1">
              <span>Taille:</span>
              <FileSizeFormatter size={file.fileSize} showUnit={true} />
            </span>
            
            <span className="flex items-center gap-1">
              <span>Uploadé:</span>
              <span>{timeAgo}</span>
            </span>

            {showAgent && file.agent && (
              <span className="flex items-center gap-1">
                <span>Agent:</span>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {file.agent.name}
                </Badge>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="h-4 w-4 mr-2" />
              Voir les détails
            </DropdownMenuItem>
            
            {file.status === "ready" && (
              <DropdownMenuItem disabled>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
                <span className="text-xs text-slate-500 ml-auto">Bientôt</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={!fileStatus.canDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/**
 * Variante compacte du composant FileItem pour les listes denses
 * 
 * Version allégée du composant principal, optimisée pour l'affichage
 * dans des espaces restreints ou des listes avec beaucoup d'éléments.
 * 
 * @variant Compact - Réduit les espacements et informations affichées
 * @usecase Idéal pour les sidebars, modals étroites, ou listes longues
 * 
 * @differences
 * - Espacement réduit (py-2 px-3 vs p-4)
 * - Icônes plus petites (16px vs 24px)
 * - Actions simplifiées (boutons directs vs menu dropdown)
 * - Moins de métadonnées affichées
 * - showAgent désactivé par défaut
 */
export function FileItemCompact({ 
  file, 
  onDelete, 
  onView, 
  className = "",
  showAgent = false 
}: FileItemProps) {
  const fileStatus = useFileStatus(file.status)

  return (
    <div className={`flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded transition-colors ${className}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileTypeIcon mimeType={file.fileType} size={16} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-900 truncate">{file.originalFilename}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileSizeFormatter size={file.fileSize} />
            <FileStatusBadge status={file.status} showIcon={false} />
            {showAgent && file.agent && (
              <span>• {file.agent.name}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {onView && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onView(file)}
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
        
        {fileStatus.canDelete && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            onClick={() => onDelete(file)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}