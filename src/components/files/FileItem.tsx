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
 * Composant pour afficher un élément fichier dans une liste
 * - Informations complètes du fichier
 * - Actions contextuelles (voir, supprimer, télécharger)
 * - Design cohérent avec le reste de l'app
 */

interface FileItemProps {
  file: FileResponse & { agent?: { id: string; name: string } }
  onDelete?: (file: FileResponse) => void
  onView?: (file: FileResponse) => void
  className?: string
  showAgent?: boolean
}

export function FileItem({ 
  file, 
  onDelete, 
  onView, 
  className = "",
  showAgent = true 
}: FileItemProps) {
  const fileStatus = useFileStatus(file.status)
  
  const uploadDate = new Date(file.uploadDate)
  const timeAgo = formatDistanceToNow(uploadDate, { 
    addSuffix: true, 
    locale: fr 
  })

  const handleDelete = () => {
    if (onDelete) {
      onDelete(file)
    }
  }

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

// Version compacte pour les listes denses
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