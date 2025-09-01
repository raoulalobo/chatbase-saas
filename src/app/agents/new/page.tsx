"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Bot, Save, AlertCircle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAgentsStore } from "@/stores/agentsStore"
import { CreateAgentSchema, type CreateAgent } from "@/lib/schemas/agent"

/**
 * Page de création d'un nouvel agent IA
 * - Formulaire avec validation Zod
 * - Intégration avec le store Zustand
 * - Configuration complète de l'agent (modèle, température, etc.)
 * - Navigation automatique après création
 */

// Modèles disponibles pour les agents
const AVAILABLE_MODELS = [
  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
]

export default function NewAgentPage() {
  const router = useRouter()
  const { createAgent, isCreating, error } = useAgentsStore()

  // Configuration du formulaire avec React Hook Form et Zod
  const form = useForm<CreateAgent>({
    resolver: zodResolver(CreateAgentSchema),
    defaultValues: {
      name: "",
      description: "",
      systemPrompt: "Tu es un assistant IA serviable, honnête et précis. Réponds de manière concise et utile aux questions de l'utilisateur.",
      temperature: "0.7",
      maxTokens: "4000",
      topP: "0.9",
      model: "claude-3-5-sonnet-20241022",
      isActive: true,
    },
  })

  // Gérer la soumission du formulaire
  const onSubmit = async (data: CreateAgent) => {
    const result = await createAgent(data)
    
    if (result.success && result.agent) {
      // Rediriger vers la page de l'agent créé
      router.push(`/agents/${result.agent.id}`)
    }
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
            <h1 className="text-3xl font-bold text-slate-900">Nouvel Agent IA</h1>
            <p className="text-slate-600 mt-2">
              Créez un assistant intelligent personnalisé selon vos besoins
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

        {/* Formulaire de création */}
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
                  Définissez les informations de base de votre agent
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
                  Définissez le comportement et la personnalité de votre agent
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
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href="/agents">Annuler</Link>
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !form.formState.isValid}
                className="bg-primary hover:bg-primary/90"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Créer l'agent
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