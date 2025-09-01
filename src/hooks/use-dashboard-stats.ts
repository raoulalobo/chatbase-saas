"use client"

import * as React from "react"
import type { DashboardStats } from "@/app/api/dashboard/stats/route"

/**
 * Hook pour récupérer et gérer les statistiques du dashboard
 * - Fetch les métriques principales depuis l'API
 * - Gestion des états de loading et d'erreur
 * - Rafraîchissement automatique optionnel
 * - Cache des données pour éviter les appels répétés
 */

interface UseDashboardStatsOptions {
  // Intervalle de rafraîchissement en millisecondes (optionnel)
  refreshInterval?: number
  // Désactiver le fetch automatique au montage
  enabled?: boolean
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboardStats(options: UseDashboardStatsOptions = {}): UseDashboardStatsReturn {
  const { refreshInterval, enabled = true } = options

  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(enabled)
  const [error, setError] = React.useState<string | null>(null)

  // Fonction pour récupérer les statistiques
  const fetchStats = React.useCallback(async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
        throw new Error(errorData.message || `Erreur ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        setStats(result.data)
        setError(null)
      } else {
        throw new Error(result.message || 'Erreur lors de la récupération des statistiques')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      console.error('Erreur lors de la récupération des statistiques du dashboard:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  // Effet pour le fetch initial
  React.useEffect(() => {
    if (enabled) {
      fetchStats()
    }
  }, [fetchStats, enabled])

  // Effet pour le rafraîchissement automatique
  React.useEffect(() => {
    if (!refreshInterval || !enabled) return

    const interval = setInterval(() => {
      fetchStats()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, fetchStats, enabled])

  // Fonction manuelle de refetch
  const refetch = React.useCallback(async () => {
    await fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refetch,
  }
}