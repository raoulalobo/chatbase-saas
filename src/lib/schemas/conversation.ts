import { z } from "zod"

/**
 * Schémas de validation Zod pour les conversations et messages
 * - Validation unifiée côté client et serveur
 * - Types TypeScript générés automatiquement
 * - Messages d'erreur personnalisés en français
 */

// Schéma de base pour un message
export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  content: z
    .string()
    .min(1, "Le contenu du message ne peut pas être vide")
    .max(8000, "Le message ne peut pas dépasser 8000 caractères"),
  isFromBot: z.boolean(),
  createdAt: z.string().or(z.date()),
})

// Schéma pour créer un message
export const CreateMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Le contenu du message ne peut pas être vide")
    .max(8000, "Le message ne peut pas dépasser 8000 caractères"),
  conversationId: z.string().min(1, "L'ID de conversation est obligatoire"),
  isFromBot: z.boolean().default(false),
})

// Schéma de base pour une conversation
export const ConversationSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  visitorId: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

// Schéma pour créer une conversation
export const CreateConversationSchema = z.object({
  agentId: z.string().min(1, "L'ID de l'agent est obligatoire"),
  visitorId: z
    .string()
    .min(1, "L'ID du visiteur est obligatoire")
    .max(100, "L'ID du visiteur ne peut pas dépasser 100 caractères"),
})

// Schéma pour les paramètres de requête des conversations
export const ConversationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  agentId: z.string().optional(),
  visitorId: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

// Schéma pour les paramètres d'URL avec ID
export const ConversationParamsSchema = z.object({
  id: z.string().min(1, "L'ID de conversation est obligatoire"),
})

// Schéma de réponse pour une conversation avec ses messages
export const ConversationWithMessagesSchema = ConversationSchema.extend({
  messages: z.array(MessageSchema),
  messageCount: z.number().optional(),
  lastMessage: MessageSchema.optional(),
  agent: z.object({
    id: z.string(),
    name: z.string(),
    model: z.string(),
  }).optional(),
})

// Schéma de réponse pour la liste des conversations
export const ConversationsListSchema = z.object({
  conversations: z.array(ConversationWithMessagesSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
})

// Schéma pour le chat en temps réel
export const ChatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Le message ne peut pas être vide")
    .max(8000, "Le message ne peut pas dépasser 8000 caractères"),
  visitorId: z
    .string()
    .min(1, "L'ID du visiteur est obligatoire")
    .max(100, "L'ID du visiteur ne peut pas dépasser 100 caractères"),
  conversationId: z.string().optional(), // Optionnel pour nouvelle conversation
})

// Schéma de réponse du chat
export const ChatResponseSchema = z.object({
  response: z.string(),
  conversationId: z.string(),
  messageId: z.string(),
  tokensUsed: z.number().optional(),
  filesUsed: z.number().optional(),
})

// Types TypeScript générés automatiquement
export type Message = z.infer<typeof MessageSchema>
export type CreateMessage = z.infer<typeof CreateMessageSchema>
export type Conversation = z.infer<typeof ConversationSchema>
export type CreateConversation = z.infer<typeof CreateConversationSchema>
export type ConversationQuery = z.infer<typeof ConversationQuerySchema>
export type ConversationParams = z.infer<typeof ConversationParamsSchema>
export type ConversationWithMessages = z.infer<typeof ConversationWithMessagesSchema>
export type ConversationsListResponse = z.infer<typeof ConversationsListSchema>
export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type ChatResponse = z.infer<typeof ChatResponseSchema>

// Schéma pour les statistiques des conversations
export const ConversationStatsSchema = z.object({
  totalConversations: z.number(),
  activeConversations: z.number(), // Conversations avec messages récents
  totalMessages: z.number(),
  averageMessagesPerConversation: z.number(),
  topAgents: z.array(z.object({
    agentId: z.string(),
    agentName: z.string(),
    conversationCount: z.number(),
  })),
})

export type ConversationStats = z.infer<typeof ConversationStatsSchema>