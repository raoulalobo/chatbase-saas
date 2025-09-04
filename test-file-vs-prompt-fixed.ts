/**
 * Script d'exécution des tests de comparaison (version corrigée)
 * Fichier uploadé vs Prompt système avec 50k caractères
 */

import { FileUploadTestService } from './test-file-upload-50k-fixed'

console.log('🎆 COMPARAISON COÛTS: FICHIER UPLOADÉ vs PROMPT SYSTÈME')
console.log('='.repeat(70))
console.log('📊 Test avec contenu de 50 000 caractères exactement')
console.log('🤖 Modèle: Claude Haiku (claude-3-5-haiku-20241022)')

async function main() {
  try {
    const testResults = await FileUploadTestService.runComparisonTest()
    
    console.log('\n📊 RÉSULTATS DÉTAILLÉS:')
    console.log('='.repeat(50))
    
    // Affichage détaillé des résultats
    const questions = new Set(testResults.results.map(r => r.question))
    
    for (const question of questions) {
      const withFile = testResults.results.find(r => r.question === question && r.method === 'file-upload')
      const withPrompt = testResults.results.find(r => r.question === question && r.method === 'system-prompt')
      
      console.log('\n❓ QUESTION:', question)
      
      if (withFile) {
        console.log('\n📁 AVEC FICHIER UPLOADÉ:')
        if (withFile.error) {
          console.log('   ❌ Erreur:', withFile.error)
        } else {
          console.log('   📊 Tokens:', withFile.totalTokens, `(${withFile.tokensInput} in + ${withFile.tokensOutput} out)`)
          console.log('   💰 Coût: $' + (
            FileUploadTestService.calculateCost(withFile.tokensInput, 'input') + 
            FileUploadTestService.calculateCost(withFile.tokensOutput, 'output')
          ).toFixed(6))
          console.log('   ⏱️  Temps:', withFile.responseTime + 'ms')
          console.log('   📄 ID fichier:', withFile.fileId)
          console.log('   💬 Réponse:', withFile.response.substring(0, 150) + '...')
        }
      }
      
      if (withPrompt) {
        console.log('\n📜 AVEC PROMPT SYSTÈME:')
        if (withPrompt.error) {
          console.log('   ❌ Erreur:', withPrompt.error)
        } else {
          console.log('   📊 Tokens:', withPrompt.totalTokens, `(${withPrompt.tokensInput} in + ${withPrompt.tokensOutput} out)`)
          console.log('   💰 Coût: $' + (
            FileUploadTestService.calculateCost(withPrompt.tokensInput, 'input') + 
            FileUploadTestService.calculateCost(withPrompt.tokensOutput, 'output')
          ).toFixed(6))
          console.log('   ⏱️  Temps:', withPrompt.responseTime + 'ms')
          console.log('   💬 Réponse:', withPrompt.response.substring(0, 150) + '...')
        }
      }
      
      // Comparaison directe
      if (withFile && withPrompt && !withFile.error && !withPrompt.error) {
        const tokenDiff = withPrompt.totalTokens - withFile.totalTokens
        const costDiff = (
          FileUploadTestService.calculateCost(withPrompt.tokensInput, 'input') + 
          FileUploadTestService.calculateCost(withPrompt.tokensOutput, 'output')
        ) - (
          FileUploadTestService.calculateCost(withFile.tokensInput, 'input') + 
          FileUploadTestService.calculateCost(withFile.tokensOutput, 'output')
        )
        
        console.log('\n⚖️  COMPARAISON DIRECTE:')
        console.log('   ⚙️  Différence tokens:', tokenDiff > 0 ? '+' + tokenDiff : tokenDiff)
        console.log('   💸 Différence coût: $' + (costDiff >= 0 ? '+' : '') + costDiff.toFixed(6))
        console.log('   ' + (tokenDiff < 0 ? '💰 ÉCONOMIE avec fichier' : '💸 SURCOÛT avec fichier'))
      }
      
      console.log('-'.repeat(50))
    }
    
    // Résumé comparatif global
    console.log('\n🎯 ANALYSE COMPARATIVE GLOBALE:')
    console.log('='.repeat(50))
    
    const { comparison } = testResults
    
    console.log('\n📁 FICHIER UPLOADÉ (total):')
    console.log('   📊 Tokens totaux:', comparison.fileUpload.totalTokens)
    console.log('   💰 Coût total: $' + comparison.fileUpload.totalCost.toFixed(6))
    console.log('   ⏱️  Temps moyen:', Math.round(comparison.fileUpload.avgResponseTime) + 'ms')
    
    console.log('\n📜 PROMPT SYSTÈME (total):')
    console.log('   📊 Tokens totaux:', comparison.systemPrompt.totalTokens)
    console.log('   💰 Coût total: $' + comparison.systemPrompt.totalCost.toFixed(6))
    console.log('   ⏱️  Temps moyen:', Math.round(comparison.systemPrompt.avgResponseTime) + 'ms')
    
    console.log('\n⚖️  DIFFÉRENCES:')
    console.log('   ⚙️  Tokens:', comparison.difference.tokensDiff > 0 ? '+' + comparison.difference.tokensDiff : comparison.difference.tokensDiff)
    console.log('   💸 Coût: $' + (comparison.difference.costDiff >= 0 ? '+' : '') + comparison.difference.costDiff.toFixed(6))
    console.log('   ⏱️  Temps:', (comparison.difference.timeDiff >= 0 ? '+' : '') + Math.round(comparison.difference.timeDiff) + 'ms')
    
    if (comparison.difference.costSavingsPercent !== 0) {
      console.log('   📈 Économie relative:', Math.abs(comparison.difference.costSavingsPercent).toFixed(1) + '%')
    }
    
    // Extrapolation pour 1000 requêtes
    console.log('\n🚀 EXTRAPOLATION POUR 1000 REQUÊTES:')
    console.log('='.repeat(50))
    
    const fileUpload1k = {
      tokens: comparison.fileUpload.totalTokens * 200, // 5 questions -> 1000 req = x200
      cost: comparison.fileUpload.totalCost * 200
    }
    
    const systemPrompt1k = {
      tokens: comparison.systemPrompt.totalTokens * 200,
      cost: comparison.systemPrompt.totalCost * 200
    }
    
    console.log('📁 Fichier uploadé (1000 req):', fileUpload1k.tokens.toLocaleString(), 'tokens, $' + fileUpload1k.cost.toFixed(2))
    console.log('📜 Prompt système (1000 req):', systemPrompt1k.tokens.toLocaleString(), 'tokens, $' + systemPrompt1k.cost.toFixed(2))
    console.log('💰 Économie avec fichiers: $' + (systemPrompt1k.cost - fileUpload1k.cost).toFixed(2))
    
    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:')
    console.log('='.repeat(50))
    
    if (comparison.difference.costDiff < 0) {
      console.log('✅ Les fichiers uploadés sont plus économiques')
      console.log('   → Utiliser l\'API Files pour les gros contenus (>10k caractères)')
      console.log('   → Économie significative sur les conversations longues')
      console.log('   → Réduction de la consommation de tokens d\'input')
    } else {
      console.log('⚠️  Les prompts système sont plus économiques pour ce cas')
      console.log('   → Évaluer le ratio coût/complexité de mise en œuvre')
      console.log('   → L\'API Files peut avoir des coûts cachés ou ne pas supporter les fichiers texte')
    }
    
    if (Math.abs(comparison.difference.timeDiff) > 1000) {
      console.log('⏱️  Différence de performance notable:', Math.abs(comparison.difference.timeDiff) + 'ms')
      console.log('   → Considérer l\'expérience utilisateur dans le choix')
    }
    
    // Notes importantes
    console.log('\n📝 NOTES IMPORTANTES:')
    console.log('='.repeat(50))
    console.log('• L\'API Files est en beta et peut évoluer')
    console.log('• La syntaxe d\'utilisation des fichiers dans les messages n\'est pas documentée')
    console.log('• Les résultats peuvent varier selon la disponibilité de l\'API Files')
    console.log('• Test réalisé avec Claude Haiku - les coûts peuvent différer avec Sonnet')
    
    console.log('\n🎉 Test terminé avec succès !')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('HTTP 400') || error.message.includes('HTTP 401')) {
        console.log('\n💡 DIAGNOSTIC:')
        console.log('• L\'API Files semble ne pas être accessible avec cette clé API')
        console.log('• Vérifiez que votre compte a accès aux API beta d\'Anthropic')
        console.log('• L\'API Files pourrait nécessiter une autorisation spéciale')
      }
    }
    
    console.log('\n🔄 ALTERNATIVE: Utilisez les résultats du test-50k-prompt.ts existant')
    console.log('   Celui-ci compare déjà prompt court vs prompt long de 50k caractères')
    
    process.exit(1)
  }
}

main()