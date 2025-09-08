/**
 * Script pour examiner directement les données de la base via l'URL de connexion
 */

const { Client } = require('pg');

async function debugDatabase() {
  const client = new Client({
    connectionString: "postgresql://postgres:uhcArreGVLJueiamhMiEbXyZddNFmRVq@yamabiko.proxy.rlwy.net:56786/railway"
  });

  try {
    await client.connect();
    console.log('🔗 Connexion à la base de données établie\n');

    // Rechercher l'agent problématique
    console.log('🔍 Recherche de l\'agent "test-final-company-name"...\n');
    
    const agentQuery = `
      SELECT 
        id, 
        name, 
        description,
        system_prompt,
        restrict_to_prompt_system,
        temperature,
        max_tokens,
        top_p,
        model,
        is_active,
        created_at
      FROM agents 
      WHERE id LIKE '%test-final%' OR name LIKE '%Test Final%'
      ORDER BY created_at DESC
    `;
    
    const result = await client.query(agentQuery);
    
    if (result.rows.length === 0) {
      console.log('❌ Aucun agent trouvé avec "test-final" dans le nom ou l\'ID\n');
      
      // Lister tous les agents disponibles
      console.log('📋 Agents disponibles:');
      const allAgentsQuery = 'SELECT id, name, restrict_to_prompt_system FROM agents ORDER BY created_at DESC LIMIT 10';
      const allAgents = await client.query(allAgentsQuery);
      
      allAgents.rows.forEach(agent => {
        console.log(`- ${agent.name} (${agent.id}) - restrictToPromptSystem: ${agent.restrict_to_prompt_system}`);
      });
    } else {
      console.log(`✅ ${result.rows.length} agent(s) trouvé(s):\n`);
      
      result.rows.forEach((agent, index) => {
        console.log(`📊 AGENT ${index + 1}: ${agent.name}`);
        console.log(`├─ ID: ${agent.id}`);
        console.log(`├─ Description: ${agent.description}`);
        console.log(`├─ restrictToPromptSystem: ${agent.restrict_to_prompt_system ? '✅ TRUE' : '❌ FALSE'}`);
        console.log(`├─ Modèle: ${agent.model}`);
        console.log(`├─ Température: ${agent.temperature}`);
        console.log(`├─ Max tokens: ${agent.max_tokens}`);
        console.log(`├─ Top P: ${agent.top_p}`);
        console.log(`├─ Actif: ${agent.is_active ? '✅' : '❌'}`);
        console.log(`└─ System Prompt (200 premiers chars):`);
        console.log(`   "${agent.system_prompt.substring(0, 200)}..."\n`);
        
        // Diagnostic
        console.log(`🎯 DIAGNOSTIC:`);
        if (!agent.restrict_to_prompt_system) {
          console.log(`   ❌ PROBLÈME TROUVÉ: restrictToPromptSystem = FALSE`);
          console.log(`   💡 SOLUTION: Activer restrictToPromptSystem dans l'interface\n`);
        } else {
          console.log(`   ✅ restrictToPromptSystem est correctement activé`);
          console.log(`   🔍 Le problème doit venir du system prompt ou de la logique Anthropic\n`);
        }
        
        console.log(`${'='.repeat(80)}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

debugDatabase();