import { NextResponse } from "next/server"
import { agentQueries } from "@/lib/db/queries"
import { AnthropicService } from "@/lib/anthropic"

/**
 * API de test temporaire pour vérifier la configuration anti-hallucination
 * SANS authentification - à supprimer après débogage
 */

export async function POST(request: Request) {
  try {
    const { agentId, message } = await request.json()
    
    if (!agentId) {
      return NextResponse.json({ error: "agentId requis" }, { status: 400 })
    }

    // Récupérer l'agent
    const agent = await agentQueries.getFull(agentId)
    if (!agent) {
      return NextResponse.json({ error: "Agent introuvable" }, { status: 404 })
    }

    // Retourner la configuration de l'agent pour débogage
    const config = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      restrictToPromptSystem: agent.restrictToPromptSystem,
      systemPrompt: agent.systemPrompt.substring(0, 200) + "...", // Tronquer pour lisibilité
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      topP: agent.topP,
      model: agent.model,
      isActive: agent.isActive
    }

    if (message) {
      // Tester aussi la réponse de l'agent si un message est fourni
      const anthropicConfig = {
        model: agent.model,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        topP: agent.topP,
        restrictToPromptSystem: agent.restrictToPromptSystem
      }

      try {
        const { response, tokensUsed } = await AnthropicService.chat(anthropicConfig, message)
        
        return NextResponse.json({
          agentConfig: config,
          testMessage: message,
          agentResponse: response,
          tokensUsed,
          restrictionActive: agent.restrictToPromptSystem
        })
      } catch (anthropicError) {
        return NextResponse.json({
          agentConfig: config,
          testMessage: message,
          anthropicError: anthropicError instanceof Error ? anthropicError.message : 'Erreur Anthropic',
          restrictionActive: agent.restrictToPromptSystem
        })
      }
    }

    return NextResponse.json({
      agentConfig: config,
      message: "Configuration récupérée avec succès"
    })

  } catch (error) {
    console.error("Erreur test agent config:", error)
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}