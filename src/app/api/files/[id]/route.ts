import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { agentFiles, agents } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { 
  FileParamsSchema,
  FileSchema
} from "@/lib/schemas/file"
import { 
  createSuccessResponse, 
  createErrorResponse,
  ApiErrorHandler 
} from "@/lib/utils/api"

/**
 * API Routes pour la gestion d'un fichier spécifique
 * GET /api/files/[id] - Récupérer un fichier par ID
 * DELETE /api/files/[id] - Supprimer un fichier
 */

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
    const fileId = resolvedParams.id

    // Validation des paramètres
    const paramsResult = FileParamsSchema.safeParse({ id: fileId })
    if (!paramsResult.success) {
      return createErrorResponse("ID de fichier invalide", 400)
    }

    // Récupérer le fichier avec vérification de propriété
    const fileResult = await db
      .select({
        file: agentFiles,
        agent: {
          id: agents.id,
          name: agents.name,
          userId: agents.userId
        }
      })
      .from(agentFiles)
      .innerJoin(agents, eq(agentFiles.agentId, agents.id))
      .where(eq(agentFiles.id, fileId))
      .limit(1)

    const fileData = fileResult[0]

    if (!fileData) {
      return ApiErrorHandler.notFound("Fichier introuvable")
    }

    // Vérifier que le fichier appartient à l'utilisateur connecté
    if (fileData.agent.userId !== session.user.id) {
      return ApiErrorHandler.forbidden("Accès non autorisé à ce fichier")
    }

    // Formatter la réponse
    const response = {
      ...fileData.file,
      agent: {
        id: fileData.agent.id,
        name: fileData.agent.name
      }
    }

    // Validation avec Zod
    const validatedData = FileSchema.parse(response)

    return createSuccessResponse(validatedData)

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}

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
    const fileId = resolvedParams.id

    // Validation des paramètres
    const paramsResult = FileParamsSchema.safeParse({ id: fileId })
    if (!paramsResult.success) {
      return createErrorResponse("ID de fichier invalide", 400)
    }

    // Vérifier que le fichier existe et appartient à l'utilisateur
    const fileResult = await db
      .select({
        file: agentFiles,
        agent: {
          id: agents.id,
          name: agents.name,
          userId: agents.userId,
          anthropicFileIds: agents.anthropicFileIds
        }
      })
      .from(agentFiles)
      .innerJoin(agents, eq(agentFiles.agentId, agents.id))
      .where(eq(agentFiles.id, fileId))
      .limit(1)

    const fileData = fileResult[0]

    if (!fileData) {
      return ApiErrorHandler.notFound("Fichier introuvable")
    }

    // Vérifier la propriété
    if (fileData.agent.userId !== session.user.id) {
      return ApiErrorHandler.forbidden("Accès non autorisé à ce fichier")
    }

    // Supprimer le fichier de la base de données
    await db
      .delete(agentFiles)
      .where(eq(agentFiles.id, fileId))

    // Optionnel: Mettre à jour la liste des fichiers dans l'agent
    // Retirer l'ID Anthropic de la liste des fichiers de l'agent
    if (fileData.file.anthropicFileId && fileData.agent.anthropicFileIds) {
      const updatedFileIds = fileData.agent.anthropicFileIds.filter(
        id => id !== fileData.file.anthropicFileId
      )
      
      await db
        .update(agents)
        .set({ anthropicFileIds: updatedFileIds })
        .where(eq(agents.id, fileData.agent.id))
    }

    // Note: On ne supprime pas le fichier de l'API Anthropic volontairement
    // pour éviter les problèmes si le fichier est utilisé ailleurs
    // ou si on veut garder un historique

    return createSuccessResponse({ 
      message: "Fichier supprimé avec succès",
      fileId: fileId
    })

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}