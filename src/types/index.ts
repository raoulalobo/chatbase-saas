import { InferSelectModel, InferInsertModel } from "drizzle-orm"
import { users, agents, conversations, messages, agentFiles } from "@/lib/db/schema"

/**
 * Types générés automatiquement à partir du schéma Drizzle
 * Ces types sont synchronisés avec la base de données PostgreSQL
 */

// Types pour les sélections (lecture depuis la DB)
export type User = InferSelectModel<typeof users>
export type Agent = InferSelectModel<typeof agents>
export type Conversation = InferSelectModel<typeof conversations>
export type Message = InferSelectModel<typeof messages>
export type AgentFile = InferSelectModel<typeof agentFiles>

// Types pour les insertions (écriture vers la DB)
export type NewUser = InferInsertModel<typeof users>
export type NewAgent = InferInsertModel<typeof agents>
export type NewConversation = InferInsertModel<typeof conversations>
export type NewMessage = InferInsertModel<typeof messages>
export type NewAgentFile = InferInsertModel<typeof agentFiles>

// Types étendus avec relations
export type AgentWithUser = Agent & {
  user: User
}

export type AgentWithFiles = Agent & {
  files: AgentFile[]
}

export type AgentFull = Agent & {
  user: User
  files: AgentFile[]
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
  fileIds: string[]
  restrictToDocuments: boolean // Force l'agent à utiliser uniquement les documents fournis
}

export type ChatRequest = {
  agentId: string
  question: string
  conversationId?: string
}

export type ChatResponse = {
  response: string
  conversationId: string
  messageId: string
  tokensUsed?: number
  sourcesUsed?: AgentFile[]
}