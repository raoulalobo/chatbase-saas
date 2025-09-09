"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Bot, Save, AlertCircle, Loader2, Code2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAgentsStore } from "@/stores/agentsStore"
import { UpdateAgentSchema, type UpdateAgent } from "@/lib/schemas/agent"
import { AntiHallucinationConfig } from "@/components/agents/AntiHallucinationConfig"
import { getDefaultTemplate, AntiHallucinationTemplateSchema } from "@/lib/templates/anti-hallucination"

/**
 * Page d'édition d'un agent IA existant
 * - Chargement automatique des données de l'agent
 * - Formulaire pré-rempli avec validation Zod
 * - Sauvegarde des modifications
 * - Navigation vers la liste après sauvegarde
 */

// Modèles disponibles pour les agents (Claude Haiku en premier par défaut)
const AVAILABLE_MODELS = [
  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (Rapide & Économique)" },
  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Équilibré)" },
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus (Puissant)" },
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
  const [companyName, setCompanyName] = React.useState("")
  const [successMessage, setSuccessMessage] = React.useState("")

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
      model: "claude-3-5-haiku-20241022",
      isActive: true,
      restrictToPromptSystem: true,
      antiHallucinationTemplate: AntiHallucinationTemplateSchema.parse({
        enabled: true,
        intensity: 'strict',
        domain: "services client",
        companyName: "",
        contextLimitations: {
          strictBoundaries: true,
          rejectOutOfScope: true,
          inventionPrevention: true,
          competitorMention: false,
        },
        responsePatterns: {
          refusalMessage: "Je suis spécialisé uniquement dans les services de cette entreprise. Cette question sort de mon domaine d'expertise.",
          escalationMessage: "Pour cette demande spécifique, je vous invite à contacter notre service client directement.",
          uncertaintyMessage: "Je ne dispose pas de cette information précise. Laissez-moi vous mettre en relation avec un expert.",
        },
      }),
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
      const template = selectedAgent.antiHallucinationTemplate || AntiHallucinationTemplateSchema.parse({
        enabled: true,
        intensity: 'strict',
        domain: "services client",
        companyName: "",
        contextLimitations: {
          strictBoundaries: true,
          rejectOutOfScope: true,
          inventionPrevention: true,
          competitorMention: false,
        },
        responsePatterns: {
          refusalMessage: "Je suis spécialisé uniquement dans les services de cette entreprise. Cette question sort de mon domaine d'expertise.",
          escalationMessage: "Pour cette demande spécifique, je vous invite à contacter notre service client directement.",
          uncertaintyMessage: "Je ne dispose pas de cette information précise. Laissez-moi vous mettre en relation avec un expert.",
        },
      })
      
      form.reset({
        name: selectedAgent.name,
        description: selectedAgent.description,
        systemPrompt: selectedAgent.systemPrompt,
        temperature: selectedAgent.temperature.toString(),
        maxTokens: selectedAgent.maxTokens.toString(),
        topP: selectedAgent.topP.toString(),
        model: selectedAgent.model,
        isActive: selectedAgent.isActive,
        restrictToPromptSystem: selectedAgent.restrictToPromptSystem || true,
        antiHallucinationTemplate: template,
      })
      
      // Récupérer le nom d'entreprise depuis le template
      if (template.companyName) {
        setCompanyName(template.companyName)
      }
    }
  }, [selectedAgent, agentId, form])

  // Gérer la soumission du formulaire
  const onSubmit = async (data: UpdateAgent) => {
    if (!agentId) return
    
    const result = await updateAgent(agentId, data)
    
    if (result.success) {
      // Afficher un message de succès temporaire
      setSuccessMessage("Agent mis à jour avec succès")
      
      // Masquer le message après 4 secondes
      setTimeout(() => {
        setSuccessMessage("")
      }, 4000)
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
        <div className="flex items-center justify-between">
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
          
          {/* Bouton d'accès à l'intégration widget */}
          <Button variant="outline" asChild className="bg-primary/5 border-primary/20 hover:bg-primary/10">
            <Link href={`/agents/${agentId}/embed`}>
              <Code2 className="w-4 h-4 mr-2" />
              Intégration Widget
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

        {/* Message de succès */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                <path d="M3 7l-2-2 1-1 1 1 3-3 1 1z"/>
              </svg>
            </div>
            <div className="text-green-800">
              <p className="font-medium">{successMessage}</p>
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
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">
                      Le prompt système détermine le comportement de base de votre agent.
                      Soyez précis et détaillé.
                    </p>
                    <p className={`text-xs font-medium ${
                      (form.watch("systemPrompt")?.length || 0) > 150000 
                        ? "text-red-600" 
                        : (form.watch("systemPrompt")?.length || 0) > 120000 
                          ? "text-amber-600" 
                          : "text-slate-600"
                    }`}>
                      {form.watch("systemPrompt")?.length || 0} / 150000 caractères
                    </p>
                  </div>
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
                    
                    {/* Activation du système anti-hallucination */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="restrictToPromptSystem"
                        checked={form.watch("restrictToPromptSystem") ?? true}
                        onChange={(e) => form.setValue("restrictToPromptSystem", e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <div className="flex-1">
                        <Label htmlFor="restrictToPromptSystem" className="text-sm font-medium text-slate-900 cursor-pointer">
                          Activer la protection anti-hallucination
                        </Label>
                        <p className="text-xs text-slate-600 mt-1">
                          Système avancé basé sur des templates pour empêcher l'agent de sortir de son contexte 
                          ou d'inventer des informations. Testé avec 100% de fidélité contextuelle.
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          ✅ Recommandé pour tous les agents de service client
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Anti-Hallucination Avancée */}
            {form.watch("restrictToPromptSystem") && (
              <AntiHallucinationConfig
                value={form.watch("antiHallucinationTemplate")}
                onChange={(template) => {
                  // S'assurer que le companyName est toujours inclus dans le template
                  const updatedTemplate = {
                    ...template,
                    companyName: template.companyName || companyName
                  }
                  form.setValue("antiHallucinationTemplate", updatedTemplate)
                }}
                companyName={companyName}
                onCompanyNameChange={(name) => {
                  setCompanyName(name)
                  // Mettre à jour aussi le template avec le nouveau nom
                  const currentTemplate = form.watch("antiHallucinationTemplate")
                  form.setValue("antiHallucinationTemplate", {
                    ...currentTemplate,
                    companyName: name
                  })
                }}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href="/agents">Annuler</Link>
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
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