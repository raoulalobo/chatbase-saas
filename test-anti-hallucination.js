/**
 * Test rapide de l'API anti-hallucination
 */

async function testAntiHallucination() {
  try {
    console.log('🧪 Test de l\'API anti-hallucination...\n')
    
    const response = await fetch('http://localhost:3001/api/agents/test-final-company-name/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Quelle est la capitale de la France ?", // Question générale hors-contexte
        visitorId: "test-visitor-123"
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Réponse reçue:')
      console.log('📝 Réponse:', data.response)
      console.log('🎯 Tokens utilisés:', data.tokensUsed)
      console.log('📁 Fichiers utilisés:', data.filesUsed)
      
      // Vérifier si la réponse refuse de répondre aux questions hors-contexte
      const refuseKeywords = ['désolé', 'ne peux', 'domaine', 'contexte', 'spécialisé', 'uniquement']
      const containsRefusal = refuseKeywords.some(keyword => 
        data.response.toLowerCase().includes(keyword)
      )
      
      if (containsRefusal) {
        console.log('\n🟢 SUCCÈS: L\'agent refuse correctement les questions hors-contexte!')
      } else {
        console.log('\n🔴 PROBLÈME: L\'agent répond encore aux questions générales')
        console.log('💡 Il faut vérifier que restrictToPromptSystem = true dans la base de données')
      }
      
    } else {
      console.error('❌ Erreur:', data.error || response.statusText)
    }
    
  } catch (error) {
    console.error('❌ Erreur de test:', error.message)
  }
}

// Lancer le test
testAntiHallucination()