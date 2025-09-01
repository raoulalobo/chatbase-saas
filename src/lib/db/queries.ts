import { eq, desc, and } from "drizzle-orm"
import { db, users, agents, conversations, messages, agentFiles } from "./index"
import { nanoid } from "nanoid"

/**
 * Fonctions utilitaires pour les requêtes de base de données
 * Toutes les opérations CRUD sont typées avec Drizzle
 */

// Fonctions pour les utilisateurs
export const userQueries = {
  /**
   * Créer un nouvel utilisateur
   */
  async create(data: { email: string; name: string; id?: string }) {
    const id = data.id || nanoid()
    const [user] = await db.insert(users).values({
      id,
      email: data.email,
      name: data.name,
    }).returning()
    return user
  },

  /**
   * Obtenir un utilisateur par email
   */
  async getByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email))
    return user || null
  },

  /**
   * Obtenir un utilisateur par ID
   */
  async getById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id))
    return user || null
  },
}

// Fonctions pour les agents
export const agentQueries = {
  /**
   * Créer un nouvel agent avec configuration Anthropic
   */
  async create(data: { 
    name: string
    description: string
    systemPrompt: string
    userId: string
    temperature?: string
    maxTokens?: string
    topP?: string
    model?: string
  }) {
    const id = nanoid()
    const [agent] = await db.insert(agents).values({
      id,
      ...data,
    }).returning()
    return agent
  },

  /**
   * Obtenir tous les agents d'un utilisateur
   */
  async getByUserId(userId: string) {
    return await db.select().from(agents).where(eq(agents.userId, userId))
  },

  /**
   * Obtenir un agent avec son utilisateur
   */
  async getWithUser(agentId: string) {
    const result = await db
      .select()
      .from(agents)
      .leftJoin(users, eq(agents.userId, users.id))
      .where(eq(agents.id, agentId))

    const [row] = result
    if (!row || !row.agents || !row.users) return null

    return {
      ...row.agents,
      user: row.users,
    }
  },

  /**
   * Obtenir un agent avec ses fichiers
   */
  async getWithFiles(agentId: string) {
    const result = await db
      .select()
      .from(agents)
      .leftJoin(agentFiles, eq(agents.id, agentFiles.agentId))
      .where(eq(agents.id, agentId))

    const agent = result[0]?.agents
    if (!agent) return null

    const files = result
      .filter(row => row.agent_files)
      .map(row => row.agent_files!)

    return {
      ...agent,
      files,
    }
  },

  /**
   * Obtenir un agent complet (utilisateur + fichiers)
   */
  async getFull(agentId: string) {
    const agentData = await db.select().from(agents).where(eq(agents.id, agentId))
    const userData = await db.select().from(users).where(eq(users.id, agentData[0]?.userId))
    const filesData = await db.select().from(agentFiles).where(eq(agentFiles.agentId, agentId))

    const agent = agentData[0]
    const user = userData[0]
    
    if (!agent || !user) return null

    return {
      ...agent,
      user,
      files: filesData,
    }
  },

  /**
   * Mettre à jour un agent
   */
  async update(id: string, data: Partial<{
    name: string
    description: string
    systemPrompt: string
    temperature: string
    maxTokens: string
    topP: string
    model: string
    isActive: boolean
    anthropicFileIds: string[]
  }>) {
    const [agent] = await db
      .update(agents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning()
    return agent
  },

  /**
   * Supprimer un agent
   */
  async delete(id: string) {
    await db.delete(agents).where(eq(agents.id, id))
  },
}

// Fonctions pour les conversations
export const conversationQueries = {
  /**
   * Créer une nouvelle conversation
   */
  async create(data: { agentId: string; visitorId: string }) {
    const id = nanoid()
    const [conversation] = await db.insert(conversations).values({
      id,
      ...data,
    }).returning()
    return conversation
  },

  /**
   * Obtenir les conversations d'un agent avec leurs messages
   */
  async getByAgentId(agentId: string) {
    return await db
      .select()
      .from(conversations)
      .leftJoin(messages, eq(conversations.id, messages.conversationId))
      .where(eq(conversations.agentId, agentId))
      .orderBy(desc(conversations.createdAt))
  },

  /**
   * Obtenir une conversation avec ses messages
   */
  async getWithMessages(conversationId: string) {
    const conversationData = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))

    const messagesData = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)

    const [conversation] = conversationData
    if (!conversation) return null

    return {
      ...conversation,
      messages: messagesData,
    }
  },

  /**
   * Obtenir une conversation par agent et visiteur (pour réutiliser une conversation existante)
   */
  async getByAgentAndVisitor(agentId: string, visitorId: string) {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.agentId, agentId),
          eq(conversations.visitorId, visitorId)
        )
      )
      .orderBy(desc(conversations.updatedAt))
      .limit(1)
    
    return conversation || null
  },

  /**
   * Obtenir une conversation par ID
   */
  async getById(conversationId: string) {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
    
    return conversation || null
  },
}

// Fonctions pour les messages
export const messageQueries = {
  /**
   * Ajouter un message à une conversation
   */
  async create(data: { conversationId: string; content: string; isFromBot: boolean }) {
    const id = nanoid()
    const [message] = await db.insert(messages).values({
      id,
      ...data,
    }).returning()
    return message
  },

  /**
   * Obtenir les messages d'une conversation
   */
  async getByConversationId(conversationId: string) {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)
  },
}

// Fonctions pour les fichiers des agents
export const agentFileQueries = {
  /**
   * Ajouter un fichier à un agent
   */
  async create(data: {
    agentId: string
    originalFilename: string
    anthropicFileId: string
    fileType?: string
    fileSize?: string
  }) {
    const id = nanoid()
    const [file] = await db.insert(agentFiles).values({
      id,
      ...data,
    }).returning()
    return file
  },

  /**
   * Obtenir tous les fichiers d'un agent
   */
  async getByAgentId(agentId: string) {
    return await db
      .select()
      .from(agentFiles)
      .where(eq(agentFiles.agentId, agentId))
      .orderBy(desc(agentFiles.uploadDate))
  },

  /**
   * Mettre à jour le statut d'un fichier
   */
  async updateStatus(id: string, status: "uploading" | "ready" | "error") {
    const [file] = await db
      .update(agentFiles)
      .set({ status })
      .where(eq(agentFiles.id, id))
      .returning()
    return file
  },

  /**
   * Mettre à jour un fichier avec l'ID Anthropic et le statut
   */
  async updateWithAnthropicId(id: string, anthropicFileId: string, status: "uploading" | "ready" | "error" = "ready") {
    const [file] = await db
      .update(agentFiles)
      .set({ 
        anthropicFileId,
        status 
      })
      .where(eq(agentFiles.id, id))
      .returning()
    return file
  },

  /**
   * Supprimer un fichier
   */
  async delete(id: string) {
    await db.delete(agentFiles).where(eq(agentFiles.id, id))
  },

  /**
   * Obtenir un fichier par son ID Anthropic
   */
  async getByAnthropicId(anthropicFileId: string) {
    const [file] = await db
      .select()
      .from(agentFiles)
      .where(eq(agentFiles.anthropicFileId, anthropicFileId))
    return file || null
  },
}