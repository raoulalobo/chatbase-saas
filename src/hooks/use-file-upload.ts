"use client"

import * as React from "react"
import { SupportedFileTypesSchema, FileSizeValidationSchema } from "@/lib/schemas/file"

/**
 * Hook personnalisé pour gérer l'upload de fichiers
 * - Validation des fichiers avant upload
 * - Progress tracking
 * - Gestion des erreurs
 * - Support drag & drop
 */

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface UploadError {
  message: string
  code?: string
}

interface UseFileUploadOptions {
  agentId: string
  onSuccess?: (response: any) => void
  onError?: (error: UploadError) => void
  onProgress?: (progress: UploadProgress) => void
  maxSize?: number // en bytes, défaut 25MB
  allowedTypes?: string[]
}

interface UseFileUploadReturn {
  upload: (file: File) => Promise<boolean>
  isUploading: boolean
  progress: UploadProgress | null
  error: UploadError | null
  clearError: () => void
  validateFile: (file: File) => { valid: boolean; error?: string }
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const {
    agentId,
    onSuccess,
    onError,
    onProgress,
    maxSize = 25 * 1024 * 1024, // 25MB
    allowedTypes
  } = options

  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState<UploadProgress | null>(null)
  const [error, setError] = React.useState<UploadError | null>(null)

  // Validation d'un fichier
  const validateFile = React.useCallback((file: File) => {
    try {
      // Validation de la taille
      FileSizeValidationSchema.parse({
        size: file.size,
        filename: file.name,
        type: file.type
      })

      // Validation du type si spécifié
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(", ")}`
        }
      }

      // Validation avec le schéma Zod
      SupportedFileTypesSchema.parse(file.type)

      // Validation de la taille personnalisée
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024)
        return {
          valid: false,
          error: `Le fichier est trop volumineux. Taille maximale: ${maxSizeMB}MB`
        }
      }

      return { valid: true }

    } catch (err: any) {
      let errorMessage = "Fichier invalide"
      
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message
      } else if (err.message) {
        errorMessage = err.message
      }

      return {
        valid: false,
        error: errorMessage
      }
    }
  }, [allowedTypes, maxSize])

  // Upload d'un fichier
  const upload = React.useCallback(async (file: File): Promise<boolean> => {
    // Validation préalable
    const validation = validateFile(file)
    if (!validation.valid) {
      const uploadError = { message: validation.error || "Fichier invalide" }
      setError(uploadError)
      onError?.(uploadError)
      return false
    }

    setIsUploading(true)
    setProgress({ loaded: 0, total: file.size, percentage: 0 })
    setError(null)

    try {
      // Créer FormData
      const formData = new FormData()
      formData.append('file', file)

      // XMLHttpRequest pour le support du progress
      const xhr = new XMLHttpRequest()

      // Promise pour gérer l'upload
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progressData: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            }
            setProgress(progressData)
            onProgress?.(progressData)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (err) {
              reject(new Error("Réponse invalide du serveur"))
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              reject(new Error(errorResponse.error || `Erreur HTTP ${xhr.status}`))
            } catch (err) {
              reject(new Error(`Erreur HTTP ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error("Erreur de réseau lors de l'upload"))
        })

        xhr.addEventListener('timeout', () => {
          reject(new Error("Timeout lors de l'upload"))
        })
      })

      // Configuration et envoi de la requête
      xhr.open('POST', `/api/agents/${agentId}/files`)
      xhr.setRequestHeader('Accept', 'application/json')
      xhr.timeout = 5 * 60 * 1000 // 5 minutes timeout
      xhr.send(formData)

      // Attendre la réponse
      const response = await uploadPromise

      // Upload terminé avec succès
      setProgress({ loaded: file.size, total: file.size, percentage: 100 })
      setIsUploading(false)
      onSuccess?.(response)
      
      return true

    } catch (err: any) {
      const uploadError: UploadError = {
        message: err.message || "Erreur lors de l'upload",
        code: err.code
      }
      
      setError(uploadError)
      setIsUploading(false)
      setProgress(null)
      onError?.(uploadError)
      
      return false
    }
  }, [agentId, validateFile, onSuccess, onError, onProgress])

  // Effacer l'erreur
  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    upload,
    isUploading,
    progress,
    error,
    clearError,
    validateFile
  }
}

// Hook pour gérer le drag & drop
export function useFileDrop(options: {
  onFileDrop: (files: File[]) => void
  onFileHover?: (isHovering: boolean) => void
  multiple?: boolean
}) {
  const { onFileDrop, onFileHover, multiple = false } = options
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    onFileHover?.(true)
  }, [onFileHover])

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    onFileHover?.(false)
  }, [onFileHover])

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    onFileHover?.(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const filesToProcess = multiple ? files : [files[0]]
      onFileDrop(filesToProcess)
    }
  }, [onFileDrop, multiple, onFileHover])

  return {
    isDragging,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    }
  }
}