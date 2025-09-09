import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { agents } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { UpdateAgentSchema } from "@/lib/schemas/agent"

/**
 * API Route pour la gestion d'un agent spécifique
 * GET /api/agents/[id] - Récupérer les détails d'un agent
 * PUT /api/agents/[id] - Mettre à jour un agent
 * DELETE /api/agents/[id] - Supprimer un agent
 */

/**
 * Récupérer les détails d'un agent par ID
 * GET /api/agents/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérification authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      )
    }

    const { id: agentId } = await params

    // 2. Récupération de l'agent avec vérification de propriété
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1)

    if (!agent.length) {
      return NextResponse.json(
        { error: "Agent introuvable" },
        { status: 404 }
      )
    }

    const agentData = agent[0]

    // 3. Vérification que l'utilisateur est propriétaire de l'agent
    if (agentData.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès non autorisé à cet agent" },
        { status: 403 }
      )
    }

    // 4. Formatage de la réponse (les champs JSONB sont auto-parsés par Drizzle)
    const response = {
      ...agentData,
      createdAt: agentData.createdAt.toISOString(),
      updatedAt: agentData.updatedAt.toISOString(),
      // Les champs JSONB sont automatiquement parsés par Drizzle, pas besoin de JSON.parse()
      antiHallucinationTemplate: agentData.antiHallucinationTemplate || null,
      allowedDomains: agentData.allowedDomains || null,
      widgetConfig: agentData.widgetConfig || null
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error: any) {
    console.error("Erreur récupération agent:", error)

    return NextResponse.json(
      { error: "Erreur interne lors de la récupération de l'agent" },
      { status: 500 }
    )
  }
}

/**
 * Mettre à jour un agent
 * PUT /api/agents/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérification authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      )
    }

    const { id: agentId } = await params

    // 2. Validation des données de la requête
    const body = await request.json()
    const validationResult = UpdateAgentSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))

      return NextResponse.json(
        { 
          error: "Données invalides",
          details: errors
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // 3. Vérification existence et propriété de l'agent
    const existingAgent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1)

    if (!existingAgent.length) {
      return NextResponse.json(
        { error: "Agent introuvable" },
        { status: 404 }
      )
    }

    if (existingAgent[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès non autorisé à cet agent" },
        { status: 403 }
      )
    }

    // 4. Vérifier l'unicité du nom (si changé)
    if (updateData.name !== existingAgent[0].name) {
      const nameConflict = await db
        .select()
        .from(agents)
        .where(eq(agents.name, updateData.name))
        .limit(1)

      if (nameConflict.length > 0 && nameConflict[0].id !== agentId) {
        return NextResponse.json(
          { error: "Un agent avec ce nom existe déjà" },
          { status: 409 }
        )
      }
    }

    // 5. Mise à jour de l'agent
    const updatedAgent = await db
      .update(agents)
      .set({
        name: updateData.name,
        description: updateData.description,
        systemPrompt: updateData.systemPrompt,
        temperature: updateData.temperature,
        maxTokens: updateData.maxTokens,
        topP: updateData.topP,
        model: updateData.model,
        isActive: updateData.isActive,
        restrictToPromptSystem: updateData.restrictToPromptSystem,
        antiHallucinationTemplate: updateData.antiHallucinationTemplate || null,
        updatedAt: new Date()
      })
      .where(eq(agents.id, agentId))
      .returning()

    // 6. Format de la réponse
    const response = {
      ...updatedAgent[0],
      createdAt: updatedAgent[0].createdAt.toISOString(),
      updatedAt: updatedAgent[0].updatedAt.toISOString(),
      // Les champs JSONB sont automatiquement parsés par Drizzle, pas besoin de JSON.parse()
      antiHallucinationTemplate: updatedAgent[0].antiHallucinationTemplate || null
    }

    return NextResponse.json({
      success: true,
      message: "Agent mis à jour avec succès",
      data: response
    })

  } catch (error: any) {
    console.error("Erreur mise à jour agent:", error)

    return NextResponse.json(
      { error: "Erreur interne lors de la mise à jour" },
      { status: 500 }
    )
  }
}

/**
 * Supprimer un agent
 * DELETE /api/agents/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérification authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      )
    }

    const { id: agentId } = await params

    // 2. Vérification existence et propriété de l'agent
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1)

    if (!agent.length) {
      return NextResponse.json(
        { error: "Agent introuvable" },
        { status: 404 }
      )
    }

    if (agent[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès non autorisé à cet agent" },
        { status: 403 }
      )
    }

    // 3. Suppression de l'agent (cascade automatique sur conversations/messages)
    await db
      .delete(agents)
      .where(eq(agents.id, agentId))

    // 4. Log pour audit
    console.log(`Agent ${agentId} supprimé par utilisateur ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: "Agent supprimé avec succès"
    })

  } catch (error: any) {
    console.error("Erreur suppression agent:", error)

    return NextResponse.json(
      { error: "Erreur interne lors de la suppression" },
      { status: 500 }
    )
  }
}