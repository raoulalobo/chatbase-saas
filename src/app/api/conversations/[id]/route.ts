import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversations, messages, agents } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { 
  ConversationParamsSchema,
  type ConversationWithMessages
} from "@/lib/schemas/conversation"
import { 
  createSuccessResponse, 
  ApiErrorHandler 
} from "@/lib/utils/api"

/**
 * API Route pour une conversation spécifique
 * GET /api/conversations/[id] - Récupérer une conversation avec ses messages
 * DELETE /api/conversations/[id] - Supprimer une conversation
 */

// GET /api/conversations/[id] - Récupérer une conversation spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiErrorHandler.unauthorized()
    }

    // Attendre la résolution des params pour Next.js 15
    const resolvedParams = await params
    
    // Validation de l'ID
    const paramsResult = ConversationParamsSchema.safeParse({ id: resolvedParams.id })
    if (!paramsResult.success) {
      return ApiErrorHandler.handleError(paramsResult.error)
    }

    const { id } = paramsResult.data

    // Récupération de la conversation avec son agent
    const conversationResult = await db
      .select({
        conversation: conversations,
        agent: {
          id: agents.id,
          name: agents.name,
          model: agents.model,
          description: agents.description,
          isActive: agents.isActive,
        }
      })
      .from(conversations)
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(
        and(
          eq(conversations.id, id),
          eq(agents.userId, session.user.id) // Vérifier que l'agent appartient à l'utilisateur
        )
      )
      .limit(1)

    if (conversationResult.length === 0) {
      return ApiErrorHandler.notFound("Conversation")
    }

    const { conversation, agent } = conversationResult[0]

    // Récupération de tous les messages de la conversation
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt) // Ordre chronologique

    // Format de la réponse
    const responseData: ConversationWithMessages = {
      ...conversation,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      agent,
      messageCount: conversationMessages.length,
      lastMessage: conversationMessages.length > 0 ? {
        ...conversationMessages[conversationMessages.length - 1],
        createdAt: conversationMessages[conversationMessages.length - 1].createdAt.toISOString(),
      } : undefined,
      messages: conversationMessages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
      }))
    }

    return createSuccessResponse(responseData)

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}

// DELETE /api/conversations/[id] - Supprimer une conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiErrorHandler.unauthorized()
    }

    // Attendre la résolution des params pour Next.js 15
    const resolvedParams = await params

    // Validation de l'ID
    const paramsResult = ConversationParamsSchema.safeParse({ id: resolvedParams.id })
    if (!paramsResult.success) {
      return ApiErrorHandler.handleError(paramsResult.error)
    }

    const { id } = paramsResult.data

    // Vérifier que la conversation existe et appartient à l'utilisateur
    const existingConversation = await db
      .select({
        conversation: conversations,
        agent: agents,
      })
      .from(conversations)
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(
        and(
          eq(conversations.id, id),
          eq(agents.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingConversation.length === 0) {
      return ApiErrorHandler.notFound("Conversation")
    }

    // Supprimer la conversation (les messages seront supprimés automatiquement via CASCADE)
    await db
      .delete(conversations)
      .where(eq(conversations.id, id))

    return createSuccessResponse(
      { id },
      "Conversation supprimée avec succès"
    )

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}