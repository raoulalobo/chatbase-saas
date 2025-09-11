import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agents, conversations, messages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { AnthropicService } from "@/lib/anthropic"
import { generateAntiHallucinationPrompt, getDefaultTemplate } from "@/lib/templates/anti-hallucination"
import { checkWidgetRateLimit } from "@/lib/rate-limiter"

/**
 * API publique pour l'intégration widget sécurisée
 * Permet aux sites externes d'interagir avec les agents via clé API publique
 * 
 * Sécurité:
 * - Authentification via publicApiKey
 * - Validation des domaines autorisés (CORS)
 * - Rate limiting par domaine/IP
 * - Validation stricte des paramètres d'entrée
 */

// Configuration CORS et sécurité
const ALLOWED_METHODS = ["POST", "OPTIONS"]
const MAX_MESSAGE_LENGTH = 2000
const MAX_CONVERSATION_MESSAGES = 50

/**
 * Gestion des requêtes CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin")
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Public-API-Key, X-Domain",
      "Access-Control-Max-Age": "86400", // 24h cache preflight
    },
  })
}

/**
 * Endpoint principal du chat widget public
 * POST /api/public/agents/[id]/chat
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params
    
    // 1. Vérification Rate Limiting (première priorité)
    const rateLimitCheck = await checkWidgetRateLimit(request, agentId)
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { 
          error: rateLimitCheck.message,
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { 
          status: 429,
          headers: {
            ...getCORSHeaders(request.headers.get("origin")),
            ...rateLimitCheck.headers
          }
        }
      )
    }
    
    // 2. Validation des headers de sécurité
    const publicApiKey = request.headers.get("X-Public-API-Key")
    const requestDomain = request.headers.get("X-Domain") || request.headers.get("origin")
    
    if (!publicApiKey) {
      return NextResponse.json(
        { error: "Clé API publique manquante" },
        { 
          status: 401,
          headers: getCORSHeaders(requestDomain)
        }
      )
    }
    
    // 2. Récupération et validation de l'agent
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1)
    
    if (!agent.length) {
      return NextResponse.json(
        { error: "Agent introuvable" },
        { 
          status: 404,
          headers: getCORSHeaders(requestDomain)
        }
      )
    }
    
    const agentData = agent[0]
    
    // 3. Validation de la clé API publique
    if (agentData.publicApiKey !== publicApiKey) {
      return NextResponse.json(
        { error: "Clé API invalide" },
        { 
          status: 403,
          headers: getCORSHeaders(requestDomain)
        }
      )
    }
    
    // 4. Validation du domaine autorisé
    if (requestDomain && !isDomainAllowed(requestDomain, agentData.allowedDomains)) {
      return NextResponse.json(
        { error: "Domaine non autorisé pour cet agent" },
        { 
          status: 403,
          headers: getCORSHeaders(requestDomain)
        }
      )
    }
    
    // 5. Validation du corps de la requête
    const body = await request.json()
    const { message, conversationId, visitorId } = body
    
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message requis" },
        { 
          status: 400,
          headers: getCORSHeaders(requestDomain)
        }
      )
    }
    
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message trop long (max ${MAX_MESSAGE_LENGTH} caractères)` },
        { 
          status: 400,
          headers: getCORSHeaders(requestDomain)
        }
      )
    }
    
    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json(
        { error: "ID visiteur requis" },
        { 
          status: 400,
          headers: getCORSHeaders(requestDomain)
        }
      )
    }
    
    // 6. Gestion de la conversation
    let currentConversationId = conversationId
    
    // Créer nouvelle conversation si nécessaire
    if (!currentConversationId) {
      currentConversationId = nanoid()
      
      await db.insert(conversations).values({
        id: currentConversationId,
        agentId: agentId,
        visitorId: visitorId,
      })
    }
    
    // Vérifier limite messages par conversation (anti-spam)
    const messageCount = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, currentConversationId))
    
    if (messageCount.length >= MAX_CONVERSATION_MESSAGES) {
      return NextResponse.json(
        { error: "Limite de messages atteinte pour cette conversation" },
        { 
          status: 429,
          headers: getCORSHeaders(requestDomain)
        }
      )
    }
    
    // 7. Sauvegarder message utilisateur (version originale sans l'instruction de langue)
    await db.insert(messages).values({
      id: nanoid(),
      conversationId: currentConversationId,
      content: message,
      isFromBot: false,
    })
    
    // 8. Configuration anti-hallucination pour API publique
    // Niveau ultra-strict par défaut pour les widgets publics
    let antiHallucinationTemplate
    try {
      antiHallucinationTemplate = agentData.antiHallucinationTemplate 
        ? (typeof agentData.antiHallucinationTemplate === 'string' 
            ? JSON.parse(agentData.antiHallucinationTemplate)
            : agentData.antiHallucinationTemplate)
        : getDefaultTemplate('ultra_strict')
    } catch (error) {
      console.warn('Erreur parsing antiHallucinationTemplate, utilisation du template par défaut:', error)
      antiHallucinationTemplate = getDefaultTemplate('ultra_strict')
    }
    
    // Nom d'entreprise depuis les données agent ou template
    const companyName = antiHallucinationTemplate.companyName || "cette entreprise"
    
    // Générer le prompt système complet avec anti-hallucination
    const enhancedSystemPrompt = generateAntiHallucinationPrompt(
      antiHallucinationTemplate,
      companyName,
      agentData.systemPrompt
    )
    
    // 9. Configuration Anthropic pour widget public
    const anthropicConfig = {
      systemPrompt: enhancedSystemPrompt,
      temperature: agentData.temperature,
      maxTokens: agentData.maxTokens,
      topP: agentData.topP,
      model: agentData.model,
      restrictToPromptSystem: true, // Toujours activé pour les widgets publics
    }
    
    // 10. Détecter la langue et ajouter l'instruction appropriée
    // 11. Génération de la réponse via Anthropic avec le message original
    const anthropicResponse = await AnthropicService.chat(anthropicConfig, message)
    
    // 12. Sauvegarder réponse bot
    await db.insert(messages).values({
      id: nanoid(),
      conversationId: currentConversationId,
      content: anthropicResponse.response,
      isFromBot: true,
    })
    
    // 13. Réponse finale avec headers CORS et rate limiting
    return NextResponse.json(
      {
        response: anthropicResponse.response,
        conversationId: currentConversationId,
        tokensUsed: anthropicResponse.tokensUsed,
        agentName: agentData.name,
      },
      {
        status: 200,
        headers: {
          ...getCORSHeaders(requestDomain),
          ...rateLimitCheck.headers
        }
      }
    )
    
  } catch (error: any) {
    console.error("Erreur API widget publique:", error)
    
    // Gestion spécifique des erreurs Anthropic
    if (error.message?.includes("Limite de taux atteinte")) {
      return NextResponse.json(
        { 
          error: "Service temporairement surchargé. Veuillez patienter quelques minutes.",
          retryAfter: 300 // 5 minutes
        },
        { 
          status: 429,
          headers: getCORSHeaders(request.headers.get("origin"))
        }
      )
    }
    
    return NextResponse.json(
      { error: "Erreur interne du service" },
      { 
        status: 500,
        headers: getCORSHeaders(request.headers.get("origin"))
      }
    )
  }
}

/**
 * Génère les headers CORS appropriés selon le domaine
 */
function getCORSHeaders(requestDomain: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": requestDomain || "*",
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Public-API-Key, X-Domain",
    "Access-Control-Expose-Headers": "X-RateLimit-Remaining, X-RateLimit-Reset",
    "Content-Type": "application/json",
  }
}

/**
 * Valide si un domaine est autorisé pour cet agent
 * Supporte les wildcard domains (*.example.com)
 */
function isDomainAllowed(requestDomain: string, allowedDomains: any): boolean {
  // Si aucune restriction configurée, autoriser tous les domaines
  if (!allowedDomains || !Array.isArray(allowedDomains) || allowedDomains.length === 0) {
    return true
  }
  
  // Nettoyer le domaine de la requête (supprimer protocole et port)
  const cleanDomain = requestDomain
    .replace(/^https?:\/\//, "")
    .replace(/:\d+$/, "")
    .toLowerCase()
  
  // Vérifier chaque domaine autorisé
  for (const allowedDomain of allowedDomains) {
    const cleanAllowed = allowedDomain.toLowerCase()
    
    // Domaine exact
    if (cleanDomain === cleanAllowed) {
      return true
    }
    
    // Wildcard domain (*.example.com)
    if (cleanAllowed.startsWith("*.")) {
      const baseDomain = cleanAllowed.substring(2)
      if (cleanDomain.endsWith(baseDomain)) {
        return true
      }
    }
    
    // Sous-domaine autorisé
    if (cleanDomain.endsWith("." + cleanAllowed)) {
      return true
    }
  }
  
  return false
}