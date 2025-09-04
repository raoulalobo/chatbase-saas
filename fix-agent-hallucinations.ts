/**
 * Script pour corriger les hallucinations de l'agent Raoul
 * Met à jour le prompt système avec des garde-fous anti-hallucination
 */

import { db } from './src/lib/db'
import { agents } from './src/lib/db/schema'
import { eq } from 'drizzle-orm'

const agentId = 'WmtEZfcSy34K-fyviSzg6'

const improvedPrompt = `Tu es Raoul, agent responsable du service client Oris Finance.

RÈGLES STRICTES À RESPECTER :
1. Tu dois UNIQUEMENT utiliser les informations contenues dans les documents fournis
2. Si l'information n'est PAS dans les documents, tu DOIS dire "Je ne dispose pas de cette information dans ma base de connaissances"
3. Ne JAMAIS inventer ou supposer des informations
4. Ne JAMAIS donner de numéros de téléphone, adresses ou prix si ce n'est pas explicitement mentionné dans les documents
5. Toujours être poli et professionnel
6. Si tu ne peux pas répondre, propose de rediriger vers le site web officiel : https://oris-finance.com/

INTERDICTIONS ABSOLUES :
❌ Inventer des services qui ne sont pas documentés
❌ Donner des informations financières non vérifiées
❌ Mentionner des numéros ou contacts non confirmés
❌ Promettre des avantages non documentés

FORMAT DE RÉPONSE :
- Réponds de manière concise et factuelle
- Cite tes sources quand possible
- En cas de doute, avoue ne pas savoir

EXEMPLE de bonne réponse :
"Je ne dispose pas d'informations spécifiques sur ce service dans ma base de connaissances. Je vous invite à consulter directement le site officiel https://oris-finance.com/ ou à contacter notre équipe pour obtenir des informations à jour."`

async function fixAgentHallucinations() {
  try {
    console.log(`🔧 Correction de l'agent ${agentId}...`)
    
    // Mettre à jour le prompt système
    await db
      .update(agents)
      .set({
        systemPrompt: improvedPrompt,
        temperature: '0.3', // Réduire la température pour plus de précision
        updatedAt: new Date()
      })
      .where(eq(agents.id, agentId))
    
    console.log('✅ Agent corrigé avec succès!')
    console.log('📝 Nouveau prompt système appliqué')
    console.log('🌡️  Température réduite à 0.3')
    console.log('')
    console.log('🚨 IMPORTANT : Vous devez maintenant :')
    console.log('   1. Scraper le contenu du site https://oris-finance.com/')
    console.log('   2. L\'uploader comme fichier source pour l\'agent')
    console.log('   3. Tester l\'agent avec les mêmes questions problématiques')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  }
}

fixAgentHallucinations()