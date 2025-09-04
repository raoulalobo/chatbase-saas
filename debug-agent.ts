/**
 * Script de debug pour analyser l'agent WmtEZfcSy34K-fyviSzg6
 * Examine la configuration, les fichiers et les conversations pour identifier les causes d'hallucination
 */

import { db } from './src/lib/db'
import { agents, conversations, messages, agentFiles } from './src/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

const agentId = 'WmtEZfcSy34K-fyviSzg6'

console.log(`🔍 DIAGNOSTIC DE L'AGENT ${agentId}`)
console.log('='.repeat(60))

async function debugAgent() {
  try {
    // 1. Récupérer les informations de base de l'agent avec ses relations
    console.log('\n📋 CONFIGURATION DE L\'AGENT:')
    
    const agent = await db
      .select({
        // Agent fields
        id: agents.id,
        name: agents.name,
        description: agents.description,
        systemPrompt: agents.systemPrompt,
        model: agents.model,
        temperature: agents.temperature,
        maxTokens: agents.maxTokens,
        topP: agents.topP,
        isActive: agents.isActive,
        restrictToDocuments: agents.restrictToDocuments,
        createdAt: agents.createdAt,
        updatedAt: agents.updatedAt,
        userId: agents.userId
      })
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1)

    if (!agent || agent.length === 0) {
      console.log('❌ Agent non trouvé!')
      return
    }

    const agentData = agent[0]
    
    console.log(`Nom: ${agentData.name}`)
    console.log(`Description: ${agentData.description}`)
    console.log(`Utilisateur ID: ${agentData.userId}`)
    console.log(`Modèle: ${agentData.model}`)
    console.log(`Température: ${agentData.temperature}`)
    console.log(`Max Tokens: ${agentData.maxTokens}`)
    console.log(`Top P: ${agentData.topP}`)
    console.log(`Restriction au contexte: ${agentData.restrictToDocuments ? 'OUI' : 'NON'}`)
    console.log(`Statut: ${agentData.isActive ? 'ACTIF' : 'INACTIF'}`)
    console.log(`Créé le: ${agentData.createdAt}`)
    console.log(`Modifié le: ${agentData.updatedAt}`)

    // 2. Analyser le prompt système
    console.log('\n📝 PROMPT SYSTÈME:')
    console.log(`Longueur: ${agentData.systemPrompt.length} caractères`)
    console.log('Contenu:')
    console.log('-'.repeat(40))
    console.log(agentData.systemPrompt)
    console.log('-'.repeat(40))

    // 3. Examiner les fichiers sources
    console.log('\n📁 FICHIERS SOURCES:')
    const files = await db
      .select()
      .from(agentFiles)
      .where(eq(agentFiles.agentId, agentId))
    
    console.log(`Nombre total: ${files.length}`)
    
    if (files.length > 0) {
      for (const file of files) {
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
    const agentConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.agentId, agentId))
      .orderBy(desc(conversations.updatedAt))
      .limit(3)

    console.log(`Nombre total de conversations: ${agentConversations.length}`)

    for (const conversation of agentConversations) {
      console.log(`\n  💭 Conversation ${conversation.id}`)
      console.log(`     Visiteur: ${conversation.visitorId}`)
      console.log(`     Créée le: ${conversation.createdAt}`)
      
      // Récupérer les messages de cette conversation
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(desc(messages.createdAt))
        .limit(6)
      
      console.log(`     Messages: ${conversationMessages.length}`)
      
      for (const message of conversationMessages) {
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
    
    const temperature = parseFloat(agentData.temperature)
    const topP = parseFloat(agentData.topP)
    
    const risks = []
    
    if (temperature > 0.8) {
      risks.push(`🔥 Température élevée (${temperature}) - Augmente la créativité mais peut causer des hallucinations`)
    }
    
    if (topP > 0.95) {
      risks.push(`🎲 Top-P élevé (${topP}) - Peut permettre des réponses moins contrôlées`)
    }
    
    if (files.length === 0) {
      risks.push('📄 Aucun fichier source - L\'agent s\'appuie uniquement sur ses connaissances pré-entraînées')
    }
    
    if (!agentData.restrictToDocuments) {
      risks.push('🔓 Restriction désactivée - L\'agent peut sortir du contexte défini')
    }
    
    if (agentData.systemPrompt.length < 100) {
      risks.push('📝 Prompt système court - Instructions insuffisamment détaillées')
    }
    
    if (agentData.model !== 'claude-3-5-sonnet-20241022' && agentData.model !== 'claude-3-opus-20240229') {
      risks.push(`🧠 Modèle ${agentData.model} - Pourrait être moins précis que Sonnet ou Opus`)
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
    
    if (files.length === 0) {
      console.log('   • Ajouter des fichiers sources pertinents pour donner un contexte factuel')
    }
    
    if (!agentData.restrictToDocuments) {
      console.log('   • Activer la restriction au contexte pour maintenir la cohérence')
    }
    
    console.log('   • Ajouter des instructions anti-hallucination dans le prompt système')
    console.log('   • Tester avec des questions spécifiques pour identifier les patterns d\'hallucination')

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error)
  }
}

debugAgent()