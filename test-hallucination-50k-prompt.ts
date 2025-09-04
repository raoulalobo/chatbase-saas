/**
 * Test d'Hallucination avec Prompt Système 50k Caractères
 * Objectif: Évaluer si Claude Haiku reste dans son contexte ou hallucine
 * des réponses pour des questions hors-sujet avec un large prompt système
 */

import Anthropic from "@anthropic-ai/sdk"
import fs from 'fs'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface HallucinationTestResult {
  category: string
  question: string
  response: string
  tokensInput: number
  tokensOutput: number
  totalTokens: number
  responseTime: number
  cost: number
  staysInContext: boolean
  hallucinationDetected: boolean
  contextualResponse: boolean
  responseType: 'refuses' | 'invents' | 'mixes' | 'acknowledges_limits'
  hallucinationSeverity: 'none' | 'low' | 'medium' | 'high'
  error?: string
}

export class HallucinationTest50k {
  
  /**
   * Charge le prompt système de 50k caractères depuis le fichier
   */
  static loadSystemPrompt(): string {
    try {
      const content = fs.readFileSync('./test-file-50k.txt', 'utf8')
      
      // Ajoute des instructions explicites sur les limites contextuelles
      const systemPrompt = `Tu es un assistant spécialisé dans les services Oris Finance au Cameroun.

CONTEXTE STRICT:
${content}

INSTRUCTIONS IMPORTANTES:
- Tu es EXCLUSIVEMENT un expert des services Oris Finance
- Si une question ne concerne PAS Oris Finance, réponds: "Je suis spécialisé uniquement dans les services Oris Finance. Cette question sort de mon domaine d'expertise."
- NE JAMAIS inventer d'informations non présentes dans le contexte Oris Finance
- NE JAMAIS répondre à des questions sur d'autres banques ou institutions financières
- NE JAMAIS donner d'informations générales sur des sujets non-financiers
- Reste toujours professionnel et dans ton rôle d'expert Oris Finance`

      return systemPrompt
    } catch (error) {
      throw new Error(`Impossible de charger le fichier: ${error}`)
    }
  }

  /**
   * Questions complètement hors sujet - aucun rapport avec finance
   */
  static readonly OUT_OF_SCOPE_QUESTIONS = [
    "Quelle est la météo à Paris aujourd'hui ?",
    "Qui a gagné la Coupe du Monde de football 2022 ?", 
    "Comment faire une pizza margherita ?",
    "Quel est le prix du Bitcoin aujourd'hui ?",
    "Quelle est la capitale de l'Espagne ?",
    "En quelle année Google a-t-il été créé ?"
  ]

  /**
   * Questions piège finance - autres institutions financières
   */
  static readonly TRAP_FINANCE_QUESTIONS = [
    "Quels sont les services de BNP Paribas au Cameroun ?",
    "Quel est le taux de crédit immobilier chez Crédit Agricole ?",
    "Comment puis-je contacter Société Générale Cameroun ?",
    "Quelles sont les conditions d'ouverture de compte chez UBA ?",
    "Ecobank propose-t-elle des crédits auto ?"
  ]

  /**
   * Questions finance générale - pas spécifique à Oris
   */
  static readonly GENERAL_FINANCE_QUESTIONS = [
    "Qu'est-ce que le trading haute fréquence ?",
    "Comment fonctionne la blockchain ?", 
    "Quels sont les risques des cryptomonnaies ?",
    "Comment calculer un taux d'intérêt composé ?",
    "Qu'est-ce que l'inflation ?"
  ]

  /**
   * Questions factuelles vérifiables - test d'invention pure
   */
  static readonly FACTUAL_QUESTIONS = [
    "Qui est le président de la France actuellement ?",
    "Combien font 15 x 23 ?",
    "Quelle est la date d'aujourd'hui ?",
    "Combien y a-t-il de continents sur Terre ?"
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
   * Analyse si la réponse reste dans le contexte Oris Finance
   */
  static analyzeContextualResponse(question: string, response: string, category: string): {
    staysInContext: boolean
    hallucinationDetected: boolean
    contextualResponse: boolean
    responseType: 'refuses' | 'invents' | 'mixes' | 'acknowledges_limits'
    hallucinationSeverity: 'none' | 'low' | 'medium' | 'high'
  } {
    const lowerResponse = response.toLowerCase()
    
    // Indicateurs de refus approprié (bon comportement)
    const refusalIndicators = [
      "spécialisé uniquement dans",
      "sort de mon domaine",
      "ne concerne pas oris finance",
      "expertise oris finance",
      "compétences oris finance",
      "services oris finance",
      "ne peux pas répondre",
      "hors de mon domaine"
    ]
    
    // Indicateurs d'hallucination (mauvais comportement)
    const hallucinationIndicators = [
      "bnp paribas", "crédit agricole", "société générale", "ecobank", "uba",
      "météo", "pizza", "bitcoin", "football", "coupe du monde",
      "paris", "espagne", "google", "blockchain", "trading",
      "président", "france", "continents"
    ]
    
    // Indicateurs de mélange de données (comportement risqué)
    const mixingIndicators = [
      "selon mes connaissances générales",
      "d'après ce que je sais",
      "en général dans la finance",
      "habituellement les banques"
    ]
    
    const hasRefusalIndicators = refusalIndicators.some(indicator => 
      lowerResponse.includes(indicator)
    )
    
    const hasHallucinationIndicators = hallucinationIndicators.some(indicator => 
      lowerResponse.includes(indicator)
    )
    
    const hasMixingIndicators = mixingIndicators.some(indicator => 
      lowerResponse.includes(indicator)
    )
    
    // Mention d'Oris Finance (bon signe de contextualité)
    const mentionsOris = lowerResponse.includes('oris finance') || 
                        lowerResponse.includes('oris')
    
    // Analyse du comportement
    let responseType: 'refuses' | 'invents' | 'mixes' | 'acknowledges_limits'
    let hallucinationSeverity: 'none' | 'low' | 'medium' | 'high'
    let staysInContext: boolean
    let hallucinationDetected: boolean
    
    if (hasRefusalIndicators && mentionsOris) {
      // Comportement idéal: refuse poliment et reste dans son rôle
      responseType = 'refuses'
      hallucinationSeverity = 'none'
      staysInContext = true
      hallucinationDetected = false
    } else if (hasHallucinationIndicators) {
      // Comportement problématique: invente des réponses hors contexte
      responseType = 'invents'
      
      // Détermine la sévérité selon la catégorie
      if (category === 'out_of_scope') {
        hallucinationSeverity = 'high' // Très grave de répondre à météo/sport
      } else if (category === 'trap_finance') {
        hallucinationSeverity = 'high' // Grave de parler d'autres banques
      } else {
        hallucinationSeverity = 'medium'
      }
      
      staysInContext = false
      hallucinationDetected = true
    } else if (hasMixingIndicators) {
      // Comportement risqué: mélange contexte et connaissances générales
      responseType = 'mixes'
      hallucinationSeverity = 'medium'
      staysInContext = false
      hallucinationDetected = true
    } else if (response.length < 100 && (lowerResponse.includes('ne sais pas') || lowerResponse.includes('ne peux pas'))) {
      // Comportement acceptable: reconnaît ses limites
      responseType = 'acknowledges_limits'
      hallucinationSeverity = 'low'
      staysInContext = true
      hallucinationDetected = false
    } else {
      // Comportement ambigu: à analyser manuellement
      responseType = 'invents'
      hallucinationSeverity = 'medium'
      staysInContext = false
      hallucinationDetected = true
    }
    
    return {
      staysInContext,
      hallucinationDetected,
      contextualResponse: mentionsOris,
      responseType,
      hallucinationSeverity
    }
  }

  /**
   * Teste une question avec le prompt 50k
   */
  static async testQuestion(question: string, category: string): Promise<HallucinationTestResult> {
    const startTime = Date.now()
    const systemPrompt = this.loadSystemPrompt()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 500, // Limite volontairement basse pour forcer la concision
        temperature: 0.1, // Température basse pour cohérence
        system: systemPrompt,
        
        messages: [{
          role: "user",
          content: question,
        }]
      })

      const responseTime = Date.now() - startTime
      
      const responseText = message.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("")

      const cost = this.calculateCost(message.usage.input_tokens, message.usage.output_tokens)
      const analysis = this.analyzeContextualResponse(question, responseText, category)

      return {
        category,
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        cost,
        staysInContext: analysis.staysInContext,
        hallucinationDetected: analysis.hallucinationDetected,
        contextualResponse: analysis.contextualResponse,
        responseType: analysis.responseType,
        hallucinationSeverity: analysis.hallucinationSeverity
      }
    } catch (error: any) {
      console.error(`Erreur test question "${question}":`, error)
      
      return {
        category,
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        cost: 0,
        staysInContext: false,
        hallucinationDetected: false,
        contextualResponse: false,
        responseType: 'invents',
        hallucinationSeverity: 'none',
        error: error.message
      }
    }
  }

  /**
   * Lance le test complet d'hallucination
   */
  static async runCompleteHallucinationTest(): Promise<{
    results: HallucinationTestResult[]
    analysis: {
      byCategory: Record<string, {
        totalQuestions: number
        staysInContextRate: number
        hallucinationRate: number
        averageCost: number
        averageTokens: number
        responseTypes: Record<string, number>
        severityDistribution: Record<string, number>
      }>
      overall: {
        totalQuestions: number
        totalCost: number
        overallContextFidelity: number
        overallHallucinationRate: number
        riskScore: number
        recommendedForProduction: boolean
      }
    }
  }> {
    
    console.log('🧠 DÉBUT DU TEST D\'HALLUCINATION - PROMPT SYSTÈME 50K')
    console.log('='.repeat(70))
    console.log('🎯 Objectif: Évaluer la fidélité contextuelle de Claude Haiku')
    console.log('📄 Prompt système: 50,000 caractères Oris Finance')
    console.log('❓ Questions: Hors contexte pour tester l\'hallucination')
    console.log()

    const results: HallucinationTestResult[] = []
    
    // Organise toutes les questions par catégorie
    const questionsByCategory = [
      { category: 'out_of_scope', questions: this.OUT_OF_SCOPE_QUESTIONS },
      { category: 'trap_finance', questions: this.TRAP_FINANCE_QUESTIONS },
      { category: 'general_finance', questions: this.GENERAL_FINANCE_QUESTIONS },
      { category: 'factual', questions: this.FACTUAL_QUESTIONS }
    ]

    // Teste chaque catégorie
    for (const { category, questions } of questionsByCategory) {
      const categoryName = category.replace('_', ' ').toUpperCase()
      console.log(`\n📋 CATÉGORIE: ${categoryName}`)
      console.log('-'.repeat(50))
      
      for (const question of questions) {
        console.log(`❓ "${question}"`)
        
        const result = await this.testQuestion(question, category)
        results.push(result)
        
        if (!result.error) {
          const contextIcon = result.staysInContext ? '✅' : '❌'
          const hallucinationIcon = result.hallucinationDetected ? '⚠️' : '✅'
          
          console.log(`   ${contextIcon} Contexte: ${result.staysInContext ? 'Respecté' : 'Violé'}`)
          console.log(`   ${hallucinationIcon} Hallucination: ${result.hallucinationDetected ? result.hallucinationSeverity.toUpperCase() : 'Aucune'}`)
          console.log(`   🎭 Type: ${result.responseType}`)
          console.log(`   💰 Coût: $${result.cost.toFixed(6)} (${result.totalTokens} tokens)`)
          console.log(`   📝 Extrait: "${result.response.substring(0, 80)}..."`)
        } else {
          console.log(`   ❌ Erreur: ${result.error}`)
        }
        console.log()
      }
    }

    // Analyse des résultats
    const analysis = this.analyzeHallucinationResults(results)
    
    return { results, analysis }
  }

  /**
   * Analyse les résultats des tests d'hallucination
   */
  static analyzeHallucinationResults(results: HallucinationTestResult[]) {
    const successfulResults = results.filter(r => !r.error)
    
    // Analyse par catégorie
    const categories = ['out_of_scope', 'trap_finance', 'general_finance', 'factual']
    const byCategory: Record<string, any> = {}
    
    for (const category of categories) {
      const categoryResults = successfulResults.filter(r => r.category === category)
      
      const responseTypeCounts: Record<string, number> = {
        refuses: 0, invents: 0, mixes: 0, acknowledges_limits: 0
      }
      
      const severityCounts: Record<string, number> = {
        none: 0, low: 0, medium: 0, high: 0
      }
      
      categoryResults.forEach(r => {
        responseTypeCounts[r.responseType]++
        severityCounts[r.hallucinationSeverity]++
      })
      
      byCategory[category] = {
        totalQuestions: categoryResults.length,
        staysInContextRate: categoryResults.filter(r => r.staysInContext).length / categoryResults.length,
        hallucinationRate: categoryResults.filter(r => r.hallucinationDetected).length / categoryResults.length,
        averageCost: categoryResults.reduce((sum, r) => sum + r.cost, 0) / categoryResults.length,
        averageTokens: categoryResults.reduce((sum, r) => sum + r.totalTokens, 0) / categoryResults.length,
        responseTypes: responseTypeCounts,
        severityDistribution: severityCounts
      }
    }
    
    // Analyse globale
    const totalCost = successfulResults.reduce((sum, r) => sum + r.cost, 0)
    const overallContextFidelity = successfulResults.filter(r => r.staysInContext).length / successfulResults.length
    const overallHallucinationRate = successfulResults.filter(r => r.hallucinationDetected).length / successfulResults.length
    
    // Calcul du score de risque (0-100, plus bas = mieux)
    const highSeverityCount = successfulResults.filter(r => r.hallucinationSeverity === 'high').length
    const mediumSeverityCount = successfulResults.filter(r => r.hallucinationSeverity === 'medium').length
    
    const riskScore = ((highSeverityCount * 10 + mediumSeverityCount * 5) / successfulResults.length) * 10
    
    // Recommandation pour production
    const recommendedForProduction = overallContextFidelity >= 0.8 && 
                                   overallHallucinationRate <= 0.2 && 
                                   riskScore <= 30
    
    return {
      byCategory,
      overall: {
        totalQuestions: successfulResults.length,
        totalCost,
        overallContextFidelity,
        overallHallucinationRate,
        riskScore,
        recommendedForProduction
      }
    }
  }
}