"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { ArrowLeft, Bot, User, Clock, MessageSquare, Send, Loader2, AlertCircle, Copy, CheckCheck } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppLayout } from "@/components/layout/AppLayout"
import { useConversation, useConversationsStore } from "@/stores/conversationsStore"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/hooks/useToast"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"

/**
 * Page de détail d'une conversation
 * - Affichage complet de l'historique des messages
 * - Interface de chat pour continuer la conversation
 * - Informations détaillées sur l'agent et le visiteur
 * - Actions de gestion
 */

export default function ConversationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const conversation = useConversation(conversationId)
  const { openConfirmDialog, ConfirmDialog } = useConfirmDialog()
  const { toast } = useToast()
  const { 
    sendChatMessage, 
    isLoading, 
    isChatting, 
    error,
    deleteConversation,
    isDeleting
  } = useConversationsStore()
  
  const [newMessage, setNewMessage] = React.useState('')
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null)
  
  // Référence pour auto-scroll vers le bas
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])

  // Gérer l'envoi de message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !conversation?.agentId) return
    
    const result = await sendChatMessage(conversation.agentId, {
      message: newMessage.trim(),
      visitorId: conversation.visitorId,
      conversationId: conversation.id,
    })
    
    if (result.success) {
      setNewMessage('')
    }
  }

  // Copier le contenu d'un message
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }
  }

  // Gérer la suppression
  const handleDelete = async () => {
    if (!conversation) return
    
    openConfirmDialog({
      title: "Supprimer la conversation",
      description: `Êtes-vous sûr de vouloir supprimer cette conversation avec "${conversation.visitorId}" ? Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteConversation(conversation.id)
          if (result.success) {
            toast({
              title: "Conversation supprimée",
              description: `La conversation avec "${conversation.visitorId}" a été supprimée avec succès.`,
              variant: "success",
            })
            router.push('/conversations')
          } else {
            toast({
              title: "Erreur",
              description: result.error || "Une erreur est survenue lors de la suppression.",
              variant: "destructive",
            })
          }
        } catch (error) {
          toast({
            title: "Erreur",
            description: "Une erreur inattendue est survenue.",
            variant: "destructive",
          })
        }
      }
    })
  }

  // État de chargement
  if (isLoading || !conversation) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-slate-600">Chargement de la conversation...</p>
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
            <Link href="/conversations">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux conversations
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              Conversation avec {conversation.visitorId}
            </h1>
            <p className="text-slate-600 mt-2">
              Agent utilisé : {conversation.agent?.name} • {conversation.messageCount || 0} messages
            </p>
          </div>
          <Button 
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
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

        {/* Informations sur la conversation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Visiteur</p>
                  <p className="text-lg font-semibold text-slate-900">{conversation.visitorId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Agent IA</p>
                  <p className="text-lg font-semibold text-slate-900">{conversation.agent?.name}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {conversation.agent?.model}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Créée</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {format(new Date(conversation.createdAt), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interface de chat */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Historique des messages
            </CardTitle>
            <CardDescription>
              Conversation complète avec possibilité de continuer la discussion
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Zone des messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {conversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Aucun message dans cette conversation</p>
                  </div>
                </div>
              ) : (
                <>
                  {conversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromBot ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.isFromBot
                            ? 'bg-slate-100 text-slate-900'
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
                                {message.isFromBot ? conversation.agent?.name : conversation.visitorId}
                              </span>
                              <span className="text-xs opacity-75">
                                {format(new Date(message.createdAt), 'HH:mm', { locale: fr })}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto"
                            onClick={() => handleCopyMessage(message.id, message.content)}
                          >
                            {copiedMessageId === message.id ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Formulaire d'envoi de message */}
            <div className="border-t p-4">
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
                Envoyez un message pour continuer cette conversation avec l'agent {conversation.agent?.name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      {ConfirmDialog}
    </AppLayout>
  )
}