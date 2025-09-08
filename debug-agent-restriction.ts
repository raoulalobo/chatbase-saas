/**
 * Script de débogage pour analyser la configuration anti-hallucination
 * d'un agent spécifique
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugAgentRestriction() {
  try {
    console.log('🔍 Recherche des agents avec "Test Final Solution" dans le nom...\n')
    
    // Chercher les agents qui correspondent
    const agents = await prisma.agent.findMany({
      where: {
        name: {
          contains: 'Test Final Solution',
          mode: 'insensitive'
        }
      },
      include: {
        files: {
          select: {
            id: true,
            filename: true,
            anthropicFileId: true
          }
        }
      }
    })

    if (agents.length === 0) {
      console.log('❌ Aucun agent trouvé avec "Test Final Solution" dans le nom')
      return
    }

    for (const agent of agents) {
      console.log(`\n📊 AGENT: ${agent.name} (ID: ${agent.id})`)
      console.log(`├─ Modèle: ${agent.model}`)
      console.log(`├─ Restriction au contexte: ${agent.restrictToDocuments ? '✅ ACTIVÉE' : '❌ DÉSACTIVÉE'}`)
      console.log(`├─ Température: ${agent.temperature}`)
      console.log(`├─ Max tokens: ${agent.maxTokens}`)
      console.log(`├─ Top P: ${agent.topP}`)
      console.log(`├─ Fichiers associés: ${agent.files.length}`)
      
      if (agent.files.length > 0) {
        console.log(`│  └─ Fichiers:`)
        agent.files.forEach(file => {
          console.log(`│     ├─ ${file.filename} (Anthropic ID: ${file.anthropicFileId || 'Non défini'})`)
        })
      }

      console.log(`├─ System Prompt (premiers 200 chars):`)
      console.log(`│  └─ ${agent.systemPrompt.substring(0, 200)}...`)
      
      console.log(`\n🎯 DIAGNOSTIC:`)
      if (!agent.restrictToDocuments) {
        console.log(`   ❌ PROBLÈME: restrictToDocuments = false`)
        console.log(`   💡 SOLUTION: Activer la restriction au contexte dans l'interface`)
      } else {
        console.log(`   ✅ Configuration correcte: restrictToDocuments = true`)
        console.log(`   🔍 Vérifier si le system prompt contient des règles anti-hallucination`)
      }
      
      console.log(`\n${'='.repeat(80)}`)
    }

  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
debugAgentRestriction()