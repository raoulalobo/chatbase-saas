import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { agentFiles, agents } from "@/lib/db/schema"
import { eq, and, count, sum, gte, sql } from "drizzle-orm"
import { 
  FileStatsSchema,
  type FileStats
} from "@/lib/schemas/file"
import { 
  createSuccessResponse, 
  ApiErrorHandler 
} from "@/lib/utils/api"

/**
 * API Route pour les statistiques des fichiers
 * GET /api/files/stats - Récupérer les statistiques des fichiers de l'utilisateur
 */

export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiErrorHandler.unauthorized()
    }

    const userId = session.user.id

    // Date limite pour les uploads récents (7 derniers jours)
    const recentThreshold = new Date()
    recentThreshold.setDate(recentThreshold.getDate() - 7)

    // 1. Statistiques générales
    const totalFilesResult = await db
      .select({ count: count() })
      .from(agentFiles)
      .innerJoin(agents, eq(agentFiles.agentId, agents.id))
      .where(eq(agents.userId, userId))

    const totalFiles = totalFilesResult[0]?.count || 0

    // 2. Taille totale des fichiers (conversion string -> number pour la somme)
    const totalSizeResult = await db
      .select({ 
        totalSize: sql<number>`COALESCE(SUM(CAST(${agentFiles.fileSize} AS BIGINT)), 0)`.as('totalSize')
      })
      .from(agentFiles)
      .innerJoin(agents, eq(agentFiles.agentId, agents.id))
      .where(and(
        eq(agents.userId, userId),
        sql`${agentFiles.fileSize} IS NOT NULL AND ${agentFiles.fileSize} ~ '^[0-9]+$'`
      ))

    const totalSize = Number(totalSizeResult[0]?.totalSize) || 0

    // 3. Fichiers par statut
    const filesByStatusResult = await db
      .select({
        status: agentFiles.status,
        count: count()
      })
      .from(agentFiles)
      .innerJoin(agents, eq(agentFiles.agentId, agents.id))
      .where(eq(agents.userId, userId))
      .groupBy(agentFiles.status)

    const filesByStatus = {
      uploading: 0,
      ready: 0,
      error: 0,
    }

    filesByStatusResult.forEach(row => {
      if (row.status && row.status in filesByStatus) {
        filesByStatus[row.status as keyof typeof filesByStatus] = row.count
      }
    })

    // 4. Fichiers par type
    const filesByTypeResult = await db
      .select({
        type: agentFiles.fileType,
        count: count(),
        totalSize: sql<number>`COALESCE(SUM(CAST(${agentFiles.fileSize} AS BIGINT)), 0)`.as('totalSize')
      })
      .from(agentFiles)
      .innerJoin(agents, eq(agentFiles.agentId, agents.id))
      .where(and(
        eq(agents.userId, userId),
        sql`${agentFiles.fileType} IS NOT NULL`
      ))
      .groupBy(agentFiles.fileType)

    const filesByType = filesByTypeResult.map(row => ({
      type: row.type || 'unknown',
      count: row.count,
      size: Number(row.totalSize) || 0
    }))

    // 5. Uploads récents (7 derniers jours)
    const recentUploadsResult = await db
      .select({ count: count() })
      .from(agentFiles)
      .innerJoin(agents, eq(agentFiles.agentId, agents.id))
      .where(and(
        eq(agents.userId, userId),
        gte(agentFiles.uploadDate, recentThreshold)
      ))

    const recentUploads = recentUploadsResult[0]?.count || 0

    // Construire la réponse
    const stats: FileStats = {
      totalFiles,
      totalSize,
      filesByStatus,
      filesByType,
      recentUploads,
    }

    // Validation avec Zod
    const validatedData = FileStatsSchema.parse(stats)

    return createSuccessResponse(validatedData)

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}