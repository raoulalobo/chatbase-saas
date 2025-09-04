/**
 * Script de test des co\u00fbts d'upload de fichier vs prompt syst\u00e8me
 * Compare l'utilisation d'un fichier upload\u00e9 de 50k caract\u00e8res vs prompt syst\u00e8me \u00e9quivalent
 */

import Anthropic from "@anthropic-ai/sdk"
import * as fs from "fs"
import * as path from "path"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface FileUploadTestResult {
  method: 'file-upload' | 'system-prompt'
  question: string
  response: string
  tokensInput: number
  tokensOutput: number
  totalTokens: number
  responseTime: number
  fileId?: string
  error?: string
}

export class FileUploadTestService {
  /**
   * Upload le fichier vers l'API Anthropic Files
   */
  static async uploadFile(filePath: string): Promise<string> {
    try {
      const fileContent = fs.readFileSync(filePath)
      
      console.log(`\ud83d\udcc1 Upload du fichier: ${filePath}`)
      console.log(`\ud83d\udcca Taille: ${fileContent.length} octets`)
      
      // Upload du fichier via l'API Anthropic Files
      // Préparation des données multipart/form-data
      const formData = new FormData()
      const blob = new Blob([fileContent], { type: 'text/plain' })
      formData.append('file', blob, path.basename(filePath))
      
      // Appel HTTP direct à l'API Anthropic Files
      const response = await fetch('https://api.anthropic.com/v1/files', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'files-api-2025-04-14'
        },
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const result = await response.json()
      
      console.log(`\u2705 Fichier upload\u00e9 avec succ\u00e8s: ${file.id}`)
      return result.id
      
    } catch (error: any) {
      console.error('\u274c Erreur lors de l\'upload du fichier:', error)
      throw error
    }
  }

  /**
   * Teste avec fichier upload\u00e9
   */
  static async testWithFileUpload(
    question: string, 
    fileId: string
  ): Promise<FileUploadTestResult> {
    const startTime = Date.now()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: `Tu es Raoul, agent responsable du service client Oris Finance.
        
INSTRUCTIONS :
- Utilise EXCLUSIVEMENT les informations contenues dans le fichier fourni
- R\u00e9ponds de mani\u00e8re pr\u00e9cise et factuelle
- Si l'information n'est pas dans le fichier, dis-le clairement`,
        
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: question
            },
            {
              type: "document",
              source: {
                type: "file",
                file_id: fileId
              }
            }
          ]
        }]
      })

      const responseTime = Date.now() - startTime
      
      const responseText = message.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("")

      return {
        method: 'file-upload',
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        fileId
      }
    } catch (error: any) {
      console.error("Erreur lors du test avec fichier upload\u00e9:", error)
      
      return {
        method: 'file-upload',
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        fileId,
        error: error.message
      }
    }
  }

  /**
   * Teste avec prompt syst\u00e8me (contenu du fichier dans le prompt)
   */
  static async testWithSystemPrompt(
    question: string, 
    fileContent: string
  ): Promise<FileUploadTestResult> {
    const startTime = Date.now()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: `Tu es Raoul, agent responsable du service client Oris Finance.

INFORMATIONS ORIS FINANCE :
${fileContent}

INSTRUCTIONS :
- Utilise EXCLUSIVEMENT les informations ci-dessus
- R\u00e9ponds de mani\u00e8re pr\u00e9cise et factuelle
- Si l'information n'est pas disponible, dis-le clairement`,
        
        messages: [{
          role: "user",
          content: question
        }]
      })

      const responseTime = Date.now() - startTime
      
      const responseText = message.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("")

      return {
        method: 'system-prompt',
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime
      }
    } catch (error: any) {
      console.error("Erreur lors du test avec prompt syst\u00e8me:", error)
      
      return {
        method: 'system-prompt',
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        error: error.message
      }
    }
  }

  /**
   * Calcule le co\u00fbt approximatif en USD pour Claude Haiku
   */
  static calculateCost(tokens: number, type: 'input' | 'output'): number {
    // Prix Claude Haiku (approximatif)
    const HAIKU_INPUT_COST = 0.00025 / 1000   // $0.00025 per 1k input tokens
    const HAIKU_OUTPUT_COST = 0.00125 / 1000  // $0.00125 per 1k output tokens
    
    return type === 'input' 
      ? tokens * HAIKU_INPUT_COST 
      : tokens * HAIKU_OUTPUT_COST
  }

  /**
   * Teste et compare les deux m\u00e9thodes
   */
  static async runComparisonTest(): Promise<{
    results: FileUploadTestResult[]
    comparison: {
      fileUpload: {
        totalTokens: number
        totalCost: number
        avgResponseTime: number
      }
      systemPrompt: {
        totalTokens: number
        totalCost: number
        avgResponseTime: number
      }
      difference: {
        tokensDiff: number
        costDiff: number
        timeDiff: number
        costSavingsPercent: number
      }
    }
  }> {
    const filePath = path.join(__dirname, 'test-file-50k.txt')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    console.log(`\ud83d\udcc4 Contenu du fichier: ${fileContent.length} caract\u00e8res`)
    
    // Upload du fichier
    console.log('\n\ud83d\ude80 PHASE 1: UPLOAD DU FICHIER')
    console.log('='.repeat(50))
    const fileId = await this.uploadFile(filePath)
    
    const testQuestions = [
      "Quels sont les services propos\u00e9s par Oris Finance ?",
      "Quel est le num\u00e9ro de t\u00e9l\u00e9phone d'Oris Finance ?", 
      "Quelles sont les conditions d'\u00e9ligibilit\u00e9 pour un cr\u00e9dit ?",
      "Quels sont les horaires d'ouverture ?",
      "Comment contacter le service client ?"
    ]

    const results: FileUploadTestResult[] = []
    
    console.log('\n\ud83e\uddea PHASE 2: TESTS COMPARATIFS')
    console.log('='.repeat(50))
    
    for (const question of testQuestions) {
      console.log(`\n\u2753 Question: "${question}"`)
      
      // Test avec fichier upload\u00e9
      console.log('   \ud83d\udcc1 Test avec fichier upload\u00e9...')
      const withFile = await this.testWithFileUpload(question, fileId)
      
      // Test avec prompt syst\u00e8me
      console.log('   \ud83d\udcdc Test avec prompt syst\u00e8me...')
      const withPrompt = await this.testWithSystemPrompt(question, fileContent)
      
      results.push(withFile, withPrompt)
      
      // Affichage des r\u00e9sultats interm\u00e9diaires
      if (!withFile.error && !withPrompt.error) {
        console.log(`   \u2699\ufe0f  Tokens (fichier): ${withFile.totalTokens}`)
        console.log(`   \u2699\ufe0f  Tokens (prompt): ${withPrompt.totalTokens}`)
        console.log(`   \ud83d\udcb0 \u00c9conomie tokens: ${withPrompt.totalTokens - withFile.totalTokens}`)
        console.log(`   \u23f1\ufe0f  Temps (fichier): ${withFile.responseTime}ms`)
        console.log(`   \u23f1\ufe0f  Temps (prompt): ${withPrompt.responseTime}ms`)
      }
    }

    // Analyse des r\u00e9sultats
    const fileResults = results.filter(r => r.method === 'file-upload' && !r.error)
    const promptResults = results.filter(r => r.method === 'system-prompt' && !r.error)
    
    const fileUploadStats = {
      totalTokens: fileResults.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: fileResults.reduce((sum, r) => 
        sum + this.calculateCost(r.tokensInput, 'input') + this.calculateCost(r.tokensOutput, 'output'), 0),
      avgResponseTime: fileResults.reduce((sum, r) => sum + r.responseTime, 0) / fileResults.length
    }
    
    const systemPromptStats = {
      totalTokens: promptResults.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: promptResults.reduce((sum, r) => 
        sum + this.calculateCost(r.tokensInput, 'input') + this.calculateCost(r.tokensOutput, 'output'), 0),
      avgResponseTime: promptResults.reduce((sum, r) => sum + r.responseTime, 0) / promptResults.length
    }

    const difference = {
      tokensDiff: systemPromptStats.totalTokens - fileUploadStats.totalTokens,
      costDiff: systemPromptStats.totalCost - fileUploadStats.totalCost,
      timeDiff: systemPromptStats.avgResponseTime - fileUploadStats.avgResponseTime,
      costSavingsPercent: fileUploadStats.totalCost > 0 
        ? ((systemPromptStats.totalCost - fileUploadStats.totalCost) / systemPromptStats.totalCost) * 100
        : 0
    }

    return {
      results,
      comparison: {
        fileUpload: fileUploadStats,
        systemPrompt: systemPromptStats,
        difference
      }
    }
  }
}