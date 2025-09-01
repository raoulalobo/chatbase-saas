import { NextResponse } from "next/server"
import { userQueries } from "@/lib/db/queries"

/**
 * API Routes pour la gestion des utilisateurs
 * Endpoints: POST /api/users, GET /api/users/[email]
 */

/**
 * POST /api/users
 * Créer un nouvel utilisateur
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, id } = body
    
    if (!email || !name) {
      return NextResponse.json(
        { error: "email et name requis" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await userQueries.getByEmail(email)
    if (existingUser) {
      return NextResponse.json(existingUser, { status: 200 })
    }

    // Créer le nouvel utilisateur avec l'ID fourni si disponible
    const userData = {
      email: email.trim(),
      name: name.trim(),
      id: id || undefined, // Utiliser l'ID fourni ou laisser nanoid() générer un nouveau
    }

    const newUser = await userQueries.create(userData)
    return NextResponse.json(newUser, { status: 201 })

  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    
    // Gestion spécifique pour les contraintes uniques
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    )
  }
}