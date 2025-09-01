import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { agentQueries, conversationQueries, messageQueries } from "@/lib/db/queries"
import { AnthropicService } from "@/lib/anthropic"
import { 
  ChatMessageSchema,
  type ChatResponse
} from "@/lib/schemas/conversation"
import { 
  createSuccessResponse, 
  ApiErrorHandler 
} from "@/lib/utils/api"

/**
 * API Route pour le chat avec un agent utilisant ses fichiers sources
 * Endpoint: POST /api/agents/[id]/chat
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiErrorHandler.unauthorized()
    }

    const resolvedParams = await params
    const agentId = resolvedParams.id
    
    // Récupérer et valider les données de la requête
    const body = await request.json()
    const validatedMessage = ChatMessageSchema.parse(body)
    
    const { message, visitorId, conversationId } = validatedMessage

    // Vérifier que l'agent existe, qu'il appartient à l'utilisateur et récupérer ses fichiers
    const agent = await agentQueries.getFull(agentId)
    if (!agent) {
      return ApiErrorHandler.notFound("Agent introuvable")
    }
    
    // Vérifier que l'agent appartient à l'utilisateur connecté
    if (agent.userId !== session.user.id) {
      return ApiErrorHandler.forbidden("Accès non autorisé à cet agent")
    }

    let finalConversationId: string

    // Si un conversationId est fourni, utiliser cette conversation
    if (conversationId) {
      // Vérifier que la conversation existe et appartient à cet agent
      const existingConversation = await conversationQueries.getById(conversationId)
      if (!existingConversation || existingConversation.agentId !== agentId) {
        return ApiErrorHandler.badRequest("Conversation invalide")
      }
      finalConversationId = conversationId
    } else {
      // Chercher une conversation existante pour ce visiteur et cet agent
      const existingConversation = await conversationQueries.getByAgentAndVisitor(agentId, visitorId)
      
      if (existingConversation) {
        // Réutiliser la conversation existante
        finalConversationId = existingConversation.id
      } else {
        // Créer une nouvelle conversation seulement si aucune n'existe
        const newConversation = await conversationQueries.create({
          agentId,
          visitorId
        })
        finalConversationId = newConversation.id
      }
    }

    // Sauvegarder le message de l'utilisateur
    await messageQueries.create({
      conversationId: finalConversationId,
      content: message,
      isFromBot: false
    })

    // Préparer la configuration pour Anthropic
    const anthropicConfig = {
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      topP: agent.topP,
      fileIds: agent.files.map(f => f.anthropicFileId).filter(Boolean) // Filtrer les IDs vides
    }

    // Appeler l'API Anthropic pour générer une réponse
    const { response: botResponse, tokensUsed } = await AnthropicService.chat(
      anthropicConfig,
      message
    )

    // Sauvegarder la réponse du bot
    await messageQueries.create({
      conversationId: finalConversationId,
      content: botResponse,
      isFromBot: true
    })

    // Format de réponse conforme à l'API
    const responseData: ChatResponse = {
      response: botResponse,
      conversationId: finalConversationId,
      tokensUsed: tokensUsed || 0,
      filesUsed: agent.files.length
    }

    return createSuccessResponse(responseData)

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}