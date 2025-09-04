import Anthropic from "@anthropic-ai/sdk"

/**
 * Service de test pour WebSearch avec Claude Haiku
 * Teste l'intégration des outils web pour éviter les hallucinations
 */

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface WebSearchTestResult {
  question: string
  response: string
  tokensInput: number
  tokensOutput: number
  totalTokens: number
  responseTime: number
  webSearchUsed: boolean
  error?: string
}

export class WebSearchTestService {
  /**
   * Teste une question avec recherche web activée
   */
  static async testWithWebSearch(question: string): Promise<WebSearchTestResult> {
    const startTime = Date.now()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: `Tu es Raoul, agent responsable du service client Oris Finance.
        
INSTRUCTIONS :
- Utilise les outils de recherche web pour obtenir des informations précises
- Recherche spécifiquement sur https://oris-finance.com/ quand c'est pertinent
- Ne donne que des informations factuelles trouvées sur le web
- Si tu ne trouves pas d'information, dis-le clairement`,
        
        messages: [{
          role: "user",
          content: question,
        }],
        
        // Configuration des outils web (supporté par l'API!)
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search"
          }
        ]
      })

      const responseTime = Date.now() - startTime
      
      const responseText = message.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("")

      return {
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        webSearchUsed: true
      }
    } catch (error: any) {
      console.error("Erreur lors du test WebSearch:", error)
      
      return {
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        webSearchUsed: false,
        error: error.message
      }
    }
  }

  /**
   * Teste la même question sans recherche web (pour comparaison)
   */
  static async testWithoutWebSearch(question: string): Promise<WebSearchTestResult> {
    const startTime = Date.now()
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: `Tu es Raoul, agent responsable du service client Oris Finance.
        
INSTRUCTIONS :
- Réponds avec tes connaissances existantes uniquement
- Ne pas inventer d'informations si tu n'es pas sûr
- Sois honnête sur les limites de tes connaissances`,
        
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

      return {
        question,
        response: responseText,
        tokensInput: message.usage.input_tokens,
        tokensOutput: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        responseTime,
        webSearchUsed: false
      }
    } catch (error: any) {
      console.error("Erreur lors du test sans WebSearch:", error)
      
      return {
        question,
        response: "",
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        responseTime: Date.now() - startTime,
        webSearchUsed: false,
        error: error.message
      }
    }
  }

  /**
   * Calcule le coût approximatif en USD pour Claude Haiku
   */
  static calculateCost(tokens: number, type: 'input' | 'output'): number {
    // Prix Claude Haiku (approximatif)
    const HAIKU_INPUT_COST = 0.00025 / 1000  // $0.00025 per 1k input tokens
    const HAIKU_OUTPUT_COST = 0.00125 / 1000 // $0.00125 per 1k output tokens
    
    return type === 'input' 
      ? tokens * HAIKU_INPUT_COST 
      : tokens * HAIKU_OUTPUT_COST
  }

  /**
   * Analyse complète de plusieurs questions
   */
  static async runCompleteTest(): Promise<{
    results: WebSearchTestResult[]
    comparison: {
      totalCostWithWeb: number
      totalCostWithoutWeb: number
      avgResponseTimeWithWeb: number
      avgResponseTimeWithoutWeb: number
      webSearchSupported: boolean
    }
  }> {
    const testQuestions = [
      "Quels sont les services proposés par Oris Finance ?",
      "Quel est le numéro de téléphone d'Oris Finance ?", 
      "C'est quoi Cresco chez Oris Finance ?",
      "Quelles sont les conditions de financement ?",
      "Où se trouve le siège social d'Oris Finance ?"
    ]

    const results: WebSearchTestResult[] = []
    
    console.log("🔍 Début des tests WebSearch vs Standard...")
    
    for (const question of testQuestions) {
      console.log(`\n📝 Test de: "${question}"`)
      
      // Test avec WebSearch
      console.log("   🌐 Test avec WebSearch...")
      const withWebSearch = await this.testWithWebSearch(question)
      
      // Test sans WebSearch  
      console.log("   📚 Test sans WebSearch...")
      const withoutWebSearch = await this.testWithoutWebSearch(question)
      
      results.push(withWebSearch, withoutWebSearch)
      
      // Affichage des résultats
      console.log(`   ✅ Tokens avec web: ${withWebSearch.totalTokens}`)
      console.log(`   ✅ Tokens sans web: ${withoutWebSearch.totalTokens}`)
      console.log(`   ⏱️  Temps avec web: ${withWebSearch.responseTime}ms`)
      console.log(`   ⏱️  Temps sans web: ${withoutWebSearch.responseTime}ms`)
    }

    // Analyse des résultats
    const withWebResults = results.filter(r => r.webSearchUsed)
    const withoutWebResults = results.filter(r => !r.webSearchUsed && !r.error)
    
    const totalCostWithWeb = withWebResults.reduce((sum, r) => 
      sum + this.calculateCost(r.tokensInput, 'input') + this.calculateCost(r.tokensOutput, 'output'), 0)
    
    const totalCostWithoutWeb = withoutWebResults.reduce((sum, r) => 
      sum + this.calculateCost(r.tokensInput, 'input') + this.calculateCost(r.tokensOutput, 'output'), 0)
    
    const avgResponseTimeWithWeb = withWebResults.reduce((sum, r) => sum + r.responseTime, 0) / withWebResults.length
    const avgResponseTimeWithoutWeb = withoutWebResults.reduce((sum, r) => sum + r.responseTime, 0) / withoutWebResults.length

    return {
      results,
      comparison: {
        totalCostWithWeb,
        totalCostWithoutWeb,
        avgResponseTimeWithWeb,
        avgResponseTimeWithoutWeb,
        webSearchSupported: withWebResults.some(r => !r.error)
      }
    }
  }
}