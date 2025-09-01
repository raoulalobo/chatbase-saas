import Anthropic from "@anthropic-ai/sdk"
import type { AnthropicConfig, ChatRequest, ChatResponse } from "@/types"

/**
 * Service Anthropic pour l'intégration avec l'API Claude
 * Gère l'upload de fichiers et les conversations avec contexte
 */

// Initialisation du client Anthropic avec les headers requis pour l'API Files
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  apiVersion: "2023-06-01",
  defaultHeaders: {
    "anthropic-beta": "files-api-2025-04-14",
  },
})

export class AnthropicService {
  /**
   * Uploader un fichier vers l'API Anthropic via appel REST direct
   * @param file - Buffer du fichier à uploader
   * @param filename - Nom original du fichier
   * @returns ID du fichier uploadé
   */
  static async uploadFile(file: Buffer, filename: string): Promise<string> {
    try {
      // Créer FormData pour l'upload
      const formData = new FormData()
      const fileBlob = new Blob([file], { type: this.getMimeType(filename) })
      formData.append('file', fileBlob, filename)

      // Appel direct à l'API REST Anthropic avec les headers beta
      const response = await fetch('https://api.anthropic.com/v1/files', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'files-api-2025-04-14',
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorData}`)
      }

      const result = await response.json()
      console.log("Fichier uploadé avec succès:", result)
      
      return result.id
    } catch (error) {
      console.error("Erreur lors de l'upload du fichier:", error)
      
      // Log détaillé de l'erreur pour debug
      if (error instanceof Error) {
        console.error("Détails erreur:", error.message)
        console.error("Stack:", error.stack)
      }
      
      throw new Error(`Impossible d'uploader le fichier vers Anthropic: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  /**
   * Obtenir le type MIME d'un fichier basé sur son extension
   */
  private static getMimeType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf': return 'application/pdf'
      case 'txt': return 'text/plain'
      case 'md': return 'text/markdown'
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      case 'csv': return 'text/csv'
      default: return 'text/plain'
    }
  }

  /**
   * Créer une conversation avec un agent utilisant ses fichiers sources
   * @param config - Configuration de l'agent
   * @param question - Question de l'utilisateur
   * @returns Réponse formatée
   */
  static async chat(config: AnthropicConfig, question: string): Promise<{
    response: string
    tokensUsed: number
  }> {
    try {
      const message = await anthropic.messages.create({
        model: config.model,
        max_tokens: parseInt(config.maxTokens),
        temperature: parseFloat(config.temperature),
        top_p: parseFloat(config.topP),
        system: config.systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: question,
              },
              // Inclure les fichiers si disponibles (format correct selon la doc)
              ...config.fileIds.map(fileId => ({
                type: "document" as const,
                source: {
                  type: "file" as const,
                  file_id: fileId,
                },
              })),
            ],
          },
        ],
      })

      const responseText = message.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("")

      return {
        response: responseText,
        tokensUsed: message.usage.output_tokens + message.usage.input_tokens,
      }
    } catch (error) {
      console.error("Erreur lors de la conversation Anthropic:", error)
      throw new Error("Impossible de générer une réponse")
    }
  }

  /**
   * Obtenir les informations d'un fichier uploadé
   * @param fileId - ID du fichier Anthropic
   */
  static async getFileInfo(fileId: string) {
    try {
      return await anthropic.files.retrieve(fileId)
    } catch (error) {
      console.error("Erreur lors de la récupération du fichier:", error)
      throw new Error("Fichier introuvable")
    }
  }

  /**
   * Supprimer un fichier de l'API Anthropic
   * @param fileId - ID du fichier à supprimer
   */
  static async deleteFile(fileId: string): Promise<void> {
    try {
      await anthropic.files.delete(fileId)
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier:", error)
      throw new Error("Impossible de supprimer le fichier")
    }
  }

  /**
   * Lister tous les fichiers uploadés
   */
  static async listFiles() {
    try {
      return await anthropic.files.list()
    } catch (error) {
      console.error("Erreur lors de la récupération des fichiers:", error)
      throw new Error("Impossible de récupérer la liste des fichiers")
    }
  }
}

export default AnthropicService