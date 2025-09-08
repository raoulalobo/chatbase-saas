import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { agents } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

/**
 * API pour générer une nouvelle clé API publique pour un agent
 * POST /api/agents/[id]/generate-api-key
 * 
 * Sécurité:
 * - Authentification NextAuth requise
 * - Vérification propriété de l'agent
 * - Génération clé unique et sécurisée
 */

export async function POST(
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
    
    // 3. Génération nouvelle clé API publique
    // Format: cbp_[32 caractères aléatoires]_[timestamp]
    const timestamp = Date.now().toString(36)
    const randomPart = nanoid(32)
    const publicApiKey = `cbp_${randomPart}_${timestamp}`
    
    // 4. Mise à jour de l'agent avec la nouvelle clé
    await db
      .update(agents)
      .set({ 
        publicApiKey: publicApiKey,
        updatedAt: new Date()
      })
      .where(eq(agents.id, agentId))
    
    // 5. Log pour audit de sécurité
    console.log(`Nouvelle clé API générée pour agent ${agentId} par utilisateur ${session.user.id}`)
    
    return NextResponse.json({
      success: true,
      publicApiKey: publicApiKey,
      message: "Clé API publique générée avec succès"
    })

  } catch (error: any) {
    console.error("Erreur génération clé API:", error)
    
    return NextResponse.json(
      { error: "Erreur interne lors de la génération de la clé API" },
      { status: 500 }
    )
  }
}

/**
 * Supprimer/désactiver une clé API publique
 * DELETE /api/agents/[id]/generate-api-key
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
    
    // 3. Suppression de la clé API (désactivation de l'intégration widget)
    await db
      .update(agents)
      .set({ 
        publicApiKey: null,
        allowedDomains: null,
        widgetConfig: null,
        updatedAt: new Date()
      })
      .where(eq(agents.id, agentId))
    
    // 4. Log pour audit de sécurité
    console.log(`Clé API supprimée pour agent ${agentId} par utilisateur ${session.user.id}`)
    
    return NextResponse.json({
      success: true,
      message: "Clé API publique supprimée. L'intégration widget est maintenant désactivée."
    })

  } catch (error: any) {
    console.error("Erreur suppression clé API:", error)
    
    return NextResponse.json(
      { error: "Erreur interne lors de la suppression de la clé API" },
      { status: 500 }
    )
  }
}