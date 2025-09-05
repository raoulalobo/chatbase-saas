import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import bcrypt from "bcryptjs"

/**
 * API Route pour le changement de mot de passe
 * - Vérification du mot de passe actuel
 * - Mise à jour avec le nouveau mot de passe hashé
 * - Authentification requise
 */

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
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
    const body: ChangePasswordRequest = await request.json()
    const { currentPassword, newPassword } = body

    // Validation des données
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Mot de passe actuel et nouveau mot de passe requis", code: "MISSING_PASSWORDS" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 8 caractères", code: "PASSWORD_TOO_SHORT" },
        { status: 400 }
      )
    }

    if (newPassword.length > 128) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe ne peut pas dépasser 128 caractères", code: "PASSWORD_TOO_LONG" },
        { status: 400 }
      )
    }

    // TODO: Récupérer l'utilisateur avec son mot de passe hashé depuis la base de données
    // Exemple avec Prisma :
    // const user = await prisma.user.findUnique({
    //   where: { id: session.user.id },
    //   select: { id: true, password: true }
    // })

    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" },
    //     { status: 404 }
    //   )
    // }

    // Simulation pour le moment - normalement on vérifierait le mot de passe actuel
    // const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    // if (!isValidPassword) {
    //   return NextResponse.json(
    //     { error: "Mot de passe actuel incorrect", code: "INVALID_CURRENT_PASSWORD" },
    //     { status: 400 }
    //   )
    // }

    // Hasher le nouveau mot de passe
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // TODO: Mettre à jour le mot de passe en base de données
    // const updatedUser = await prisma.user.update({
    //   where: { id: session.user.id },
    //   data: { 
    //     password: hashedNewPassword,
    //     updatedAt: new Date()
    //   },
    //   select: { id: true, updatedAt: true }
    // })

    // Simulation pour le moment
    console.log(`Changement de mot de passe pour l'utilisateur ${session.user.id}`)
    
    // Réponse de succès (sans données sensibles)
    return NextResponse.json({
      message: "Mot de passe modifié avec succès",
      data: {
        id: session.user.id,
        updatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error)
    
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