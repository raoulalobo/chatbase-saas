"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"

/**
 * Hook pour gérer les breadcrumbs de manière dynamique
 * - Génère automatiquement les breadcrumbs basés sur l'URL
 * - Traduit les segments d'URL en labels français
 * - Fournit les liens de navigation
 */

interface Breadcrumb {
  label: string
  href?: string
}

// Mapping des routes vers des labels français
const routeLabels: Record<string, string> = {
  dashboard: "Tableau de bord",
  agents: "Agents IA",
  conversations: "Conversations",
  files: "Fichiers",
  settings: "Paramètres",
  create: "Créer",
  edit: "Modifier",
  new: "Nouveau",
}

export function useBreadcrumbs(): Breadcrumb[] {
  const pathname = usePathname()

  return useMemo(() => {
    // Toujours commencer par l'accueil
    const breadcrumbs: Breadcrumb[] = [
      { label: "Accueil", href: "/dashboard" }
    ]

    // Si on est sur la page d'accueil, retourner juste l'accueil
    if (pathname === "/" || pathname === "/dashboard") {
      return [{ label: "Tableau de bord" }]
    }

    // Découper le chemin en segments
    const segments = pathname.split("/").filter(Boolean)
    
    // Construire les breadcrumbs
    let currentPath = ""
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Label du segment (traduit ou segment brut)
      const label = routeLabels[segment] || segment
      
      // Si c'est le dernier segment, pas de lien
      if (index === segments.length - 1) {
        breadcrumbs.push({ label })
      } else {
        breadcrumbs.push({ label, href: currentPath })
      }
    })

    return breadcrumbs
  }, [pathname])
}