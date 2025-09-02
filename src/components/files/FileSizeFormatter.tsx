"use client"

import * as React from "react"

/**
 * Composant pour formater et afficher la taille des fichiers
 * - Conversion automatique en unités appropriées (B, KB, MB, GB)
 * - Affichage conditionnel si pas de taille
 * - Styling cohérent avec le reste de l'app
 */

interface FileSizeFormatterProps {
  size: string | number | null
  className?: string
  showUnit?: boolean
}

export function FileSizeFormatter({ 
  size, 
  className = "text-sm text-slate-600", 
  showUnit = true 
}: FileSizeFormatterProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return showUnit ? '0 B' : '0'
    
    const k = 1024
    const sizes = showUnit ? ['B', 'KB', 'MB', 'GB', 'TB'] : ['', 'K', 'M', 'G', 'T']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2))
    const unit = sizes[i]
    
    return showUnit ? `${value} ${unit}` : `${value}${unit}`
  }

  const getSizeInBytes = (size: string | number | null): number | null => {
    if (!size) return null
    
    if (typeof size === 'number') {
      return size
    }
    
    if (typeof size === 'string') {
      const parsed = parseInt(size, 10)
      return isNaN(parsed) ? null : parsed
    }
    
    return null
  }

  const bytes = getSizeInBytes(size)

  if (bytes === null) {
    return (
      <span className={`${className} opacity-50`}>
        -
      </span>
    )
  }

  return (
    <span className={className}>
      {formatFileSize(bytes)}
    </span>
  )
}

// Hook personnalisé pour formater la taille de fichier
export function useFileSize(size: string | number | null) {
  return React.useMemo(() => {
    if (!size) return null
    
    const bytes = typeof size === 'string' ? parseInt(size, 10) : size
    if (isNaN(bytes)) return null

    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2))
    const unit = sizes[i]
    
    return `${value} ${unit}`
  }, [size])
}

// Utilitaire pour obtenir la couleur selon la taille
export function getFileSizeColor(bytes: number): string {
  if (bytes < 1024) return "text-green-600" // < 1KB
  if (bytes < 1024 * 1024) return "text-blue-600" // < 1MB
  if (bytes < 10 * 1024 * 1024) return "text-orange-600" // < 10MB
  return "text-red-600" // >= 10MB
}

// Composant avec couleur selon la taille
export function FileSizeWithColor({ 
  size, 
  className = "text-sm font-medium" 
}: FileSizeFormatterProps) {
  const bytes = typeof size === 'string' ? parseInt(size, 10) : size || 0
  const colorClass = getFileSizeColor(bytes)
  
  return (
    <FileSizeFormatter 
      size={size} 
      className={`${className} ${colorClass}`}
    />
  )
}