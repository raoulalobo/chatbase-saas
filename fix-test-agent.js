/**
 * Script pour corriger l'agent de test avec un system prompt restrictif
 */

const { Client } = require('pg');

async function fixTestAgent() {
  const client = new Client({
    connectionString: "postgresql://postgres:uhcArreGVLJueiamhMiEbXyZddNFmRVq@yamabiko.proxy.rlwy.net:56786/railway"
  });

  try {
    await client.connect();
    console.log('🔧 Correction de l\'agent de test...\n');

    // Nouveau system prompt restrictif
    const newSystemPrompt = `Tu es un assistant IA spécialisé EXCLUSIVEMENT dans le support technique informatique de l'entreprise TechSolutions.

TON DOMAINE D'EXPERTISE SE LIMITE À :
- Dépannage Windows, Mac et Linux
- Problèmes de réseau et connectivité
- Installation et configuration de logiciels
- Aide avec matériel informatique (imprimantes, périphériques)
- Questions de sécurité informatique de base

RÈGLES ABSOLUES :
- Tu dois REFUSER toute question qui ne concerne pas le support technique informatique
- Tu ne peux PAS répondre aux questions générales (géographie, histoire, culture, etc.)
- Tu ne peux PAS donner d'informations sur d'autres entreprises
- Tu ne peux PAS faire de comparaisons avec des concurrents

RÉPONSE TYPE POUR QUESTIONS HORS-SUJET :
"Je suis désolé, mais je suis spécialisé uniquement dans le support technique informatique de TechSolutions. Cette question sort de mon domaine d'expertise. Comment puis-je vous aider avec vos problèmes informatiques ?"

Reste toujours professionnel et propose ton aide dans ton domaine de compétence.`;

    // Template ultra-strict pour anti-hallucination
    const ultraStrictTemplate = {
      enabled: true,
      intensity: 'ultra_strict',
      domain: "support technique informatique TechSolutions",
      companyName: "TechSolutions",
      contextLimitations: {
        strictBoundaries: true,
        rejectOutOfScope: true,
        inventionPrevention: true,
        competitorMention: false,
      },
      responsePatterns: {
        refusalMessage: "ATTENTION: Je suis EXCLUSIVEMENT un assistant TechSolutions. Je ne peux pas traiter de demandes externes à TechSolutions.",
        escalationMessage: "Cette demande nécessite un traitement par notre équipe TechSolutions. Contactez-nous directement.",
        uncertaintyMessage: "Cette information n'est pas disponible dans ma base de données TechSolutions. Je dois vous rediriger vers un expert.",
      },
    };

    // Mettre à jour l'agent
    const updateQuery = `
      UPDATE agents 
      SET 
        system_prompt = $1,
        restrict_to_prompt_system = true,
        anti_hallucination_template = $2,
        updated_at = NOW()
      WHERE id = 'test-final-company-name'
      RETURNING id, name, system_prompt
    `;

    const result = await client.query(updateQuery, [
      newSystemPrompt,
      JSON.stringify(ultraStrictTemplate)
    ]);

    if (result.rows.length > 0) {
      console.log('✅ Agent mis à jour avec succès !');
      console.log(`├─ ID: ${result.rows[0].id}`);
      console.log(`├─ Nom: ${result.rows[0].name}`);
      console.log(`├─ restrictToPromptSystem: activé`);
      console.log(`├─ Template: ultra_strict`);
      console.log(`└─ System prompt: ${result.rows[0].system_prompt.substring(0, 100)}...\n`);
      
      console.log('🧪 Test recommandé:');
      console.log('1. Connectez-vous sur http://localhost:3001');
      console.log('2. Allez sur l\'agent "test-final-company-name"');
      console.log('3. Testez avec: "Quelle est la capitale de la France ?"');
      console.log('4. L\'agent doit maintenant REFUSER de répondre');
    } else {
      console.log('❌ Agent non trouvé ou non mis à jour');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

fixTestAgent();