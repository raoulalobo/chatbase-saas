import { pgTable, text, timestamp, boolean, serial } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

/**
 * Schéma de base de données Drizzle pour le SaaS d'agents IA
 * Utilise PostgreSQL avec des relations typées
 */

// Table des utilisateurs
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"), // Hash du mot de passe pour l'authentification credentials
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Table des agents IA avec configuration Anthropic
export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // OBLIGATOIRE
  description: text("description").notNull(), // OBLIGATOIRE  
  systemPrompt: text("system_prompt").notNull(), // OBLIGATOIRE - Prompt personnalisé
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Paramètres API Anthropic avec valeurs par défaut
  temperature: text("temperature").default("0.7").notNull(), // 0.0 à 1.0
  maxTokens: text("max_tokens").default("4096").notNull(), // 1 à 8192
  topP: text("top_p").default("1.0").notNull(), // 0.0 à 1.0
  model: text("model").default("claude-3-5-sonnet-20241204").notNull(),
  
  // État et fichiers
  isActive: boolean("is_active").default(true).notNull(),
  restrictToDocuments: boolean("restrict_to_documents").default(true).notNull(), // Force l'agent à utiliser uniquement les documents fournis
  anthropicFileIds: text("anthropic_file_ids").array(), // Array des IDs fichiers Anthropic
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Table des fichiers associés aux agents
export const agentFiles = pgTable("agent_files", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  originalFilename: text("original_filename").notNull(), // Nom original du fichier
  anthropicFileId: text("anthropic_file_id").notNull(), // ID retourné par l'API Anthropic
  fileType: text("file_type"), // Type MIME du fichier
  fileSize: text("file_size"), // Taille en bytes (stocké en string pour éviter overflow)
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  status: text("status").default("uploading").notNull(), // uploading, ready, error
})

// Table des conversations
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  visitorId: text("visitor_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Table des messages
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isFromBot: boolean("is_from_bot").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Tables NextAuth.js pour l'authentification
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: timestamp("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
})

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
})

export const verificationTokens = pgTable("verification_tokens", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
})

// Relations entre les tables
export const usersRelations = relations(users, ({ many }) => ({
  agents: many(agents),
  accounts: many(accounts),
  sessions: many(sessions),
}))

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  conversations: many(conversations),
  files: many(agentFiles), // Relation vers les fichiers de l'agent
}))

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  agent: one(agents, {
    fields: [conversations.agentId],
    references: [agents.id],
  }),
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const agentFilesRelations = relations(agentFiles, ({ one }) => ({
  agent: one(agents, {
    fields: [agentFiles.agentId],
    references: [agents.id],
  }),
}))