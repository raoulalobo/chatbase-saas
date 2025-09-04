/**
 * Test WebSearch avec restriction de domaine - SecureTechCenter
 * Compare les résultats avec domaine restreint vs recherche libre
 * Mesure les coûts, tokens et qualité des réponses avec Claude Haiku 3.5
 */

import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface WebSearchTestResult {
  question: string
  response: string
  tokensInput: number
  tokensOutput: number
  totalTokens: number
  responseTime: number
  cost: number
  restricted: boolean
  foundRelevantInfo: boolean
  error?: string
}

export class SecureTechCenterWebSearchTest {
  
  /**
   * Questions spécifiques à SecureTechCenter (probablement présentes sur leur site)
   */
  static readonly SPECIFIC_QUESTIONS = [
    "Où sont situés les bureaux de SecureTechCenter ?",
    "Quels sont les numéros de téléphone de SecureTechCenter ?", 
    "Quel est le prix des switches chez SecureTechCenter ?",
    "Quels sont les prix des caméras HIKVISION chez SecureTechCenter ?",
    "SecureTechCenter vend-il des antennes Starlink ?"
  ]

  /**
   * Questions générales (probablement absentes du domaine)
   */
  static readonly GENERAL_QUESTIONS = [
    "Quelle est la météo à Paris aujourd'hui ?",
    "Comment faire une pizza margherita ?",
    "Qui a gagné le dernier match de football ?", 
    "Quel est le cours de l'action Tesla ?",
    "Comment réparer un ordinateur qui ne s'allume pas ?"
  ]

  /**
   * Calcule le coût pour Claude Haiku 3.5
   */
  static calculateCost(tokensInput: number, tokensOutput: number): number {
    const HAIKU_INPUT_COST = 0.00025 / 1000   // $0.00025 per 1k input tokens
    const HAIKU_OUTPUT_COST = 0.00125 / 1000  // $0.00125 per 1k output tokens
    
    return (tokensInput * HAIKU_INPUT_COST) + (tokensOutput * HAIKU_OUTPUT_COST)
  }

  /**
   * Évalue si la réponse contient des informations pertinentes
   */
  static evaluateResponseQuality(question: string, response: string): boolean {
    const lowerResponse = response.toLowerCase()
    const lowerQuestion = question.toLowerCase()
    
    // Indicateurs de réponses non pertinentes
    const noInfoIndicators = [
      "je ne peux pas",
      "je ne trouve pas",
      "information non disponible", 
      "pas d'information",
      "ne dispose pas",
      "impossible de trouver",
      "aucune information",
      "données non disponibles"
    ]
    
    // Si contient des indicateurs "pas d'info"
    if (noInfoIndicators.some(indicator => lowerResponse.includes(indicator))) {
      return false
    }
    
    // Si réponse très courte (moins de 50 caractères) = probablement pas pertinente
    if (response.length < 50) {
      return false
    }
    
    // Recherche de mots-clés spécifiques selon la question
    if (lowerQuestion.includes("téléphone") || lowerQuestion.includes("contact")) {
      return lowerResponse.includes("0") || lowerResponse.includes("+") || lowerResponse.includes("tel")
    }
    
    if (lowerQuestion.includes("situé") || lowerQuestion.includes("adresse") || lowerQuestion.includes("bureau")) {
      return lowerResponse.includes("rue") || lowerResponse.includes("avenue") || lowerResponse.includes("boulevard") || 
             lowerResponse.includes("ville") || lowerResponse.includes("adresse")
    }
    
    if (lowerQuestion.includes("prix") || lowerQuestion.includes("coût")) {
      return lowerResponse.includes("€") || lowerResponse.includes("euro") || lowerResponse.includes("prix") ||
             lowerResponse.includes("fcfa") || lowerResponse.includes("dollar") || lowerResponse.includes("$")
    }
    
    // Par défaut, si réponse substantielle = probablement pertinente
    return response.length > 100
  }

  /**
   * Teste avec restriction de domaine
   */
  static async testWithDomainRestriction(question: string): Promise<WebSearchTestResult> {
    const startTime = Date.now()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1000,
        temperature: 0.1, // Température basse pour des réponses plus factuelles
        system: `Tu es un assistant spécialisé dans les informations sur SecureTechCenter.

INSTRUCTIONS STRICTES :
- Utilise UNIQUEMENT les informations trouvées via la recherche web
- Si aucune information n'est trouvée, dis clairement "Je n'ai pas trouvé d'information sur ce sujet"
- Sois factuel et précis
- Ne pas inventer ou supposer d'informations`,
        
        messages: [{
          role: "user",
          content: question,
        }],
        
        // Configuration WebSearch avec restriction de domaine
        tools: [{
          type: "web_search_20250305",
          name: "web_search",
          allowed_domains: ["www.securetechcenter.com"]
        }]
      })

      const responseTime = Date.now() - startTime
      
      const responseText = message.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("")

      const cost = this.calculateCost(message.usage.input_tokens, message.usage.output_tokens)
      const foundRelevantInfo = this.evaluateResponseQuality(question, responseText)

      return {
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        cost,
        restricted: true,
        foundRelevantInfo
      }
    } catch (error: any) {
      console.error("Erreur WebSearch avec restriction:", error)
      
      return {
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        cost: 0,
        restricted: true,
        foundRelevantInfo: false,
        error: error.message
      }
    }
  }

  /**
   * Teste sans restriction de domaine
   */
  static async testWithoutDomainRestriction(question: string): Promise<WebSearchTestResult> {
    const startTime = Date.now()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1000,
        temperature: 0.1,
        system: `Tu es un assistant qui recherche des informations sur le web.

INSTRUCTIONS :
- Utilise la recherche web pour trouver des informations précises
- Sois factuel et cite tes sources quand possible
- Si aucune information pertinente n'est trouvée, dis-le clairement`,
        
        messages: [{
          role: "user",
          content: question,
        }],
        
        // Configuration WebSearch sans restriction
        tools: [{
          type: "web_search_20250305", 
          name: "web_search"
        }]
      })

      const responseTime = Date.now() - startTime
      
      const responseText = message.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("")

      const cost = this.calculateCost(message.usage.input_tokens, message.usage.output_tokens)
      const foundRelevantInfo = this.evaluateResponseQuality(question, responseText)

      return {
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        cost,
        restricted: false,
        foundRelevantInfo
      }
    } catch (error: any) {
      console.error("Erreur WebSearch sans restriction:", error)
      
      return {
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        cost: 0,
        restricted: false,
        foundRelevantInfo: false,
        error: error.message
      }
    }
  }

  /**
   * Lance le test complet et génère le rapport
   */
  static async runCompleteTest(): Promise<{
    results: WebSearchTestResult[]
    analysis: {
      restrictedSearch: {
        totalTests: number
        successfulResponses: number
        totalTokens: number
        totalCost: number
        avgResponseTime: number
        relevantInfoFound: number
      }
      unrestrictedSearch: {
        totalTests: number
        successfulResponses: number
        totalTokens: number
        totalCost: number
        avgResponseTime: number
        relevantInfoFound: number
      }
      comparison: {
        costDifference: number
        tokensDifference: number
        timeDifference: number
        accuracyDifference: number
      }
    }
  }> {
    
    console.log('🔍 DÉBUT DU TEST WEBSEARCH AVEC RESTRICTION DE DOMAINE')
    console.log('='.repeat(70))
    console.log('🎯 Domaine autorisé: www.securetechcenter.com')
    console.log('🤖 Modèle: Claude Haiku 3.5')
    console.log()

    const results: WebSearchTestResult[] = []
    const allQuestions = [...this.SPECIFIC_QUESTIONS, ...this.GENERAL_QUESTIONS]

    console.log('📋 QUESTIONS SPÉCIFIQUES À SECURETECHCENTER:')
    console.log('-'.repeat(50))
    for (const question of this.SPECIFIC_QUESTIONS) {
      console.log(`📝 "${question}"`)
      
      console.log('   🔒 Test avec restriction...')
      const restrictedResult = await this.testWithDomainRestriction(question)
      results.push(restrictedResult)
      
      console.log('   🌐 Test sans restriction...')
      const unrestrictedResult = await this.testWithoutDomainRestriction(question)
      results.push(unrestrictedResult)
      
      // Affichage résultats immédiats
      if (!restrictedResult.error && !unrestrictedResult.error) {
        console.log(`   ✅ Tokens (restreint): ${restrictedResult.totalTokens} | Coût: $${restrictedResult.cost.toFixed(6)}`)
        console.log(`   ✅ Tokens (libre): ${unrestrictedResult.totalTokens} | Coût: $${unrestrictedResult.cost.toFixed(6)}`)
        console.log(`   📊 Info pertinente trouvée: Restreint=${restrictedResult.foundRelevantInfo ? '✅' : '❌'} | Libre=${unrestrictedResult.foundRelevantInfo ? '✅' : '❌'}`)
      }
      console.log()
    }

    console.log('📋 QUESTIONS GÉNÉRALES (hors domaine):')
    console.log('-'.repeat(50))
    for (const question of this.GENERAL_QUESTIONS) {
      console.log(`📝 "${question}"`)
      
      console.log('   🔒 Test avec restriction...')
      const restrictedResult = await this.testWithDomainRestriction(question)
      results.push(restrictedResult)
      
      console.log('   🌐 Test sans restriction...')
      const unrestrictedResult = await this.testWithoutDomainRestriction(question)
      results.push(unrestrictedResult)
      
      // Affichage résultats immédiats
      if (!restrictedResult.error && !unrestrictedResult.error) {
        console.log(`   ✅ Tokens (restreint): ${restrictedResult.totalTokens} | Coût: $${restrictedResult.cost.toFixed(6)}`)
        console.log(`   ✅ Tokens (libre): ${unrestrictedResult.totalTokens} | Coût: $${unrestrictedResult.cost.toFixed(6)}`)
        console.log(`   📊 Info pertinente trouvée: Restreint=${restrictedResult.foundRelevantInfo ? '✅' : '❌'} | Libre=${unrestrictedResult.foundRelevantInfo ? '✅' : '❌'}`)
      }
      console.log()
    }

    // Analyse des résultats
    const restrictedResults = results.filter(r => r.restricted && !r.error)
    const unrestrictedResults = results.filter(r => !r.restricted && !r.error)

    const restrictedAnalysis = {
      totalTests: restrictedResults.length,
      successfulResponses: restrictedResults.filter(r => !r.error).length,
      totalTokens: restrictedResults.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: restrictedResults.reduce((sum, r) => sum + r.cost, 0),
      avgResponseTime: restrictedResults.reduce((sum, r) => sum + r.responseTime, 0) / restrictedResults.length,
      relevantInfoFound: restrictedResults.filter(r => r.foundRelevantInfo).length
    }

    const unrestrictedAnalysis = {
      totalTests: unrestrictedResults.length,
      successfulResponses: unrestrictedResults.filter(r => !r.error).length,
      totalTokens: unrestrictedResults.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: unrestrictedResults.reduce((sum, r) => sum + r.cost, 0),
      avgResponseTime: unrestrictedResults.reduce((sum, r) => sum + r.responseTime, 0) / unrestrictedResults.length,
      relevantInfoFound: unrestrictedResults.filter(r => r.foundRelevantInfo).length
    }

    const comparison = {
      costDifference: unrestrictedAnalysis.totalCost - restrictedAnalysis.totalCost,
      tokensDifference: unrestrictedAnalysis.totalTokens - restrictedAnalysis.totalTokens,
      timeDifference: unrestrictedAnalysis.avgResponseTime - restrictedAnalysis.avgResponseTime,
      accuracyDifference: unrestrictedAnalysis.relevantInfoFound - restrictedAnalysis.relevantInfoFound
    }

    return {
      results,
      analysis: {
        restrictedSearch: restrictedAnalysis,
        unrestrictedSearch: unrestrictedAnalysis,
        comparison
      }
    }
  }
}