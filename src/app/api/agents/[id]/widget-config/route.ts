import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { agents } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

/**
 * API pour configurer les paramètres widget d'un agent
 * PUT /api/agents/[id]/widget-config
 * 
 * Gère:
 * - Configuration apparence widget (couleurs, textes, position)
 * - Liste des domaines autorisés pour la sécurité
 * - Validation complète des données d'entrée
 */

// Schéma de validation pour la configuration widget
const WidgetConfigSchema = z.object({
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).default('bottom-right'),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale invalide").default('#3b82f6'),
  title: z.string().min(1).max(50, "Titre trop long (max 50 caractères)").default('Assistant virtuel'),
  subtitle: z.string().min(1).max(100, "Sous-titre trop long (max 100 caractères)").default('Comment puis-je vous aider ?'),
  placeholder: z.string().min(1).max(80, "Placeholder trop long (max 80 caractères)").default('Tapez votre message...'),
  autoOpen: z.boolean().default(false),
  height: z.string().regex(/^\d+px$/, "Format hauteur invalide (ex: 600px)").default('600px'),
  width: z.string().regex(/^\d+px$/, "Format largeur invalide (ex: 380px)").default('380px'),
  showBranding: z.boolean().default(true),
  animation: z.boolean().default(true)
})

// Schéma de validation pour les domaines autorisés
const AllowedDomainsSchema = z.array(
  z.string()
    .min(1, "Domaine vide")
    .max(100, "Nom de domaine trop long")
    .refine(
      (domain) => {
        // Validation domaine basique ou wildcard
        const domainRegex = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/
        return domainRegex.test(domain)
      },
      "Format de domaine invalide"
    )
).max(20, "Maximum 20 domaines autorisés")

// Schéma principal de la requête
const RequestSchema = z.object({
  widgetConfig: WidgetConfigSchema,
  allowedDomains: AllowedDomainsSchema.optional()
})

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
    
    // 3. Validation des données de la requête
    const body = await request.json()
    const validationResult = RequestSchema.safeParse(body)
    
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
    
    const { widgetConfig, allowedDomains } = validationResult.data
    
    // 4. Validation supplémentaire des dimensions
    const heightValue = parseInt(widgetConfig.height)
    const widthValue = parseInt(widgetConfig.width)
    
    if (heightValue < 300 || heightValue > 800) {
      return NextResponse.json(
        { error: "Hauteur invalide (entre 300px et 800px)" },
        { status: 400 }
      )
    }
    
    if (widthValue < 320 || widthValue > 500) {
      return NextResponse.json(
        { error: "Largeur invalide (entre 320px et 500px)" },
        { status: 400 }
      )
    }
    
    // 5. Validation des domaines autorisés (détection doublons et domaines invalides)
    if (allowedDomains && allowedDomains.length > 0) {
      const uniqueDomains = [...new Set(allowedDomains)]
      
      if (uniqueDomains.length !== allowedDomains.length) {
        return NextResponse.json(
          { error: "Domaines dupliqués détectés" },
          { status: 400 }
        )
      }
      
      // Validation domaines conflictuels (ex: example.com et *.example.com)
      const conflicts = findDomainConflicts(uniqueDomains)
      if (conflicts.length > 0) {
        return NextResponse.json(
          { 
            error: "Conflits de domaines détectés",
            details: conflicts
          },
          { status: 400 }
        )
      }
    }
    
    // 6. Mise à jour de la configuration dans la base de données
    await db
      .update(agents)
      .set({
        widgetConfig: JSON.stringify(widgetConfig),
        allowedDomains: allowedDomains && allowedDomains.length > 0 
          ? JSON.stringify(allowedDomains) 
          : null,
        updatedAt: new Date()
      })
      .where(eq(agents.id, agentId))
    
    // 7. Log pour audit
    console.log(`Configuration widget mise à jour pour agent ${agentId} par utilisateur ${session.user.id}`)
    
    return NextResponse.json({
      success: true,
      message: "Configuration widget sauvegardée avec succès",
      widgetConfig,
      allowedDomains: allowedDomains || []
    })

  } catch (error: any) {
    console.error("Erreur sauvegarde configuration widget:", error)
    
    return NextResponse.json(
      { error: "Erreur interne lors de la sauvegarde" },
      { status: 500 }
    )
  }
}

/**
 * Récupérer la configuration widget actuelle
 * GET /api/agents/[id]/widget-config
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
    
    // 2. Récupération de l'agent avec sa configuration
    const agent = await db
      .select({
        id: agents.id,
        userId: agents.userId,
        widgetConfig: agents.widgetConfig,
        allowedDomains: agents.allowedDomains,
        publicApiKey: agents.publicApiKey
      })
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
    
    // 3. Parsing des configurations JSON
    const agentData = agent[0]
    const widgetConfig = agentData.widgetConfig 
      ? JSON.parse(agentData.widgetConfig as string)
      : WidgetConfigSchema.parse({}) // Configuration par défaut
      
    const allowedDomains = agentData.allowedDomains
      ? JSON.parse(agentData.allowedDomains as string)
      : []
    
    return NextResponse.json({
      widgetConfig,
      allowedDomains,
      hasPublicApiKey: !!agentData.publicApiKey,
      isConfigured: !!agentData.widgetConfig
    })

  } catch (error: any) {
    console.error("Erreur récupération configuration widget:", error)
    
    return NextResponse.json(
      { error: "Erreur interne lors de la récupération" },
      { status: 500 }
    )
  }
}

/**
 * Détecte les conflits entre domaines autorisés
 * Ex: "example.com" et "*.example.com" sont en conflit
 */
function findDomainConflicts(domains: string[]): string[] {
  const conflicts: string[] = []
  
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      const domainA = domains[i]
      const domainB = domains[j]
      
      // Cas 1: Domaine exact vs wildcard du même domaine
      if (domainA.startsWith('*.') && domainB === domainA.substring(2)) {
        conflicts.push(`"${domainA}" et "${domainB}" sont redondants`)
      } else if (domainB.startsWith('*.') && domainA === domainB.substring(2)) {
        conflicts.push(`"${domainA}" et "${domainB}" sont redondants`)
      }
      
      // Cas 2: Sous-domaine vs wildcard parent
      else if (domainA.startsWith('*.') && domainB.endsWith(domainA.substring(2))) {
        conflicts.push(`"${domainB}" est déjà couvert par "${domainA}"`)
      } else if (domainB.startsWith('*.') && domainA.endsWith(domainB.substring(2))) {
        conflicts.push(`"${domainA}" est déjà couvert par "${domainB}"`)
      }
    }
  }
  
  return conflicts
}