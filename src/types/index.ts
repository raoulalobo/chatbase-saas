import { InferSelectModel, InferInsertModel } from "drizzle-orm"
import { users, agents, conversations, messages } from "@/lib/db/schema"

/**
 * Types générés automatiquement à partir du schéma Drizzle
 * Ces types sont synchronisés avec la base de données PostgreSQL
 */

// Types pour les sélections (lecture depuis la DB)
export type User = InferSelectModel<typeof users>
export type Agent = InferSelectModel<typeof agents>
export type Conversation = InferSelectModel<typeof conversations>
export type Message = InferSelectModel<typeof messages>

// Types pour les insertions (écriture vers la DB)
export type NewUser = InferInsertModel<typeof users>
export type NewAgent = InferInsertModel<typeof agents>
export type NewConversation = InferInsertModel<typeof conversations>
export type NewMessage = InferInsertModel<typeof messages>

// Types étendus avec relations
export type AgentWithUser = Agent & {
  user: User
}

export type ConversationWithAgent = Conversation & {
  agent: Agent
}

export type ConversationWithMessages = Conversation & {
  messages: Message[]
}

export type ConversationFull = Conversation & {
  agent: Agent
  messages: Message[]
}

// Types spécifiques pour l'API Anthropic
export type AnthropicConfig = {
  systemPrompt: string
  temperature: string
  maxTokens: string
  topP: string
  model: string
  restrictToPromptSystem: boolean // Force l'agent à rester strictement dans le contexte de son prompt système
}

export type ChatRequest = {
  agentId: string
  question: string
  conversationId?: string
}

export type ChatResponse = {
  response: string
  conversationId: string
  tokensUsed?: number
  filesUsed?: number
}