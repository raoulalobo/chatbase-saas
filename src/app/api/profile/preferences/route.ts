import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * API Route pour la gestion des préférences utilisateur
 * - Mise à jour des préférences de notifications
 * - Authentification requise
 */

interface UpdatePreferencesRequest {
  emailNotifications?: boolean
  securityNotifications?: boolean
}

export async function PATCH(request: Request) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    // Récupération des données de la requête
    const body: UpdatePreferencesRequest = await request.json()
    const { emailNotifications, securityNotifications } = body

    // Validation des données
    const updates: Record<string, any> = {}

    if (emailNotifications !== undefined) {
      if (typeof emailNotifications !== 'boolean') {
        return NextResponse.json(
          { error: "emailNotifications doit être un booléen", code: "INVALID_EMAIL_NOTIFICATIONS" },
          { status: 400 }
        )
      }
      updates.emailNotifications = emailNotifications
    }

    if (securityNotifications !== undefined) {
      if (typeof securityNotifications !== 'boolean') {
        return NextResponse.json(
          { error: "securityNotifications doit être un booléen", code: "INVALID_SECURITY_NOTIFICATIONS" },
          { status: 400 }
        )
      }
      updates.securityNotifications = securityNotifications
    }

    // Si aucune donnée à mettre à jour
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Aucune préférence à mettre à jour", code: "NO_DATA" },
        { status: 400 }
      )
    }

    // TODO: Mise à jour en base de données
    // Exemple avec Prisma :
    // const updatedPreferences = await prisma.userPreferences.upsert({
    //   where: { userId: session.user.id },
    //   update: updates,
    //   create: {
    //     userId: session.user.id,
    //     emailNotifications: updates.emailNotifications ?? true,
    //     securityNotifications: updates.securityNotifications ?? true,
    //   },
    //   select: {
    //     emailNotifications: true,
    //     securityNotifications: true,
    //     updatedAt: true
    //   }
    // })

    // Simulation pour le moment
    console.log(`Mise à jour des préférences pour l'utilisateur ${session.user.id}:`, updates)
    
    // Réponse de succès
    return NextResponse.json({
      message: "Préférences mises à jour avec succès",
      data: {
        userId: session.user.id,
        preferences: {
          emailNotifications: updates.emailNotifications ?? true,
          securityNotifications: updates.securityNotifications ?? true,
        },
        updatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Erreur lors de la mise à jour des préférences:", error)
    
    return NextResponse.json(
      { 
        error: "Erreur interne du serveur", 
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Récupération des préférences utilisateur
 */
export async function GET(request: Request) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    // TODO: Récupérer les préférences depuis la base de données
    // Exemple avec Prisma :
    // const preferences = await prisma.userPreferences.findUnique({
    //   where: { userId: session.user.id },
    //   select: {
    //     emailNotifications: true,
    //     securityNotifications: true,
    //     updatedAt: true
    //   }
    // })

    // Valeurs par défaut si pas de préférences
    // const defaultPreferences = {
    //   emailNotifications: true,
    //   securityNotifications: true,
    //   updatedAt: new Date().toISOString()
    // }

    // Simulation pour le moment
    const preferences = {
      emailNotifications: true,
      securityNotifications: true,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      data: {
        userId: session.user.id,
        preferences
      }
    })

  } catch (error) {
    console.error("Erreur lors de la récupération des préférences:", error)
    
    return NextResponse.json(
      { 
        error: "Erreur interne du serveur", 
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}