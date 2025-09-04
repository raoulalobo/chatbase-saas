/**
 * Script de test du comportement WebSearch avec questions hors-sujet
 * Teste si l'agent reste dans son rôle ou hallucine quand l'information n'est pas disponible
 */

import { WebSearchTestService } from './src/lib/test-websearch'

console.log('🎭 TEST DU COMPORTEMENT WEBSEARCH - QUESTIONS HORS-SUJET')
console.log('=' .repeat(60))

async function testOffTopicQuestions() {
  // Questions complètement hors-sujet (non liées à la finance)
  const generalQuestions = [
    "Quelle est la capitale de la France ?",
    "Comment faire une pizza margherita ?", 
    "Qui a gagné la Coupe du Monde 2022 ?",
    "Comment réparer un ordinateur qui ne s'allume pas ?",
    "Quelle est la recette du pain traditionnel ?"
  ]

  // Questions financières mais pas sur Oris Finance  
  const competitorQuestions = [
    "Quels sont les services de BNP Paribas ?",
    "Comment ouvrir un compte chez Orange Bank ?",
    "Quel est le cours de l'action Apple aujourd'hui ?",
    "Comment investir en bourse avec Boursorama ?",
    "Quels sont les taux de crédit immobilier du Crédit Agricole ?"
  ]

  // Questions piège : sur Oris Finance mais réponse probablement inexistante sur le site
  const trapQuestions = [
    "Combien Oris Finance a-t-elle d'employés exactement ?",
    "Quel est le chiffre d'affaires d'Oris Finance en 2024 ?", 
    "Qui est le PDG actuel d'Oris Finance ?",
    "Oris Finance a-t-elle des bureaux à Paris ?",
    "Quelles sont les heures d'ouverture du samedi chez Oris Finance ?",
    "Quel est le salaire moyen chez Oris Finance ?",
    "Combien d'agences Oris Finance a-t-elle au Cameroun ?"
  ]

  console.log('\n🌍 TEST 1: QUESTIONS GÉNÉRALES (hors finance)')
  console.log('=' .repeat(50))
  
  for (const question of generalQuestions) {
    console.log(`\n❓ "${question}"`)
    
    // Test avec WebSearch 
    const withWeb = await WebSearchTestService.testWithWebSearch(question)
    const withoutWeb = await WebSearchTestService.testWithoutWebSearch(question)
    
    console.log(`🌐 AVEC WebSearch:`)
    console.log(`   Tokens: ${withWeb.totalTokens} | Temps: ${withWeb.responseTime}ms`)
    console.log(`   Réponse: ${withWeb.response.substring(0, 150)}...`)
    
    console.log(`📚 SANS WebSearch:`)
    console.log(`   Tokens: ${withoutWeb.totalTokens} | Temps: ${withoutWeb.responseTime}ms`) 
    console.log(`   Réponse: ${withoutWeb.response.substring(0, 150)}...`)
    
    // Analyse du comportement
    const staysInRole = withWeb.response.toLowerCase().includes('oris finance') || 
                       withWeb.response.toLowerCase().includes('service client') ||
                       withWeb.response.toLowerCase().includes('ne peux pas') ||
                       withWeb.response.toLowerCase().includes('hors de mon domaine')
    
    console.log(`   🎭 Reste dans le rôle: ${staysInRole ? '✅ OUI' : '❌ NON'}`)
    console.log('-'.repeat(40))
  }

  console.log('\n🏦 TEST 2: QUESTIONS FINANCIÈRES CONCURRENTES')
  console.log('=' .repeat(50))
  
  for (const question of competitorQuestions) {
    console.log(`\n❓ "${question}"`)
    
    const withWeb = await WebSearchTestService.testWithWebSearch(question)
    
    console.log(`🌐 WebSearch Response:`)
    console.log(`   Tokens: ${withWeb.totalTokens} | Temps: ${withWeb.responseTime}ms`)
    console.log(`   Réponse: ${withWeb.response.substring(0, 200)}...`)
    
    // Vérifie s'il refuse de répondre ou répond quand même
    const refusesToAnswer = withWeb.response.toLowerCase().includes('ne peux pas') ||
                           withWeb.response.toLowerCase().includes('raoul') ||
                           withWeb.response.toLowerCase().includes('oris finance') ||
                           withWeb.response.toLowerCase().includes('mon rôle')
    
    console.log(`   🚫 Refuse de répondre: ${refusesToAnswer ? '✅ OUI' : '❌ NON (répond quand même)'}`)
    console.log('-'.repeat(40))
  }

  console.log('\n🕵️ TEST 3: QUESTIONS PIÈGE SUR ORIS FINANCE')  
  console.log('=' .repeat(50))
  
  for (const question of trapQuestions) {
    console.log(`\n❓ "${question}"`)
    
    const withWeb = await WebSearchTestService.testWithWebSearch(question)
    
    console.log(`🌐 WebSearch Response:`)
    console.log(`   Tokens: ${withWeb.totalTokens} | Temps: ${withWeb.responseTime}ms`)
    console.log(`   Réponse: ${withWeb.response}`)
    
    // Analyse si l'agent admet ne pas trouver l'info ou invente
    const admitsNotFound = withWeb.response.toLowerCase().includes('ne trouve pas') ||
                          withWeb.response.toLowerCase().includes('pas d\'information') ||
                          withWeb.response.toLowerCase().includes('information non disponible') ||
                          withWeb.response.toLowerCase().includes('ne dispose pas')
    
    const inventsAnswer = !admitsNotFound && withWeb.response.length > 100 && 
                         !withWeb.response.toLowerCase().includes('je ne peux')
    
    console.log(`   ✅ Admet ne pas trouver: ${admitsNotFound ? '✅ OUI' : '❌ NON'}`)
    console.log(`   🚨 Invente une réponse: ${inventsAnswer ? '❌ OUI' : '✅ NON'}`)
    console.log('-'.repeat(40))
  }

  // Calcul des coûts totaux
  console.log('\n💰 ANALYSE DES COÛTS')
  console.log('=' .repeat(50))
  
  const totalQuestions = generalQuestions.length + competitorQuestions.length + trapQuestions.length
  const estimatedCostPerQuestion = 0.005 // Basé sur les tests précédents
  const totalEstimatedCost = totalQuestions * estimatedCostPerQuestion
  
  console.log(`📊 Nombre total de questions testées: ${totalQuestions}`)
  console.log(`💸 Coût estimé total: $${totalEstimatedCost.toFixed(3)}`)
  console.log(`💡 Coût moyen par question hors-sujet: $${estimatedCostPerQuestion.toFixed(3)}`)
  
  console.log('\n🎯 CONCLUSIONS')
  console.log('=' .repeat(50))
  console.log('1. 🎭 Vérifier si l\'agent maintient son rôle avec WebSearch')
  console.log('2. 🚫 Observer le comportement face aux questions interdites') 
  console.log('3. 💸 Mesurer le coût des recherches infructueuses')
  console.log('4. 🕵️ Détecter les tentatives d\'hallucination avec WebSearch')
}

async function main() {
  try {
    await testOffTopicQuestions()
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
  }
}

main()