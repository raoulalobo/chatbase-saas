import { NextRequest } from "next/server"
import { nanoid } from "nanoid"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { agents, conversations } from "@/lib/db/schema"
import { eq, and, desc, asc, ilike, count, sql } from "drizzle-orm"
import { 
  CreateAgentSchema, 
  AgentQuerySchema,
  type AgentsListResponse
} from "@/lib/schemas/agent"
import { 
  createSuccessResponse, 
  ApiErrorHandler,
  validatePagination,
  calculatePagination 
} from "@/lib/utils/api"

/**
 * API Route pour la gestion des agents avec validation Zod
 * GET /api/agents - Liste paginée des agents de l'utilisateur
 * POST /api/agents - Création d'un nouvel agent
 */

// Configuration pour augmenter la limite de taille du body
export const runtime = 'nodejs'
export const maxDuration = 60

// GET /api/agents - Récupérer la liste des agents
export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiErrorHandler.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    
    // Validation des paramètres de requête
    const queryResult = AgentQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    })

    if (!queryResult.success) {
      return ApiErrorHandler.handleError(queryResult.error)
    }

    const { page, limit, search, status, sortBy, sortOrder } = queryResult.data
    const { offset } = validatePagination(page.toString(), limit.toString())

    // Construction de la requête avec filtres
    let whereConditions = [eq(agents.userId, session.user.id)]
    
    // Filtre par recherche (nom ou description)
    if (search) {
      whereConditions.push(
        // @ts-ignore - ilike fonctionne mais TypeScript n'aime pas
        ilike(agents.name, `%${search}%`)
      )
    }
    
    // Filtre par statut
    if (status !== 'all') {
      whereConditions.push(eq(agents.isActive, status === 'active'))
    }

    // Ordre de tri
    const orderBy = sortOrder === 'asc' 
      ? asc(agents[sortBy as keyof typeof agents])
      : desc(agents[sortBy as keyof typeof agents])

    // Requête optimisée avec LEFT JOIN pour récupérer les agents avec compteur de conversations
    const agentsResult = await db
      .select({
        id: agents.id,
        name: agents.name,
        description: agents.description,
        systemPrompt: agents.systemPrompt,
        userId: agents.userId,
        temperature: agents.temperature,
        maxTokens: agents.maxTokens,
        topP: agents.topP,
        model: agents.model,
        isActive: agents.isActive,
        restrictToPromptSystem: agents.restrictToPromptSystem,
        antiHallucinationTemplate: agents.antiHallucinationTemplate,
        publicApiKey: agents.publicApiKey,
        allowedDomains: agents.allowedDomains,
        widgetConfig: agents.widgetConfig,
        createdAt: agents.createdAt,
        updatedAt: agents.updatedAt,
        // COUNT avec LEFT JOIN pour compter les conversations réelles
        conversationsCount: sql<number>`COALESCE(COUNT(${conversations.id}), 0)`.as('conversations_count')
      })
      .from(agents)
      .leftJoin(conversations, eq(agents.id, conversations.agentId))
      .where(and(...whereConditions))
      .groupBy(
        agents.id,
        agents.name,
        agents.description,
        agents.systemPrompt,
        agents.userId,
        agents.temperature,
        agents.maxTokens,
        agents.topP,
        agents.model,
        agents.isActive,
        agents.restrictToPromptSystem,
        agents.antiHallucinationTemplate,
        agents.publicApiKey,
        agents.allowedDomains,
        agents.widgetConfig,
        agents.createdAt,
        agents.updatedAt
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    // Compter le total pour la pagination
    const totalResult = await db
      .select({ count: count() })
      .from(agents)
      .where(and(...whereConditions))

    const total = totalResult[0]?.count || 0
    const pagination = calculatePagination(total, page, limit)

    // Format des données de réponse avec les vraies statistiques
    const response: AgentsListResponse = {
      agents: agentsResult.map(agent => ({
        ...agent,
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
        // Statistiques réelles calculées depuis la base de données
        _count: {
          conversations: agent.conversationsCount || 0,
          files: 0, // Architecture basée sur templates JSON, plus de fichiers
        }
      })),
      pagination
    }

    return createSuccessResponse(response)

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}

// POST /api/agents - Créer un nouvel agent
export async function POST(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiErrorHandler.unauthorized()
    }

    const body = await request.json()
    
    // Validation des données avec Zod
    const validationResult = CreateAgentSchema.safeParse(body)
    if (!validationResult.success) {
      return ApiErrorHandler.handleError(validationResult.error)
    }

    const agentData = validationResult.data

    // Vérifier l'unicité du nom pour cet utilisateur
    const existingAgent = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.userId, session.user.id),
          eq(agents.name, agentData.name)
        )
      )
      .limit(1)

    if (existingAgent.length > 0) {
      return ApiErrorHandler.conflict("Un agent avec ce nom existe déjà")
    }

    // Création de l'agent avec génération automatique de la clé API publique
    const agentId = nanoid()
    const now = new Date()
    
    // Génération clé API publique pour intégration widget
    // Format: cbp_[32 caractères aléatoires]_[timestamp]
    const timestamp = Date.now().toString(36)
    const randomPart = nanoid(32)
    const publicApiKey = `cbp_${randomPart}_${timestamp}`

    const newAgent = await db
      .insert(agents)
      .values({
        id: agentId,
        userId: session.user.id,
        name: agentData.name,
        description: agentData.description,
        systemPrompt: agentData.systemPrompt,
        temperature: agentData.temperature,
        maxTokens: agentData.maxTokens,
        topP: agentData.topP,
        model: agentData.model,
        isActive: agentData.isActive,
        restrictToPromptSystem: agentData.restrictToPromptSystem,
        antiHallucinationTemplate: agentData.antiHallucinationTemplate,
        publicApiKey: publicApiKey, // Clé API générée automatiquement
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    // Format de la réponse
    const responseData = {
      ...newAgent[0],
      createdAt: newAgent[0].createdAt.toISOString(),
      updatedAt: newAgent[0].updatedAt.toISOString(),
    }

    return createSuccessResponse(
      responseData, 
      "Agent créé avec succès"
    )

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}