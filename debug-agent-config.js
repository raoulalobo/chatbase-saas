/**
 * Script pour examiner la configuration d'un agent spécifique
 * Version Node.js sans Prisma pour éviter les problèmes de génération
 */

async function debugAgentConfig() {
  try {
    console.log('🔍 Investigation de la configuration agent...\n')
    
    // URL de test de l'API
    const agentId = 'test-final-company-name'
    const testUrl = 'http://localhost:3001/api/test-db'
    
    console.log(`📋 Test de connexion à la base de données...`)
    
    // Tester la connexion DB d'abord
    const dbResponse = await fetch(testUrl)
    const dbData = await dbResponse.json()
    
    if (dbResponse.ok) {
      console.log('✅ Connexion DB: OK')
      console.log(`📊 Agents trouvés: ${dbData.stats.totalAgents}`)
      console.log(`💬 Conversations: ${dbData.stats.totalConversations}`)
    } else {
      console.log('❌ Erreur DB:', dbData.error)
      return
    }
    
    // Maintenant, testons directement l'agent via l'interface web
    console.log(`\n🎯 Agent à investiguer: "${agentId}"`)
    console.log(`🌐 URL interface: http://localhost:3001/agents/${agentId}`)
    console.log(`💬 URL chat: http://localhost:3001/agents/${agentId}/chat`)
    
    console.log(`\n🔧 ACTIONS MANUELLES RECOMMANDÉES:`)
    console.log(`1. Aller sur http://localhost:3001/agents/${agentId}`)
    console.log(`2. Vérifier la configuration "restrictToPromptSystem"`)
    console.log(`3. Examiner le system prompt de l'agent`)
    console.log(`4. Tester avec une question générale comme "Quelle est la capitale de la France?"`)
    
    console.log(`\n📝 Ce qu'il faut chercher:`)
    console.log(`- restrictToPromptSystem: doit être TRUE`)
    console.log(`- systemPrompt: doit contenir des instructions claires sur le domaine`)
    console.log(`- La réponse doit refuser les questions hors-contexte`)
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

debugAgentConfig()