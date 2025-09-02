"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Bot, Save, AlertCircle, Loader2, FileText, Upload } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAgentsStore } from "@/stores/agentsStore"
import { UpdateAgentSchema, type UpdateAgent } from "@/lib/schemas/agent"

/**
 * Page d'édition d'un agent IA existant
 * - Chargement automatique des données de l'agent
 * - Formulaire pré-rempli avec validation Zod
 * - Sauvegarde des modifications
 * - Navigation vers la liste après sauvegarde
 */

// Modèles disponibles pour les agents
const AVAILABLE_MODELS = [
  { value: "claude-3-5-sonnet-20241204", label: "Claude 3.5 Sonnet (Latest)" },
  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
]

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const { 
    selectedAgent,
    fetchAgent,
    updateAgent,
    isLoading,
    isUpdating,
    error 
  } = useAgentsStore()

  // Configuration du formulaire avec React Hook Form et Zod
  const form = useForm<UpdateAgent>({
    resolver: zodResolver(UpdateAgentSchema),
    defaultValues: {
      name: "",
      description: "",
      systemPrompt: "",
      temperature: "0.7",
      maxTokens: "4000",
      topP: "0.9",
      model: "claude-3-5-sonnet-20241204",
      isActive: true,
      restrictToDocuments: true,
    },
  })

  // Charger les données de l'agent au montage
  React.useEffect(() => {
    if (agentId && (!selectedAgent || selectedAgent.id !== agentId)) {
      fetchAgent(agentId)
    }
  }, [agentId, selectedAgent, fetchAgent])

  // Mettre à jour le formulaire quand l'agent est chargé
  React.useEffect(() => {
    if (selectedAgent && selectedAgent.id === agentId) {
      form.reset({
        name: selectedAgent.name,
        description: selectedAgent.description,
        systemPrompt: selectedAgent.systemPrompt,
        temperature: selectedAgent.temperature.toString(),
        maxTokens: selectedAgent.maxTokens.toString(),
        topP: selectedAgent.topP.toString(),
        model: selectedAgent.model,
        isActive: selectedAgent.isActive,
        restrictToDocuments: selectedAgent.restrictToDocuments,
      })
    }
  }, [selectedAgent, agentId, form])

  // Gérer la soumission du formulaire
  const onSubmit = async (data: UpdateAgent) => {
    if (!agentId) return
    
    const result = await updateAgent(agentId, data)
    
    if (result.success) {
      // Rediriger vers la liste des agents après mise à jour
      router.push('/agents')
    }
  }

  // État de chargement
  if (isLoading || !selectedAgent || selectedAgent.id !== agentId) {
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
            <Link href="/agents">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux agents
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Modifier l'agent : {selectedAgent.name}
            </h1>
            <p className="text-slate-600 mt-2">
              Ajustez la configuration et le comportement de votre assistant
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

        {/* Formulaire d'édition */}
        <div className="max-w-4xl">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Informations générales
                </CardTitle>
                <CardDescription>
                  Modifiez les informations de base de votre agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nom de l'agent */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de l'agent *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Assistant de support client"
                      className={form.formState.errors.name ? "border-red-500" : ""}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Statut */}
                  <div className="space-y-2">
                    <Label htmlFor="isActive">Statut</Label>
                    <select
                      id="isActive"
                      value={form.watch("isActive") ? "true" : "false"}
                      onChange={(e) => form.setValue("isActive", e.target.value === "true")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="true">Actif</option>
                      <option value="false">Inactif</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Décrivez brièvement le rôle et les capacités de cet agent..."
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      form.formState.errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instruction système */}
            <Card>
              <CardHeader>
                <CardTitle>Instruction système</CardTitle>
                <CardDescription>
                  Modifiez le comportement et la personnalité de votre agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">Prompt système *</Label>
                  <textarea
                    id="systemPrompt"
                    {...form.register("systemPrompt")}
                    rows={6}
                    placeholder="Tu es un expert en service client. Tu réponds toujours de manière professionnelle et empathique..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      form.formState.errors.systemPrompt ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {form.formState.errors.systemPrompt && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.systemPrompt.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Le prompt système détermine le comportement de base de votre agent.
                    Soyez précis et détaillé.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configuration avancée */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration du modèle</CardTitle>
                <CardDescription>
                  Paramètres techniques pour optimiser les performances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Modèle */}
                  <div className="space-y-2">
                    <Label htmlFor="model">Modèle IA *</Label>
                    <select
                      id="model"
                      value={form.watch("model")}
                      onChange={(e) => form.setValue("model", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {AVAILABLE_MODELS.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Température */}
                  <div className="space-y-2">
                    <Label htmlFor="temperature">
                      Température ({form.watch("temperature")})
                    </Label>
                    <Input
                      id="temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      {...form.register("temperature")}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500">
                      0 = Plus déterministe, 1 = Plus créatif
                    </p>
                    {form.formState.errors.temperature && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.temperature.message}
                      </p>
                    )}
                  </div>

                  {/* Tokens maximum */}
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Tokens maximum</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min="100"
                      max="8000"
                      step="100"
                      {...form.register("maxTokens")}
                      placeholder="4000"
                      className={form.formState.errors.maxTokens ? "border-red-500" : ""}
                    />
                    {form.formState.errors.maxTokens && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.maxTokens.message}
                      </p>
                    )}
                  </div>

                  {/* Top P */}
                  <div className="space-y-2">
                    <Label htmlFor="topP">
                      Top P ({form.watch("topP")})
                    </Label>
                    <Input
                      id="topP"
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      {...form.register("topP")}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500">
                      Contrôle la diversité des réponses
                    </p>
                    {form.formState.errors.topP && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.topP.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section dédiée aux restrictions */}
                <div className="col-span-full">
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-base font-medium text-slate-900 mb-3">Comportement de l'agent</h3>
                    
                    {/* Restriction aux documents */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="restrictToDocuments"
                        checked={form.watch("restrictToDocuments")}
                        onChange={(e) => form.setValue("restrictToDocuments", e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <div className="flex-1">
                        <Label htmlFor="restrictToDocuments" className="text-sm font-medium text-slate-900 cursor-pointer">
                          Restreindre aux documents fournis
                        </Label>
                        <p className="text-xs text-slate-600 mt-1">
                          L'agent utilisera uniquement les informations contenues dans les documents uploadés et ignorera ses connaissances préexistantes. 
                          Si l'information n'est pas dans les documents, l'agent le mentionnera explicitement.
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          💡 Recommandé pour garantir que les réponses proviennent exclusivement de vos sources
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gestion des fichiers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Fichiers sources
                </CardTitle>
                <CardDescription>
                  Gérez les fichiers qui enrichissent les connaissances de cet agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">
                      Les fichiers permettent à votre agent d'avoir accès à des informations spécifiques
                    </p>
                    <p className="text-xs text-slate-500">
                      Formats supportés : PDF, TXT, MD, DOCX, CSV, JSON, HTML
                    </p>
                  </div>
                  <Button asChild variant="outline" className="flex items-center gap-2">
                    <Link href={`/agents/${agentId}/files`}>
                      <Upload className="w-4 h-4" />
                      Gérer les fichiers
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href="/agents">Annuler</Link>
              </Button>
              <Button
                type="submit"
                disabled={isUpdating || !form.formState.isValid}
                className="bg-primary hover:bg-primary/90"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}