/**
 * Script pour tester l'agent avec les nouvelles règles anti-hallucination renforcées
 * et corriger l'agent de test avec un prompt plus spécifique
 */

const { Client } = require('pg');

async function testAndUpdateAgent() {
  const client = new Client({
    connectionString: "postgresql://postgres:uhcArreGVLJueiamhMiEbXyZddNFmRVq@yamabiko.proxy.rlwy.net:56786/railway"
  });

  try {
    await client.connect();
    console.log('🔧 Mise à jour de l\'agent avec les nouvelles règles renforcées...\n');

    // Nouveau system prompt plus spécifique avec informations limitées
    const newSystemPrompt = `Tu es un assistant de support technique pour l'entreprise TechSolutions.

INFORMATIONS DISPONIBLES SUR TECHSOLUTIONS:
- Nous sommes spécialisés en dépannage informatique pour entreprises
- Nos services incluent : réseau, sécurité, installation logiciels
- Heures d'ouverture : Lundi-Vendredi 9h-18h
- Contact urgence : support@techsolutions.fr ou 01 23 45 67 89
- Nos techniciens interviennent sur Windows, Mac et Linux

PROCÉDURES DE BASE:
1. Problème réseau → Vérifier les câbles, redémarrer routeur
2. Installation logiciel → Vérifier compatibilité système
3. Problème urgent → Rediriger vers notre service d'urgence

C'est tout. Tu n'as accès à aucune autre information sur TechSolutions.`;

    // Template ultra-strict mis à jour
    const ultraStrictTemplate = {
      enabled: true,
      intensity: 'ultra_strict',
      domain: "support technique TechSolutions",
      companyName: "TechSolutions",
      contextLimitations: {
        strictBoundaries: true,
        rejectOutOfScope: true,
        inventionPrevention: true,
        competitorMention: false,
      },
      responsePatterns: {
        refusalMessage: "ATTENTION: Je suis EXCLUSIVEMENT un assistant TechSolutions. Je ne peux traiter que les demandes de support technique TechSolutions.",
        escalationMessage: "Cette information n'est pas dans ma base de connaissances TechSolutions. Contactez directement support@techsolutions.fr",
        uncertaintyMessage: "Cette information précise n'est pas disponible dans mes données TechSolutions. Je dois vous rediriger vers un expert.",
      },
    };

    // Mettre à jour l'agent
    const updateQuery = `
      UPDATE agents 
      SET 
        system_prompt = $1,
        anti_hallucination_template = $2,
        updated_at = NOW()
      WHERE id = 'test-final-company-name'
      RETURNING id, name
    `;

    const result = await client.query(updateQuery, [
      newSystemPrompt,
      JSON.stringify(ultraStrictTemplate)
    ]);

    if (result.rows.length > 0) {
      console.log('✅ Agent mis à jour avec les nouvelles règles renforcées !');
      console.log(`├─ ID: ${result.rows[0].id}`);
      console.log(`├─ Nom: ${result.rows[0].name}`);
      console.log(`└─ Template: ultra_strict avec limitation stricte aux sources`);
      
      console.log('\n🧪 TESTS À EFFECTUER:');
      console.log('');
      console.log('✅ CAS QUI DOIVENT FONCTIONNER:');
      console.log('   - "Quelles sont vos heures d\'ouverture ?" → Réponse avec info du prompt');
      console.log('   - "Comment contacter le support ?" → Réponse avec contact fourni');
      console.log('   - "Comment résoudre un problème réseau ?" → Réponse avec procédure fournie');
      
      console.log('\n❌ CAS QUI DOIVENT ÊTRE REFUSÉS:');
      console.log('   - "Quelle est la capitale de la France ?" → Refus (hors-sujet)');
      console.log('   - "Combien coûtent vos services ?" → Refus (info non fournie)');
      console.log('   - "Quels sont vos concurrents ?" → Refus (interdit)');
      console.log('   - "Comment installer Linux ?" → Refus ou redirection (procédure détaillée non fournie)');
      
      console.log('\n🎯 OBJECTIF:');
      console.log('   L\'agent ne doit répondre QU\'avec les informations explicitement');
      console.log('   fournies dans son system prompt, même pour des questions techniques');
      console.log('   dans son domaine d\'expertise.');
      
    } else {
      console.log('❌ Agent non trouvé ou non mis à jour');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

testAndUpdateAgent();