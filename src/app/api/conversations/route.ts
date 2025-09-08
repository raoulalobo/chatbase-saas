import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversations, messages, agents } from "@/lib/db/schema"
import { eq, and, desc, asc, ilike, count, gte, lte, sql } from "drizzle-orm"
import { 
  ConversationQuerySchema,
  type ConversationsListResponse
} from "@/lib/schemas/conversation"
import { 
  createSuccessResponse, 
  ApiErrorHandler,
  validatePagination,
  calculatePagination 
} from "@/lib/utils/api"

/**
 * API Route pour la gestion des conversations
 * GET /api/conversations - Liste paginée des conversations de l'utilisateur
 */

// GET /api/conversations - Récupérer la liste des conversations
export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiErrorHandler.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    
    // Validation des paramètres de requête
    const queryResult = ConversationQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      agentId: searchParams.get('agentId') ?? undefined,
      visitorId: searchParams.get('visitorId') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
    })

    if (!queryResult.success) {
      return ApiErrorHandler.handleError(queryResult.error)
    }

    const { page, limit, search, agentId, visitorId, sortBy, sortOrder, startDate, endDate } = queryResult.data
    const { offset } = validatePagination(page.toString(), limit.toString())

    // Construction de la requête avec filtres
    let whereConditions = [
      eq(agents.userId, session.user.id) // Seulement les conversations des agents de l'utilisateur
    ]
    
    // Filtre par agent spécifique
    if (agentId) {
      whereConditions.push(eq(conversations.agentId, agentId))
    }
    
    // Filtre par visiteur
    if (visitorId) {
      whereConditions.push(ilike(conversations.visitorId, `%${visitorId}%`))
    }
    
    // Filtre par recherche (visiteurId ou contenu de messages)
    if (search) {
      // On cherche dans les IDs de visiteurs pour l'instant
      // TODO: Améliorer pour chercher aussi dans le contenu des messages
      whereConditions.push(ilike(conversations.visitorId, `%${search}%`))
    }
    
    // Filtres de date
    if (startDate) {
      whereConditions.push(gte(conversations.createdAt, new Date(startDate)))
    }
    if (endDate) {
      whereConditions.push(lte(conversations.createdAt, new Date(endDate)))
    }

    // Ordre de tri
    const orderBy = sortOrder === 'asc' 
      ? asc(conversations[sortBy as keyof typeof conversations])
      : desc(conversations[sortBy as keyof typeof conversations])

    // Requête principale pour récupérer les conversations avec leurs agents
    const conversationsResult = await db
      .select({
        conversation: conversations,
        agent: {
          id: agents.id,
          name: agents.name,
          model: agents.model,
        }
      })
      .from(conversations)
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    // Récupérer les messages pour chaque conversation (derniers messages + compte)
    const conversationIds = conversationsResult.map(r => r.conversation.id)
    
    let messagesData: any[] = []
    let messageCounts: any[] = []
    
    if (conversationIds.length > 0) {
      // Récupérer le nombre de messages par conversation
      messageCounts = await db
        .select({
          conversationId: messages.conversationId,
          count: count(),
        })
        .from(messages)
        .where(sql`${messages.conversationId} IN ${conversationIds}`)
        .groupBy(messages.conversationId)

      // Récupérer le dernier message de chaque conversation
      messagesData = await db
        .select()
        .from(messages)
        .where(
          and(
            sql`${messages.conversationId} IN ${conversationIds}`,
            sql`${messages.id} IN (
              SELECT DISTINCT ON (${messages.conversationId}) ${messages.id}
              FROM ${messages}
              WHERE ${messages.conversationId} IN ${conversationIds}
              ORDER BY ${messages.conversationId}, ${messages.createdAt} DESC
            )`
          )
        )
    }

    // Compter le total pour la pagination
    const totalResult = await db
      .select({ count: count() })
      .from(conversations)
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(and(...whereConditions))

    const total = totalResult[0]?.count || 0
    const pagination = calculatePagination(total, page, limit)

    // Construire la réponse en combinant les données
    const conversationsWithDetails = conversationsResult.map(({ conversation, agent }) => {
      const messageCount = messageCounts.find(m => m.conversationId === conversation.id)?.count || 0
      const lastMessage = messagesData.find(m => m.conversationId === conversation.id)
      
      return {
        ...conversation,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        agent,
        messageCount,
        lastMessage: lastMessage ? {
          ...lastMessage,
          createdAt: lastMessage.createdAt.toISOString(),
        } : undefined,
        messages: [], // On ne charge pas tous les messages dans la liste
      }
    })

    // Format des données de réponse
    const response: ConversationsListResponse = {
      conversations: conversationsWithDetails,
      pagination
    }

    return createSuccessResponse(response)

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}