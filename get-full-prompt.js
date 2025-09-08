/**
 * Script pour récupérer le system prompt complet de l'agent
 */

const { Client } = require('pg');

async function getFullPrompt() {
  const client = new Client({
    connectionString: "postgresql://postgres:uhcArreGVLJueiamhMiEbXyZddNFmRVq@yamabiko.proxy.rlwy.net:56786/railway"
  });

  try {
    await client.connect();
    console.log('🔍 Récupération du system prompt complet...\n');

    const query = `
      SELECT system_prompt 
      FROM agents 
      WHERE id = 'test-final-company-name'
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length > 0) {
      console.log('📝 SYSTEM PROMPT COMPLET:');
      console.log('=' .repeat(80));
      console.log(result.rows[0].system_prompt);
      console.log('=' .repeat(80));
      
      // Analyser le prompt
      const prompt = result.rows[0].system_prompt;
      
      console.log('\n🔍 ANALYSE DU PROMPT:');
      console.log(`├─ Longueur: ${prompt.length} caractères`);
      
      const domainKeywords = ['spécialisé', 'domaine', 'expertise', 'uniquement', 'seulement', 'limité'];
      const foundKeywords = domainKeywords.filter(keyword => 
        prompt.toLowerCase().includes(keyword)
      );
      
      if (foundKeywords.length > 0) {
        console.log(`├─ Mots-clés de spécialisation trouvés: ${foundKeywords.join(', ')}`);
      } else {
        console.log(`├─ ❌ PROBLÈME: Aucun mot-clé de spécialisation trouvé`);
        console.log(`├─ Le prompt ne définit pas de domaine d'expertise spécifique`);
      }
      
      if (prompt.toLowerCase().includes('assistant professionnel')) {
        console.log(`├─ ⚠️  Prompt générique détecté: "assistant professionnel"`);
        console.log(`└─ 💡 SOLUTION: Modifier le prompt pour définir un domaine spécifique`);
      }
      
    } else {
      console.log('❌ Agent non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

getFullPrompt();