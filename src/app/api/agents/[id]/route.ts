import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { agents } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"
import { 
  UpdateAgentSchema, 
  AgentParamsSchema,
  type AgentResponse
} from "@/lib/schemas/agent"
import { 
  createSuccessResponse, 
  ApiErrorHandler 
} from "@/lib/utils/api"

/**
 * API Route pour les opérations sur un agent spécifique
 * GET /api/agents/[id] - Récupérer un agent
 * PUT /api/agents/[id] - Mettre à jour un agent
 * DELETE /api/agents/[id] - Supprimer un agent
 */

// GET /api/agents/[id] - Récupérer un agent spécifique
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

    const resolvedParams = await params
    
    // Validation de l'ID
    const paramsResult = AgentParamsSchema.safeParse({ id: resolvedParams.id })
    if (!paramsResult.success) {
      return ApiErrorHandler.handleError(paramsResult.error)
    }

    const { id } = paramsResult.data

    // Récupération de l'agent
    const agent = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.id, id),
          eq(agents.userId, session.user.id)
        )
      )
      .limit(1)

    if (agent.length === 0) {
      return ApiErrorHandler.notFound("Agent")
    }

    // Format de la réponse
    const responseData: AgentResponse = {
      ...agent[0],
      createdAt: agent[0].createdAt.toISOString(),
      updatedAt: agent[0].updatedAt.toISOString(),
      // TODO: Ajouter les compteurs réels
      _count: {
        conversations: 0,
        files: 0,
      }
    }

    return createSuccessResponse(responseData)

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}

// PUT /api/agents/[id] - Mettre à jour un agent
export async function PUT(
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

    // Validation de l'ID
    const paramsResult = AgentParamsSchema.safeParse({ id: resolvedParams.id })
    if (!paramsResult.success) {
      return ApiErrorHandler.handleError(paramsResult.error)
    }

    const { id } = paramsResult.data

    // Validation des données à mettre à jour
    const body = await request.json()
    const validationResult = UpdateAgentSchema.safeParse(body)
    if (!validationResult.success) {
      return ApiErrorHandler.handleError(validationResult.error)
    }

    const updateData = validationResult.data

    // Vérifier que l'agent existe et appartient à l'utilisateur
    const existingAgent = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.id, id),
          eq(agents.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingAgent.length === 0) {
      return ApiErrorHandler.notFound("Agent")
    }

    // Si le nom change, vérifier l'unicité
    if (updateData.name && updateData.name !== existingAgent[0].name) {
      const duplicateAgent = await db
        .select()
        .from(agents)
        .where(
          and(
            eq(agents.userId, session.user.id),
            eq(agents.name, updateData.name),
            // Exclure l'agent actuel
            ne(agents.id, id)
          )
        )
        .limit(1)

      if (duplicateAgent.length > 0) {
        return ApiErrorHandler.conflict("Un agent avec ce nom existe déjà")
      }
    }

    // Mise à jour de l'agent
    const updatedAgent = await db
      .update(agents)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agents.id, id),
          eq(agents.userId, session.user.id)
        )
      )
      .returning()

    if (updatedAgent.length === 0) {
      return ApiErrorHandler.notFound("Agent")
    }

    // Format de la réponse
    const responseData: AgentResponse = {
      ...updatedAgent[0],
      createdAt: updatedAgent[0].createdAt.toISOString(),
      updatedAt: updatedAgent[0].updatedAt.toISOString(),
    }

    return createSuccessResponse(
      responseData,
      "Agent mis à jour avec succès"
    )

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}

// DELETE /api/agents/[id] - Supprimer un agent
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

    const resolvedParams = await params

    // Validation de l'ID
    const paramsResult = AgentParamsSchema.safeParse({ id: resolvedParams.id })
    if (!paramsResult.success) {
      return ApiErrorHandler.handleError(paramsResult.error)
    }

    const { id } = paramsResult.data

    // Vérifier que l'agent existe et appartient à l'utilisateur
    const existingAgent = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.id, id),
          eq(agents.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingAgent.length === 0) {
      return ApiErrorHandler.notFound("Agent")
    }

    // TODO: Vérifier si l'agent a des conversations actives
    // et peut-être empêcher la suppression ou proposer une désactivation

    // Suppression de l'agent (cascade défini dans le schéma)
    await db
      .delete(agents)
      .where(
        and(
          eq(agents.id, id),
          eq(agents.userId, session.user.id)
        )
      )

    return createSuccessResponse(
      { id },
      "Agent supprimé avec succès"
    )

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}