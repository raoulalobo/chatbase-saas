"use client"

import * as React from "react"
import { 
  FileText, 
  File, 
  FileImage, 
  FileSpreadsheet, 
  FileCode,
  FileVideo,
  FileAudio,
  Archive,
  HelpCircle
} from "lucide-react"

/**
 * Composant pour afficher l'icône appropriée selon le type de fichier
 * - Mapping des types MIME vers des icônes Lucide
 * - Couleurs cohérentes par catégorie
 * - Fallback pour les types non reconnus
 */

interface FileTypeIconProps {
  mimeType: string | null
  className?: string
  size?: number
}

export function FileTypeIcon({ mimeType, className = "", size = 20 }: FileTypeIconProps) {
  const getIconAndColor = (type: string | null) => {
    if (!type) {
      return { 
        Icon: HelpCircle, 
        color: "text-gray-500" 
      }
    }

    // Documents texte
    if (type === "application/pdf") {
      return { Icon: FileText, color: "text-red-600" }
    }
    if (type === "text/plain" || type === "text/markdown") {
      return { Icon: FileText, color: "text-blue-600" }
    }
    if (type.includes("word") || type.includes("document")) {
      return { Icon: FileText, color: "text-blue-700" }
    }

    // Feuilles de calcul
    if (type === "text/csv" || type.includes("spreadsheet") || type.includes("excel")) {
      return { Icon: FileSpreadsheet, color: "text-green-600" }
    }

    // Code/Développement
    if (type === "application/json" || type === "text/html" || type.includes("javascript") || type.includes("typescript")) {
      return { Icon: FileCode, color: "text-purple-600" }
    }

    // Images
    if (type.startsWith("image/")) {
      return { Icon: FileImage, color: "text-pink-600" }
    }

    // Vidéo
    if (type.startsWith("video/")) {
      return { Icon: FileVideo, color: "text-orange-600" }
    }

    // Audio
    if (type.startsWith("audio/")) {
      return { Icon: FileAudio, color: "text-indigo-600" }
    }

    // Archives
    if (type.includes("zip") || type.includes("rar") || type.includes("archive")) {
      return { Icon: Archive, color: "text-yellow-600" }
    }

    // Par défaut
    return { Icon: File, color: "text-gray-600" }
  }

  const { Icon, color } = getIconAndColor(mimeType)

  return (
    <Icon 
      className={`${color} ${className}`} 
      size={size}
    />
  )
}

// Utilitaire pour obtenir le label du type de fichier
export function getFileTypeLabel(mimeType: string | null): string {
  if (!mimeType) return "Inconnu"

  const labels: Record<string, string> = {
    "application/pdf": "PDF",
    "text/plain": "Texte",
    "text/markdown": "Markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
    "text/csv": "CSV",
    "application/json": "JSON",
    "text/html": "HTML",
    "image/png": "PNG",
    "image/jpeg": "JPEG",
    "image/gif": "GIF",
    "video/mp4": "MP4",
    "audio/mp3": "MP3",
    "application/zip": "ZIP",
  }

  return labels[mimeType] || mimeType.split("/")[1]?.toUpperCase() || "Fichier"
}