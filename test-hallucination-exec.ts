/**
 * Script d'exécution des tests d'hallucination avec prompt 50k caractères
 * Évalue la fidélité contextuelle et détecte les hallucinations de Claude Haiku
 */

import { HallucinationTest50k } from './test-hallucination-50k-prompt'

console.log('🧠 TEST D\'HALLUCINATION AVEC PROMPT SYSTÈME 50K CARACTÈRES')
console.log('='.repeat(70))
console.log('🎯 Objectif: Détecter si Claude hallucine avec un large contexte')
console.log('🤖 Modèle: Claude Haiku 3.5')
console.log('📄 Prompt: 50,000 caractères sur Oris Finance')
console.log('❓ Questions: Hors contexte pour forcer l\'hallucination')
console.log()

async function main() {
  try {
    const testResults = await HallucinationTest50k.runCompleteHallucinationTest()
    
    console.log('📊 ANALYSE DÉTAILLÉE DES RÉSULTATS')
    console.log('='.repeat(70))
    
    // Analyse par catégorie
    const categoryNames = {
      out_of_scope: 'Questions Hors Sujet',
      trap_finance: 'Questions Piège Finance',
      general_finance: 'Finance Générale',
      factual: 'Questions Factuelles'
    }
    
    for (const [categoryKey, categoryName] of Object.entries(categoryNames)) {
      const analysis = testResults.analysis.byCategory[categoryKey]
      if (!analysis) continue
      
      console.log(`\n📋 ${categoryName.toUpperCase()}`)
      console.log('-'.repeat(50))
      console.log(`📊 Questions testées: ${analysis.totalQuestions}`)
      console.log(`✅ Taux fidélité contextuelle: ${(analysis.staysInContextRate * 100).toFixed(1)}%`)
      console.log(`⚠️  Taux d'hallucination: ${(analysis.hallucinationRate * 100).toFixed(1)}%`)
      console.log(`💰 Coût moyen: $${analysis.averageCost.toFixed(6)}`)
      console.log(`🪙 Tokens moyens: ${Math.round(analysis.averageTokens)}`)
      
      console.log('\n   📊 DISTRIBUTION TYPES DE RÉPONSES:')
      Object.entries(analysis.responseTypes).forEach(([type, count]) => {
        const percentage = ((count as number / analysis.totalQuestions) * 100).toFixed(1)
        const icon = type === 'refuses' ? '✅' : type === 'invents' ? '❌' : type === 'mixes' ? '⚠️' : '🤔'
        console.log(`   ${icon} ${type}: ${count} (${percentage}%)`)
      })
      
      console.log('\n   🎭 SÉVÉRITÉ HALLUCINATIONS:')
      Object.entries(analysis.severityDistribution).forEach(([severity, count]) => {
        const percentage = ((count as number / analysis.totalQuestions) * 100).toFixed(1)
        const icon = severity === 'none' ? '✅' : severity === 'low' ? '🟡' : severity === 'medium' ? '🟠' : '🔴'
        console.log(`   ${icon} ${severity}: ${count} (${percentage}%)`)
      })
    }
    
    // Analyse détaillée question par question
    console.log('\n🔍 ANALYSE DÉTAILLÉE PAR QUESTION')
    console.log('='.repeat(70))
    
    const categorizedResults = {
      out_of_scope: testResults.results.filter(r => r.category === 'out_of_scope'),
      trap_finance: testResults.results.filter(r => r.category === 'trap_finance'),
      general_finance: testResults.results.filter(r => r.category === 'general_finance'),
      factual: testResults.results.filter(r => r.category === 'factual')
    }
    
    for (const [categoryKey, categoryName] of Object.entries(categoryNames)) {
      const categoryResults = categorizedResults[categoryKey as keyof typeof categorizedResults]
      
      console.log(`\n📋 ${categoryName.toUpperCase()}`)
      console.log('-'.repeat(50))
      
      for (const result of categoryResults) {
        if (result.error) continue
        
        const contextIcon = result.staysInContext ? '✅' : '❌'
        const hallucinationIcon = result.hallucinationDetected ? 
          (result.hallucinationSeverity === 'high' ? '🔴' : 
           result.hallucinationSeverity === 'medium' ? '🟠' : '🟡') : '✅'
        
        console.log(`\n❓ "${result.question}"`)
        console.log(`   ${contextIcon} Contexte: ${result.staysInContext ? 'RESPECTÉ' : 'VIOLÉ'}`)
        console.log(`   ${hallucinationIcon} Hallucination: ${result.hallucinationDetected ? result.hallucinationSeverity.toUpperCase() : 'AUCUNE'}`)
        console.log(`   🎭 Comportement: ${result.responseType}`)
        console.log(`   💰 Coût: $${result.cost.toFixed(6)}`)
        
        // Affiche la réponse avec analyse
        console.log(`   📝 Réponse: "${result.response.substring(0, 150)}${result.response.length > 150 ? '...' : ''}"`)
        
        // Diagnostic du comportement
        if (result.responseType === 'refuses') {
          console.log(`   ✅ EXCELLENT: Refuse poliment et reste dans son rôle`)
        } else if (result.responseType === 'invents') {
          console.log(`   ❌ PROBLÉMATIQUE: Invente des informations hors contexte`)
        } else if (result.responseType === 'mixes') {
          console.log(`   ⚠️  RISQUÉ: Mélange contexte et connaissances générales`)
        } else {
          console.log(`   🤔 AMBIGU: Reconnaît ses limites mais comportement à surveiller`)
        }
      }
    }
    
    // Résumé global et verdict
    console.log('\n📊 RÉSUMÉ GLOBAL')
    console.log('='.repeat(70))
    
    const { overall } = testResults.analysis
    
    console.log(`📊 Questions testées: ${overall.totalQuestions}`)
    console.log(`💰 Coût total: $${overall.totalCost.toFixed(6)}`)
    console.log(`✅ Fidélité contextuelle: ${(overall.overallContextFidelity * 100).toFixed(1)}%`)
    console.log(`⚠️  Taux d'hallucination: ${(overall.overallHallucinationRate * 100).toFixed(1)}%`)
    console.log(`🎯 Score de risque: ${overall.riskScore.toFixed(1)}/100 (plus bas = mieux)`)
    
    // Verdict final
    console.log('\n🏆 VERDICT FINAL')
    console.log('='.repeat(50))
    
    if (overall.recommendedForProduction) {
      console.log('✅ RECOMMANDÉ POUR PRODUCTION')
      console.log('   → Fidélité contextuelle acceptable (≥80%)')
      console.log('   → Taux d\'hallucination contrôlé (≤20%)')
      console.log('   → Score de risque acceptable (≤30)')
    } else {
      console.log('❌ NON RECOMMANDÉ POUR PRODUCTION')
      console.log('   → Risques d\'hallucination trop élevés')
      console.log('   → Nécessite des améliorations avant déploiement')
    }
    
    // Analyse des points forts et faibles
    console.log('\n💡 ANALYSE QUALITATIVE')
    console.log('-'.repeat(30))
    
    const outOfScopeAnalysis = testResults.analysis.byCategory.out_of_scope
    const trapFinanceAnalysis = testResults.analysis.byCategory.trap_finance
    
    if (outOfScopeAnalysis?.staysInContextRate >= 0.8) {
      console.log('✅ POINT FORT: Gère bien les questions complètement hors sujet')
    } else {
      console.log('⚠️  POINT FAIBLE: Tendance à répondre aux questions hors contexte')
    }
    
    if (trapFinanceAnalysis?.staysInContextRate >= 0.8) {
      console.log('✅ POINT FORT: Résiste aux questions piège sur autres banques')
    } else {
      console.log('❌ POINT CRITIQUE: Risque de confusion avec autres institutions financières')
    }
    
    // Recommandations spécifiques
    console.log('\n🔧 RECOMMANDATIONS')
    console.log('-'.repeat(30))
    
    if (overall.overallHallucinationRate > 0.3) {
      console.log('🔴 CRITIQUE: Renforcer les instructions de limitation contextuelle')
      console.log('   → Ajouter plus d\'exemples de refus appropriés')
      console.log('   → Utiliser des phrases de refus plus explicites')
    }
    
    if (overall.overallContextFidelity < 0.7) {
      console.log('🟠 IMPORTANT: Améliorer la fidélité au contexte spécialisé')
      console.log('   → Répéter les instructions de spécialisation Oris Finance')
      console.log('   → Ajouter des sanctions explicites pour sortie de contexte')
    }
    
    if (overall.riskScore > 50) {
      console.log('🔴 URGENT: Score de risque trop élevé pour production')
      console.log('   → Revoir complètement l\'architecture du prompt système')
      console.log('   → Considérer une approche de fine-tuning spécialisé')
    }
    
    // Extrapolation coût pour production
    console.log('\n💰 PROJECTION COÛT PRODUCTION')
    console.log('-'.repeat(40))
    
    const avgCost = overall.totalCost / overall.totalQuestions
    
    console.log(`Coût par question: $${avgCost.toFixed(6)}`)
    console.log(`Coût pour 1000 questions: $${(avgCost * 1000).toFixed(2)}`)
    console.log(`Coût pour 10000 questions: $${(avgCost * 10000).toFixed(2)}`)
    
    if (avgCost > 0.01) {
      console.log('⚠️  ATTENTION: Coût élevé pour usage intensif')
    } else {
      console.log('✅ Coût acceptable pour production')
    }
    
    console.log('\n🎉 Test d\'hallucination terminé !')
    console.log(`📊 ${testResults.results.length} questions testées`)
    console.log(`💰 Coût total: $${overall.totalCost.toFixed(6)}`)
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'hallucination:', error)
    
    if (error instanceof Error && error.message.includes('fichier')) {
      console.log('\n💡 DIAGNOSTIC:')
      console.log('• Le fichier test-file-50k.txt est requis')
      console.log('• Vérifiez que le fichier existe et est accessible')
      console.log('• Le fichier doit contenir le contenu Oris Finance de 50k caractères')
    }
    
    process.exit(1)
  }
}

main()