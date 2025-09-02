"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Upload } from "lucide-react"

/**
 * Composant pour afficher le statut d'un fichier avec badge coloré
 * - Différents styles selon le statut (uploading, ready, error)
 * - Icônes appropriées pour chaque statut
 * - Animation pour le statut uploading
 */

interface FileStatusBadgeProps {
  status: "uploading" | "ready" | "error"
  className?: string
  showIcon?: boolean
}

export function FileStatusBadge({ 
  status, 
  className = "", 
  showIcon = true 
}: FileStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "uploading":
        return {
          label: "En cours...",
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Loader2 className="w-3 h-3 animate-spin" />
        }
      case "ready":
        return {
          label: "Prêt",
          variant: "default" as const,
          className: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: <CheckCircle className="w-3 h-3" />
        }
      case "error":
        return {
          label: "Erreur",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="w-3 h-3" />
        }
      default:
        return {
          label: "Inconnu",
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Upload className="w-3 h-3" />
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} flex items-center gap-1 px-2 py-1`}
    >
      {showIcon && config.icon}
      <span className="text-xs font-medium">{config.label}</span>
    </Badge>
  )
}

// Composant simple juste avec l'icône
export function FileStatusIcon({ 
  status, 
  className = "w-4 h-4" 
}: {
  status: "uploading" | "ready" | "error"
  className?: string
}) {
  const getIcon = (status: string) => {
    switch (status) {
      case "uploading":
        return <Loader2 className={`${className} text-blue-600 animate-spin`} />
      case "ready":
        return <CheckCircle className={`${className} text-emerald-600`} />
      case "error":
        return <XCircle className={`${className} text-red-600`} />
      default:
        return <Upload className={`${className} text-gray-600`} />
    }
  }

  return getIcon(status)
}

// Hook pour obtenir les informations de statut
export function useFileStatus(status: "uploading" | "ready" | "error") {
  return React.useMemo(() => {
    switch (status) {
      case "uploading":
        return {
          label: "Upload en cours",
          description: "Le fichier est en cours d'upload vers Anthropic",
          color: "blue",
          canDelete: false,
          canUse: false
        }
      case "ready":
        return {
          label: "Prêt à utiliser",
          description: "Le fichier a été uploadé avec succès",
          color: "green",
          canDelete: true,
          canUse: true
        }
      case "error":
        return {
          label: "Erreur d'upload",
          description: "Une erreur est survenue lors de l'upload",
          color: "red",
          canDelete: true,
          canUse: false
        }
      default:
        return {
          label: "Statut inconnu",
          description: "Le statut du fichier n'est pas défini",
          color: "gray",
          canDelete: false,
          canUse: false
        }
    }
  }, [status])
}