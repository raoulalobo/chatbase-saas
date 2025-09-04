/**
 * Script d'exécution des tests WebSearch avec restriction de domaine
 * SecureTechCenter - Analyse complète avec rapport détaillé
 */

import { SecureTechCenterWebSearchTest } from './test-websearch-securetechcenter'

console.log('🚀 TEST WEBSEARCH AVEC RESTRICTION DE DOMAINE')
console.log('='.repeat(70))
console.log('🎯 Objectif: Tester la restriction à www.securetechcenter.com')
console.log('🤖 Modèle: Claude Haiku 3.5')
console.log('💰 Coût: ~$0.00025/1k input tokens, ~$0.00125/1k output tokens')
console.log()

async function main() {
  try {
    const testResults = await SecureTechCenterWebSearchTest.runCompleteTest()
    
    console.log('📊 ANALYSE DÉTAILLÉE DES RÉSULTATS')
    console.log('='.repeat(70))
    
    // Affichage détaillé par question
    const questions = new Set(testResults.results.map(r => r.question))
    
    for (const question of questions) {
      const restrictedResult = testResults.results.find(r => r.question === question && r.restricted)
      const unrestrictedResult = testResults.results.find(r => r.question === question && !r.restricted)
      
      console.log(`\n❓ QUESTION: "${question}"`)
      console.log('-'.repeat(50))
      
      if (restrictedResult) {
        console.log('🔒 AVEC RESTRICTION DE DOMAINE:')
        if (restrictedResult.error) {
          console.log(`   ❌ Erreur: ${restrictedResult.error}`)
        } else {
          console.log(`   📊 Tokens: ${restrictedResult.totalTokens} (${restrictedResult.tokensInput} in + ${restrictedResult.tokensOutput} out)`)
          console.log(`   💰 Coût: $${restrictedResult.cost.toFixed(6)}`)
          console.log(`   ⏱️  Temps: ${restrictedResult.responseTime}ms`)
          console.log(`   🎯 Info pertinente: ${restrictedResult.foundRelevantInfo ? '✅ Trouvée' : '❌ Non trouvée'}`)
          console.log(`   📝 Réponse: ${restrictedResult.response.substring(0, 150)}...`)
        }
      }
      
      if (unrestrictedResult) {
        console.log('\n🌐 SANS RESTRICTION:')
        if (unrestrictedResult.error) {
          console.log(`   ❌ Erreur: ${unrestrictedResult.error}`)
        } else {
          console.log(`   📊 Tokens: ${unrestrictedResult.totalTokens} (${unrestrictedResult.tokensInput} in + ${unrestrictedResult.tokensOutput} out)`)
          console.log(`   💰 Coût: $${unrestrictedResult.cost.toFixed(6)}`)
          console.log(`   ⏱️  Temps: ${unrestrictedResult.responseTime}ms`)
          console.log(`   🎯 Info pertinente: ${unrestrictedResult.foundRelevantInfo ? '✅ Trouvée' : '❌ Non trouvée'}`)
          console.log(`   📝 Réponse: ${unrestrictedResult.response.substring(0, 150)}...`)
        }
      }
      
      // Comparaison directe
      if (restrictedResult && unrestrictedResult && !restrictedResult.error && !unrestrictedResult.error) {
        console.log('\n⚖️  COMPARAISON:')
        const tokenDiff = unrestrictedResult.totalTokens - restrictedResult.totalTokens
        const costDiff = unrestrictedResult.cost - restrictedResult.cost
        
        console.log(`   📊 Différence tokens: ${tokenDiff > 0 ? '+' : ''}${tokenDiff}`)
        console.log(`   💸 Différence coût: $${costDiff >= 0 ? '+' : ''}${costDiff.toFixed(6)}`)
        console.log(`   🎯 Pertinence: Restreint=${restrictedResult.foundRelevantInfo ? '✅' : '❌'} vs Libre=${unrestrictedResult.foundRelevantInfo ? '✅' : '❌'}`)
      }
    }
    
    // Résumé global
    console.log('\n📈 RÉSUMÉ GLOBAL')
    console.log('='.repeat(70))
    
    const { analysis } = testResults
    
    console.log('\n🔒 RECHERCHE AVEC RESTRICTION:')
    console.log(`   📊 Tests réalisés: ${analysis.restrictedSearch.totalTests}`)
    console.log(`   ✅ Réponses réussies: ${analysis.restrictedSearch.successfulResponses}`)
    console.log(`   🪙 Tokens totaux: ${analysis.restrictedSearch.totalTokens}`)
    console.log(`   💰 Coût total: $${analysis.restrictedSearch.totalCost.toFixed(6)}`)
    console.log(`   ⏱️  Temps moyen: ${Math.round(analysis.restrictedSearch.avgResponseTime)}ms`)
    console.log(`   🎯 Infos pertinentes trouvées: ${analysis.restrictedSearch.relevantInfoFound}/${analysis.restrictedSearch.totalTests}`)
    
    console.log('\n🌐 RECHERCHE SANS RESTRICTION:')
    console.log(`   📊 Tests réalisés: ${analysis.unrestrictedSearch.totalTests}`)
    console.log(`   ✅ Réponses réussies: ${analysis.unrestrictedSearch.successfulResponses}`)
    console.log(`   🪙 Tokens totaux: ${analysis.unrestrictedSearch.totalTokens}`)
    console.log(`   💰 Coût total: $${analysis.unrestrictedSearch.totalCost.toFixed(6)}`)
    console.log(`   ⏱️  Temps moyen: ${Math.round(analysis.unrestrictedSearch.avgResponseTime)}ms`)
    console.log(`   🎯 Infos pertinentes trouvées: ${analysis.unrestrictedSearch.relevantInfoFound}/${analysis.unrestrictedSearch.totalTests}`)
    
    console.log('\n⚖️  COMPARAISON GLOBALE:')
    console.log(`   💸 Différence de coût: $${analysis.comparison.costDifference >= 0 ? '+' : ''}${analysis.comparison.costDifference.toFixed(6)}`)
    console.log(`   📊 Différence tokens: ${analysis.comparison.tokensDifference > 0 ? '+' : ''}${analysis.comparison.tokensDifference}`)
    console.log(`   ⏱️  Différence temps: ${analysis.comparison.timeDifference >= 0 ? '+' : ''}${Math.round(analysis.comparison.timeDifference)}ms`)
    console.log(`   🎯 Différence pertinence: ${analysis.comparison.accuracyDifference > 0 ? '+' : ''}${analysis.comparison.accuracyDifference} infos trouvées`)
    
    // Extrapolation pour 1000 requêtes
    console.log('\n🚀 EXTRAPOLATION POUR 1000 REQUÊTES:')
    console.log('-'.repeat(50))
    
    const restricted1k = {
      cost: (analysis.restrictedSearch.totalCost / analysis.restrictedSearch.totalTests) * 1000,
      tokens: (analysis.restrictedSearch.totalTokens / analysis.restrictedSearch.totalTests) * 1000
    }
    
    const unrestricted1k = {
      cost: (analysis.unrestrictedSearch.totalCost / analysis.unrestrictedSearch.totalTests) * 1000,
      tokens: (analysis.unrestrictedSearch.totalTokens / analysis.unrestrictedSearch.totalTests) * 1000
    }
    
    console.log(`🔒 Recherche restreinte (1000 req): $${restricted1k.cost.toFixed(2)} | ${Math.round(restricted1k.tokens).toLocaleString()} tokens`)
    console.log(`🌐 Recherche libre (1000 req): $${unrestricted1k.cost.toFixed(2)} | ${Math.round(unrestricted1k.tokens).toLocaleString()} tokens`)
    console.log(`💰 Économie avec restriction: $${(unrestricted1k.cost - restricted1k.cost).toFixed(2)}`)
    
    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    console.log('='.repeat(50))
    
    const restrictedAccuracy = analysis.restrictedSearch.relevantInfoFound / analysis.restrictedSearch.totalTests
    const unrestrictedAccuracy = analysis.unrestrictedSearch.relevantInfoFound / analysis.unrestrictedSearch.totalTests
    
    if (analysis.comparison.costDifference < 0) {
      console.log('✅ La restriction de domaine RÉDUIT les coûts')
      console.log('   → Recommandé pour les agents spécialisés')
      console.log('   → Économie de coût significative')
    } else {
      console.log('💸 La restriction de domaine AUGMENTE les coûts')
      console.log('   → Évaluer si la précision justifie le surcoût')
    }
    
    if (restrictedAccuracy >= unrestrictedAccuracy * 0.8) {
      console.log('🎯 La précision avec restriction est acceptable')
      console.log('   → Maintient une bonne qualité de réponse')
    } else {
      console.log('⚠️  La précision avec restriction est limitée')
      console.log('   → Beaucoup d\'informations non trouvées sur le domaine restreint')
    }
    
    console.log('\n📋 POINTS CLÉS:')
    console.log(`• Taux de succès restreint: ${(restrictedAccuracy * 100).toFixed(1)}%`)
    console.log(`• Taux de succès libre: ${(unrestrictedAccuracy * 100).toFixed(1)}%`)
    console.log(`• Économie/Surcoût: ${analysis.comparison.costDifference < 0 ? 'ÉCONOMIE' : 'SURCOÛT'} de $${Math.abs(analysis.comparison.costDifference).toFixed(6)} par lot de ${analysis.restrictedSearch.totalTests} questions`)
    
    if (analysis.comparison.accuracyDifference >= 0) {
      console.log('• La recherche libre ne trouve pas plus d\'informations pertinentes')
    } else {
      console.log('• La recherche libre trouve plus d\'informations pertinentes')
    }
    
    console.log('\n🎉 Test terminé avec succès !')
    console.log(`📊 ${testResults.results.length} requêtes testées au total`)
    console.log(`💰 Coût total du test: $${(analysis.restrictedSearch.totalCost + analysis.unrestrictedSearch.totalCost).toFixed(6)}`)
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    
    if (error instanceof Error && error.message.includes('web_search')) {
      console.log('\n💡 DIAGNOSTIC:')
      console.log('• L\'outil WebSearch pourrait ne pas être disponible')
      console.log('• Vérifiez votre clé API et les accès aux outils beta')
      console.log('• Le paramètre allowed_domains pourrait ne pas être supporté')
    }
    
    process.exit(1)
  }
}

main()