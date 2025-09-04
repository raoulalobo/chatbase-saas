"use client"

import * as React from "react"
import { Plus, Bot, Settings, MoreHorizontal, FileText, MessageSquare, Search, Filter } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAgentsStore, useAgentsList } from "@/stores/agentsStore"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/hooks/useToast"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

/**
 * Page de gestion des agents IA avec données réelles
 * - Liste des agents depuis l'API avec Zustand
 * - Filtres et recherche en temps réel
 * - Actions CRUD fonctionnelles
 * - Métriques dynamiques
 */

export default function AgentsPage() {
  const { agents, pagination, isLoading, filters } = useAgentsList()
  const { deleteAgent, setFilters, isDeleting } = useAgentsStore()
  const { openConfirmDialog, ConfirmDialog } = useConfirmDialog()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState(filters.search || '')

  // Gérer la recherche avec debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ search: searchTerm })
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchTerm, filters.search, setFilters])

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    const totalAgents = agents.length
    const activeAgents = agents.filter(agent => agent.isActive).length
    const totalConversations = agents.reduce((sum, agent) => sum + (agent._count?.conversations || 0), 0)
    const totalFiles = agents.reduce((sum, agent) => sum + (agent._count?.files || 0), 0)
    
    return { totalAgents, activeAgents, totalConversations, totalFiles }
  }, [agents])

  const handleDeleteAgent = async (id: string, name: string) => {
    openConfirmDialog({
      title: "Supprimer l'agent",
      description: `Êtes-vous sûr de vouloir supprimer l'agent "${name}" ? Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler", 
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteAgent(id)
          if (result.success) {
            toast({
              title: "Agent supprimé",
              description: `L'agent "${name}" a été supprimé avec succès.`,
              variant: "success",
            })
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* En-tête avec actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Agents IA</h1>
            <p className="text-slate-600 mt-2">
              Gérez vos assistants intelligents et leur configuration
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/agents/new">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Agent
              </Link>
            </Button>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Rechercher des agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilters({ status: 'all' })}>
                Tous les agents
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({ status: 'active' })}>
                Agents actifs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({ status: 'inactive' })}>
                Agents inactifs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilters({ sortBy: 'name', sortOrder: 'asc' })}>
                Trier par nom
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({ sortBy: 'createdAt', sortOrder: 'desc' })}>
                Plus récents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Agents</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="w-4 h-4 bg-green-500 rounded-full" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Actifs</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.activeAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Conversations</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalConversations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Fichiers</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalFiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* État de chargement */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Liste des agents */}
        {!isLoading && (
          <>
            {agents.length === 0 ? (
              <Card className="border border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bot className="w-12 h-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun agent trouvé</h3>
                  <p className="text-slate-600 text-center mb-4">
                    {searchTerm ? 
                      "Aucun agent ne correspond à votre recherche." : 
                      "Commencez par créer votre premier agent IA."
                    }
                  </p>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href="/agents/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un agent
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <Card key={agent.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg text-slate-900 leading-tight">
                              {agent.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={agent.isActive ? "default" : "secondary"}
                                className={
                                  agent.isActive 
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" 
                                    : "bg-gray-100 text-gray-700"
                                }
                              >
                                {agent.isActive ? "Actif" : "Inactif"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/agents/${agent.id}`} className="text-slate-700">
                                <Settings className="w-4 h-4 mr-2" />
                                Configurer
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/agents/${agent.id}/files`} className="text-slate-700">
                                <FileText className="w-4 h-4 mr-2" />
                                Fichiers
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/conversations?agent=${agent.id}`} className="text-slate-700">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Conversations
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteAgent(agent.id, agent.name)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Suppression..." : "Supprimer"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardDescription className="text-slate-600 text-sm leading-relaxed">
                        {agent.description}
                      </CardDescription>

                      {/* Métriques */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-lg font-semibold text-slate-900">
                            {agent._count?.conversations || 0}
                          </p>
                          <p className="text-xs text-slate-600">Conversations</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-lg font-semibold text-slate-900">
                            {agent._count?.files || 0}
                          </p>
                          <p className="text-xs text-slate-600">Fichiers</p>
                        </div>
                      </div>

                      {/* Informations */}
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-slate-600">
                          Créé: <span className="text-slate-800">
                            {formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true, locale: fr })}
                          </span>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Modèle: <span className="text-slate-800 font-medium">{agent.model}</span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          asChild
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-slate-700 border-gray-300 hover:bg-gray-50"
                        >
                          <Link href={`/agents/${agent.id}`}>
                            <Settings className="w-4 h-4 mr-1" />
                            Config
                          </Link>
                        </Button>
                        <Button 
                          asChild
                          variant="outline" 
                          size="sm"
                          className="flex-1 text-slate-700 border-gray-300 hover:bg-gray-50"
                        >
                          <Link href={`/agents/${agent.id}/chat`}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Chat
                          </Link>
                        </Button>
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
                  onClick={() => setFilters({ page: Math.max(1, pagination.page - 1) })}
                  disabled={pagination.page <= 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-slate-600">
                  Page {pagination.page} sur {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ page: Math.min(pagination.pages, pagination.page + 1) })}
                  disabled={pagination.page >= pagination.pages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      {ConfirmDialog}
    </AppLayout>
  )
}