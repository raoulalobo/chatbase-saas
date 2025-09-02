import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

/**
 * Route de test pour vérifier l'API Anthropic de base
 * Endpoint: GET /api/test-anthropic
 */

export async function GET() {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Test simple de l'API Anthropic avec un modèle récent
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241204",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: "Dis simplement 'Bonjour, l'API Anthropic fonctionne !'"
      }]
    })

    const responseText = message.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("")

    return NextResponse.json({
      success: true,
      message: "API Anthropic fonctionnelle",
      response: responseText,
      tokensUsed: message.usage.output_tokens + message.usage.input_tokens
    })

  } catch (error) {
    console.error("Erreur test Anthropic:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    }, { status: 500 })
  }
}