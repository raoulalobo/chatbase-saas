import { z } from "zod"

/**
 * Schémas Zod pour la validation des fichiers
 * - Types sûrs pour les fichiers et leurs opérations
 * - Validation complète des données entrantes/sortantes
 * - Messages d'erreur en français pour l'UX
 */

// Schéma de base pour un fichier
export const FileSchema = z.object({
  id: z.string().min(1, "L'ID du fichier est requis"),
  agentId: z.string().min(1, "L'ID de l'agent est requis"),
  originalFilename: z.string().min(1, "Le nom de fichier est requis"),
  anthropicFileId: z.string().min(1, "L'ID Anthropic est requis"),
  fileType: z.string().nullable(),
  fileSize: z.string().nullable(),
  uploadDate: z.string().or(z.date()),
  status: z.enum(["uploading", "ready", "error"], {
    message: "Le statut doit être uploading, ready ou error"
  }),
})

// Type TypeScript inféré
export type FileResponse = z.infer<typeof FileSchema>

// Schéma pour la création d'un fichier (sans ID et dates)
export const CreateFileSchema = z.object({
  agentId: z.string().min(1, "L'ID de l'agent est requis"),
  originalFilename: z.string().min(1, "Le nom de fichier est requis"),
  anthropicFileId: z.string(),
  fileType: z.string().optional(),
  fileSize: z.string().optional(),
})

export type CreateFile = z.infer<typeof CreateFileSchema>

// Schéma pour la mise à jour d'un fichier
export const UpdateFileSchema = z.object({
  anthropicFileId: z.string().min(1).optional(),
  status: z.enum(["uploading", "ready", "error"]).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Au moins un champ doit être modifié" }
)

export type UpdateFile = z.infer<typeof UpdateFileSchema>

// Schéma pour les paramètres d'URL
export const FileParamsSchema = z.object({
  id: z.string().min(1, "L'ID du fichier est requis"),
})

// Schéma pour les requêtes de liste avec filtres
export const FileQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  
  // Filtres
  agentId: z.string().optional(),
  status: z.enum(["uploading", "ready", "error", "all"]).default("all"),
  fileType: z.string().optional(), // ex: "application/pdf"
  search: z.string().optional(), // Recherche dans le nom de fichier
  
  // Tri
  sortBy: z.enum(["originalFilename", "uploadDate", "fileSize"]).default("uploadDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export type FileQuery = z.infer<typeof FileQuerySchema>

// Schéma pour les statistiques des fichiers
export const FileStatsSchema = z.object({
  totalFiles: z.number().min(0),
  totalSize: z.number().min(0), // en bytes
  filesByStatus: z.object({
    uploading: z.number().min(0),
    ready: z.number().min(0),
    error: z.number().min(0),
  }),
  filesByType: z.array(z.object({
    type: z.string(),
    count: z.number().min(0),
    size: z.number().min(0),
  })),
  recentUploads: z.number().min(0), // fichiers des 7 derniers jours
})

export type FileStats = z.infer<typeof FileStatsSchema>

// Schéma pour les réponses paginées
export const FilesPaginatedResponseSchema = z.object({
  files: z.array(FileSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }),
})

export type FilesPaginatedResponse = z.infer<typeof FilesPaginatedResponseSchema>

// Schéma pour les réponses de liste simple
export const FilesListResponseSchema = z.object({
  files: z.array(FileSchema),
  total: z.number(),
})

export type FilesListResponse = z.infer<typeof FilesListResponseSchema>

// Schéma pour l'upload de fichier
export const FileUploadSchema = z.object({
  agentId: z.string().min(1, "L'ID de l'agent est requis"),
})

export type FileUpload = z.infer<typeof FileUploadSchema>

// Schéma pour la validation des types de fichiers supportés
export const SupportedFileTypesSchema = z.enum([
  "application/pdf",
  "text/plain", 
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "application/json",
  "text/html",
], {
  message: "Type de fichier non supporté"
})

export type SupportedFileTypes = z.infer<typeof SupportedFileTypesSchema>

// Schéma pour la validation de taille de fichier
export const FileSizeValidationSchema = z.object({
  size: z.number()
    .min(1, "Le fichier ne peut pas être vide")
    .max(25 * 1024 * 1024, "Le fichier ne peut pas dépasser 25MB"),
  filename: z.string().min(1, "Le nom de fichier est requis"),
  type: SupportedFileTypesSchema,
})

// Utilitaire pour formater les types de fichiers
export const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "text/plain": "Texte",
  "text/markdown": "Markdown", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "text/csv": "CSV",
  "application/json": "JSON",
  "text/html": "HTML",
}

// Utilitaire pour formater les tailles
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Utilitaire pour obtenir l'extension depuis le type MIME
export const getFileExtension = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/markdown": "md",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/csv": "csv",
    "application/json": "json",
    "text/html": "html",
  }
  return extensions[mimeType] || "unknown"
}