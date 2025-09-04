/**
 * Script de test des coûts d'upload de fichier vs prompt système (version corrigée)
 * Compare l'utilisation d'un fichier uploadé de 50k caractères vs prompt système équivalent
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
   * Upload le fichier vers l'API Anthropic Files via HTTP direct
   */
  static async uploadFile(filePath: string): Promise<string> {
    try {
      const fileContent = fs.readFileSync(filePath)
      
      console.log('📁 Upload du fichier:', filePath)
      console.log('📊 Taille:', fileContent.length, 'octets')
      
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
      
      console.log('✅ Fichier uploadé avec succès:', result.id)
      console.log('📋 Nom:', result.filename)
      console.log('🔄 Type MIME:', result.mime_type)
      console.log('📏 Taille:', result.size_bytes, 'octets')
      
      return result.id
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'upload du fichier:', error)
      throw error
    }
  }

  /**
   * Teste avec fichier uploadé - utilisation à déterminer selon la doc
   */
  static async testWithFileUpload(
    question: string, 
    fileId: string
  ): Promise<FileUploadTestResult> {
    const startTime = Date.now()
    
    try {
      // Première tentative : référence du fichier dans le contenu
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: `Tu es Raoul, agent responsable du service client Oris Finance.
        
INSTRUCTIONS :
- Utilise EXCLUSIVEMENT les informations contenues dans le fichier fourni
- Réponds de manière précise et factuelle
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
      console.error("Erreur lors du test avec fichier uploadé:", error)
      
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
   * Teste avec prompt système (contenu du fichier dans le prompt)
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
- Réponds de manière précise et factuelle
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
      console.error("Erreur lors du test avec prompt système:", error)
      
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
   * Calcule le coût approximatif en USD pour Claude Haiku
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
   * Teste et compare les deux méthodes
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
    
    console.log('📄 Contenu du fichier:', fileContent.length, 'caractères')
    
    // Upload du fichier
    console.log('\n🚀 PHASE 1: UPLOAD DU FICHIER')
    console.log('='.repeat(50))
    const fileId = await this.uploadFile(filePath)
    
    const testQuestions = [
      "Quels sont les services proposés par Oris Finance ?",
      "Quel est le numéro de téléphone d'Oris Finance ?", 
      "Quelles sont les conditions d'éligibilité pour un crédit ?",
      "Quels sont les horaires d'ouverture ?",
      "Comment contacter le service client ?"
    ]

    const results: FileUploadTestResult[] = []
    
    console.log('\n🧪 PHASE 2: TESTS COMPARATIFS')
    console.log('='.repeat(50))
    
    for (const question of testQuestions) {
      console.log('\n❓ Question:', `"${question}"`)
      
      // Test avec fichier uploadé
      console.log('   📁 Test avec fichier uploadé...')
      const withFile = await this.testWithFileUpload(question, fileId)
      
      // Test avec prompt système  
      console.log('   📜 Test avec prompt système...')
      const withPrompt = await this.testWithSystemPrompt(question, fileContent)
      
      results.push(withFile, withPrompt)
      
      // Affichage des résultats intermédiaires
      if (!withFile.error && !withPrompt.error) {
        console.log('   ⚙️  Tokens (fichier):', withFile.totalTokens)
        console.log('   ⚙️  Tokens (prompt):', withPrompt.totalTokens)
        console.log('   💰 Économie tokens:', withPrompt.totalTokens - withFile.totalTokens)
        console.log('   ⏱️  Temps (fichier):', withFile.responseTime + 'ms')
        console.log('   ⏱️  Temps (prompt):', withPrompt.responseTime + 'ms')
      }
    }

    // Analyse des résultats
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