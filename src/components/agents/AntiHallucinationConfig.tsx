"use client"

import * as React from "react"
import { Info, AlertTriangle, CheckCircle, XCircle, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  type AntiHallucinationTemplate, 
  type HallucinationIntensity,
  DEFAULT_TEMPLATES,
  calculateHallucinationRisk,
  UI_HELP_MESSAGES,
  SECTOR_EXAMPLES
} from "@/lib/templates/anti-hallucination"

/**
 * Composant de configuration anti-hallucination pour agents de service client
 * Interface utilisateur simplifiée pour clients non-techniques
 * 
 * Fonctionnalités:
 * - 4 niveaux d'intensité avec explications métier
 * - Configuration nom d'entreprise dynamique
 * - Calcul temps réel du risque d'hallucination
 * - Exemples par secteur d'activité
 * - Aperçu des messages de refus personnalisés
 */

interface AntiHallucinationConfigProps {
  value: AntiHallucinationTemplate
  onChange: (template: AntiHallucinationTemplate) => void
  className?: string
  showAdvancedFeatures?: boolean
}

export function AntiHallucinationConfig({
  value,
  onChange,
  className = "",
  showAdvancedFeatures = false
}: AntiHallucinationConfigProps) {
  // Une seule source de vérité : value.companyName
  const companyName = value.companyName || ""
  
  // Calculer le risque en temps réel
  const riskScore = calculateHallucinationRisk(value)
  const riskLevel = riskScore <= 30 ? 'low' : riskScore <= 60 ? 'medium' : 'high'
  
  /**
   * Gérer le changement d'intensité
   * Applique automatiquement le template correspondant
   */
  const handleIntensityChange = (intensity: HallucinationIntensity) => {
    const newTemplate = { 
      ...DEFAULT_TEMPLATES[intensity],
      companyName: companyName // Utiliser la source unique
    }
    onChange(newTemplate)
  }
  
  /**
   * Gérer le changement de nom d'entreprise
   * Mise à jour directe du template - source unique de vérité
   */
  const handleCompanyNameChange = (name: string) => {
    // Mettre à jour uniquement le template - plus simple !
    onChange({
      ...value,
      companyName: name,
      domain: value.domain.replace(/\[COMPANY_NAME\]/g, name)
    })
  }
  
  /**
   * Appliquer un exemple de secteur
   */
  const applySectorExample = (sectorKey: keyof typeof SECTOR_EXAMPLES) => {
    const example = SECTOR_EXAMPLES[sectorKey]
    
    const template = {
      ...DEFAULT_TEMPLATES[example.intensity],
      companyName: example.companyName,
      domain: example.domain.replace(/\[COMPANY_NAME\]/g, example.companyName)
    }
    onChange(template)
  }
  
  /**
   * Aperçu du message de refus avec nom d'entreprise
   */
  const getPreviewRefusalMessage = () => {
    const message = value.responsePatterns.refusalMessage
    return companyName 
      ? message.replace(/\[COMPANY_NAME\]/g, companyName)
      : message
  }
  
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration Anti-Hallucination
          </CardTitle>
          <CardDescription>
            Configurez la protection contre les réponses hors-contexte de votre agent de service client.
            Basé sur des tests prouvant 100% de fidélité contextuelle avec la configuration stricte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Configuration nom d'entreprise */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="companyName" className="text-sm font-medium">
                Nom de votre entreprise *
              </Label>
              <div className="flex gap-1">
                {Object.entries(SECTOR_EXAMPLES).map(([key, example]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applySectorExample(key as keyof typeof SECTOR_EXAMPLES)}
                    className="text-xs px-2 py-1"
                  >
                    {example.companyName}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="Ex: Oris Finance, AssurMax, ShopExpress..."
              className="w-full"
            />
            <p className="text-xs text-slate-600">
              Ce nom sera utilisé pour personnaliser les réponses de votre agent et définir son domaine d'expertise.
            </p>
          </div>
          
          {/* Sélection niveau d'intensité */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Niveau de protection anti-hallucination
            </Label>
            {!showAdvancedFeatures && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border-l-4 border-amber-400">
                📋 Configuration en lecture seule. Contactez votre administrateur pour modifier le niveau.
              </p>
            )}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 ${
              !showAdvancedFeatures ? 'opacity-75 pointer-events-none' : ''
            }`}>
              {(Object.keys(DEFAULT_TEMPLATES) as HallucinationIntensity[]).map((intensity) => {
                const isSelected = value.intensity === intensity
                const template = DEFAULT_TEMPLATES[intensity]
                
                return (
                  <div
                    key={intensity}
                    className={`border rounded-lg p-4 transition-all ${
                      showAdvancedFeatures ? 'cursor-pointer' : 'cursor-not-allowed'
                    } ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={showAdvancedFeatures ? () => handleIntensityChange(intensity) : undefined}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {intensity === 'disabled' && <XCircle className="w-4 h-4 text-red-500" />}
                        {intensity === 'light' && <CheckCircle className="w-4 h-4 text-yellow-500" />}
                        {intensity === 'strict' && <CheckCircle className="w-4 h-4 text-orange-500" />}
                        {intensity === 'ultra_strict' && <CheckCircle className="w-4 h-4 text-red-500" />}
                        <span className="font-medium text-sm capitalize">
                          {intensity.replace('_', ' ')}
                        </span>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
                    </div>
                    
                    <p className="text-xs text-slate-600 mb-2">
                      {UI_HELP_MESSAGES.intensity[intensity]}
                    </p>
                    
                    {/* Indicateurs visuels */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded text-xs ${
                        template.contextLimitations.rejectOutOfScope 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        Hors-sujet: {template.contextLimitations.rejectOutOfScope ? 'Bloqué' : 'Autorisé'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Indicateur de risque */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Évaluation du risque d'hallucination
              </Label>
              <div className="flex items-center gap-2">
                {riskLevel === 'low' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {riskLevel === 'medium' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                {riskLevel === 'high' && <XCircle className="w-4 h-4 text-red-500" />}
                <span className={`text-sm font-medium ${
                  riskLevel === 'low' ? 'text-green-600' :
                  riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {riskScore}/100
                </span>
              </div>
            </div>
            
            {/* Barre de progression du risque */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  riskLevel === 'low' ? 'bg-green-500' :
                  riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
            
            <p className="text-xs text-slate-600">
              {UI_HELP_MESSAGES.risk[riskLevel]}
            </p>
          </div>
          
          {/* Aperçu des messages */}
          {value.enabled && companyName && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Aperçu des réponses automatiques
              </Label>
              
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-1">
                    Message de refus (questions hors-sujet) :
                  </p>
                  <p className="text-xs text-slate-600 italic">
                    "{getPreviewRefusalMessage()}"
                  </p>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-1">
                    Message d'escalade (incertitude) :
                  </p>
                  <p className="text-xs text-slate-600 italic">
                    "{value.responsePatterns.escalationMessage.replace(/\[COMPANY_NAME\]/g, companyName)}"
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Configuration avancée */}
          <div className={`space-y-3 relative ${!showAdvancedFeatures ? 'opacity-50' : ''}`}>
            <Label className="text-sm font-medium">
              Options avancées
            </Label>
            
            {!showAdvancedFeatures && (
              <div className="absolute inset-0 bg-gray-50/80 rounded-lg flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-600 flex items-center gap-2">
                    🔒 Configuration réservée aux administrateurs
                  </p>
                </div>
              </div>
            )}
            
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ${
              !showAdvancedFeatures ? 'pointer-events-none' : ''
            }`}>
              <div className="flex items-center justify-between">
                <span>Limites contextuelles strictes</span>
                <div className={`px-2 py-1 rounded text-xs ${
                  value.contextLimitations.strictBoundaries 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {value.contextLimitations.strictBoundaries ? 'Activé' : 'Désactivé'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Prévention invention</span>
                <div className={`px-2 py-1 rounded text-xs ${
                  value.contextLimitations.inventionPrevention 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {value.contextLimitations.inventionPrevention ? 'Activé' : 'Désactivé'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Rejet questions hors-sujet</span>
                <div className={`px-2 py-1 rounded text-xs ${
                  value.contextLimitations.rejectOutOfScope 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {value.contextLimitations.rejectOutOfScope ? 'Activé' : 'Désactivé'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Mention concurrents</span>
                <div className={`px-2 py-1 rounded text-xs ${
                  value.contextLimitations.competitorMention 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {value.contextLimitations.competitorMention ? 'Autorisé' : 'Bloqué'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Note informative */}
          {showAdvancedFeatures ? (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Recommandations basées sur nos tests</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li><strong>Configuration "Strict"</strong> : 100% de fidélité contextuelle testée</li>
                  <li><strong>Service client</strong> : Évite les erreurs sur produits concurrents</li>
                  <li><strong>Coût optimisé</strong> : Prompts longs mais haute efficacité</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Info className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">🔒 Informations techniques masquées</p>
                <p className="text-xs">
                  Les détails sur les performances et recommandations internes sont réservés aux administrateurs.
                </p>
              </div>
            </div>
          )}
          
        </CardContent>
      </Card>
    </div>
  )
}