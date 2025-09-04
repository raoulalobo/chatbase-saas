import { z } from "zod"
import { AntiHallucinationTemplateSchema, type HallucinationIntensity } from "@/lib/templates/anti-hallucination"

/**
 * Schémas de validation Zod pour les agents IA
 * - Validation unifiée côté client et serveur
 * - Types TypeScript générés automatiquement
 * - Messages d'erreur personnalisés en français
 */

// Schéma de base pour un agent IA
export const AgentBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .regex(/^[a-zA-Z0-9\s\-_àáâäèéêëìíîïòóôöùúûüçñ]+$/, "Le nom contient des caractères invalides"),
  
  description: z
    .string()
    .min(1, "La description est obligatoire")
    .max(500, "La description ne peut pas dépasser 500 caractères"),
  
  systemPrompt: z
    .string()
    .min(10, "Le prompt système doit contenir au moins 10 caractères")
    .max(50000, "Le prompt système ne peut pas dépasser 50000 caractères"),
  
  // Paramètres Anthropic avec validation stricte
  temperature: z
    .string()
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0 && num <= 1
      },
      "La température doit être entre 0 et 1"
    ),
  
  maxTokens: z
    .string()
    .refine(
      (val) => {
        const num = parseInt(val)
        return !isNaN(num) && num >= 1 && num <= 8192
      },
      "Le nombre de tokens doit être entre 1 et 8192"
    ),
  
  topP: z
    .string()
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0 && num <= 1
      },
      "Le Top P doit être entre 0 et 1"
    ),
  
  model: z
    .string()
    .min(1, "Le modèle est obligatoire")
    .refine(
      (val) => [
        "claude-3-5-haiku-20241022",
        "claude-3-5-sonnet-20241022",
        "claude-3-opus-20240229"
      ].includes(val),
      "Le modèle doit être un modèle Claude valide"
    ),
  
  isActive: z.boolean().default(true),
  restrictToPromptSystem: z.boolean().default(true), // Active le système anti-hallucination basé sur templates
  antiHallucinationTemplate: AntiHallucinationTemplateSchema.default({
    enabled: true,
    intensity: 'strict',
    domain: "services client",
    companyName: "", // Champ obligatoire pour personnalisation
    contextLimitations: {
      strictBoundaries: true,
      rejectOutOfScope: true,
      inventionPrevention: true,
      competitorMention: false,
    },
    responsePatterns: {
      refusalMessage: "Je suis spécialisé uniquement dans les services de cette entreprise. Cette question sort de mon domaine d'expertise.",
      escalationMessage: "Pour cette demande spécifique, je vous invite à contacter notre service client directement.",
      uncertaintyMessage: "Je ne dispose pas de cette information précise. Laissez-moi vous mettre en relation avec un expert.",
    },
  }), // Template JSON pour configuration anti-hallucination
})

// Schéma pour la création d'un agent
export const CreateAgentSchema = AgentBaseSchema.omit({})

// Schéma pour la mise à jour d'un agent (tous les champs optionnels sauf l'ID)
export const UpdateAgentSchema = AgentBaseSchema.partial()

// Schéma pour les paramètres de requête (filtres, pagination)
export const AgentQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1))
    .refine((val) => val > 0, "La page doit être positive"),
  
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20))
    .refine((val) => val > 0 && val <= 100, "La limite doit être entre 1 et 100"),
  
  search: z.string().optional(),
  
  status: z.enum(["active", "inactive", "all"]).optional().default("all"),
  
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).optional().default("createdAt"),
  
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
})

// Schéma pour les paramètres d'URL
export const AgentParamsSchema = z.object({
  id: z
    .string()
    .min(1, "L'ID de l'agent est obligatoire")
    .regex(/^[a-zA-Z0-9._-]+$/, "Format d'ID invalide"),
})

// Schéma pour la validation des fichiers uploadés
export const AgentFileSchema = z.object({
  originalFilename: z
    .string()
    .min(1, "Le nom du fichier est obligatoire")
    .max(255, "Le nom du fichier est trop long"),
  
  fileType: z
    .string()
    .refine(
      (val) => {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/markdown'
        ]
        return allowedTypes.includes(val)
      },
      "Type de fichier non supporté. Seuls PDF, Word, TXT et Markdown sont acceptés"
    ),
  
  fileSize: z
    .string()
    .refine(
      (val) => {
        const size = parseInt(val)
        return !isNaN(size) && size > 0 && size <= 10 * 1024 * 1024 // 10MB max
      },
      "La taille du fichier doit être entre 1 byte et 10MB"
    ),
})

// Types TypeScript générés automatiquement
export type Agent = z.infer<typeof AgentBaseSchema> & {
  id: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export type CreateAgent = z.infer<typeof CreateAgentSchema>
export type UpdateAgent = z.infer<typeof UpdateAgentSchema>
export type AgentQuery = z.infer<typeof AgentQuerySchema>
export type AgentParams = z.infer<typeof AgentParamsSchema>
export type AgentFile = z.infer<typeof AgentFileSchema>

// Schéma de réponse API pour un agent
export const AgentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  systemPrompt: z.string(),
  temperature: z.string(),
  maxTokens: z.string(),
  topP: z.string(),
  model: z.string(),
  isActive: z.boolean(),
  restrictToPromptSystem: z.boolean(),
  antiHallucinationTemplate: AntiHallucinationTemplateSchema,
  userId: z.string(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
  
  // Relations
  _count: z.object({
    conversations: z.number(),
    files: z.number(),
  }).optional(),
})

// Schéma de réponse pour la liste paginée
export const AgentsListResponseSchema = z.object({
  agents: z.array(AgentResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }),
})

export type AgentResponse = z.infer<typeof AgentResponseSchema>
export type AgentsListResponse = z.infer<typeof AgentsListResponseSchema>

// Utilitaires de validation
export const validateAgent = (data: unknown) => {
  return CreateAgentSchema.safeParse(data)
}

export const validateAgentUpdate = (data: unknown) => {
  return UpdateAgentSchema.safeParse(data)
}

export const validateAgentQuery = (data: unknown) => {
  return AgentQuerySchema.safeParse(data)
}

// Messages d'erreur par défaut pour l'interface utilisateur
export const AGENT_ERROR_MESSAGES = {
  REQUIRED_NAME: "Le nom de l'agent est obligatoire",
  REQUIRED_DESCRIPTION: "La description est obligatoire", 
  REQUIRED_PROMPT: "Le prompt système est obligatoire",
  INVALID_TEMPERATURE: "La température doit être un nombre entre 0 et 1",
  INVALID_TOKENS: "Le nombre de tokens doit être entre 1 et 8192",
  INVALID_MODEL: "Veuillez sélectionner un modèle Claude valide",
  INVALID_ANTI_HALLUCINATION: "Configuration anti-hallucination invalide",
  INVALID_INTENSITY: "Niveau d'intensité anti-hallucination invalide",
  AGENT_NOT_FOUND: "Agent non trouvé",
  UNAUTHORIZED: "Vous n'êtes pas autorisé à accéder à cet agent",
  CREATION_FAILED: "Erreur lors de la création de l'agent",
  UPDATE_FAILED: "Erreur lors de la mise à jour de l'agent",
  DELETE_FAILED: "Erreur lors de la suppression de l'agent",
} as const