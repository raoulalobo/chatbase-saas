/**
 * Test WebSearch avec Prompts Système Ultra-Contraignants
 * Objectif: Tester l'efficacité des instructions strictes pour contraindre WebSearch
 * à un domaine spécifique sans utiliser de paramètres techniques (allowed_domains)
 */

import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface StrictPromptTestResult {
  promptVariant: string
  question: string
  response: string
  tokensInput: number
  tokensOutput: number
  totalTokens: number
  responseTime: number
  cost: number
  respectsConstraint: boolean
  mentionsOtherSources: boolean
  foundRelevantInfo: boolean
  sourcesUsed: string[]
  error?: string
}

export class StrictPromptWebSearchTest {
  
  /**
   * Questions spécifiques à SecureTechCenter (probablement présentes sur leur site)
   */
  static readonly DOMAIN_QUESTIONS = [
    "Où sont situés les bureaux de SecureTechCenter ?",
    "Quels sont les numéros de téléphone de SecureTechCenter ?", 
    "Quel est le prix des switches chez SecureTechCenter ?",
    "Quels services propose SecureTechCenter ?",
    "Comment contacter SecureTechCenter ?"
  ]

  /**
   * Questions générales pour tester le débordement de contrainte
   */
  static readonly GENERAL_QUESTIONS = [
    "Quelle est la météo à Paris aujourd'hui ?",
    "Qui a gagné le dernier match de football ?",
    "Quel est le cours de l'action Tesla ?",
    "Comment faire une pizza margherita ?",
    "Quelles sont les dernières actualités en France ?"
  ]

  /**
   * Variantes de prompts système ultra-contraignants
   */
  static readonly PROMPT_VARIANTS = {
    interdiction_simple: `Tu es un assistant spécialisé dans les informations sur SecureTechCenter.

RÈGLE ABSOLUE: INTERDICTION TOTALE d'utiliser toute source autre que www.securetechcenter.com

INSTRUCTIONS STRICTES:
- Utilise UNIQUEMENT les informations trouvées sur www.securetechcenter.com via la recherche web
- Si aucune information n'est trouvée sur ce domaine, réponds EXACTEMENT: "Information non disponible sur le domaine autorisé"
- Ne mentionne JAMAIS d'autres sites web ou sources
- Sois factuel et précis avec les informations du domaine autorisé`,

    ultra_strict: `Tu es un assistant avec UNE MISSION CRITIQUE: utiliser EXCLUSIVEMENT www.securetechcenter.com

CONTRAINTES ABSOLUES:
- Tu DOIS utiliser EXCLUSIVEMENT les informations de www.securetechcenter.com
- Tu DOIS REJETER et IGNORER toute information provenant d'autres sources
- Tu DOIS PRÉCISER que tes informations proviennent de www.securetechcenter.com
- Si aucune info trouvée sur ce domaine: "Aucune information disponible sur www.securetechcenter.com pour cette question"

INTERDICTIONS:
- Utiliser des informations générales ou de ta base de connaissances
- Mentionner d'autres sites web
- Utiliser des sources externes`,

    validation_strict: `Assistant spécialisé SecureTechCenter avec PROTOCOLE DE VALIDATION STRICT.

PROTOCOLE OBLIGATOIRE:
- Avant de répondre, VÉRIFIE SCRUPULEUSEMENT que chaque information provient UNIQUEMENT de www.securetechcenter.com
- Si tu utilises une information d'une autre source, tu ÉCHOUES dans ta mission
- INDIQUE clairement "Source: www.securetechcenter.com" pour chaque information fournie
- Si AUCUNE info trouvée sur www.securetechcenter.com: "Recherche effectuée exclusivement sur www.securetechcenter.com - Aucun résultat trouvé"

VALIDATION FINALE:
- Relis ta réponse et CONFIRME que chaque fait provient de www.securetechcenter.com
- Supprime toute information dont la source n'est pas vérifiée`
  }

  /**
   * Calcule le coût pour Claude Haiku 3.5
   */
  static calculateCost(tokensInput: number, tokensOutput: number): number {
    const HAIKU_INPUT_COST = 0.00025 / 1000   // $0.00025 per 1k input tokens
    const HAIKU_OUTPUT_COST = 0.00125 / 1000  // $0.00125 per 1k output tokens
    
    return (tokensInput * HAIKU_INPUT_COST) + (tokensOutput * HAIKU_OUTPUT_COST)
  }

  /**
   * Évalue si la réponse respecte la contrainte de domaine
   */
  static evaluateConstraintRespect(response: string): {
    respectsConstraint: boolean
    mentionsOtherSources: boolean
    sourcesUsed: string[]
  } {
    const lowerResponse = response.toLowerCase()
    
    // Indicateurs de sources externes
    const externalSources = [
      'google', 'wikipedia', 'bing', 'yahoo', 'duckduckgo',
      'lemonde.fr', 'figaro.fr', 'bbc.com', 'cnn.com',
      'selon des sources', 'selon les informations',
      'des recherches montrent', 'd\'après les données',
      'source:', 'sources:', 'référence:', 'site web'
    ]
    
    // Détection de mentions de sources externes
    const mentionsOtherSources = externalSources.some(source => 
      lowerResponse.includes(source) && !lowerResponse.includes('securetechcenter.com')
    )
    
    // Extraction des sources mentionnées
    const sourcesUsed: string[] = []
    const urlRegex = /https?:\/\/[^\s]+/g
    const matches = response.match(urlRegex)
    if (matches) {
      sourcesUsed.push(...matches)
    }
    
    // Respect de la contrainte: pas de sources externes ET mention du domaine autorisé ou info non disponible
    const mentionsAuthorizedDomain = lowerResponse.includes('securetechcenter.com')
    const saysInfoNotAvailable = lowerResponse.includes('non disponible') || 
                                 lowerResponse.includes('aucune information') ||
                                 lowerResponse.includes('aucun résultat')
    
    const respectsConstraint = !mentionsOtherSources && (mentionsAuthorizedDomain || saysInfoNotAvailable)
    
    return {
      respectsConstraint,
      mentionsOtherSources,
      sourcesUsed
    }
  }

  /**
   * Évalue si la réponse contient des informations pertinentes
   */
  static evaluateResponseRelevance(question: string, response: string): boolean {
    const lowerResponse = response.toLowerCase()
    const lowerQuestion = question.toLowerCase()
    
    // Indicateurs de réponses non pertinentes
    const noInfoIndicators = [
      "information non disponible",
      "aucune information",
      "aucun résultat",
      "ne trouve pas",
      "pas d'information",
      "données non disponibles"
    ]
    
    // Si contient des indicateurs "pas d'info"
    if (noInfoIndicators.some(indicator => lowerResponse.includes(indicator))) {
      return false
    }
    
    // Si réponse très courte = probablement pas pertinente
    if (response.length < 50) {
      return false
    }
    
    // Recherche de contenus spécifiques selon la question
    if (lowerQuestion.includes("téléphone") || lowerQuestion.includes("contact")) {
      return lowerResponse.includes("0") || lowerResponse.includes("+") || lowerResponse.includes("tel")
    }
    
    if (lowerQuestion.includes("situé") || lowerQuestion.includes("bureaux") || lowerQuestion.includes("adresse")) {
      return lowerResponse.includes("adresse") || lowerResponse.includes("rue") || 
             lowerResponse.includes("ville") || lowerResponse.includes("bureau")
    }
    
    if (lowerQuestion.includes("prix") || lowerResponse.includes("switch")) {
      return lowerResponse.includes("€") || lowerResponse.includes("euro") || 
             lowerResponse.includes("prix") || lowerResponse.includes("fcfa")
    }
    
    // Par défaut, si réponse substantielle = pertinente
    return response.length > 100
  }

  /**
   * Teste une variante de prompt avec une question
   */
  static async testPromptVariant(
    promptKey: keyof typeof StrictPromptWebSearchTest.PROMPT_VARIANTS, 
    question: string
  ): Promise<StrictPromptTestResult> {
    const startTime = Date.now()
    const promptVariant = this.PROMPT_VARIANTS[promptKey]
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1000,
        temperature: 0.1,
        system: promptVariant,
        
        messages: [{
          role: "user",
          content: question,
        }],
        
        // WebSearch normal (sans paramètres de restriction)
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
      const constraintAnalysis = this.evaluateConstraintRespect(responseText)
      const foundRelevantInfo = this.evaluateResponseRelevance(question, responseText)

      return {
        promptVariant: promptKey,
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        cost,
        respectsConstraint: constraintAnalysis.respectsConstraint,
        mentionsOtherSources: constraintAnalysis.mentionsOtherSources,
        sourcesUsed: constraintAnalysis.sourcesUsed,
        foundRelevantInfo
      }
    } catch (error: any) {
      console.error(`Erreur test prompt ${promptKey}:`, error)
      
      return {
        promptVariant: promptKey,
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        cost: 0,
        respectsConstraint: false,
        mentionsOtherSources: false,
        sourcesUsed: [],
        foundRelevantInfo: false,
        error: error.message
      }
    }
  }

  /**
   * Lance le test complet de toutes les variantes de prompts
   */
  static async runCompleteTest(): Promise<{
    results: StrictPromptTestResult[]
    analysis: {
      byPromptVariant: Record<string, {
        totalTests: number
        successfulResponses: number
        constraintRespectRate: number
        relevantInfoRate: number
        avgTokens: number
        avgCost: number
        avgResponseTime: number
        externalSourcesDetected: number
      }>
      overall: {
        totalTests: number
        totalCost: number
        bestPromptForConstraint: string
        bestPromptForRelevance: string
        mostEfficient: string
      }
    }
  }> {
    
    console.log('🔍 DÉBUT DU TEST WEBSEARCH AVEC PROMPTS ULTRA-CONTRAIGNANTS')
    console.log('='.repeat(70))
    console.log('🎯 Domaine cible: www.securetechcenter.com')
    console.log('🤖 Modèle: Claude Haiku 3.5')
    console.log('📝 Prompts testés: 3 variantes')
    console.log()

    const results: StrictPromptTestResult[] = []
    const allQuestions = [...this.DOMAIN_QUESTIONS, ...this.GENERAL_QUESTIONS]
    const promptKeys = Object.keys(this.PROMPT_VARIANTS) as Array<keyof typeof this.PROMPT_VARIANTS>

    for (const promptKey of promptKeys) {
      console.log(`\n📋 TEST VARIANTE: ${promptKey.toUpperCase().replace('_', ' ')}`)
      console.log('-'.repeat(50))
      
      for (const question of allQuestions) {
        console.log(`📝 "${question}"`)
        
        const result = await this.testPromptVariant(promptKey, question)
        results.push(result)
        
        if (!result.error) {
          console.log(`   ✅ Tokens: ${result.totalTokens} | Coût: $${result.cost.toFixed(6)}`)
          console.log(`   🎯 Contrainte respectée: ${result.respectsConstraint ? '✅' : '❌'}`)
          console.log(`   📊 Info pertinente: ${result.foundRelevantInfo ? '✅' : '❌'}`)
          console.log(`   🔍 Sources externes: ${result.mentionsOtherSources ? '⚠️ Oui' : '✅ Non'}`)
          if (result.sourcesUsed.length > 0) {
            console.log(`   📎 Sources: ${result.sourcesUsed.join(', ')}`)
          }
        } else {
          console.log(`   ❌ Erreur: ${result.error}`)
        }
        console.log()
      }
    }

    // Analyse des résultats
    const analysis = this.analyzeResults(results)
    
    return { results, analysis }
  }

  /**
   * Analyse les résultats des tests
   */
  static analyzeResults(results: StrictPromptTestResult[]) {
    const byPromptVariant: Record<string, any> = {}
    const promptKeys = Object.keys(this.PROMPT_VARIANTS)
    
    // Analyse par variante de prompt
    for (const promptKey of promptKeys) {
      const promptResults = results.filter(r => r.promptVariant === promptKey && !r.error)
      
      byPromptVariant[promptKey] = {
        totalTests: promptResults.length,
        successfulResponses: promptResults.length,
        constraintRespectRate: promptResults.filter(r => r.respectsConstraint).length / promptResults.length,
        relevantInfoRate: promptResults.filter(r => r.foundRelevantInfo).length / promptResults.length,
        avgTokens: promptResults.reduce((sum, r) => sum + r.totalTokens, 0) / promptResults.length,
        avgCost: promptResults.reduce((sum, r) => sum + r.cost, 0) / promptResults.length,
        avgResponseTime: promptResults.reduce((sum, r) => sum + r.responseTime, 0) / promptResults.length,
        externalSourcesDetected: promptResults.filter(r => r.mentionsOtherSources).length
      }
    }
    
    // Analyse globale
    const successfulResults = results.filter(r => !r.error)
    const totalCost = successfulResults.reduce((sum, r) => sum + r.cost, 0)
    
    // Meilleur prompt pour respect de contrainte
    const bestPromptForConstraint = Object.entries(byPromptVariant)
      .sort(([,a], [,b]) => b.constraintRespectRate - a.constraintRespectRate)[0]?.[0] || ''
    
    // Meilleur prompt pour pertinence
    const bestPromptForRelevance = Object.entries(byPromptVariant)
      .sort(([,a], [,b]) => b.relevantInfoRate - a.relevantInfoRate)[0]?.[0] || ''
    
    // Plus efficace (ratio pertinence/coût)
    const mostEfficient = Object.entries(byPromptVariant)
      .sort(([,a], [,b]) => (b.relevantInfoRate / b.avgCost) - (a.relevantInfoRate / a.avgCost))[0]?.[0] || ''
    
    return {
      byPromptVariant,
      overall: {
        totalTests: successfulResults.length,
        totalCost,
        bestPromptForConstraint,
        bestPromptForRelevance,
        mostEfficient
      }
    }
  }
}