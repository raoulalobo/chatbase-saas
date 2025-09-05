"use client"

import * as React from "react"
import { Bot, MessageSquare, FileText, TrendingUp, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layout/AppLayout"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"

/**
 * Page Dashboard principale
 * - Métriques et statistiques temps réel avec API
 * - Cartes d'informations dynamiques  
 * - Actions rapides fonctionnelles
 * - Design moderne avec palette verte
 */

export default function DashboardPage() {
  const { stats, isLoading, error, refetch } = useDashboardStats({
    refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
  })

  // Configuration des métriques avec les vraies données
  const metricsConfig = React.useMemo(() => {
    if (!stats) return []

    return [
      {
        title: "Agents IA Actifs",
        value: stats.agents.active.toString(),
        description: `${stats.agents.total} agents total`,
        icon: Bot,
        trend: stats.agents.recentGrowth,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
      {
        title: "Conversations",
        value: stats.conversations.total.toLocaleString(),
        description: `${stats.conversations.totalMessages} messages`,
        icon: MessageSquare,
        trend: stats.conversations.growthRate,
        color: "text-blue-600", 
        bgColor: "bg-blue-50",
      },
      {
        title: "Fichiers Sources",
        value: stats.files.total.toString(),
        description: "Documents uploadés",
        icon: FileText,
        trend: stats.files.recentGrowth,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
      {
        title: "Satisfaction",
        value: stats.satisfaction.percentage,
        description: "Score moyen",
        icon: TrendingUp,
        trend: stats.satisfaction.trend,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
    ]
  }, [stats])

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* En-tête avec bouton de rafraîchissement */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
            <p className="text-slate-600 mt-2">
              Aperçu de vos agents IA et leurs performances
            </p>
          </div>
          <Button 
            onClick={refetch}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Gestion des erreurs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-red-800">
              <p className="font-medium">Erreur de chargement</p>
              <p className="text-sm">{error}</p>
              <Button 
                onClick={refetch} 
                variant="outline" 
                size="sm" 
                className="mt-2 text-red-700 border-red-300 hover:bg-red-50"
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading && !stats ? (
            // Skeleton loading pour les métriques
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20 mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                </CardContent>
              </Card>
            ))
          ) : (
            metricsConfig.map((metric) => (
              <Card key={metric.title} className="border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-800">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {metric.value}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {metric.description}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium mt-2">
                    {metric.trend}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agents récents */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900">
                    Agents Récents
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Vos derniers agents créés
                  </CardDescription>
                </div>
                <Button 
                  asChild
                  variant="outline" 
                  size="sm"
                  className="text-slate-700 border-gray-300 hover:bg-gray-50"
                >
                  <Link href="/agents">Voir tous</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && !stats ? (
                // Skeleton loading pour les agents
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                      <div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-1" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                  </div>
                ))
              ) : stats && stats.recentAgents.length > 0 ? (
                stats.recentAgents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {agent.name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {agent.conversationCount} conversations
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={agent.status === "active" ? "default" : "secondary"}
                        className={
                          agent.status === "active" 
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" 
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {agent.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">Aucun agent créé</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/agents">Créer votre premier agent</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">
                Actions Rapides
              </CardTitle>
              <CardDescription className="text-slate-600">
                Créez et gérez vos agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                asChild
                className="w-full justify-start h-auto p-4 bg-primary hover:bg-primary/90"
              >
                <Link href="/agents/new">
                  <Bot className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Créer un nouvel agent</div>
                    <div className="text-sm opacity-90">
                      Assistant IA personnalisé pour votre site
                    </div>
                  </div>
                </Link>
              </Button>
              
              {/* <Button 
                asChild
                variant="outline" 
                className="w-full justify-start h-auto p-4 text-slate-700 border-gray-300 hover:bg-gray-50"
              >
                <Link href="/files">
                  <FileText className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Uploader des fichiers</div>
                    <div className="text-sm text-slate-600">
                      Sources de données pour vos agents
                    </div>
                  </div>
                </Link>
              </Button> */}

              <Button 
                asChild
                variant="outline" 
                className="w-full justify-start h-auto p-4 text-slate-700 border-gray-300 hover:bg-gray-50"
              >
                <Link href="/conversations">
                  <MessageSquare className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Voir les conversations</div>
                    <div className="text-sm text-slate-600">
                      Historique et analytics
                    </div>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}