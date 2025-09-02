"use client"

import * as React from "react"
import { FileText, Upload, HardDrive, AlertCircle, Plus } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/layout/AppLayout"
import { FilesList } from "@/components/files/FilesList"
import { FileSizeFormatter } from "@/components/files/FileSizeFormatter"
import { useFiles } from "@/stores/filesStore"
import { FILE_TYPE_LABELS } from "@/lib/schemas/file"
import type { FileResponse } from "@/lib/schemas/file"

/**
 * Page principale de gestion des fichiers
 * - Vue d'ensemble avec statistiques
 * - Liste de tous les fichiers avec filtres
 * - Actions rapides pour upload et gestion
 * - Design cohérent avec le reste de l'application
 */

export default function FilesPage() {
  const { stats, fetchStats, error, clearError } = useFiles()
  const [selectedFile, setSelectedFile] = React.useState<FileResponse | null>(null)

  // Charger les statistiques au montage
  React.useEffect(() => {
    fetchStats()
  }, []) // Retirer fetchStats des dépendances

  // Gérer la vue d'un fichier
  const handleFileView = (file: FileResponse) => {
    setSelectedFile(file)
    // TODO: Ouvrir un modal ou naviguer vers la page de détails
    console.log("Voir fichier:", file)
  }

  // Gérer la suppression d'un fichier
  const handleFileDelete = (file: FileResponse) => {
    // La logique de suppression est gérée par le composant FilesList
    console.log("Supprimer fichier:", file)
  }

  // Calculer les métriques d'affichage
  const displayStats = React.useMemo(() => {
    if (!stats) return null

    return [
      {
        title: "Total Fichiers",
        value: stats.totalFiles.toLocaleString(),
        description: "Fichiers uploadés",
        icon: FileText,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "Taille Totale",
        value: <FileSizeFormatter size={stats.totalSize} showUnit={true} />,
        description: "Espace utilisé",
        icon: HardDrive,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "Fichiers Prêts",
        value: stats.filesByStatus.ready.toLocaleString(),
        description: "Utilisables par les agents",
        icon: Upload,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
      {
        title: "Uploads Récents",
        value: stats.recentUploads.toLocaleString(),
        description: "Cette semaine",
        icon: Plus,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
    ]
  }, [stats])

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fichiers</h1>
            <p className="text-slate-600 mt-2">
              Gérez tous vos fichiers sources pour les agents IA
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/agents">
              <Upload className="w-4 h-4 mr-2" />
              Uploader des fichiers
            </Link>
          </Button>
        </div>

        {/* Gestion des erreurs générales */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-red-800">
              <p className="font-medium">Erreur de chargement</p>
              <p className="text-sm">{error.message}</p>
              <Button 
                onClick={clearError} 
                variant="outline" 
                size="sm" 
                className="mt-2 text-red-700 border-red-300 hover:bg-red-50"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}

        {/* Statistiques */}
        {displayStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayStats.map((stat) => (
              <Card key={stat.title} className="border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-800">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Répartition par type de fichier */}
        {stats && stats.filesByType.length > 0 && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">
                Répartition par type
              </CardTitle>
              <CardDescription>
                Distribution de vos fichiers par format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.filesByType.map((typeStats) => (
                  <div key={typeStats.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        {FILE_TYPE_LABELS[typeStats.type] || typeStats.type}
                      </p>
                      <p className="text-sm text-slate-600">
                        <FileSizeFormatter size={typeStats.size} />
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-white">
                      {typeStats.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Indicateurs de statut */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {stats.filesByStatus.ready} Prêts
                    </p>
                    <p className="text-xs text-slate-600">Utilisables</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {stats.filesByStatus.uploading} En cours
                    </p>
                    <p className="text-xs text-slate-600">Upload en cours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {stats.filesByStatus.error} Erreurs
                    </p>
                    <p className="text-xs text-slate-600">À corriger</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Liste des fichiers */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-slate-900">
                  Tous les fichiers
                </CardTitle>
                <CardDescription>
                  Gérez vos fichiers sources pour les agents IA
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <FilesList 
              onFileView={handleFileView}
              onFileDelete={handleFileDelete}
              showAgent={true}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}