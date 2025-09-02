import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { agentFiles, agents } from "@/lib/db/schema"
import { eq, and, desc, asc, count, like, ilike, sql } from "drizzle-orm"
import { 
  FileQuerySchema,
  FilesListResponseSchema,
  type FilesListResponse,
  type FileQuery
} from "@/lib/schemas/file"
import { 
  createSuccessResponse, 
  createErrorResponse,
  ApiErrorHandler 
} from "@/lib/utils/api"

/**
 * API Route pour la gestion globale des fichiers
 * GET /api/files - Récupérer tous les fichiers de l'utilisateur avec filtres et pagination
 */

export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiErrorHandler.unauthorized()
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)

    // Validation des paramètres de query
    const queryResult = FileQuerySchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      agentId: searchParams.get('agentId') || undefined,
      status: searchParams.get('status') || undefined,
      fileType: searchParams.get('fileType') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    })

    if (!queryResult.success) {
      return createErrorResponse("Paramètres de requête invalides", 400)
    }

    const query: FileQuery = queryResult.data

    // Construction de la clause WHERE
    const whereConditions = [
      eq(agents.userId, userId) // Seuls les fichiers des agents de l'utilisateur
    ]

    // Filtre par agent spécifique
    if (query.agentId) {
      whereConditions.push(eq(agentFiles.agentId, query.agentId))
    }

    // Filtre par statut
    if (query.status && query.status !== 'all') {
      whereConditions.push(eq(agentFiles.status, query.status))
    }

    // Filtre par type de fichier
    if (query.fileType) {
      whereConditions.push(eq(agentFiles.fileType, query.fileType))
    }

    // Recherche dans le nom de fichier (insensible à la casse)
    if (query.search) {
      whereConditions.push(ilike(agentFiles.originalFilename, `%${query.search}%`))
    }

    // Déterminer l'ordre de tri
    const sortColumn = {
      originalFilename: agentFiles.originalFilename,
      uploadDate: agentFiles.uploadDate,
      fileSize: agentFiles.fileSize,
    }[query.sortBy]

    const orderFn = query.sortOrder === 'asc' ? asc : desc

    // Requête principale avec jointure et pagination
    const offset = (query.page - 1) * query.limit

    const filesResult = await db
      .select({
        file: agentFiles,
        agent: {
          id: agents.id,
          name: agents.name
        }
      })
      .from(agentFiles)
      .innerJoin(agents, eq(agentFiles.agentId, agents.id))
      .where(and(...whereConditions))
      .orderBy(orderFn(sortColumn))
      .limit(query.limit)
      .offset(offset)

    // Compter le total pour la pagination
    const totalResult = await db
      .select({ count: count() })
      .from(agentFiles)
      .innerJoin(agents, eq(agentFiles.agentId, agents.id))
      .where(and(...whereConditions))

    const total = totalResult[0]?.count || 0

    // Formatter les résultats
    const files = filesResult.map(row => ({
      ...row.file,
      agent: row.agent
    }))

    // Construire la réponse
    const responseData: FilesListResponse = {
      files,
      total
    }

    // Validation avec Zod
    const validatedData = FilesListResponseSchema.parse(responseData)

    return createSuccessResponse(validatedData)

  } catch (error) {
    return ApiErrorHandler.handleError(error)
  }
}