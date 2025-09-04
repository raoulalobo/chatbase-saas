/**
 * Script d'exécution des tests WebSearch avec prompts ultra-contraignants
 * Analyse l'efficacité des instructions système strictes pour contraindre à un domaine
 */

import { StrictPromptWebSearchTest } from './test-websearch-strict-prompts'

console.log('🚀 TEST WEBSEARCH AVEC PROMPTS ULTRA-CONTRAIGNANTS')
console.log('='.repeat(70))
console.log('🎯 Objectif: Tester l\'efficacité des prompts système stricts')
console.log('🌐 Domaine cible: www.securetechcenter.com')
console.log('🤖 Modèle: Claude Haiku 3.5')
console.log('📝 Variantes: Interdiction Simple | Ultra-Strict | Validation Strict')
console.log()

async function main() {
  try {
    const testResults = await StrictPromptWebSearchTest.runCompleteTest()
    
    console.log('📊 ANALYSE DÉTAILLÉE DES RÉSULTATS')
    console.log('='.repeat(70))
    
    // Analyse par variante de prompt
    for (const [promptKey, analysis] of Object.entries(testResults.analysis.byPromptVariant)) {
      console.log(`\n🎯 VARIANTE: ${promptKey.toUpperCase().replace('_', ' ')}`)
      console.log('-'.repeat(50))
      console.log(`📊 Tests réalisés: ${analysis.totalTests}`)
      console.log(`✅ Réponses réussies: ${analysis.successfulResponses}`)
      console.log(`🎯 Taux respect contrainte: ${(analysis.constraintRespectRate * 100).toFixed(1)}%`)
      console.log(`📋 Taux infos pertinentes: ${(analysis.relevantInfoRate * 100).toFixed(1)}%`)
      console.log(`🪙 Tokens moyens: ${Math.round(analysis.avgTokens)}`)
      console.log(`💰 Coût moyen: $${analysis.avgCost.toFixed(6)}`)
      console.log(`⏱️ Temps moyen: ${Math.round(analysis.avgResponseTime)}ms`)
      console.log(`⚠️ Sources externes détectées: ${analysis.externalSourcesDetected}`)
    }
    
    // Analyse détaillée par question
    console.log('\n📋 ANALYSE PAR QUESTION')
    console.log('='.repeat(70))
    
    const questions = new Set(testResults.results.map(r => r.question))
    
    for (const question of questions) {
      const questionResults = testResults.results.filter(r => r.question === question && !r.error)
      
      console.log(`\n❓ QUESTION: "${question}"`)
      console.log('-'.repeat(50))
      
      for (const result of questionResults) {
        console.log(`\n📝 ${result.promptVariant.replace('_', ' ').toUpperCase()}:`)
        console.log(`   🎯 Contrainte respectée: ${result.respectsConstraint ? '✅' : '❌'}`)
        console.log(`   📊 Info pertinente: ${result.foundRelevantInfo ? '✅' : '❌'}`)
        console.log(`   ⚠️ Sources externes: ${result.mentionsOtherSources ? '❌' : '✅'}`)
        console.log(`   💰 Coût: $${result.cost.toFixed(6)} (${result.totalTokens} tokens)`)
        console.log(`   📝 Réponse: ${result.response.substring(0, 120)}...`)
        
        if (result.sourcesUsed.length > 0) {
          console.log(`   📎 Sources utilisées: ${result.sourcesUsed.join(', ')}`)
        }
      }
    }
    
    // Résumé global et comparatif
    console.log('\n📈 RÉSUMÉ GLOBAL')
    console.log('='.repeat(70))
    
    const { overall } = testResults.analysis
    
    console.log(`📊 Tests totaux réalisés: ${overall.totalTests}`)
    console.log(`💰 Coût total du test: $${overall.totalCost.toFixed(6)}`)
    console.log()
    
    console.log('🏆 CLASSEMENT DES PROMPTS:')
    console.log(`🎯 Meilleur pour contrainte: ${overall.bestPromptForConstraint.replace('_', ' ').toUpperCase()}`)
    console.log(`📋 Meilleur pour pertinence: ${overall.bestPromptForRelevance.replace('_', ' ').toUpperCase()}`)
    console.log(`⚡ Plus efficace: ${overall.mostEfficient.replace('_', ' ').toUpperCase()}`)
    
    // Analyse comparative des taux de réussite
    console.log('\n⚖️ COMPARATIF DES PERFORMANCES')
    console.log('-'.repeat(50))
    
    for (const [promptKey, analysis] of Object.entries(testResults.analysis.byPromptVariant)) {
      const constraintScore = analysis.constraintRespectRate * 100
      const relevanceScore = analysis.relevantInfoRate * 100
      const efficiency = (analysis.relevantInfoRate / analysis.avgCost) * 1000 // score par $0.001
      
      console.log(`\n${promptKey.replace('_', ' ').toUpperCase()}:`)
      console.log(`  🎯 Respect contrainte: ${constraintScore.toFixed(1)}%`)
      console.log(`  📋 Pertinence: ${relevanceScore.toFixed(1)}%`)
      console.log(`  ⚡ Efficacité: ${efficiency.toFixed(2)} (infos pertinentes par $0.001)`)
    }
    
    // Extrapolation pour 1000 requêtes
    console.log('\n🚀 EXTRAPOLATION POUR 1000 REQUÊTES')
    console.log('='.repeat(50))
    
    for (const [promptKey, analysis] of Object.entries(testResults.analysis.byPromptVariant)) {
      const cost1k = analysis.avgCost * 1000
      const tokens1k = analysis.avgTokens * 1000
      
      console.log(`${promptKey.replace('_', ' ').toUpperCase()}: $${cost1k.toFixed(2)} | ${Math.round(tokens1k).toLocaleString()} tokens`)
    }
    
    // Recommandations finales
    console.log('\n💡 RECOMMANDATIONS')
    console.log('='.repeat(50))
    
    const bestConstraintRate = Math.max(...Object.values(testResults.analysis.byPromptVariant).map(a => a.constraintRespectRate))
    const bestRelevanceRate = Math.max(...Object.values(testResults.analysis.byPromptVariant).map(a => a.relevantInfoRate))
    
    if (bestConstraintRate >= 0.8) {
      console.log('✅ Les prompts contraignants sont EFFICACES pour restreindre les sources')
      console.log('   → Recommandé pour agents spécialisés nécessitant un contrôle strict des sources')
    } else {
      console.log('⚠️ Les prompts contraignants ont une efficacité LIMITÉE')
      console.log('   → Nécessite des améliorations ou approches techniques complémentaires')
    }
    
    if (bestRelevanceRate >= 0.6) {
      console.log('📊 La qualité des réponses reste ACCEPTABLE malgré les contraintes')
      console.log('   → Équilibre correct entre restriction et utilité')
    } else {
      console.log('📉 Les contraintes RÉDUISENT significativement la qualité des réponses')
      console.log('   → Risque de perte d\'informations importantes pour l\'utilisateur')
    }
    
    // Points clés à retenir
    console.log('\n📋 POINTS CLÉS')
    console.log('-'.repeat(30))
    
    const avgConstraintRate = Object.values(testResults.analysis.byPromptVariant)
      .reduce((sum, a) => sum + a.constraintRespectRate, 0) / Object.keys(testResults.analysis.byPromptVariant).length
    
    const avgRelevanceRate = Object.values(testResults.analysis.byPromptVariant)
      .reduce((sum, a) => sum + a.relevantInfoRate, 0) / Object.keys(testResults.analysis.byPromptVariant).length
    
    console.log(`• Taux moyen respect contrainte: ${(avgConstraintRate * 100).toFixed(1)}%`)
    console.log(`• Taux moyen pertinence: ${(avgRelevanceRate * 100).toFixed(1)}%`)
    console.log(`• Stabilité technique: ${testResults.results.filter(r => !r.error).length}/${testResults.results.length} tests réussis`)
    
    if (avgConstraintRate > 0.7) {
      console.log('• Les prompts système PEUVENT contraindre efficacement WebSearch')
    } else {
      console.log('• Les prompts système ont des limites pour contraindre WebSearch')
    }
    
    if (testResults.results.filter(r => !r.error).length === testResults.results.length) {
      console.log('• Avantage: AUCUNE erreur 500 (vs 60% avec allowed_domains)')
    } else {
      console.log(`• ${testResults.results.filter(r => r.error).length} erreurs détectées`)
    }
    
    console.log('\n🎉 Test terminé avec succès !')
    console.log(`📊 ${testResults.results.length} requêtes testées au total`)
    console.log(`💰 Coût total du test: $${overall.totalCost.toFixed(6)}`)
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    
    if (error instanceof Error && error.message.includes('web_search')) {
      console.log('\n💡 DIAGNOSTIC:')
      console.log('• L\'outil WebSearch pourrait ne pas être disponible')
      console.log('• Vérifiez votre clé API et les accès aux outils beta')
      console.log('• Les prompts système ne peuvent pas compenser les problèmes techniques')
    }
    
    process.exit(1)
  }
}

main()