import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { conversations, messages, agents } from "@/lib/db/schema"
import { eq, and, count, sql, desc, gte } from "drizzle-orm"
import { 
  ConversationStatsSchema,
  type ConversationStats
} from "@/lib/schemas/conversation"
import { 
  createSuccessResponse, 
  ApiErrorHandler 
} from "@/lib/utils/api"

/**
 * API Route pour les statistiques des conversations
 * GET /api/conversations/stats - Récupérer les statistiques des conversations de l'utilisateur
 */

// GET /api/conversations/stats - Récupérer les statistiques
export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiErrorHandler.unauthorized()
    }

    // Date limite pour considérer une conversation comme "active" (7 derniers jours)
    const activeThreshold = new Date()
    activeThreshold.setDate(activeThreshold.getDate() - 7)

    // Compter le total des conversations
    const totalConversationsResult = await db
      .select({ count: count() })
      .from(conversations)
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(eq(agents.userId, session.user.id))

    const totalConversations = totalConversationsResult[0]?.count || 0

    // Compter les conversations actives (avec des messages récents)
    const activeConversationsResult = await db
      .select({ count: count() })
      .from(conversations)
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .innerJoin(messages, eq(conversations.id, messages.conversationId))
      .where(
        and(
          eq(agents.userId, session.user.id),
          gte(messages.createdAt, activeThreshold)
        )
      )

    const activeConversations = activeConversationsResult[0]?.count || 0

    // Compter le total des messages
    const totalMessagesResult = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(eq(agents.userId, session.user.id))

    const totalMessages = totalMessagesResult[0]?.count || 0

    // Calculer la moyenne des messages par conversation
    const averageMessagesPerConversation = totalConversations > 0 
      ? Math.round((totalMessages / totalConversations) * 10) / 10 
      : 0

    // Récupérer les agents les plus utilisés (top 5)
    const topAgentsResult = await db
      .select({
        agentId: agents.id,
        agentName: agents.name,
        conversationCount: count(conversations.id),
      })
      .from(agents)
      .leftJoin(conversations, eq(agents.id, conversations.agentId))
      .where(eq(agents.userId, session.user.id))
      .groupBy(agents.id, agents.name)
      .orderBy(desc(count(conversations.id)))
      .limit(5)

    const topAgents = topAgentsResult.map(row => ({
      agentId: row.agentId,
      agentName: row.agentName,
      conversationCount: row.conversationCount || 0,
    }))

    // Format des données de réponse
    const responseData: ConversationStats = {
      totalConversations,
      activeConversations,
      totalMessages,
      averageMessagesPerConversation,
      topAgents,
    }

    // Validation avec Zod
    const validatedData = ConversationStatsSchema.parse(responseData)

    return createSuccessResponse(validatedData)

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}