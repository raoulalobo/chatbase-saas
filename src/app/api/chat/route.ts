import { NextResponse } from "next/server"
import { agentQueries, conversationQueries, messageQueries } from "@/lib/db/queries"
import { AnthropicService } from "@/lib/anthropic"
import { nanoid } from "nanoid"
import type { ChatRequest, AnthropicConfig } from "@/types"

/**
 * API Route pour le chat avec les agents IA
 * Endpoint: POST /api/chat
 */

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json()
    const { agentId, question, conversationId } = body

    if (!agentId || !question) {
      return NextResponse.json(
        { error: "agentId et question requis" },
        { status: 400 }
      )
    }

    // Récupérer l'agent avec ses fichiers
    const agent = await agentQueries.getWithFiles(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: "Agent introuvable" },
        { status: 404 }
      )
    }

    if (!agent.isActive) {
      return NextResponse.json(
        { error: "Agent désactivé" },
        { status: 403 }
      )
    }

    // Préparer la configuration Anthropic
    const anthropicConfig: AnthropicConfig = {
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      topP: agent.topP,
      model: agent.model,
      fileIds: agent.anthropicFileIds || [], // IDs des fichiers associés
    }

    // Créer ou récupérer la conversation
    let currentConversationId = conversationId
    if (!currentConversationId) {
      const newConversation = await conversationQueries.create({
        agentId,
        visitorId: nanoid(), // ID temporaire pour le visiteur
      })
      currentConversationId = newConversation.id
    }

    // Appeler l'API Anthropic
    const anthropicResponse = await AnthropicService.chat(anthropicConfig, question)

    // Sauvegarder la question de l'utilisateur
    await messageQueries.create({
      conversationId: currentConversationId,
      content: question,
      isFromBot: false,
    })

    // Sauvegarder la réponse du bot
    const botMessage = await messageQueries.create({
      conversationId: currentConversationId,
      content: anthropicResponse.response,
      isFromBot: true,
    })

    // Réponse formatée
    const chatResponse = {
      response: anthropicResponse.response,
      conversationId: currentConversationId,
      messageId: botMessage.id,
      tokensUsed: anthropicResponse.tokensUsed,
      sourcesUsed: agent.files?.filter(file => file.status === "ready") || [],
    }

    return NextResponse.json(chatResponse)

  } catch (error) {
    console.error("Erreur lors du chat:", error)
    
    // Gestion des erreurs spécifiques d'Anthropic
    if (error instanceof Error) {
      if (error.message.includes("Impossible de générer une réponse")) {
        return NextResponse.json(
          { error: "Erreur de l'API Anthropic", details: error.message },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { error: "Erreur serveur lors du chat" },
      { status: 500 }
    )
  }
}