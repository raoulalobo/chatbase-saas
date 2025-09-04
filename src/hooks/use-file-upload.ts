"use client"

import * as React from "react"
import { SupportedFileTypesSchema, FileSizeValidationSchema } from "@/lib/schemas/file"

/**
 * Hook React personnalisé pour la gestion complète d'upload de fichiers
 * 
 * Ce hook encapsule toute la logique d'upload de fichiers vers les agents,
 * incluant la validation, le suivi de progression, la gestion d'erreurs,
 * et l'intégration avec l'API backend. Il utilise XMLHttpRequest pour
 * un contrôle précis du processus d'upload et du suivi de progression.
 * 
 * @features
 * - **Validation pré-upload** : Types MIME, taille, format
 * - **Suivi de progression** : Pourcentage temps réel via XMLHttpRequest
 * - **Gestion d'erreurs** : Messages localisés et codes d'erreur
 * - **Support timeout** : 5 minutes par défaut pour gros fichiers
 * - **Callbacks configurables** : onSuccess, onError, onProgress
 * - **Validation Zod** : Intégration avec les schémas de validation
 * 
 * @performance
 * - Utilisation de XMLHttpRequest pour le contrôle de progression
 * - Validation côté client pour éviter les uploads inutiles  
 * - Gestion mémoire optimisée avec cleanup automatique
 * - Timeout configurable pour éviter les uploads infinis
 * 
 * @compatibility
 * - Compatible avec tous les navigateurs modernes
 * - Support des gros fichiers (jusqu'à 25MB par défaut)
 * - Intégration native avec l'API FormData
 * 
 * @example
 * ```tsx
 * const { upload, isUploading, progress, error } = useFileUpload({
 *   agentId: 'agent_123',
 *   onSuccess: (response) => console.log('Upload réussi:', response),
 *   onError: (error) => console.error('Erreur upload:', error),
 *   onProgress: (progress) => console.log(`${progress.percentage}%`)
 * });
 * 
 * // Upload d'un fichier
 * const handleFileSelect = async (file: File) => {
 *   const success = await upload(file);
 *   if (success) {
 *     // Fichier uploadé avec succès
 *   }
 * };
 * ```
 */

/**
 * Interface décrivant l'objet de progression d'upload
 * 
 * Contient toutes les informations nécessaires pour afficher
 * une barre de progression et des statistiques d'upload.
 */
interface UploadProgress {
  /** Nombre d'octets déjà envoyés */
  loaded: number
  /** Taille totale du fichier en octets */
  total: number
  /** Pourcentage de progression (0-100) */
  percentage: number
}

/**
 * Interface décrivant une erreur d'upload
 * 
 * Structure standardisée pour toutes les erreurs liées à l'upload
 * de fichiers, compatible avec les systèmes de notification.
 */
interface UploadError {
  /** Message d'erreur lisible par l'utilisateur */
  message: string
  /** Code d'erreur technique optionnel pour le débogage */
  code?: string
}

/**
 * Options de configuration du hook useFileUpload
 * 
 * Définit le comportement et les callbacks du processus d'upload.
 * Permet une customisation fine selon les besoins de chaque composant.
 */
interface UseFileUploadOptions {
  /** ID de l'agent vers lequel uploader le fichier */
  agentId: string
  /** Callback exécuté en cas de succès d'upload */
  onSuccess?: (response: any) => void
  /** Callback exécuté en cas d'erreur d'upload */
  onError?: (error: UploadError) => void
  /** Callback exécuté à chaque mise à jour de progression */
  onProgress?: (progress: UploadProgress) => void
  /** Taille maximale autorisée en octets (défaut: 25MB) */
  maxSize?: number
  /** Liste des types MIME autorisés (optionnel, utilise les défauts sinon) */
  allowedTypes?: string[]
}

/**
 * Interface de retour du hook useFileUpload
 * 
 * Définit l'API publique du hook avec toutes les fonctions
 * et états disponibles pour les composants consommateurs.
 */
interface UseFileUploadReturn {
  /** Fonction principale pour uploader un fichier */
  upload: (file: File) => Promise<boolean>
  /** Indique si un upload est en cours */
  isUploading: boolean
  /** Objet de progression actuel (null si pas d'upload) */
  progress: UploadProgress | null
  /** Erreur actuelle (null si pas d'erreur) */
  error: UploadError | null
  /** Fonction pour effacer l'erreur actuelle */
  clearError: () => void
  /** Fonction pour valider un fichier sans l'uploader */
  validateFile: (file: File) => { valid: boolean; error?: string }
}

/**
 * Hook principal pour la gestion d'upload de fichiers
 * 
 * Implémente la logique complète d'upload avec validation, progression
 * et gestion d'erreurs. Utilise XMLHttpRequest pour un contrôle fin
 * du processus d'upload et du suivi de progression en temps réel.
 * 
 * @param {UseFileUploadOptions} options Configuration du hook
 * @returns {UseFileUploadReturn} API du hook avec fonctions et états
 * 
 * @example
 * ```tsx
 * const fileUpload = useFileUpload({
 *   agentId: 'agent_123',
 *   maxSize: 10 * 1024 * 1024, // 10MB
 *   onSuccess: (response) => {
 *     toast.success('Fichier uploadé avec succès !');
 *     refreshFilesList();
 *   },
 *   onError: (error) => {
 *     toast.error(`Erreur: ${error.message}`);
 *   },
 *   onProgress: (progress) => {
 *     setUploadProgress(progress.percentage);
 *   }
 * });
 * ```
 */
export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  /**
   * Destructuration des options avec valeurs par défaut
   * 
   * Extrait la configuration passée au hook et définit
   * les valeurs par défaut pour les options non spécifiées.
   */
  const {
    agentId,
    onSuccess,
    onError,
    onProgress,
    maxSize = 25 * 1024 * 1024, // 25MB - Limite par défaut de l'API
    allowedTypes // Optionnel - utilise SupportedFileTypesSchema par défaut
  } = options

  /**
   * États React pour la gestion du processus d'upload
   * 
   * Ces états sont exposés aux composants consommateurs pour
   * permettre l'affichage d'indicateurs visuels et la gestion UX.
   */
  const [isUploading, setIsUploading] = React.useState(false)  // Flag d'upload en cours
  const [progress, setProgress] = React.useState<UploadProgress | null>(null)  // Progression actuelle
  const [error, setError] = React.useState<UploadError | null>(null)  // Erreur actuelle

  /**
   * Fonction de validation complète d'un fichier
   * 
   * Effectue toutes les validations nécessaires avant l'upload :
   * - Validation Zod avec FileSizeValidationSchema
   * - Vérification des types MIME autorisés
   * - Validation de la taille personnalisée
   * - Gestion des erreurs avec messages localisés
   * 
   * @param {File} file - Fichier à valider
   * @returns {Object} Résultat de validation avec flag et message d'erreur optionnel
   * 
   * @example
   * ```tsx
   * const { valid, error } = validateFile(selectedFile);
   * if (!valid) {
   *   toast.error(error);
   *   return;
   * }
   * ```
   */
  const validateFile = React.useCallback((file: File) => {
    try {
      /**
       * Étape 1: Validation Zod avec schéma de taille de fichier
       * 
       * Utilise FileSizeValidationSchema pour valider :
       * - Taille du fichier (limite globale)
       * - Nom du fichier (présence et format)
       * - Type MIME (format basique)
       */
      FileSizeValidationSchema.parse({
        size: file.size,
        filename: file.name,
        type: file.type
      })

      /**
       * Étape 2: Validation des types autorisés personnalisés
       * 
       * Si une liste spécifique de types est fournie dans les options,
       * vérifie que le fichier correspond à l'un d'eux.
       */
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(", ")}`
        }
      }

      /**
       * Étape 3: Validation avec le schéma des types supportés
       * 
       * Utilise SupportedFileTypesSchema pour valider que le type MIME
       * est dans la liste des types supportés par l'application.
       */
      SupportedFileTypesSchema.parse(file.type)

      /**
       * Étape 4: Validation de la taille personnalisée
       * 
       * Vérifie la limite de taille spécifiée dans les options du hook.
       * Cette validation complète celle du schéma Zod pour plus de flexibilité.
       */
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024)
        return {
          valid: false,
          error: `Le fichier est trop volumineux. Taille maximale: ${maxSizeMB}MB`
        }
      }

      return { valid: true }

    } catch (err: any) {
      /**
       * Gestion des erreurs de validation
       * 
       * Transforme les erreurs Zod et autres exceptions en messages
       * d'erreur utilisateur-friendly avec fallback générique.
       */
      let errorMessage = "Fichier invalide"
      
      // Extraction du premier message d'erreur Zod si disponible
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