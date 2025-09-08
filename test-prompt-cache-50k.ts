/**
 * Script de test d'impact du cache des prompts système (50k caractères)
 * Compare les performances et coûts avec et sans cache_control
 */

import Anthropic from "@anthropic-ai/sdk"
import * as fs from "fs"
import * as path from "path"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface CacheTestResult {
  method: 'without-cache' | 'with-cache' | 'cache-write' | 'cache-read'
  question: string
  response: string
  tokensInput: number
  tokensOutput: number
  totalTokens: number
  responseTime: number
  promptLength: number
  cacheCreationInputTokens?: number
  cacheReadInputTokens?: number
  error?: string
}

export class PromptCacheTestService {
  /**
   * Teste sans cache (méthode standard)
   */
  static async testWithoutCache(question: string, systemPrompt: string): Promise<CacheTestResult> {
    const startTime = Date.now()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
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
        method: 'without-cache',
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        promptLength: systemPrompt.length
      }
    } catch (error: any) {
      console.error("Erreur lors du test sans cache:", error)
      
      return {
        method: 'without-cache',
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        promptLength: systemPrompt.length,
        error: error.message
      }
    }
  }

  /**
   * Teste avec cache (cache_control activé)
   * Différencie cache write (1er appel) et cache read (appels suivants)
   */
  static async testWithCache(
    question: string, 
    systemPrompt: string, 
    isFirstCall: boolean = false
  ): Promise<CacheTestResult> {
    const startTime = Date.now()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" }
          }
        ],
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
        method: isFirstCall ? 'cache-write' : 'cache-read',
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        promptLength: systemPrompt.length,
        cacheCreationInputTokens: message.usage.cache_creation_input_tokens,
        cacheReadInputTokens: message.usage.cache_read_input_tokens
      }
    } catch (error: any) {
      console.error("Erreur lors du test avec cache:", error)
      
      return {
        method: isFirstCall ? 'cache-write' : 'cache-read',
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        promptLength: systemPrompt.length,
        error: error.message
      }
    }
  }

  /**
   * Calcule le coût en USD pour Claude Haiku
   * Prend en compte les tarifs spéciaux du caching
   */
  static calculateCachingCost(result: CacheTestResult): number {
    const HAIKU_INPUT_COST = 0.00025 / 1000   // $0.00025 per 1k input tokens
    const HAIKU_OUTPUT_COST = 0.00125 / 1000  // $0.00125 per 1k output tokens
    
    // Coûts de base
    let inputCost = result.tokensInput * HAIKU_INPUT_COST
    const outputCost = result.tokensOutput * HAIKU_OUTPUT_COST
    
    // Ajustements pour le caching selon la documentation Anthropic
    if (result.cacheCreationInputTokens) {
      // Cache write: +25% sur les tokens mis en cache
      const cacheWriteCost = result.cacheCreationInputTokens * HAIKU_INPUT_COST * 1.25
      inputCost = (result.tokensInput - result.cacheCreationInputTokens) * HAIKU_INPUT_COST + cacheWriteCost
    }
    
    if (result.cacheReadInputTokens) {
      // Cache read: 10% du coût normal sur les tokens lus depuis le cache
      const cacheReadCost = result.cacheReadInputTokens * HAIKU_INPUT_COST * 0.1
      inputCost = (result.tokensInput - result.cacheReadInputTokens) * HAIKU_INPUT_COST + cacheReadCost
    }
    
    return inputCost + outputCost
  }

  /**
   * Estime le nombre de tokens d'un texte
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.5)
  }

  /**
   * Lance le test comparatif complet avec prompts 50k
   */
  static async runCacheImpactTest(): Promise<{
    results: CacheTestResult[]
    analysis: {
      withoutCache: {
        totalCalls: number
        totalTokens: number
        totalCost: number
        avgResponseTime: number
        avgTokensPerCall: number
      }
      withCache: {
        totalCalls: number
        totalTokens: number
        totalCost: number
        avgResponseTime: number
        avgTokensPerCall: number
        cacheWriteCalls: number
        cacheReadCalls: number
        totalCacheCreationTokens: number
        totalCacheReadTokens: number
      }
      savings: {
        tokensSaved: number
        costSaved: number
        timeSaved: number
        percentageCostSaved: number
        percentageTokensSaved: number
        roiAfterCalls: number
      }
    }
  }> {
    // Charger le fichier 50k
    const filePath = path.join(__dirname, 'test-file-50k.txt')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    const systemPrompt = `Tu es Raoul, agent responsable du service client Oris Finance.

INFORMATIONS COMPLÈTES ORIS FINANCE :
${fileContent}

INSTRUCTIONS :
- Utilise EXCLUSIVEMENT les informations ci-dessus
- Réponds de manière précise et factuelle
- Si l'information n'est pas disponible, dis-le clairement
- Reste dans ton rôle d'agent service client Oris Finance`

    console.log(`📄 Prompt système créé: ${systemPrompt.length} caractères (${this.estimateTokens(systemPrompt)} tokens estimés)`)
    
    const testQuestions = [
      "Quels sont les services proposés par Oris Finance ?",
      "Quel est le numéro de téléphone d'Oris Finance ?", 
      "Quelles sont les conditions d'éligibilité pour un crédit ?",
      "Quels sont les horaires d'ouverture ?",
      "Comment contacter le service client ?"
    ]

    const results: CacheTestResult[] = []
    
    console.log('\n🧪 TESTS COMPARATIFS : CACHE vs SANS CACHE (PROMPT 50K)')
    console.log('='.repeat(65))
    
    // Phase 1: Tests sans cache (5 appels)
    console.log('\n📊 PHASE 1: Tests sans cache (5 appels)')
    console.log('-'.repeat(40))
    
    for (const question of testQuestions) {
      console.log(`\n❓ Question: "${question}"`)
      console.log('   📝 Test sans cache...')
      
      const withoutCacheResult = await this.testWithoutCache(question, systemPrompt)
      results.push(withoutCacheResult)
      
      if (!withoutCacheResult.error) {
        console.log(`   ⚙️  Tokens: ${withoutCacheResult.totalTokens}`)
        console.log(`   💰 Coût: $${this.calculateCachingCost(withoutCacheResult).toFixed(6)}`)
        console.log(`   ⏱️  Temps: ${withoutCacheResult.responseTime}ms`)
      }
      
      // Pause entre appels pour éviter rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Phase 2: Tests avec cache (5 appels)
    console.log('\n\n📊 PHASE 2: Tests avec cache (5 appels)')
    console.log('-'.repeat(40))
    
    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i]
      const isFirstCall = i === 0
      
      console.log(`\n❓ Question: "${question}"`)
      console.log(`   📝 Test avec cache (${isFirstCall ? 'CACHE WRITE' : 'CACHE READ'})...`)
      
      const withCacheResult = await this.testWithCache(question, systemPrompt, isFirstCall)
      results.push(withCacheResult)
      
      if (!withCacheResult.error) {
        console.log(`   ⚙️  Tokens: ${withCacheResult.totalTokens}`)
        console.log(`   💰 Coût: $${this.calculateCachingCost(withCacheResult).toFixed(6)}`)
        console.log(`   ⏱️  Temps: ${withCacheResult.responseTime}ms`)
        
        if (withCacheResult.cacheCreationInputTokens) {
          console.log(`   🔄 Cache création: ${withCacheResult.cacheCreationInputTokens} tokens`)
        }
        if (withCacheResult.cacheReadInputTokens) {
          console.log(`   📖 Cache lecture: ${withCacheResult.cacheReadInputTokens} tokens`)
        }
      }
      
      // Pause entre appels
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Analyse des résultats
    const withoutCacheResults = results.filter(r => r.method === 'without-cache' && !r.error)
    const withCacheResults = results.filter(r => (r.method === 'cache-write' || r.method === 'cache-read') && !r.error)
    
    const withoutCacheStats = {
      totalCalls: withoutCacheResults.length,
      totalTokens: withoutCacheResults.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: withoutCacheResults.reduce((sum, r) => sum + this.calculateCachingCost(r), 0),
      avgResponseTime: withoutCacheResults.reduce((sum, r) => sum + r.responseTime, 0) / withoutCacheResults.length,
      avgTokensPerCall: withoutCacheResults.reduce((sum, r) => sum + r.totalTokens, 0) / withoutCacheResults.length
    }
    
    const withCacheStats = {
      totalCalls: withCacheResults.length,
      totalTokens: withCacheResults.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: withCacheResults.reduce((sum, r) => sum + this.calculateCachingCost(r), 0),
      avgResponseTime: withCacheResults.reduce((sum, r) => sum + r.responseTime, 0) / withCacheResults.length,
      avgTokensPerCall: withCacheResults.reduce((sum, r) => sum + r.totalTokens, 0) / withCacheResults.length,
      cacheWriteCalls: withCacheResults.filter(r => r.method === 'cache-write').length,
      cacheReadCalls: withCacheResults.filter(r => r.method === 'cache-read').length,
      totalCacheCreationTokens: withCacheResults.reduce((sum, r) => sum + (r.cacheCreationInputTokens || 0), 0),
      totalCacheReadTokens: withCacheResults.reduce((sum, r) => sum + (r.cacheReadInputTokens || 0), 0)
    }

    const savings = {
      tokensSaved: withoutCacheStats.totalTokens - withCacheStats.totalTokens,
      costSaved: withoutCacheStats.totalCost - withCacheStats.totalCost,
      timeSaved: withoutCacheStats.avgResponseTime - withCacheStats.avgResponseTime,
      percentageCostSaved: ((withoutCacheStats.totalCost - withCacheStats.totalCost) / withoutCacheStats.totalCost) * 100,
      percentageTokensSaved: ((withoutCacheStats.totalTokens - withCacheStats.totalTokens) / withoutCacheStats.totalTokens) * 100,
      roiAfterCalls: withCacheStats.cacheReadCalls // Le ROI est positif après X appels avec cache read
    }

    return {
      results,
      analysis: {
        withoutCache: withoutCacheStats,
        withCache: withCacheStats,
        savings
      }
    }
  }

  /**
   * Affiche le rapport détaillé des économies
   */
  static displayAnalysisReport(analysis: any): void {
    console.log('\n\n📈 RAPPORT D\'ANALYSE DES ÉCONOMIES')
    console.log('='.repeat(50))
    
    console.log('\n🚫 SANS CACHE:')
    console.log(`   Appels: ${analysis.withoutCache.totalCalls}`)
    console.log(`   Tokens total: ${analysis.withoutCache.totalTokens.toLocaleString()}`)
    console.log(`   Coût total: $${analysis.withoutCache.totalCost.toFixed(6)}`)
    console.log(`   Temps moyen: ${Math.round(analysis.withoutCache.avgResponseTime)}ms`)
    console.log(`   Tokens/appel: ${Math.round(analysis.withoutCache.avgTokensPerCall)}`)
    
    console.log('\n✅ AVEC CACHE:')
    console.log(`   Appels: ${analysis.withCache.totalCalls}`)
    console.log(`   Tokens total: ${analysis.withCache.totalTokens.toLocaleString()}`)
    console.log(`   Coût total: $${analysis.withCache.totalCost.toFixed(6)}`)
    console.log(`   Temps moyen: ${Math.round(analysis.withCache.avgResponseTime)}ms`)
    console.log(`   Tokens/appel: ${Math.round(analysis.withCache.avgTokensPerCall)}`)
    console.log(`   Cache writes: ${analysis.withCache.cacheWriteCalls}`)
    console.log(`   Cache reads: ${analysis.withCache.cacheReadCalls}`)
    console.log(`   Tokens création cache: ${analysis.withCache.totalCacheCreationTokens.toLocaleString()}`)
    console.log(`   Tokens lecture cache: ${analysis.withCache.totalCacheReadTokens.toLocaleString()}`)
    
    console.log('\n💰 ÉCONOMIES RÉALISÉES:')
    console.log(`   Tokens économisés: ${analysis.savings.tokensSaved.toLocaleString()} (${analysis.savings.percentageTokensSaved.toFixed(1)}%)`)
    console.log(`   Coût économisé: $${analysis.savings.costSaved.toFixed(6)} (${analysis.savings.percentageCostSaved.toFixed(1)}%)`)
    console.log(`   Temps économisé: ${Math.round(analysis.savings.timeSaved)}ms`)
    console.log(`   ROI positif après: ${analysis.savings.roiAfterCalls} appels avec cache`)
    
    // Projections
    const costPer1000Calls = {
      withoutCache: (analysis.withoutCache.totalCost / analysis.withoutCache.totalCalls) * 1000,
      withCache: (analysis.withCache.totalCost / analysis.withCache.totalCalls) * 1000
    }
    
    console.log('\n🚀 PROJECTIONS (1000 appels):')
    console.log(`   Sans cache: $${costPer1000Calls.withoutCache.toFixed(2)}`)
    console.log(`   Avec cache: $${costPer1000Calls.withCache.toFixed(2)}`)
    console.log(`   Économie: $${(costPer1000Calls.withoutCache - costPer1000Calls.withCache).toFixed(2)}`)
  }
}

// Exécution du test si le script est lancé directement
if (require.main === module) {
  PromptCacheTestService.runCacheImpactTest()
    .then((results) => {
      PromptCacheTestService.displayAnalysisReport(results.analysis)
      
      // Sauvegarde des résultats
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `cache-test-results-${timestamp}.json`
      fs.writeFileSync(filename, JSON.stringify(results, null, 2))
      console.log(`\n💾 Résultats sauvegardés dans: ${filename}`)
    })
    .catch(console.error)
}