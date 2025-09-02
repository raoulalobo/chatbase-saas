"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, X, Plus } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/layout/AppLayout"
import { useFileUpload, useFileDrop } from "@/hooks/use-file-upload"
import { FileItem } from "@/components/files/FileItem"
import { FileSizeFormatter } from "@/components/files/FileSizeFormatter"
import { FileTypeIcon } from "@/components/files/FileTypeIcon"
import { SupportedFileTypes, FILE_TYPE_LABELS } from "@/lib/schemas/file"

/**
 * Page pour ajouter des fichiers à un agent spécifique
 * - Upload par drag & drop ou sélection
 * - Vue des fichiers existants de l'agent
 * - Progress tracking en temps réel
 * - Support des types de fichiers définis
 */

interface UploadedFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  message?: string
  id?: string
}

export default function AgentFilesPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string
  
  // État local pour l'agent au lieu d'utiliser le store
  const [selectedAgent, setSelectedAgent] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<any>(null)

  // Configuration du hook d'upload avec les callbacks
  const fileUpload = useFileUpload({
    agentId,
    onSuccess: (response: any) => {
      console.log('Upload réussi:', response)
      fetchAgentFiles()
    },
    onError: (error: any) => {
      console.error('Erreur upload:', error)
    },
    onProgress: (progress: any) => {
      console.log('Progression:', progress)
    }
  })

  // État local pour les uploads
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([])
  const [agentFiles, setAgentFiles] = React.useState<any[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false)

  // Charger les données de l'agent au montage
  React.useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        console.log('Fetching agent:', agentId)
        const response = await fetch(`/api/agents/${agentId}`)
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`)
        }
        
        const result = await response.json()
        console.log('Agent response:', result)
        
        if (result.success && result.data) {
          setSelectedAgent(result.data)
        } else {
          throw new Error(result.message || 'Erreur lors de la récupération de l\'agent')
        }
      } catch (err) {
        console.error('Error fetching agent:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAgent()
  }, [agentId])

  // Charger les fichiers existants de l'agent
  React.useEffect(() => {
    if (agentId) {
      fetchAgentFiles()
    }
  }, [agentId])

  const fetchAgentFiles = async () => {
    setIsLoadingFiles(true)
    try {
      const response = await fetch(`/api/agents/${agentId}/files`)
      if (response.ok) {
        const files = await response.json()
        setAgentFiles(files)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  // Gérer les fichiers droppés ou sélectionnés
  const handleFilesSelected = React.useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      // Validation du fichier
      const validation = fileUpload.validateFile(file)
      if (!validation.valid) {
        console.error('Fichier invalide:', validation.error)
        continue
      }

      // Ajouter à la liste d'upload
      const uploadFile: UploadedFile = {
        file,
        progress: 0,
        status: 'uploading'
      }
      setUploadedFiles(prev => [...prev, uploadFile])

      // Uploader avec le hook
      try {
        const success = await fileUpload.upload(file)
        if (success) {
          setUploadedFiles(prev => 
            prev.map(item => 
              item.file === file ? { 
                ...item, 
                progress: 100, 
                status: 'success', 
                message: 'Fichier uploadé avec succès'
              } : item
            )
          )
        }
      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(item => 
            item.file === file ? { 
              ...item, 
              progress: 0, 
              status: 'error', 
              message: 'Erreur lors de l\'upload'
            } : item
          )
        )
      }
    }
  }, [fileUpload])

  // Configuration du hook de drag & drop
  const fileDrop = useFileDrop({
    onFileDrop: handleFilesSelected,
    multiple: true
  })


  // Ouvrir le sélecteur de fichiers
  const openFileSelector = React.useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '.pdf,.txt,.md,.docx,.csv,.json,.html'
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files) {
        handleFilesSelected(target.files)
      }
    }
    input.click()
  }, [handleFilesSelected])


  // Supprimer un fichier de la liste d'upload
  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Types de fichiers supportés
  const supportedTypes = [
    'application/pdf',
    'text/plain', 
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/json',
    'text/html'
  ]

  // Debug temporaire
  console.log('Debug:', { isLoading, selectedAgent: !!selectedAgent, agentId })

  if (isLoading || !selectedAgent) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600">Chargement... (isLoading: {isLoading.toString()}, selectedAgent: {selectedAgent ? 'présent' : 'absent'})</p>
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
            <Link href={`/agents/${agentId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'agent
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Fichiers - {selectedAgent.name}
            </h1>
            <p className="text-slate-600 mt-2">
              Ajoutez des fichiers sources pour enrichir les connaissances de votre agent
            </p>
          </div>
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

        {/* Zone d'upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Ajouter des fichiers
            </CardTitle>
            <CardDescription>
              Glissez-déposez vos fichiers ou cliquez pour les sélectionner
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Zone de drag & drop */}
            <div
              {...fileDrop.dragProps}
              onClick={openFileSelector}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${fileDrop.isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
                }
              `}
            >
              <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <div>
                <p className="text-lg font-medium text-slate-900 mb-2">
                  {fileDrop.isDragging ? 'Relâchez pour uploader' : 'Glissez vos fichiers ici'}
                </p>
                <p className="text-slate-600 mb-4">
                  ou <span className="text-primary font-medium">cliquez pour parcourir</span>
                </p>
                <div className="text-sm text-slate-500">
                  <p className="mb-2">Types supportés :</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {supportedTypes.map(type => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {FILE_TYPE_LABELS[type] || type}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2">Taille maximum : 25MB par fichier</p>
                  <p className="mt-1 text-xs text-amber-600">⚠️ PDF : Maximum 100 pages par fichier</p>
                </div>
              </div>
            </div>

            {/* Fichiers en cours d'upload */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-medium text-slate-900">Uploads en cours</h3>
                {uploadedFiles.map((uploadFile, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <FileTypeIcon mimeType={uploadFile.file.type} className="w-5 h-5" />
                        <div>
                          <p className="font-medium text-sm">{uploadFile.file.name}</p>
                          <p className="text-xs text-slate-500">
                            <FileSizeFormatter size={uploadFile.file.size} />
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadFile.status === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeUploadedFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="h-2" />
                    )}
                    
                    {uploadFile.message && (
                      <p className={`text-sm mt-2 ${
                        uploadFile.status === 'error' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {uploadFile.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fichiers existants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fichiers de l'agent ({agentFiles.length})
            </CardTitle>
            <CardDescription>
              Fichiers actuellement utilisés par cet agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFiles ? (
              <p className="text-slate-600 text-center py-8">Chargement des fichiers...</p>
            ) : agentFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4">Aucun fichier ajouté pour le moment</p>
                <p className="text-sm text-slate-500">
                  Ajoutez des fichiers pour enrichir les connaissances de votre agent
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agentFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileTypeIcon mimeType={file.fileType || 'application/octet-stream'} className="w-5 h-5" />
                        <div>
                          <p className="font-medium text-sm">{file.originalFilename}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <FileSizeFormatter size={parseInt(file.fileSize || '0')} />
                            <span>•</span>
                            <Badge 
                              variant={file.status === 'ready' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {file.status === 'ready' ? 'Prêt' : file.status === 'error' ? 'Erreur' : 'Upload en cours'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}