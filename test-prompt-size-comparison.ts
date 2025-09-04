/**
 * Script de test de comparaison : prompt court vs prompt long (50k caract\u00e8res)
 * Analyse l'impact de la taille du prompt syst\u00e8me sur les co\u00fbts et performances
 */

import Anthropic from "@anthropic-ai/sdk"
import * as fs from "fs"
import * as path from "path"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface PromptTestResult {
  method: 'short-prompt' | 'long-prompt'
  question: string
  response: string
  tokensInput: number
  tokensOutput: number
  totalTokens: number
  responseTime: number
  promptLength: number
  error?: string
}

export class PromptSizeTestService {
  /**
   * Teste avec prompt court (instructions basiques)
   */
  static async testWithShortPrompt(question: string): Promise<PromptTestResult> {
    const shortPrompt = `Tu es Raoul, agent responsable du service client Oris Finance.
    
R\u00e9ponds de mani\u00e8re professionnelle et factuelle aux questions sur nos services financiers.`

    const startTime = Date.now()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: shortPrompt,
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
        method: 'short-prompt',
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        promptLength: shortPrompt.length
      }
    } catch (error: any) {
      console.error("Erreur lors du test avec prompt court:", error)
      
      return {
        method: 'short-prompt',
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        promptLength: shortPrompt.length,
        error: error.message
      }
    }
  }

  /**
   * Teste avec prompt long (50k caract\u00e8res du fichier)
   */
  static async testWithLongPrompt(question: string, fileContent: string): Promise<PromptTestResult> {
    const longPrompt = `Tu es Raoul, agent responsable du service client Oris Finance.

INFORMATIONS COMPL\u00c8TES ORIS FINANCE :
${fileContent}

INSTRUCTIONS :
- Utilise EXCLUSIVEMENT les informations ci-dessus
- R\u00e9ponds de mani\u00e8re pr\u00e9cise et factuelle
- Si l'information n'est pas disponible, dis-le clairement
- Reste dans ton r\u00f4le d'agent service client Oris Finance`

    const startTime = Date.now()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: longPrompt,
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
        method: 'long-prompt',
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        promptLength: longPrompt.length
      }
    } catch (error: any) {
      console.error("Erreur lors du test avec prompt long:", error)
      
      return {
        method: 'long-prompt',
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        promptLength: longPrompt.length,
        error: error.message
      }
    }
  }

  /**
   * Calcule le co\u00fbt approximatif en USD pour Claude Haiku
   */
  static calculateCost(tokens: number, type: 'input' | 'output'): number {
    const HAIKU_INPUT_COST = 0.00025 / 1000   // $0.00025 per 1k input tokens
    const HAIKU_OUTPUT_COST = 0.00125 / 1000  // $0.00125 per 1k output tokens
    
    return type === 'input' 
      ? tokens * HAIKU_INPUT_COST 
      : tokens * HAIKU_OUTPUT_COST
  }

  /**
   * Estime le nombre de tokens approximatif d'un texte
   */
  static estimateTokens(text: string): number {
    // Approximation: 1 token \u2248 0.75 mots en anglais, ~4 caract\u00e8res en fran\u00e7ais
    return Math.ceil(text.length / 3.5)
  }

  /**
   * Lance le test comparatif complet
   */
  static async runSizeComparisonTest(): Promise<{
    results: PromptTestResult[]
    comparison: {
      shortPrompt: {
        totalTokens: number
        totalCost: number
        avgResponseTime: number
        avgPromptLength: number
        estimatedPromptTokens: number
      }
      longPrompt: {
        totalTokens: number
        totalCost: number
        avgResponseTime: number
        avgPromptLength: number
        estimatedPromptTokens: number
      }
      difference: {
        tokensDiff: number
        costDiff: number
        timeDiff: number
        promptSizeImpact: number
      }
    }
  }> {
    const filePath = path.join(__dirname, 'test-file-50k.txt')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    console.log(`\ud83d\udcc4 Fichier lu: ${fileContent.length} caract\u00e8res (${this.estimateTokens(fileContent)} tokens estim\u00e9s)`)
    
    const testQuestions = [
      "Quels sont les services propos\u00e9s par Oris Finance ?",
      "Quel est le num\u00e9ro de t\u00e9l\u00e9phone d'Oris Finance ?", 
      "Quelles sont les conditions d'\u00e9ligibilit\u00e9 pour un cr\u00e9dit ?",
      "Quels sont les horaires d'ouverture ?",
      "Comment contacter le service client ?"
    ]

    const results: PromptTestResult[] = []
    
    console.log('\n\ud83e\uddea TESTS COMPARATIFS PROMPT COURT vs PROMPT LONG')
    console.log('='.repeat(60))
    
    for (const question of testQuestions) {
      console.log(`\n\u2753 Question: "${question}"`)
      
      // Test avec prompt court
      console.log('   \ud83d\udcdc Test avec prompt court...')
      const withShort = await this.testWithShortPrompt(question)
      
      // Test avec prompt long
      console.log('   \ud83d\udcdc Test avec prompt long (50k)...')
      const withLong = await this.testWithLongPrompt(question, fileContent)
      
      results.push(withShort, withLong)
      
      // Affichage des r\u00e9sultats interm\u00e9diaires
      if (!withShort.error && !withLong.error) {
        console.log(`   \u2699\ufe0f  Tokens (court): ${withShort.totalTokens}`)
        console.log(`   \u2699\ufe0f  Tokens (long): ${withLong.totalTokens}`)
        console.log(`   \ud83d\udcb8 Surco\u00fbt: ${withLong.totalTokens - withShort.totalTokens} tokens`)
        console.log(`   \u23f1\ufe0f  Temps (court): ${withShort.responseTime}ms`)
        console.log(`   \u23f1\ufe0f  Temps (long): ${withLong.responseTime}ms`)
      }
    }

    // Analyse des r\u00e9sultats
    const shortResults = results.filter(r => r.method === 'short-prompt' && !r.error)
    const longResults = results.filter(r => r.method === 'long-prompt' && !r.error)
    
    const shortPromptStats = {
      totalTokens: shortResults.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: shortResults.reduce((sum, r) => 
        sum + this.calculateCost(r.tokensInput, 'input') + this.calculateCost(r.tokensOutput, 'output'), 0),
      avgResponseTime: shortResults.reduce((sum, r) => sum + r.responseTime, 0) / shortResults.length,
      avgPromptLength: shortResults.reduce((sum, r) => sum + r.promptLength, 0) / shortResults.length,
      estimatedPromptTokens: this.estimateTokens(shortResults[0]?.promptLength.toString() || "")
    }
    
    const longPromptStats = {
      totalTokens: longResults.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: longResults.reduce((sum, r) => 
        sum + this.calculateCost(r.tokensInput, 'input') + this.calculateCost(r.tokensOutput, 'output'), 0),
      avgResponseTime: longResults.reduce((sum, r) => sum + r.responseTime, 0) / longResults.length,
      avgPromptLength: longResults.reduce((sum, r) => sum + r.promptLength, 0) / longResults.length,
      estimatedPromptTokens: this.estimateTokens(fileContent)
    }

    const difference = {
      tokensDiff: longPromptStats.totalTokens - shortPromptStats.totalTokens,
      costDiff: longPromptStats.totalCost - shortPromptStats.totalCost,
      timeDiff: longPromptStats.avgResponseTime - shortPromptStats.avgResponseTime,
      promptSizeImpact: longPromptStats.estimatedPromptTokens - shortPromptStats.estimatedPromptTokens
    }

    return {
      results,
      comparison: {
        shortPrompt: shortPromptStats,
        longPrompt: longPromptStats,
        difference
      }
    }
  }
}