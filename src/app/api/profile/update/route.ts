import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * API Route pour la mise à jour du profil utilisateur
 * - Mise à jour des informations personnelles (nom, email)
 * - Validation des données
 * - Authentification requise
 */

interface UpdateProfileRequest {
  name?: string
  email?: string
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
    const body: UpdateProfileRequest = await request.json()
    const { name, email } = body

    // Validation des données
    const updates: Record<string, any> = {}

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: "Le nom ne peut pas être vide", code: "INVALID_NAME" },
          { status: 400 }
        )
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: "Le nom ne peut pas dépasser 100 caractères", code: "NAME_TOO_LONG" },
          { status: 400 }
        )
      }
      updates.name = name.trim()
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { error: "L'email ne peut pas être vide", code: "INVALID_EMAIL" },
          { status: 400 }
        )
      }
      
      // Validation basique de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Format d'email invalide", code: "INVALID_EMAIL_FORMAT" },
          { status: 400 }
        )
      }

      updates.email = email.trim().toLowerCase()
    }

    // Si aucune donnée à mettre à jour
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour", code: "NO_DATA" },
        { status: 400 }
      )
    }

    // TODO: Mise à jour en base de données
    // Exemple avec Prisma :
    // const updatedUser = await prisma.user.update({
    //   where: { id: session.user.id },
    //   data: updates,
    //   select: {
    //     id: true,
    //     name: true,
    //     email: true,
    //     updatedAt: true
    //   }
    // })

    // Simulation pour le moment
    console.log(`Mise à jour du profil pour l'utilisateur ${session.user.id}:`, updates)
    
    // Réponse de succès
    return NextResponse.json({
      message: "Profil mis à jour avec succès",
      data: {
        id: session.user.id,
        name: updates.name || session.user.name,
        email: updates.email || session.user.email,
        updatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error)
    
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