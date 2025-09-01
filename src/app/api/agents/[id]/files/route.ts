import { NextRequest, NextResponse } from "next/server"
import { agentQueries, agentFileQueries } from "@/lib/db/queries"
import { AnthropicService } from "@/lib/anthropic"
import { nanoid } from "nanoid"

/**
 * API Routes pour l'upload de fichiers vers les agents
 * Endpoints: POST /api/agents/[id]/files, GET /api/agents/[id]/files
 */

/**
 * POST /api/agents/[id]/files
 * Uploader un fichier vers Anthropic et l'associer à un agent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const agentId = resolvedParams.id
    
    // Vérifier que l'agent existe
    const agent = await agentQueries.getWithUser(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: "Agent introuvable" },
        { status: 404 }
      )
    }

    // Récupérer le fichier depuis FormData
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      )
    }

    // Validation du type de fichier
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: "Type de fichier non supporté",
          allowedTypes: ["PDF", "TXT", "MD", "DOCX", "CSV"]
        },
        { status: 400 }
      )
    }

    // Limite de taille (25MB)
    const maxSize = 25 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 25MB)" },
        { status: 400 }
      )
    }

    // Créer l'enregistrement en base avec statut "uploading"
    const agentFile = await agentFileQueries.create({
      agentId,
      originalFilename: file.name,
      anthropicFileId: "", // Sera mis à jour après l'upload
      fileType: file.type,
      fileSize: file.size.toString(),
    })

    try {
      // Convertir le fichier en Buffer et l'uploader vers Anthropic
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const anthropicFileId = await AnthropicService.uploadFile(fileBuffer, file.name)

      // Mettre à jour l'enregistrement avec l'ID Anthropic et le statut "ready"
      await agentFileQueries.updateWithAnthropicId(agentFile.id, anthropicFileId, "ready")

      // Optionnel: Mettre à jour la liste des fichiers dans l'agent
      const currentAgent = await agentQueries.getWithFiles(agentId)
      const currentFileIds = currentAgent?.anthropicFileIds || []
      
      await agentQueries.update(agentId, {
        anthropicFileIds: [...currentFileIds, anthropicFileId],
      })

      return NextResponse.json({
        message: "Fichier uploadé avec succès",
        file: {
          id: agentFile.id,
          originalFilename: file.name,
          anthropicFileId,
          fileType: file.type,
          fileSize: file.size,
          status: "ready",
        },
      }, { status: 201 })

    } catch (uploadError) {
      // Marquer le fichier comme erreur en cas d'échec
      await agentFileQueries.updateStatus(agentFile.id, "error")
      
      console.error("Erreur upload Anthropic:", uploadError)
      return NextResponse.json(
        { error: "Erreur lors de l'upload vers Anthropic" },
        { status: 502 }
      )
    }

  } catch (error) {
    console.error("Erreur lors de l'upload du fichier:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agents/[id]/files
 * Récupérer tous les fichiers d'un agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const agentId = resolvedParams.id
    
    // Vérifier que l'agent existe
    const agent = await agentQueries.getWithUser(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: "Agent introuvable" },
        { status: 404 }
      )
    }

    // Récupérer tous les fichiers de l'agent
    const files = await agentFileQueries.getByAgentId(agentId)

    return NextResponse.json(files)

  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}