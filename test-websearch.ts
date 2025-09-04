/**
 * Script d'exécution des tests WebSearch
 * Compare les performances et coûts entre WebSearch et réponses standard
 */

import { WebSearchTestService } from './src/lib/test-websearch'

console.log('🚀 LANCEMENT DES TESTS WEBSEARCH vs STANDARD')
console.log('=' .repeat(60))

async function main() {
  try {
    const testResults = await WebSearchTestService.runCompleteTest()
    
    console.log('\n📊 RÉSULTATS DÉTAILLÉS:')
    console.log('=' .repeat(40))
    
    // Affichage détaillé des résultats
    const questions = new Set(testResults.results.map(r => r.question))
    
    for (const question of questions) {
      const withWeb = testResults.results.find(r => r.question === question && r.webSearchUsed)
      const withoutWeb = testResults.results.find(r => r.question === question && !r.webSearchUsed)
      
      console.log(`\n❓ QUESTION: ${question}`)
      
      if (withWeb) {
        console.log('\n🌐 AVEC WEBSEARCH:')
        if (withWeb.error) {
          console.log(`   ❌ Erreur: ${withWeb.error}`)
        } else {
          console.log(`   📊 Tokens: ${withWeb.totalTokens} (${withWeb.tokensInput} in + ${withWeb.tokensOutput} out)`)
          console.log(`   💰 Coût: $${(
            WebSearchTestService.calculateCost(withWeb.tokensInput, 'input') + 
            WebSearchTestService.calculateCost(withWeb.tokensOutput, 'output')
          ).toFixed(6)}`)
          console.log(`   ⏱️  Temps: ${withWeb.responseTime}ms`)
          console.log(`   💬 Réponse: ${withWeb.response.substring(0, 200)}...`)
        }
      }
      
      if (withoutWeb) {
        console.log('\n📚 SANS WEBSEARCH:')
        if (withoutWeb.error) {
          console.log(`   ❌ Erreur: ${withoutWeb.error}`)
        } else {
          console.log(`   📊 Tokens: ${withoutWeb.totalTokens} (${withoutWeb.tokensInput} in + ${withoutWeb.tokensOutput} out)`)
          console.log(`   💰 Coût: $${(
            WebSearchTestService.calculateCost(withoutWeb.tokensInput, 'input') + 
            WebSearchTestService.calculateCost(withoutWeb.tokensOutput, 'output')
          ).toFixed(6)}`)
          console.log(`   ⏱️  Temps: ${withoutWeb.responseTime}ms`)
          console.log(`   💬 Réponse: ${withoutWeb.response.substring(0, 200)}...`)
        }
      }
      
      console.log('-'.repeat(40))
    }
    
    // Résumé comparatif
    console.log('\n🎯 ANALYSE COMPARATIVE:')
    console.log('=' .repeat(40))
    
    const { comparison } = testResults
    
    console.log(`💰 Coût total AVEC WebSearch: $${comparison.totalCostWithWeb.toFixed(6)}`)
    console.log(`💰 Coût total SANS WebSearch: $${comparison.totalCostWithoutWeb.toFixed(6)}`)
    console.log(`💸 Différence de coût: $${(comparison.totalCostWithWeb - comparison.totalCostWithoutWeb).toFixed(6)}`)
    console.log(`📈 Surcoût WebSearch: ${((comparison.totalCostWithWeb / comparison.totalCostWithoutWeb - 1) * 100).toFixed(1)}%`)
    
    console.log(`⏱️  Temps moyen AVEC WebSearch: ${Math.round(comparison.avgResponseTimeWithWeb)}ms`)
    console.log(`⏱️  Temps moyen SANS WebSearch: ${Math.round(comparison.avgResponseTimeWithoutWeb)}ms`)
    console.log(`🐌 Ralentissement WebSearch: ${Math.round(comparison.avgResponseTimeWithWeb / comparison.avgResponseTimeWithoutWeb)}x`)
    
    console.log(`🔧 WebSearch supporté: ${comparison.webSearchSupported ? '✅ OUI' : '❌ NON'}`)
    
    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    console.log('=' .repeat(40))
    
    if (!comparison.webSearchSupported) {
      console.log('❌ WebSearch non supporté par l\'API Anthropic actuelle')
      console.log('   → Utiliser des fichiers uploadés ou corriger les prompts')
    } else {
      const costIncrease = (comparison.totalCostWithWeb / comparison.totalCostWithoutWeb - 1) * 100
      
      if (costIncrease > 200) {
        console.log('💸 Surcoût WebSearch très élevé (>200%)')
        console.log('   → Réserver aux cas critiques uniquement')
      } else if (costIncrease > 50) {
        console.log('💰 Surcoût WebSearch modéré (50-200%)')
        console.log('   → Utiliser avec parcimonie pour les informations critiques')
      } else {
        console.log('✅ Surcoût WebSearch acceptable (<50%)')
        console.log('   → Peut être utilisé régulièrement')
      }
      
      if (comparison.avgResponseTimeWithWeb > 5000) {
        console.log('🐌 Temps de réponse élevé avec WebSearch')
        console.log('   → Prévoir des timeouts et messages d\'attente')
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
  }
}

main()