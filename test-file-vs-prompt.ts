/**
 * Script d'ex\u00e9cution des tests de comparaison
 * Fichier upload\u00e9 vs Prompt syst\u00e8me avec 50k caract\u00e8res
 */

import { FileUploadTestService } from './test-file-upload-50k'

console.log('\ud83c\udf86 COMPARAISON CO\u00dbTS: FICHIER UPLOAD\u00c9 vs PROMPT SYST\u00c8ME')
console.log('='.repeat(70))
console.log('\ud83d\udcca Test avec contenu de 50 000 caract\u00e8res exactement')
console.log('\ud83e\udd16 Mod\u00e8le: Claude Haiku (claude-3-5-haiku-20241022)')

async function main() {
  try {
    const testResults = await FileUploadTestService.runComparisonTest()
    
    console.log('\n\ud83d\udcca R\u00c9SULTATS D\u00c9TAILL\u00c9S:')
    console.log('='.repeat(50))
    
    // Affichage d\u00e9taill\u00e9 des r\u00e9sultats
    const questions = new Set(testResults.results.map(r => r.question))
    
    for (const question of questions) {
      const withFile = testResults.results.find(r => r.question === question && r.method === 'file-upload')
      const withPrompt = testResults.results.find(r => r.question === question && r.method === 'system-prompt')
      
      console.log(`\n\u2753 QUESTION: ${question}`)
      
      if (withFile) {
        console.log('\n\ud83d\udcc1 AVEC FICHIER UPLOAD\u00c9:')
        if (withFile.error) {
          console.log(`   \u274c Erreur: ${withFile.error}`)
        } else {
          console.log(`   \ud83d\udcca Tokens: ${withFile.totalTokens} (${withFile.tokensInput} in + ${withFile.tokensOutput} out)`)
          console.log(`   \ud83d\udcb0 Co\u00fbt: $${(
            FileUploadTestService.calculateCost(withFile.tokensInput, 'input') + 
            FileUploadTestService.calculateCost(withFile.tokensOutput, 'output')
          ).toFixed(6)}`)
          console.log(`   \u23f1\ufe0f  Temps: ${withFile.responseTime}ms`)
          console.log(`   \ud83d\udcc4 ID fichier: ${withFile.fileId}`)
          console.log(`   \ud83d\udcac R\u00e9ponse: ${withFile.response.substring(0, 150)}...`)
        }
      }
      
      if (withPrompt) {
        console.log('\n\ud83d\udcdc AVEC PROMPT SYST\u00c8ME:')
        if (withPrompt.error) {
          console.log(`   \u274c Erreur: ${withPrompt.error}`)
        } else {
          console.log(`   \ud83d\udcca Tokens: ${withPrompt.totalTokens} (${withPrompt.tokensInput} in + ${withPrompt.tokensOutput} out)`)
          console.log(`   \ud83d\udcb0 Co\u00fbt: $${(
            FileUploadTestService.calculateCost(withPrompt.tokensInput, 'input') + 
            FileUploadTestService.calculateCost(withPrompt.tokensOutput, 'output')
          ).toFixed(6)}`)
          console.log(`   \u23f1\ufe0f  Temps: ${withPrompt.responseTime}ms`)
          console.log(`   \ud83d\udcac R\u00e9ponse: ${withPrompt.response.substring(0, 150)}...`)
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
        
        console.log('\n\u2696\ufe0f  COMPARAISON DIRECTE:')
        console.log(`   \u2699\ufe0f  Diff\u00e9rence tokens: ${tokenDiff > 0 ? '+' : ''}${tokenDiff}`)
        console.log(`   \ud83d\udcb8 Diff\u00e9rence co\u00fbt: $${costDiff >= 0 ? '+' : ''}${costDiff.toFixed(6)}`)
        console.log(`   ${tokenDiff < 0 ? '\ud83d\udcb0 \u00c9CONOMIE avec fichier' : '\ud83d\udcb8 SURCO\u00dbT avec fichier'}`)
      }
      
      console.log('-'.repeat(50))
    }
    
    // R\u00e9sum\u00e9 comparatif global
    console.log('\n\ud83c\udfaf ANALYSE COMPARATIVE GLOBALE:')
    console.log('='.repeat(50))
    
    const { comparison } = testResults
    
    console.log('\n\ud83d\udcc1 FICHIER UPLOAD\u00c9 (total):')
    console.log(`   \ud83d\udcca Tokens totaux: ${comparison.fileUpload.totalTokens}`)
    console.log(`   \ud83d\udcb0 Co\u00fbt total: $${comparison.fileUpload.totalCost.toFixed(6)}`)
    console.log(`   \u23f1\ufe0f  Temps moyen: ${Math.round(comparison.fileUpload.avgResponseTime)}ms`)
    
    console.log('\n\ud83d\udcdc PROMPT SYST\u00c8ME (total):')
    console.log(`   \ud83d\udcca Tokens totaux: ${comparison.systemPrompt.totalTokens}`)
    console.log(`   \ud83d\udcb0 Co\u00fbt total: $${comparison.systemPrompt.totalCost.toFixed(6)}`)
    console.log(`   \u23f1\ufe0f  Temps moyen: ${Math.round(comparison.systemPrompt.avgResponseTime)}ms`)
    
    console.log('\n\u2696\ufe0f  DIFF\u00c9RENCES:')
    console.log(`   \u2699\ufe0f  Tokens: ${comparison.difference.tokensDiff > 0 ? '+' : ''}${comparison.difference.tokensDiff}`)
    console.log(`   \ud83d\udcb8 Co\u00fbt: $${comparison.difference.costDiff >= 0 ? '+' : ''}${comparison.difference.costDiff.toFixed(6)}`)
    console.log(`   \u23f1\ufe0f  Temps: ${comparison.difference.timeDiff >= 0 ? '+' : ''}${Math.round(comparison.difference.timeDiff)}ms`)
    
    if (comparison.difference.costSavingsPercent !== 0) {
      console.log(`   \ud83d\udcc8 \u00c9conomie relative: ${Math.abs(comparison.difference.costSavingsPercent).toFixed(1)}%`)
    }
    
    // Extrapolation pour 1000 requ\u00eates
    console.log('\n\ud83d\ude80 EXTRAPOLATION POUR 1000 REQ\u00caues:')
    console.log('='.repeat(50))
    
    const fileUpload1k = {
      tokens: comparison.fileUpload.totalTokens * 200, // 5 questions -> 1000 req = x200
      cost: comparison.fileUpload.totalCost * 200
    }
    
    const systemPrompt1k = {
      tokens: comparison.systemPrompt.totalTokens * 200,
      cost: comparison.systemPrompt.totalCost * 200
    }
    
    console.log(`\ud83d\udcc1 Fichier upload\u00e9 (1000 req): ${fileUpload1k.tokens.toLocaleString()} tokens, $${fileUpload1k.cost.toFixed(2)}`)
    console.log(`\ud83d\udcdc Prompt syst\u00e8me (1000 req): ${systemPrompt1k.tokens.toLocaleString()} tokens, $${systemPrompt1k.cost.toFixed(2)}`)
    console.log(`\ud83d\udcb0 \u00c9conomie avec fichiers: $${(systemPrompt1k.cost - fileUpload1k.cost).toFixed(2)}`)
    
    // Recommandations
    console.log('\n\ud83d\udca1 RECOMMANDATIONS:')
    console.log('='.repeat(50))
    
    if (comparison.difference.costDiff < 0) {
      console.log('\u2705 Les fichiers upload\u00e9s sont plus \u00e9conomiques')
      console.log('   \u2192 Utiliser l\'API Files pour les gros contenus (>10k caract\u00e8res)')
      console.log('   \u2192 \u00c9conomie significative sur les conversations longues')
      console.log('   \u2192 R\u00e9duction de la consommation de tokens d\'input')
    } else {
      console.log('\u26a0\ufe0f  Les prompts syst\u00e8me sont plus \u00e9conomiques pour ce cas')
      console.log('   \u2192 \u00c9valuer le ratio co\u00fbt/complexit\u00e9 de mise en œuvre')
      console.log('   \u2192 L\'API Files peut avoir des co\u00fbts cach\u00e9s')
    }
    
    if (Math.abs(comparison.difference.timeDiff) > 1000) {
      console.log(`\u23f1\ufe0f  Diff\u00e9rence de performance notable: ${Math.abs(comparison.difference.timeDiff)}ms`)
      console.log('   \u2192 Consid\u00e9rer l\'exp\u00e9rience utilisateur dans le choix')
    }
    
    console.log('\n\ud83c\udf89 Test termin\u00e9 avec succ\u00e8s !')
    
  } catch (error) {
    console.error('\u274c Erreur lors des tests:', error)
    process.exit(1)
  }
}

main()