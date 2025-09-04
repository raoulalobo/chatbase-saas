/**
 * Script de debug pour analyser l'agent WmtEZfcSy34K-fyviSzg6
 * Examine la configuration, les fichiers et les conversations pour identifier les causes d'hallucination
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import * as schema from './src/lib/db/schema.js'

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

await client.connect()
const db = drizzle(client, { schema })

const agentId = 'WmtEZfcSy34K-fyviSzg6'

console.log(`🔍 DIAGNOSTIC DE L'AGENT ${agentId}`)
console.log('=' .repeat(60))

try {
  // 1. Récupérer les informations de base de l'agent
  console.log('\n📋 CONFIGURATION DE L\'AGENT:')
  const agent = await db.query.agents.findFirst({
    where: (agents, { eq }) => eq(agents.id, agentId),
    with: {
      files: true,
      user: {
        columns: { email: true, name: true }
      }
    }
  })

  if (!agent) {
    console.log('❌ Agent non trouvé!')
    process.exit(1)
  }

  console.log(`Nom: ${agent.name}`)
  console.log(`Description: ${agent.description}`)
  console.log(`Propriétaire: ${agent.user.name} (${agent.user.email})`)
  console.log(`Modèle: ${agent.model}`)
  console.log(`Température: ${agent.temperature}`)
  console.log(`Max Tokens: ${agent.maxTokens}`)
  console.log(`Top P: ${agent.topP}`)
  console.log(`Restriction au contexte: ${agent.restrictToDocuments ? 'OUI' : 'NON'}`)
  console.log(`Statut: ${agent.isActive ? 'ACTIF' : 'INACTIF'}`)
  console.log(`Créé le: ${agent.createdAt}`)
  console.log(`Modifié le: ${agent.updatedAt}`)

  // 2. Analyser le prompt système
  console.log('\n📝 PROMPT SYSTÈME:')
  console.log(`Longueur: ${agent.systemPrompt.length} caractères`)
  console.log('Contenu:')
  console.log('-'.repeat(40))
  console.log(agent.systemPrompt)
  console.log('-'.repeat(40))

  // 3. Examiner les fichiers sources
  console.log('\n📁 FICHIERS SOURCES:')
  console.log(`Nombre total: ${agent.files.length}`)
  
  if (agent.files.length > 0) {
    for (const file of agent.files) {
      console.log(`\n  📄 ${file.originalFilename}`)
      console.log(`     Type: ${file.fileType}`)
      console.log(`     Taille: ${file.fileSize} bytes`)
      console.log(`     Status: ${file.status}`)
      console.log(`     ID Anthropic: ${file.anthropicFileId}`)
      console.log(`     Uploadé le: ${file.uploadDate}`)
    }
  } else {
    console.log('⚠️  AUCUN FICHIER SOURCE - Ceci peut expliquer les hallucinations!')
  }

  // 4. Analyser les conversations récentes
  console.log('\n💬 CONVERSATIONS RÉCENTES:')
  const conversations = await db.query.conversations.findMany({
    where: (conversations, { eq }) => eq(conversations.agentId, agentId),
    with: {
      messages: {
        orderBy: (messages, { desc }) => [desc(messages.createdAt)],
        limit: 10
      }
    },
    orderBy: (conversations, { desc }) => [desc(conversations.updatedAt)],
    limit: 3
  })

  console.log(`Nombre total de conversations: ${conversations.length}`)

  for (const conversation of conversations) {
    console.log(`\n  💭 Conversation ${conversation.id}`)
    console.log(`     Visiteur: ${conversation.visitorId}`)
    console.log(`     Créée le: ${conversation.createdAt}`)
    console.log(`     Messages: ${conversation.messages.length}`)
    
    for (const message of conversation.messages.slice(0, 6)) { // Derniers 6 messages
      const role = message.isFromBot ? '🤖 Bot' : '👤 User'
      const preview = message.content.length > 100 
        ? message.content.substring(0, 100) + '...' 
        : message.content
      console.log(`       ${role}: ${preview}`)
      console.log(`            (${message.createdAt})`)
    }
  }

  // 5. Analyse des paramètres potentiellement problématiques
  console.log('\n⚠️  ANALYSE DES RISQUES D\'HALLUCINATION:')
  
  const temperature = parseFloat(agent.temperature)
  const topP = parseFloat(agent.topP)
  
  const risks = []
  
  if (temperature > 0.8) {
    risks.push(`🔥 Température élevée (${temperature}) - Augmente la créativité mais peut causer des hallucinations`)
  }
  
  if (topP > 0.95) {
    risks.push(`🎲 Top-P élevé (${topP}) - Peut permettre des réponses moins contrôlées`)
  }
  
  if (agent.files.length === 0) {
    risks.push('📄 Aucun fichier source - L\'agent s\'appuie uniquement sur ses connaissances pré-entraînées')
  }
  
  if (!agent.restrictToDocuments) {
    risks.push('🔓 Restriction désactivée - L\'agent peut sortir du contexte défini')
  }
  
  if (agent.systemPrompt.length < 100) {
    risks.push('📝 Prompt système court - Instructions insuffisamment détaillées')
  }
  
  if (agent.model !== 'claude-3-5-sonnet-20241022' && agent.model !== 'claude-3-opus-20240229') {
    risks.push(`🧠 Modèle ${agent.model} - Pourrait être moins précis que Sonnet ou Opus`)
  }

  if (risks.length === 0) {
    console.log('✅ Aucun risque évident détecté dans la configuration')
  } else {
    risks.forEach(risk => console.log(`   ${risk}`))
  }

  // 6. Recommandations
  console.log('\n💡 RECOMMANDATIONS:')
  
  if (temperature > 0.7) {
    console.log('   • Réduire la température à 0.3-0.5 pour plus de précision')
  }
  
  if (agent.files.length === 0) {
    console.log('   • Ajouter des fichiers sources pertinents pour donner un contexte factuel')
  }
  
  if (!agent.restrictToDocuments) {
    console.log('   • Activer la restriction au contexte pour maintenir la cohérence')
  }
  
  console.log('   • Ajouter des instructions anti-hallucination dans le prompt système')
  console.log('   • Tester avec des questions spécifiques pour identifier les patterns d\'hallucination')

} catch (error) {
  console.error('❌ Erreur lors de l\'analyse:', error)
} finally {
  await client.end()
}