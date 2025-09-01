"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { nanoid } from "nanoid"

/**
 * Composant de test pour l'architecture complète Anthropic + Agents
 * Teste la création d'agents, upload de fichiers et chat
 */
export default function AnthropicTest() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  
  // États pour le test
  const [testUserId] = useState(() => nanoid()) // ID utilisateur simulé
  const [agentId, setAgentId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  /**
   * Étape 1: Créer un utilisateur de test puis un agent
   */
  const createTestAgent = async () => {
    setLoading(true)
    setStep(1)
    
    try {
      // Première étape : créer un utilisateur de test
      const userResponse = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: testUserId,
          email: "test@chatbase-saas.com",
          name: "Test User"
        }),
      })

      let user = null
      if (userResponse.ok) {
        user = await userResponse.json()
      } else {
        // L'utilisateur existe peut-être déjà, continuer avec l'agent
        console.log("Utilisateur existe déjà ou erreur, continuation...")
      }

      // Deuxième étape : créer l'agent
      const agentData = {
        name: "Agent Test Anthropic",
        description: "Agent de test pour l'intégration Anthropic",
        systemPrompt: "Tu es un assistant utile qui répond aux questions en français. Tu utilises les documents fournis pour donner des réponses précises et détaillées.",
        userId: testUserId,
        // Les valeurs par défaut seront appliquées par le schéma
      }

      const agentResponse = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentData),
      })

      const agent = await agentResponse.json()
      
      if (agentResponse.ok) {
        setAgentId(agent.id)
        setTestResult({ step: 1, success: true, agent, user })
      } else {
        setTestResult({ step: 1, success: false, error: agent.error || "Erreur création agent" })
      }
    } catch (error) {
      setTestResult({ step: 1, success: false, error: "Erreur réseau" })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Étape 2: Simuler l'upload d'un fichier
   */
  const simulateFileUpload = async () => {
    if (!agentId) return
    
    setLoading(true)
    setStep(2)
    
    try {
      // Créer un fichier texte simple pour le test
      const testContent = `
# Document de Test

## Introduction
Ceci est un document de test pour valider l'intégration Anthropic.

## Informations importantes
- Notre entreprise s'appelle "ChatBase SaaS"
- Nous sommes spécialisés dans les agents IA
- Notre technologie utilise l'API Anthropic Claude

## Contact
Email: support@chatbase-saas.com
Téléphone: +33 1 23 45 67 89
      `
      
      const blob = new Blob([testContent], { type: "text/plain" })
      const formData = new FormData()
      formData.append("file", blob, "document-test.txt")

      const response = await fetch(`/api/agents/${agentId}/files`, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      
      if (response.ok) {
        setTestResult(prev => ({ ...prev, step: 2, success: true, fileUpload: result }))
      } else {
        setTestResult(prev => ({ ...prev, step: 2, success: false, error: result.error }))
      }
    } catch (error) {
      setTestResult(prev => ({ ...prev, step: 2, success: false, error: "Erreur réseau" }))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Étape 3: Tester le chat avec l'agent
   */
  const testChat = async () => {
    if (!agentId) return
    
    setLoading(true)
    setStep(3)
    
    try {
      const chatRequest = {
        agentId,
        question: "Peux-tu me dire le nom de notre entreprise et nos coordonnées de contact d'après le document ?",
        conversationId, // null pour la première fois
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatRequest),
      })

      const chatResult = await response.json()
      
      if (response.ok) {
        setConversationId(chatResult.conversationId)
        setTestResult(prev => ({ ...prev, step: 3, success: true, chatResult }))
      } else {
        setTestResult(prev => ({ ...prev, step: 3, success: false, error: chatResult.error }))
      }
    } catch (error) {
      setTestResult(prev => ({ ...prev, step: 3, success: false, error: "Erreur réseau" }))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Réinitialiser le test
   */
  const resetTest = () => {
    setTestResult(null)
    setAgentId(null)
    setConversationId(null)
    setStep(0)
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Test Complet Architecture Anthropic
        </CardTitle>
        <CardDescription>
          Test de l'intégration complète : Création d'agent + Upload de fichiers + Chat avec sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={createTestAgent}
            disabled={loading || step > 0}
            variant={step > 0 ? "outline" : "default"}
            className="w-full"
          >
            {step === 1 && loading ? "Création..." : "1. Créer Agent"}
            {step > 0 && !loading && (
              <span className="ml-2">
                {testResult?.step >= 1 && testResult?.success ? "✓" : "✗"}
              </span>
            )}
          </Button>

          <Button
            onClick={simulateFileUpload}
            disabled={loading || !agentId || step > 1}
            variant={step > 1 ? "outline" : step === 1 ? "default" : "secondary"}
            className="w-full"
          >
            {step === 2 && loading ? "Upload..." : "2. Upload Fichier"}
            {step > 1 && !loading && (
              <span className="ml-2">
                {testResult?.step >= 2 && testResult?.success ? "✓" : "✗"}
              </span>
            )}
          </Button>

          <Button
            onClick={testChat}
            disabled={loading || !agentId || step !== 2 || !testResult?.success}
            variant={step > 2 ? "outline" : step === 2 ? "default" : "secondary"}
            className="w-full"
          >
            {step === 3 && loading ? "Chat..." : "3. Test Chat"}
            {step > 2 && !loading && (
              <span className="ml-2">
                {testResult?.step >= 3 && testResult?.success ? "✓" : "✗"}
              </span>
            )}
          </Button>
        </div>

        <Button
          onClick={resetTest}
          variant="outline"
          className="w-full"
          disabled={loading}
        >
          Réinitialiser Test
        </Button>

        {testResult && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Résultats du test :</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto max-h-96">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {testResult?.chatResult?.response && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold mb-2">Réponse de l'agent :</h4>
            <p className="text-sm">{testResult.chatResult.response}</p>
            <div className="mt-2 text-xs text-gray-600">
              Tokens utilisés: {testResult.chatResult.tokensUsed} | 
              Sources: {testResult.chatResult.sourcesUsed?.length || 0}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}