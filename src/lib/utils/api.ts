import { NextResponse } from "next/server"
import { ZodError } from "zod"

/**
 * Utilitaires pour la gestion des API avec validation Zod
 * - Formatage des erreurs de validation
 * - Réponses standardisées
 * - Gestion des erreurs communes
 */

// Types pour les réponses API standardisées
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  errors?: Record<string, string[]>
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
  details?: any
}

// Formatage des erreurs Zod pour l'API
export function formatZodError(error: ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!formattedErrors[path]) {
      formattedErrors[path] = []
    }
    formattedErrors[path].push(err.message)
  })
  
  return formattedErrors
}

// Réponse de succès standardisée
export function createSuccessResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  })
}

// Réponse d'erreur standardisée
export function createErrorResponse(
  error: string | ApiError,
  statusCode: number = 400
): NextResponse<ApiResponse> {
  if (typeof error === 'string') {
    return NextResponse.json({
      success: false,
      error,
    }, { status: statusCode })
  }

  return NextResponse.json({
    success: false,
    error: error.message,
    ...(error.details && { details: error.details }),
  }, { status: error.statusCode || statusCode })
}

// Réponse d'erreur de validation
export function createValidationErrorResponse(
  zodError: ZodError
): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error: "Erreur de validation",
    errors: formatZodError(zodError),
  }, { status: 422 })
}

// Gestion des erreurs communes
export class ApiErrorHandler {
  static handleError(error: unknown): NextResponse<ApiResponse> {
    console.error('API Error:', error)
    
    // Erreur de validation Zod
    if (error instanceof ZodError) {
      return createValidationErrorResponse(error)
    }
    
    // Erreur personnalisée
    if (error instanceof Error) {
      return createErrorResponse({
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }, 500)
    }
    
    // Erreur inconnue
    return createErrorResponse(
      "Une erreur interne s'est produite",
      500
    )
  }
  
  static unauthorized(message: string = "Non autorisé"): NextResponse<ApiResponse> {
    return createErrorResponse({
      message,
      code: "UNAUTHORIZED",
    }, 401)
  }
  
  static forbidden(message: string = "Accès interdit"): NextResponse<ApiResponse> {
    return createErrorResponse({
      message,
      code: "FORBIDDEN", 
    }, 403)
  }
  
  static notFound(resource: string = "Ressource"): NextResponse<ApiResponse> {
    return createErrorResponse({
      message: `${resource} non trouvé(e)`,
      code: "NOT_FOUND",
    }, 404)
  }
  
  static conflict(message: string = "Conflit"): NextResponse<ApiResponse> {
    return createErrorResponse({
      message,
      code: "CONFLICT",
    }, 409)
  }
}

// Middleware pour vérifier l'authentification
export async function requireAuth(request: Request) {
  // Cette fonction sera utilisée dans les API routes
  // Pour l'instant on retourne un objet utilisateur mock
  // À adapter selon votre système d'authentification NextAuth
  const user = { id: "mock-user-id" }
  
  if (!user) {
    throw ApiErrorHandler.unauthorized("Authentification requise")
  }
  
  return user
}

// Validation des paramètres de pagination
export function validatePagination(page?: string, limit?: string) {
  const pageNum = page ? parseInt(page) : 1
  const limitNum = limit ? parseInt(limit) : 20
  
  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)),
    offset: (Math.max(1, pageNum) - 1) * Math.min(100, Math.max(1, limitNum))
  }
}

// Helper pour calculer la pagination
export function calculatePagination(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  }
}