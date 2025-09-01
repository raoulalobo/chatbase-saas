"use client"

import * as React from "react"
import { MessageSquare, Bot, User, Clock, Search, Filter, MoreHorizontal, Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppLayout } from "@/components/layout/AppLayout"
import { useConversationsList, useConversationsStore } from "@/stores/conversationsStore"
import { useAgentsList } from "@/stores/agentsStore"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

/**
 * Page de gestion des conversations
 * - Liste des conversations avec données réelles
 * - Filtres et recherche en temps réel
 * - Statistiques dynamiques
 * - Actions de gestion (voir, supprimer)
 */

export default function ConversationsPage() {
  const { conversations, pagination, stats, isLoading, filters } = useConversationsList()
  const { agents } = useAgentsList()
  const { deleteConversation, setFilters, isDeleting } = useConversationsStore()
  const [searchTerm, setSearchTerm] = React.useState(filters.search || '')
  const [selectedAgent, setSelectedAgent] = React.useState(filters.agentId || '')

  // Gérer la recherche avec debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ search: searchTerm })
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchTerm, filters.search, setFilters])

  // Gérer le filtre par agent
  React.useEffect(() => {
    if (selectedAgent !== filters.agentId) {
      setFilters({ agentId: selectedAgent || undefined })
    }
  }, [selectedAgent, filters.agentId, setFilters])

  const handleDeleteConversation = async (id: string, visitorId: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la conversation avec "${visitorId}" ? Cette action est irréversible.`)) {
      await deleteConversation(id)
    }
  }

  // Calculer les statistiques dynamiques
  const dynamicStats = React.useMemo(() => {
    if (!stats) return null
    
    return {
      totalConversations: stats.totalConversations,
      activeConversations: stats.activeConversations,
      totalMessages: stats.totalMessages,
      averageMessages: stats.averageMessagesPerConversation,
    }
  }, [stats])

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* En-tête avec actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Conversations</h1>
            <p className="text-slate-600 mt-2">
              Gérez toutes les interactions avec vos visiteurs
            </p>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Rechercher par ID visiteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Filtre par agent */}
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Tous les agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>

            {/* Menu de tri */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters({ 
                  sortBy: sortBy as 'createdAt' | 'updatedAt',
                  sortOrder: sortOrder as 'asc' | 'desc'
                })
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="updatedAt-desc">Plus récentes</option>
              <option value="updatedAt-asc">Plus anciennes</option>
              <option value="createdAt-desc">Créées récemment</option>
              <option value="createdAt-asc">Créées anciennement</option>
            </select>
          </div>
        </div>

        {/* Statistiques rapides */}
        {dynamicStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Conversations</p>
                    <p className="text-2xl font-bold text-slate-900">{dynamicStats.totalConversations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Actives (7j)</p>
                    <p className="text-2xl font-bold text-slate-900">{dynamicStats.activeConversations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Messages</p>
                    <p className="text-2xl font-bold text-slate-900">{dynamicStats.totalMessages}</p>
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
                    <p className="text-sm text-slate-600">Moy. messages</p>
                    <p className="text-2xl font-bold text-slate-900">{dynamicStats.averageMessages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* État de chargement */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Liste des conversations */}
        {!isLoading && (
          <>
            {conversations.length === 0 ? (
              <Card className="border border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-12 h-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune conversation trouvée</h3>
                  <p className="text-slate-600 text-center mb-4">
                    {searchTerm || selectedAgent ? 
                      "Aucune conversation ne correspond à vos critères de recherche." : 
                      "Les conversations apparaîtront ici lorsque les visiteurs interagiront avec vos agents."
                    }
                  </p>
                  {(searchTerm || selectedAgent) && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedAgent('')
                        setFilters({ search: undefined, agentId: undefined })
                      }}
                    >
                      Effacer les filtres
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <Card key={conversation.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">
                                Visiteur: {conversation.visitorId}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Bot className="w-4 h-4 text-primary" />
                                <span className="text-sm text-slate-600">
                                  {conversation.agent?.name || 'Agent inconnu'}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {conversation.agent?.model || 'Modèle inconnu'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                              <p className="text-lg font-semibold text-slate-900">
                                {conversation.messageCount || 0}
                              </p>
                              <p className="text-xs text-slate-600">Messages</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                              <p className="text-lg font-semibold text-slate-900">
                                {formatDistanceToNow(new Date(conversation.updatedAt), { locale: fr })}
                              </p>
                              <p className="text-xs text-slate-600">Dernière activité</p>
                            </div>
                          </div>

                          {conversation.lastMessage && (
                            <div className="p-3 bg-slate-50 rounded-lg mb-4">
                              <p className="text-sm text-slate-600 mb-1">Dernier message:</p>
                              <p className="text-sm text-slate-900 line-clamp-2">
                                {conversation.lastMessage.isFromBot ? '🤖 ' : '👤 '}
                                {conversation.lastMessage.content}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button 
                              asChild
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-slate-700 border-gray-300 hover:bg-gray-50"
                            >
                              <Link href={`/conversations/${conversation.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                Voir conversation
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleDeleteConversation(conversation.id, conversation.visitorId)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              {isDeleting ? 'Suppression...' : 'Supprimer'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setFilters({ page: Math.max(1, (pagination.page || 1) - 1) })}
                  disabled={!pagination.hasPrev}
                >
                  Précédent
                </Button>
                <span className="text-sm text-slate-600">
                  Page {pagination.page} sur {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ page: Math.min(pagination.pages, (pagination.page || 1) + 1) })}
                  disabled={!pagination.hasNext}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}