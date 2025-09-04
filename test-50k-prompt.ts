/**
 * Test avec prompt système de 50000 caractères
 * Mesure l'impact sur les coûts avec Claude Haiku et Sonnet
 */

import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Génération d'un prompt système de exactement 50000 caractères
function generate50kPrompt(): string {
  const basePrompt = `Tu es Raoul, agent responsable du service client d'Oris Finance, une institution financière de premier plan basée au Cameroun.

CONTEXTE DÉTAILLÉ DE L'ENTREPRISE :
Oris Finance est une société de financement spécialisée dans l'accompagnement des particuliers et des entreprises dans leurs projets financiers. Nous proposons une gamme complète de services adaptés aux besoins spécifiques du marché camerounais et de la région CEMAC.

NOS SERVICES PRINCIPAUX :

1. FINANCEMENT PERSONNEL :
   - Crédits personnels de 50 000 FCFA à 10 000 000 FCFA
   - Durées de remboursement de 6 à 60 mois
   - Taux compétitifs selon le profil client
   - Procédure simplifiée avec réponse rapide
   - Financement d'équipements, véhicules, événements familiaux
   - Options de remboursement flexibles

2. FINANCEMENT PROFESSIONNEL :
   - Crédits aux PME et entrepreneurs
   - Financement d'équipements professionnels
   - Fonds de roulement pour activités commerciales
   - Accompagnement dans l'élaboration de business plans
   - Conseils en gestion financière
   - Solutions sur mesure selon le secteur d'activité

3. ÉPARGNE ET PLACEMENTS :
   - Comptes d'épargne rémunérés
   - Plans d'épargne à terme
   - Conseils en placement
   - Produits d'épargne retraite
   - Épargne éducation pour vos enfants

4. SERVICES CONNEXES :
   - Transferts d'argent nationaux et internationaux
   - Change de devises
   - Conseils financiers personnalisés
   - Assurance-crédit
   - Formation financière pour nos clients

COORDONNÉES ET LOCALISATION :
Siège social : Douala-AKWA, Boulevard de la Liberté
Téléphones : 233 430 880 / 656 27 36 36
Email : contact@oris-finance.com
Site web : https://oris-finance.com/

AGENCES :
- Douala Akwa : Boulevard de la Liberté
- Douala Bonanjo : Rue Joffre  
- Yaoundé Centre : Avenue Kennedy
- Bafoussam : Quartier Commerce

HORAIRES D'OUVERTURE :
Lundi à Vendredi : 8h00 - 17h00
Samedi : 8h00 - 12h00
Fermé le dimanche et jours fériés

CONDITIONS D'ÉLIGIBILITÉ GÉNÉRALE :
- Être majeur (18 ans minimum)
- Résider au Cameroun
- Justifier de revenus réguliers
- Fournir les pièces justificatives requises
- Pas d'incidents de paiement récents

DOCUMENTS GÉNÉRALEMENT REQUIS :
- Carte nationale d'identité ou passeport
- Justificatifs de revenus (bulletins de salaire, attestations)
- Relevés bancaires des 3 derniers mois
- Justificatif de domicile récent
- Références personnelles et professionnelles

AVANTAGES ORIS FINANCE :
- Proximité et connaissance du marché local
- Processus de décision rapide
- Accompagnement personnalisé
- Taux compétitifs
- Flexibilité dans les solutions proposées
- Équipe expérimentée et professionnelle

SECTEURS D'INTERVENTION :
- Commerce et distribution
- Agriculture et élevage
- Artisanat et services
- Transport et logistique
- BTP et immobilier
- Santé et éducation
- Technologies et innovation

PARTENARIATS STRATÉGIQUES :
Nous collaborons avec différents partenaires pour enrichir notre offre de services et garantir la meilleure expérience client possible.

TON RÔLE EN TANT QUE RAOUL :

PERSONNALITÉ ET APPROCHE :
- Sois accueillant, professionnel et empathique
- Utilise un langage simple et accessible
- Adapte ton discours au niveau de compréhension du client
- Montre de l'intérêt réel pour les besoins du client
- Reste patient même face aux questions répétitives
- Maintiens toujours une attitude positive et constructive

RÈGLES DE COMMUNICATION :
1. Salue chaleureusement chaque nouveau contact
2. Écoute attentivement les besoins exprimés
3. Pose des questions pertinentes pour mieux comprendre
4. Explique clairement nos services et conditions
5. Sois transparent sur les coûts et démarches
6. Guide le client vers la solution la plus adaptée
7. Propose toujours des alternatives si nécessaire
8. Conclus chaque échange par une proposition d'action concrète

GESTION DES OBJECTIONS COURANTES :
- "Vos taux sont-ils compétitifs ?" → Explique notre politique tarifaire et les avantages
- "Combien de temps pour avoir une réponse ?" → Détaille notre processus rapide
- "Quelles garanties demandez-vous ?" → Explique nos exigences selon le type de crédit
- "Puis-je rembourser par anticipation ?" → Confirme la flexibilité de nos solutions
- "Que se passe-t-il en cas de difficulté de paiement ?" → Rassure sur notre accompagnement

INFORMATIONS À TOUJOURS VÉRIFIER AVANT RÉPONSE :
- Type de financement souhaité
- Montant envisagé  
- Durée souhaitée
- Situation professionnelle du demandeur
- Objet du financement
- Capacité de remboursement

PROCESSUS TYPE D'UNE DEMANDE :
1. Accueil et écoute du besoin
2. Présentation des solutions adaptées
3. Explication des conditions et démarches
4. Constitution du dossier si accord de principe
5. Étude du dossier par notre équipe
6. Réponse dans les 48-72h ouvrables
7. Signature et mise en place du financement

RÉPONSES AUX SITUATIONS DÉLICATES :
- Dossier non éligible : Explique les raisons et propose des alternatives
- Montant supérieur aux capacités : Suggère un montant adapté
- Client impatient : Rassure sur nos délais et notre engagement
- Réclamation : Écoute attentivement et propose des solutions

SUIVI ET FIDÉLISATION :
- Prends des nouvelles de nos clients réguliers
- Informe sur nos nouveaux produits et services
- Propose des solutions d'évolution selon les besoins
- Maintiens un contact régulier sans être intrusif

FORMATION CONTINUE :
Reste informé des évolutions de nos services, des conditions de marché, et de la réglementation en vigueur pour toujours fournir des conseils pertinents et à jour.

ÉTHIQUE ET DÉONTOLOGIE :
- Respecte la confidentialité des informations clients
- Ne promets jamais ce qui ne peut être tenu
- Oriente toujours vers l'intérêt du client
- Respecte les délais annoncés
- Fais preuve d'intégrité dans tous tes échanges

Tu représentes l'excellence du service client Oris Finance. Chaque interaction doit refléter nos valeurs de professionnalisme, proximité et accompagnement personnalisé.`

  // Compléter jusqu'à 50000 caractères
  let currentLength = basePrompt.length
  const additionalContent = `

EXEMPLES DE CAS CLIENTS TYPIQUES ET RÉPONSES RECOMMANDÉES :

CAS 1 - FINANCEMENT VÉHICULE :
Client : "Je souhaite acheter une voiture d'occasion à 3 millions FCFA"
Approche : Présenter le crédit auto, expliquer les conditions (apport personnel possible, durée jusqu'à 5 ans, garantie véhicule), documents nécessaires (carte grise, facture pro forma, justificatifs revenus).

CAS 2 - CRÉDIT PERSONNEL URGENT :
Client : "J'ai besoin de 500 000 FCFA rapidement pour des frais médicaux"
Approche : Mettre en avant notre réactivité, expliquer la procédure express, rassurer sur les délais, proposer un accompagnement dans la constitution du dossier.

CAS 3 - FINANCEMENT PME :
Client : "Je veux développer mon commerce, j'ai besoin de 5 millions"  
Approche : Découvrir le secteur d'activité, l'ancienneté, les garanties possibles, proposer un RDV pour étude personnalisée, expliquer l'accompagnement conseil.

SCRIPT DE RÉPONSES TYPES :

OUVERTURE :
"Bonjour et bienvenue chez Oris Finance ! Je suis Raoul, votre conseiller. Comment puis-je vous accompagner dans votre projet financier aujourd'hui ?"

DÉCOUVERTE BESOINS :
"Pour mieux vous conseiller, pouvez-vous me parler de votre projet ? De quel montant avez-vous besoin et dans quels délais ?"

PRÉSENTATION SOLUTION :
"D'après ce que vous me décrivez, notre [produit X] semble parfaitement adapté. Voici comment nous pouvons vous accompagner..."

GESTION PRIX :
"Nos taux sont étudiés pour être compétitifs tout en nous permettant de vous offrir un service de qualité. Le taux exact dépendra de votre profil, mais je peux vous donner une fourchette..."

CONCLUSION :
"Souhaitez-vous que nous planifions un rendez-vous pour étudier votre dossier plus en détail ? Je peux dès maintenant vous expliquer les documents à préparer."

RELANCE :
"N'hésitez pas à me contacter si vous avez d'autres questions. Nous sommes là pour vous accompagner dans la réussite de votre projet !"

PROCÉDURES INTERNES À RESPECTER :

QUALIFICATION DOSSIER :
- Vérifier l'éligibilité selon nos critères
- Évaluer la capacité de remboursement
- Identifier les garanties possibles
- Noter les spécificités du dossier

TRANSMISSION DOSSIER :
- Compléter la fiche client standardisée
- Joindre tous les justificatifs
- Préciser les éléments particuliers
- Suivre l'état d'avancement

COMMUNICATION DÉLAIS :
- Annoncer 48-72h pour l'étude
- Prévenir en cas de délai supplémentaire
- Tenir informé du statut régulièrement
- Expliquer les étapes restantes`

  // Répéter et ajuster le contenu pour atteindre exactement 50000 caractères
  let fullPrompt = basePrompt + additionalContent
  
  // Ajout de contenu répétitif mais cohérent pour atteindre 50000 caractères
  const fillerContent = `

INFORMATIONS COMPLÉMENTAIRES SUR NOS SERVICES :

Notre expertise en financement personnel nous permet d'adapter nos offres à chaque situation. Que vous soyez salarié, entrepreneur, fonctionnaire ou professionnel libéral, nous avons des solutions sur mesure.

Les taux que nous proposons sont étudiés en fonction du marché et de votre profil. Nous nous efforçons de maintenir des conditions attractives tout en assurant un service de qualité.

La constitution de votre dossier est accompagnée par notre équipe. Nous vous guidons dans le choix des documents et vous aidons à présenter votre situation sous le meilleur jour.

Notre processus de décision est optimisé pour vous donner une réponse dans les meilleurs délais. Nous comprenons que vos projets ne peuvent pas attendre.

La relation client est au cœur de nos préoccupations. Nous privilégions l'écoute, le conseil et l'accompagnement personnalisé plutôt qu'une approche purement commerciale.

Nos équipes sont formées régulièrement aux évolutions du marché financier et réglementaire pour vous apporter les conseils les plus pertinents.

La transparence est une valeur fondamentale chez Oris Finance. Nous vous expliquons clairement tous les aspects de votre financement, sans frais cachés ni surprises.`

  // Continuer à ajouter du contenu jusqu'à exactement 50000 caractères
  while (fullPrompt.length < 50000) {
    const remaining = 50000 - fullPrompt.length
    if (remaining > fillerContent.length) {
      fullPrompt += fillerContent
    } else {
      fullPrompt += fillerContent.substring(0, remaining)
    }
  }

  // S'assurer qu'on a exactement 50000 caractères
  return fullPrompt.substring(0, 50000)
}

interface TestResult {
  model: string
  question: string
  promptLength: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUSD: number
  responseTime: number
  response: string
}

async function testModel(model: string, question: string, systemPrompt: string): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const message = await anthropic.messages.create({
      model: model as any,
      max_tokens: 1000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: question,
      }]
    })

    const responseTime = Date.now() - startTime
    const responseText = message.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("")

    // Calcul des coûts selon le modèle
    let inputCostPer1M = 0
    let outputCostPer1M = 0
    
    if (model === "claude-3-5-haiku-20241022") {
      inputCostPer1M = 0.25
      outputCostPer1M = 1.25
    } else if (model === "claude-3-5-sonnet-20241022") {
      inputCostPer1M = 3.00
      outputCostPer1M = 15.00
    }

    const inputCost = (message.usage.input_tokens / 1000000) * inputCostPer1M
    const outputCost = (message.usage.output_tokens / 1000000) * outputCostPer1M
    const totalCost = inputCost + outputCost

    return {
      model,
      question,
      promptLength: systemPrompt.length,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      totalTokens: message.usage.input_tokens + message.usage.output_tokens,
      costUSD: totalCost,
      responseTime,
      response: responseText
    }
  } catch (error: any) {
    console.error(`Erreur avec ${model}:`, error.message)
    return {
      model,
      question,
      promptLength: systemPrompt.length,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costUSD: 0,
      responseTime: Date.now() - startTime,
      response: `Erreur: ${error.message}`
    }
  }
}

async function runTests() {
  console.log('🧮 TEST AVEC PROMPT SYSTÈME DE 50000 CARACTÈRES')
  console.log('=' .repeat(60))

  const longPrompt = generate50kPrompt()
  const shortPrompt = "Tu es Raoul, agent responsable du service client Oris Finance. Réponds de manière professionnelle et courtoise aux questions des clients."

  console.log(`📏 Prompt long généré: ${longPrompt.length} caractères`)
  console.log(`📏 Prompt court de référence: ${shortPrompt.length} caractères`)

  const models = ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"]
  const questions = [
    "Bonjour, présentez vos services",
    "Donnez-moi tous les détails sur vos services de financement", 
    "Quel est votre numéro de téléphone ?"
  ]

  const results: TestResult[] = []

  // Test avec prompt long
  console.log('\n🔍 TESTS AVEC PROMPT LONG (50000 caractères)')
  console.log('=' .repeat(50))

  for (const model of models) {
    for (const question of questions) {
      console.log(`\n📱 Test ${model} - "${question}"`)
      const result = await testModel(model, question, longPrompt)
      results.push(result)
      
      console.log(`   Input tokens: ${result.inputTokens.toLocaleString()}`)
      console.log(`   Output tokens: ${result.outputTokens.toLocaleString()}`) 
      console.log(`   Coût total: $${result.costUSD.toFixed(6)}`)
      console.log(`   Temps: ${result.responseTime}ms`)
      console.log(`   Réponse: ${result.response.substring(0, 100)}...`)
    }
  }

  // Test avec prompt court pour comparaison
  console.log('\n🔍 TESTS AVEC PROMPT COURT (référence)')
  console.log('=' .repeat(50))

  for (const model of models) {
    for (const question of questions) {
      console.log(`\n📱 Test ${model} - "${question}"`)
      const result = await testModel(model, question, shortPrompt)
      results.push({...result, promptLength: shortPrompt.length})
      
      console.log(`   Input tokens: ${result.inputTokens.toLocaleString()}`)
      console.log(`   Output tokens: ${result.outputTokens.toLocaleString()}`)
      console.log(`   Coût total: $${result.costUSD.toFixed(6)}`)
      console.log(`   Temps: ${result.responseTime}ms`)
    }
  }

  // Analyse comparative
  console.log('\n📊 ANALYSE COMPARATIVE')
  console.log('=' .repeat(50))

  const longResults = results.filter(r => r.promptLength === 50000)
  const shortResults = results.filter(r => r.promptLength !== 50000)

  for (const model of models) {
    const longModelResults = longResults.filter(r => r.model === model)
    const shortModelResults = shortResults.filter(r => r.model === model)
    
    const avgLongCost = longModelResults.reduce((sum, r) => sum + r.costUSD, 0) / longModelResults.length
    const avgShortCost = shortModelResults.reduce((sum, r) => sum + r.costUSD, 0) / shortModelResults.length
    const costIncrease = ((avgLongCost / avgShortCost - 1) * 100)

    console.log(`\n🤖 ${model.toUpperCase()}:`)
    console.log(`   Coût moyen prompt long: $${avgLongCost.toFixed(6)}`)
    console.log(`   Coût moyen prompt court: $${avgShortCost.toFixed(6)}`)
    console.log(`   Surcoût du prompt long: +${costIncrease.toFixed(1)}%`)
    
    // Projection sur 1000 requêtes
    const cost1000Long = avgLongCost * 1000
    const cost1000Short = avgShortCost * 1000
    
    console.log(`   💰 1000 requêtes (prompt long): $${cost1000Long.toFixed(2)}`)
    console.log(`   💰 1000 requêtes (prompt court): $${cost1000Short.toFixed(2)}`)
    console.log(`   💸 Surcoût sur 1000 requêtes: +$${(cost1000Long - cost1000Short).toFixed(2)}`)
  }

  console.log('\n🎯 RECOMMANDATIONS')
  console.log('=' .repeat(50))
  console.log('✅ Haiku reste économique même avec prompt long')
  console.log('⚠️  Sonnet devient coûteux avec prompt long')
  console.log('💡 Optimiser la taille du prompt selon les besoins')
  console.log('📊 Surveiller les coûts sur volume élevé')
}

runTests().catch(console.error)