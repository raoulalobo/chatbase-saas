"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AppLayout } from "@/components/layout/AppLayout"
import { WidgetPreview } from "@/components/widgets/WidgetPreview"
import { 
  Copy, 
  ExternalLink, 
  Settings, 
  Shield, 
  Code2, 
  Palette,
  Globe,
  Key,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react"
import type { Agent } from "@/types"

/**
 * Dashboard d'intégration widget pour un agent spécifique
 * Permet de configurer et obtenir le code d'embed sécurisé
 */

interface WidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  primaryColor: string
  title: string
  subtitle: string
  placeholder: string
  autoOpen: boolean
  height: string
  width: string
  showBranding: boolean
  animation: boolean
}

const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  position: 'bottom-right',
  primaryColor: '#3b82f6',
  title: 'Assistant virtuel',
  subtitle: 'Comment puis-je vous aider ?',
  placeholder: 'Tapez votre message...',
  autoOpen: false,
  height: '600px',
  width: '380px',
  showBranding: true,
  animation: true
}

export default function EmbedDashboard() {
  const params = useParams()
  const agentId = params.id as string
  
  // États du composant
  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(DEFAULT_WIDGET_CONFIG)
  const [allowedDomains, setAllowedDomains] = useState<string[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  // Charger les données de l'agent au montage
  useEffect(() => {
    loadAgentData()
  }, [agentId])

  /**
   * Charger les données de l'agent et sa configuration widget
   */
  const loadAgentData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/agents/${agentId}`)
      if (!response.ok) throw new Error('Agent non trouvé')
      
      const agentData = await response.json()
      setAgent(agentData)
      
      // Charger la configuration widget si elle existe
      if (agentData.widgetConfig) {
        const config = typeof agentData.widgetConfig === 'string' 
          ? JSON.parse(agentData.widgetConfig) 
          : agentData.widgetConfig
        setWidgetConfig({ ...DEFAULT_WIDGET_CONFIG, ...config })
      }
      
      // Charger les domaines autorisés
      if (agentData.allowedDomains) {
        const domains = typeof agentData.allowedDomains === 'string'
          ? JSON.parse(agentData.allowedDomains)
          : agentData.allowedDomains
        setAllowedDomains(domains || [])
      }
      
    } catch (error) {
      console.error('Erreur chargement agent:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Générer une nouvelle clé API publique
   */
  const generatePublicApiKey = async () => {
    try {
      setIsGeneratingKey(true)
      const response = await fetch(`/api/agents/${agentId}/generate-api-key`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Erreur génération clé API')
      
      const data = await response.json()
      setAgent(prev => prev ? { ...prev, publicApiKey: data.publicApiKey } : null)
      
    } catch (error) {
      console.error('Erreur génération API Key:', error)
    } finally {
      setIsGeneratingKey(false)
    }
  }

  /**
   * Sauvegarder la configuration widget
   */
  const saveConfiguration = async () => {
    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/agents/${agentId}/widget-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetConfig,
          allowedDomains
        })
      })
      
      if (!response.ok) throw new Error('Erreur sauvegarde')
      
      // Feedback visuel de succès
      setCopySuccess('Configuration sauvegardée !')
      setTimeout(() => setCopySuccess(null), 2000)
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Ajouter un domaine autorisé
   */
  const addDomain = () => {
    if (newDomain && !allowedDomains.includes(newDomain)) {
      setAllowedDomains([...allowedDomains, newDomain])
      setNewDomain('')
    }
  }

  /**
   * Supprimer un domaine autorisé
   */
  const removeDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter(d => d !== domain))
  }

  /**
   * Générer le code d'intégration widget
   */
  const generateEmbedCode = () => {
    if (!agent?.publicApiKey) return ''
    
    const baseUrl = window.location.origin
    
    return `<!-- Widget ChatBase - Intégration Agent IA -->
<script>
  window.ChatbaseConfig = {
    agentId: '${agentId}',
    publicApiKey: '${agent.publicApiKey}',
    baseUrl: '${baseUrl}',
    position: '${widgetConfig.position}',
    primaryColor: '${widgetConfig.primaryColor}',
    title: '${widgetConfig.title}',
    subtitle: '${widgetConfig.subtitle}',
    placeholder: '${widgetConfig.placeholder}',
    autoOpen: ${widgetConfig.autoOpen},
    height: '${widgetConfig.height}',
    width: '${widgetConfig.width}',
    showBranding: ${widgetConfig.showBranding},
    animation: ${widgetConfig.animation}
  }
</script>
<script src="${baseUrl}/chatbase-widget.js"></script>
<!-- Fin Widget ChatBase -->`
  }

  /**
   * Copier le code dans le presse-papiers
   */
  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(successMessage)
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (error) {
      console.error('Erreur copie:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Chargement de la configuration d'intégration...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Agent introuvable</h2>
          <p className="text-gray-600">L'agent demandé n'existe pas ou vous n'y avez pas accès.</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Intégration Widget</h1>
              <p className="text-gray-600">
                Intégrez l'agent <strong>{agent.name}</strong> sur vos sites externes
              </p>
            </div>
          </div>
          
          {copySuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {copySuccess}
            </div>
          )}
        </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-6">
          
          {/* Clé API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Clé API Publique
              </CardTitle>
              <CardDescription>
                Clé d'authentification sécurisée pour l'intégration widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {agent.publicApiKey ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input 
                      value={showApiKey ? agent.publicApiKey : '•'.repeat(32)} 
                      readOnly 
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(agent.publicApiKey!, 'Clé API copiée !')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    ⚠️ Conservez cette clé en sécurité. Elle permet l'accès à votre agent.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">
                    Aucune clé API générée. Créez-en une pour activer l'intégration widget.
                  </p>
                  <Button 
                    onClick={generatePublicApiKey} 
                    disabled={isGeneratingKey}
                    className="w-full"
                  >
                    {isGeneratingKey ? 'Génération...' : 'Générer une clé API'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Domaines autorisés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Domaines Autorisés
              </CardTitle>
              <CardDescription>
                Contrôlez les sites web autorisés à utiliser votre agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="exemple.com ou *.exemple.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                />
                <Button onClick={addDomain} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {allowedDomains.length > 0 ? (
                <div className="space-y-2">
                  {allowedDomains.map((domain) => (
                    <div key={domain} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm">{domain}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeDomain(domain)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  Aucune restriction - Tous les domaines sont autorisés
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration apparence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Personnalisation
              </CardTitle>
              <CardDescription>
                Adaptez l'apparence du widget à votre site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={widgetConfig.title}
                    onChange={(e) => setWidgetConfig(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="primaryColor">Couleur principale</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="subtitle">Message d'accueil</Label>
                <Input
                  id="subtitle"
                  value={widgetConfig.subtitle}
                  onChange={(e) => setWidgetConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="placeholder">Placeholder de saisie</Label>
                <Input
                  id="placeholder"
                  value={widgetConfig.placeholder}
                  onChange={(e) => setWidgetConfig(prev => ({ ...prev, placeholder: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <select 
                    id="position"
                    value={widgetConfig.position}
                    onChange={(e) => setWidgetConfig(prev => ({ ...prev, position: e.target.value as any }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="bottom-right">Bas droite</option>
                    <option value="bottom-left">Bas gauche</option>
                    <option value="top-right">Haut droite</option>
                    <option value="top-left">Haut gauche</option>
                  </select>
                </div>
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2 mt-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={widgetConfig.autoOpen}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, autoOpen: e.target.checked }))}
                      />
                      Ouverture automatique
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={widgetConfig.animation}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, animation: e.target.checked }))}
                      />
                      Animations
                    </label>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={saveConfiguration} 
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Aperçu du widget */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Aperçu en temps réel
              </CardTitle>
              <CardDescription>
                Visualisez l'apparence du widget avec vos paramètres actuels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WidgetPreview 
                config={widgetConfig} 
                agentName={agent?.name}
              />
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Modifiez les paramètres dans la section "Personnalisation" pour voir les changements en temps réel.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code d'intégration */}
        <div className="space-y-6">
          
          {/* Code d'intégration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                Code d'Intégration
              </CardTitle>
              <CardDescription>
                Copiez ce code dans votre site web pour intégrer le widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agent.publicApiKey ? (
                <div className="space-y-3">
                  <Textarea
                    value={generateEmbedCode()}
                    readOnly
                    rows={12}
                    className="font-mono text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => copyToClipboard(generateEmbedCode(), 'Code d\'intégration copié !')}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier le code
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('/chatbase-widget.js', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Code2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Générez une clé API pour obtenir le code d'intégration</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions d'installation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Instructions d'Installation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <h4 className="font-medium">Copiez le code d'intégration</h4>
                    <p className="text-sm text-gray-600">Utilisez le bouton "Copier le code" ci-dessus</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>
                    <h4 className="font-medium">Collez avant la balise &lt;/body&gt;</h4>
                    <p className="text-sm text-gray-600">Ajoutez le code juste avant la fermeture de votre page HTML</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>
                    <h4 className="font-medium">Testez l'intégration</h4>
                    <p className="text-sm text-gray-600">Le widget apparaîtra automatiquement sur votre site</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Conseils d'utilisation</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Le widget s'adapte automatiquement aux écrans mobiles</li>
                  <li>• Configurez les domaines autorisés pour la sécurité</li>
                  <li>• Personnalisez les couleurs selon votre charte graphique</li>
                  <li>• Testez l'agent avant la mise en production</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AppLayout>
  )
}