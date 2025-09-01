import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

/**
 * API Route pour l'inscription des utilisateurs
 * - Validation des données côté serveur
 * - Vérification de l'unicité de l'email
 * - Hash sécurisé des mots de passe avec bcrypt
 * - Création de l'utilisateur en base de données
 * - Gestion complète des erreurs
 */

interface RegisterRequest {
  name: string
  email: string
  password: string
}

// Fonction de validation des données
function validateRegisterData(data: RegisterRequest): string | null {
  // Validation du nom
  if (!data.name || data.name.trim().length < 2) {
    return 'Le nom doit contenir au moins 2 caractères'
  }
  
  if (data.name.trim().length > 50) {
    return 'Le nom ne peut pas dépasser 50 caractères'
  }

  // Validation de l'email
  if (!data.email) {
    return 'L\'email est requis'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    return 'Format d\'email invalide'
  }

  if (data.email.length > 100) {
    return 'L\'email ne peut pas dépasser 100 caractères'
  }

  // Validation du mot de passe
  if (!data.password) {
    return 'Le mot de passe est requis'
  }

  if (data.password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères'
  }

  if (data.password.length > 128) {
    return 'Le mot de passe ne peut pas dépasser 128 caractères'
  }

  // Vérification de la complexité du mot de passe
  const hasUppercase = /[A-Z]/.test(data.password)
  const hasLowercase = /[a-z]/.test(data.password)
  const hasNumber = /\d/.test(data.password)
  
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
  }

  return null // Toutes les validations passées
}

export async function POST(request: NextRequest) {
  try {
    // Parse du body JSON
    let body: RegisterRequest
    
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Données JSON invalides' },
        { status: 400 }
      )
    }

    // Validation des données
    const validationError = validateRegisterData(body)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    const { name, email, password } = body

    // Normaliser l'email (lowercase + trim)
    const normalizedEmail = email.toLowerCase().trim()
    const trimmedName = name.trim()

    // Vérifier si l'email existe déjà
    try {
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      if (existingUser && existingUser.length > 0) {
        return NextResponse.json(
          { error: 'Un compte avec cet email existe déjà' },
          { status: 409 } // Conflict
        )
      }
    } catch (dbError) {
      console.error('Erreur lors de la vérification de l\'email:', dbError)
      return NextResponse.json(
        { error: 'Erreur de base de données' },
        { status: 500 }
      )
    }

    // Hash du mot de passe
    let hashedPassword: string
    
    try {
      hashedPassword = await bcrypt.hash(password, 12)
    } catch (hashError) {
      console.error('Erreur lors du hashage du mot de passe:', hashError)
      return NextResponse.json(
        { error: 'Erreur lors du traitement du mot de passe' },
        { status: 500 }
      )
    }

    // Créer l'utilisateur en base de données
    try {
      const userId = nanoid()
      
      const newUser = await db
        .insert(users)
        .values({
          id: userId,
          name: trimmedName,
          email: normalizedEmail,
          passwordHash: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })

      if (!newUser || newUser.length === 0) {
        throw new Error('Échec de la création de l\'utilisateur')
      }

      const createdUser = newUser[0]

      console.log(`✅ Nouvel utilisateur créé: ${createdUser.email} (ID: ${createdUser.id})`)

      // Retourner les données utilisateur (sans le mot de passe)
      return NextResponse.json(
        {
          success: true,
          message: 'Compte créé avec succès',
          user: {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            createdAt: createdUser.createdAt,
          },
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error('Erreur lors de la création de l\'utilisateur:', dbError)
      
      // Vérifier si c'est une erreur de contrainte unique
      const errorMessage = (dbError as Error).message
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Un compte avec cet email existe déjà' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erreur générale lors de l\'inscription:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// Méthode non autorisée pour les autres verbes HTTP
export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}