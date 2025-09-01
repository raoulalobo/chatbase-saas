"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { ArrowLeft, Bot, User, Send, Loader2, AlertCircle, Settings, MessageSquare, Sparkles } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAgent } from "@/stores/agentsStore"
import { useConversationsStore } from "@/stores/conversationsStore"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"
import { nanoid } from "nanoid"

/**
 * Interface de chat intégrée pour un agent spécifique
 * - Chat direct avec un agent depuis sa page
 * - Génération automatique d'un ID visiteur pour les tests
 * - Interface moderne avec bulles de messages
 * - Informations sur l'agent en temps réel
 */

export default function AgentChatPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const agent = useAgent(agentId)
  const { sendChatMessage, isChatting, error } = useConversationsStore()
  
  const [messages, setMessages] = React.useState<Array<{
    id: string
    content: string
    isFromBot: boolean
    timestamp: Date
  }>>([])
  const [newMessage, setNewMessage] = React.useState('')
  
  // Persister l'ID visiteur dans sessionStorage pour les tests
  const [visitorId] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const storedVisitorId = sessionStorage.getItem(`visitor-${agentId}`)
      if (storedVisitorId) {
        return storedVisitorId
      }
    }
    const newVisitorId = `test-${nanoid(8)}`
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`visitor-${agentId}`, newVisitorId)
    }
    return newVisitorId
  })
  
  // Persister l'ID de conversation dans sessionStorage
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`conversation-${agentId}-${visitorId}`)
    }
    return null
  })
  
  // Référence pour auto-scroll vers le bas
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Message de bienvenue initial
  React.useEffect(() => {
    if (agent && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        content: `Bonjour ! Je suis ${agent.name}, votre assistant IA. ${agent.description}\\n\\nComment puis-je vous aider aujourd'hui ?`,
        isFromBot: true,
        timestamp: new Date(),
      }])
    }
  }, [agent, messages.length])

  // Gérer l'envoi de message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !agent) return
    
    // Ajouter le message de l'utilisateur immédiatement
    const userMessage = {
      id: nanoid(),
      content: newMessage.trim(),
      isFromBot: false,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    const messageToSend = newMessage.trim()
    setNewMessage('')
    
    // Envoyer le message à l'API
    const result = await sendChatMessage(agent.id, {
      message: messageToSend,
      visitorId,
      conversationId: currentConversationId || undefined,
    })
    
    if (result.success && result.response) {
      // Sauvegarder l'ID de conversation pour les prochains messages
      if (!currentConversationId) {
        setCurrentConversationId(result.response.conversationId)
        // Persister dans sessionStorage
        sessionStorage.setItem(`conversation-${agentId}-${visitorId}`, result.response.conversationId)
      }
      
      // Ajouter la réponse du bot
      const botMessage = {
        id: nanoid(),
        content: result.response.response,
        isFromBot: true,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, botMessage])
    } else {
      // En cas d'erreur, ajouter un message d'erreur
      const errorMessage = {
        id: nanoid(),
        content: "Désolé, j'ai rencontré une erreur. Veuillez réessayer.",
        isFromBot: true,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // État de chargement
  if (!agent) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-slate-600">Chargement de l'agent...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* En-tête avec navigation */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/agents/${agent.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'agent
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              Chat avec {agent.name}
            </h1>
            <p className="text-slate-600 mt-2">
              Testez votre agent en temps réel • ID visiteur : {visitorId}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/agents/${agent.id}`}>
              <Settings className="w-4 h-4 mr-2" />
              Configurer
            </Link>
          </Button>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-red-800">
              <p className="font-medium">Erreur</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panneau d'informations sur l'agent */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Informations Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Description</p>
                  <p className="text-sm text-slate-900">{agent.description}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-600 mb-2">Modèle</p>
                  <Badge variant="secondary">{agent.model}</Badge>
                </div>
                
                <div>
                  <p className="text-sm text-slate-600 mb-2">Configuration</p>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>Température: {agent.temperature}</p>
                    <p>Max tokens: {agent.maxTokens}</p>
                    <p>Top P: {agent.topP}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-slate-600 mb-2">Statut</p>
                  <Badge 
                    variant={agent.isActive ? "default" : "secondary"}
                    className={agent.isActive ? "bg-emerald-100 text-emerald-800" : ""}
                  >
                    {agent.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>

                {currentConversationId && (
                  <div className="pt-4 border-t">
                    <Button 
                      asChild
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      <Link href={`/conversations/${currentConversationId}`}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Voir dans Conversations
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Interface de chat */}
          <div className="lg:col-span-3">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Interface de Chat
                </CardTitle>
                <CardDescription>
                  Conversation en temps réel avec votre agent IA
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {/* Zone des messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromBot ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.isFromBot
                            ? 'bg-white border border-gray-200 text-slate-900 shadow-sm'
                            : 'bg-primary text-white'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {message.isFromBot ? (
                                <Bot className="w-4 h-4" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                              <span className="text-xs opacity-75">
                                {message.isFromBot ? agent.name : 'Vous'}
                              </span>
                              <span className="text-xs opacity-75">
                                {format(message.timestamp, 'HH:mm', { locale: fr })}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Indicateur de frappe */}
                  {isChatting && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          <span className="text-xs text-slate-600">{agent.name} est en train d'écrire</span>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Formulaire d'envoi de message */}
                <div className="border-t p-4 bg-white">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isChatting}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || isChatting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isChatting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-slate-500 mt-2">
                    Appuyez sur Entrée pour envoyer votre message
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}