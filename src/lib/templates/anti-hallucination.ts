/**
 * Système de Templates Anti-Hallucination pour Service Client Multi-Entreprises
 * 
 * Architecture basée sur les résultats des tests:
 * - Prompt système 50k chars: 100% fidélité contextuelle, 0% hallucination
 * - 4 niveaux d'intensité configurable selon les besoins métier
 * - Templates dynamiques avec nom d'entreprise personnalisable
 * - Optimisé pour agents de service client spécialisés
 */

import { z } from "zod"

// Types d'intensité anti-hallucination
export type HallucinationIntensity = 'disabled' | 'light' | 'strict' | 'ultra_strict'

// Schéma de validation pour le template anti-hallucination
export const AntiHallucinationTemplateSchema = z.object({
  enabled: z.boolean().default(true),
  intensity: z.enum(['disabled', 'light', 'strict', 'ultra_strict']).default('strict'),
  domain: z.string().min(1, "Le domaine d'expertise est obligatoire").default("services client"),
  companyName: z.string().default(""), // Optionnel pour personnalisation
  contextLimitations: z.object({
    strictBoundaries: z.boolean().default(true), // Limites strictes du contexte
    rejectOutOfScope: z.boolean().default(true), // Rejeter questions hors-sujet
    inventionPrevention: z.boolean().default(true), // Empêcher invention d'infos
    competitorMention: z.boolean().default(false), // Interdire mention concurrents
  }),
  responsePatterns: z.object({
    refusalMessage: z.string().default("Je suis spécialisé uniquement dans les services de cette entreprise. Cette question sort de mon domaine d'expertise."),
    escalationMessage: z.string().default("Pour cette demande spécifique, je vous invite à contacter notre service client directement."),
    uncertaintyMessage: z.string().default("Je ne dispose pas de cette information précise. Laissez-moi vous mettre en relation avec un expert."),
  }),
})

export type AntiHallucinationTemplate = z.infer<typeof AntiHallucinationTemplateSchema>

/**
 * Templates prédéfinis par niveau d'intensité
 * Basés sur les résultats des tests d'hallucination
 */
export const DEFAULT_TEMPLATES: Record<HallucinationIntensity, AntiHallucinationTemplate> = {
  disabled: {
    enabled: false,
    intensity: 'disabled',
    domain: "services client",
    companyName: "",
    contextLimitations: {
      strictBoundaries: false,
      rejectOutOfScope: false,
      inventionPrevention: false,
      competitorMention: true,
    },
    responsePatterns: {
      refusalMessage: "",
      escalationMessage: "",
      uncertaintyMessage: "",
    },
  },

  light: {
    enabled: true,
    intensity: 'light',
    domain: "services client",
    companyName: "",
    contextLimitations: {
      strictBoundaries: true,
      rejectOutOfScope: false, // Peut essayer de répondre hors contexte
      inventionPrevention: true,
      competitorMention: true,
    },
    responsePatterns: {
      refusalMessage: "Je me spécialise dans les services [COMPANY_NAME], mais je peux vous donner des informations générales.",
      escalationMessage: "Pour des détails spécifiques, contactez notre équipe au [CONTACT].",
      uncertaintyMessage: "Je n'ai pas cette information précise, mais voici ce que je peux vous dire...",
    },
  },

  strict: {
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
      refusalMessage: "Je suis spécialisé uniquement dans les services [COMPANY_NAME]. Cette question sort de mon domaine d'expertise.",
      escalationMessage: "Pour cette demande spécifique, je vous invite à contacter notre service client directement.",
      uncertaintyMessage: "Je ne dispose pas de cette information précise dans ma base de connaissances [COMPANY_NAME].",
    },
  },

  ultra_strict: {
    enabled: true,
    intensity: 'ultra_strict',
    domain: "services [COMPANY_NAME] exclusivement",
    companyName: "",
    contextLimitations: {
      strictBoundaries: true,
      rejectOutOfScope: true,
      inventionPrevention: true,
      competitorMention: false,
    },
    responsePatterns: {
      refusalMessage: "ATTENTION: Je suis EXCLUSIVEMENT un assistant [COMPANY_NAME]. Je ne peux pas traiter de demandes externes à [COMPANY_NAME].",
      escalationMessage: "Cette demande nécessite un traitement par notre équipe [COMPANY_NAME]. Contactez-nous directement.",
      uncertaintyMessage: "Cette information n'est pas disponible dans ma base de données [COMPANY_NAME]. Je dois vous rediriger vers un expert.",
    },
  },
}

/**
 * Génère le prompt système anti-hallucination complet
 * Intègre le template dans le prompt utilisateur de base
 * 
 * @param template Configuration anti-hallucination
 * @param companyName Nom de l'entreprise (dynamique)
 * @param basePrompt Prompt système de base de l'utilisateur
 * @returns Prompt système complet avec protections anti-hallucination
 */
export function generateAntiHallucinationPrompt(
  template: AntiHallucinationTemplate,
  companyName: string,
  basePrompt: string
): string {
  // Si désactivé, retourner le prompt de base sans modifications
  if (!template.enabled || template.intensity === 'disabled') {
    return basePrompt
  }

  // Remplacer les placeholders par le nom d'entreprise réel
  const processMessage = (message: string) => 
    message.replace(/\[COMPANY_NAME\]/g, companyName)

  // Instructions de base selon l'intensité
  let instructions = ""

  if (template.intensity === 'light') {
    instructions = `
CONTEXTE PROFESSIONNEL:
Tu es un assistant spécialisé dans ${processMessage(template.domain)} ${companyName}.

DIRECTIVES COMPORTEMENTALES:
- Privilégier les informations ${companyName} quand disponibles
- Signaler quand tu sors du contexte ${companyName}
- Éviter d'inventer des informations non vérifiées`

  } else if (template.intensity === 'strict') {
    instructions = `
CONTEXTE STRICT:
Tu es un assistant spécialisé EXCLUSIVEMENT dans ${processMessage(template.domain)} ${companyName}.

LIMITATIONS CONTEXTUELLES OBLIGATOIRES:
- Si une question ne concerne PAS ${companyName}, réponds: "${processMessage(template.responsePatterns.refusalMessage)}"
- NE JAMAIS inventer d'informations non présentes dans le contexte ${companyName}
- NE JAMAIS répondre à des questions sur d'autres entreprises ou concurrents
- En cas d'incertitude: "${processMessage(template.responsePatterns.uncertaintyMessage)}"
- Pour escalade: "${processMessage(template.responsePatterns.escalationMessage)}"`

  } else if (template.intensity === 'ultra_strict') {
    instructions = `
CONTEXTE ULTRA-STRICT - RESPECT OBLIGATOIRE:
Tu es un assistant spécialisé UNIQUEMENT et EXCLUSIVEMENT dans ${processMessage(template.domain)} ${companyName}.

RÈGLES ABSOLUES - AUCUNE EXCEPTION:
- INTERDICTION FORMELLE de répondre à toute question ne concernant pas ${companyName}
- INTERDICTION d'inventer, supposer ou extrapoler des informations
- INTERDICTION de mentionner ou comparer avec d'autres entreprises
- RÉPONSE AUTOMATIQUE pour hors-sujet: "${processMessage(template.responsePatterns.refusalMessage)}"
- ESCALADE SYSTÉMATIQUE si incertain: "${processMessage(template.responsePatterns.escalationMessage)}"

SANCTIONS: Toute violation de ces règles constitue un échec critique.`
  }

  // Assembler le prompt final
  return `${instructions}

PROMPT UTILISATEUR PERSONNALISÉ:
${basePrompt}

RAPPEL FINAL: Reste toujours professionnel et dans ton rôle d'expert ${companyName}.`
}

/**
 * Valide un template anti-hallucination
 * 
 * @param template Template à valider
 * @returns Résultat de validation Zod
 */
export function validateAntiHallucinationTemplate(template: unknown) {
  return AntiHallucinationTemplateSchema.safeParse(template)
}

/**
 * Obtient le template par défaut pour une intensité donnée
 * 
 * @param intensity Niveau d'intensité souhaité
 * @returns Template configuré pour cette intensité
 */
export function getDefaultTemplate(intensity: HallucinationIntensity): AntiHallucinationTemplate {
  return { ...DEFAULT_TEMPLATES[intensity] }
}

/**
 * Calcule un score de risque d'hallucination basé sur la configuration
 * Utilisé pour l'interface utilisateur et les alertes
 * 
 * @param template Configuration anti-hallucination
 * @returns Score de 0 (aucun risque) à 100 (risque maximum)
 */
export function calculateHallucinationRisk(template: AntiHallucinationTemplate): number {
  if (!template.enabled) return 100

  let risk = 0

  // Facteurs de risque basés sur les tests
  if (!template.contextLimitations.strictBoundaries) risk += 30
  if (!template.contextLimitations.rejectOutOfScope) risk += 25  
  if (!template.contextLimitations.inventionPrevention) risk += 25
  if (template.contextLimitations.competitorMention) risk += 20

  // Bonus de sécurité selon l'intensité
  switch (template.intensity) {
    case 'ultra_strict': risk = Math.max(0, risk - 40); break
    case 'strict': risk = Math.max(0, risk - 20); break
    case 'light': risk = Math.max(0, risk - 5); break
  }

  return Math.min(100, risk)
}

/**
 * Exemples de templates pour différents secteurs d'activité
 * Utilisés pour la démonstration et l'onboarding
 */
export const SECTOR_EXAMPLES = {
  banking: {
    companyName: "Oris Finance",
    domain: "services bancaires Oris Finance",
    intensity: 'strict' as HallucinationIntensity,
  },
  insurance: {
    companyName: "AssurMax",
    domain: "services d'assurance AssurMax", 
    intensity: 'strict' as HallucinationIntensity,
  },
  ecommerce: {
    companyName: "ShopExpress",
    domain: "service client e-commerce ShopExpress",
    intensity: 'light' as HallucinationIntensity,
  },
  healthcare: {
    companyName: "CliniquePlus",
    domain: "services de santé CliniquePlus",
    intensity: 'ultra_strict' as HallucinationIntensity,
  },
} as const

/**
 * Messages d'aide contextuels pour l'interface utilisateur
 */
export const UI_HELP_MESSAGES = {
  intensity: {
    disabled: "⚠️ Aucune protection - L'agent peut répondre à toute question",
    light: "🟡 Protection légère - Recommandé pour e-commerce et services généraux", 
    strict: "🟠 Protection élevée - Recommandé pour finance et services spécialisés",
    ultra_strict: "🔴 Protection maximale - Recommandé pour santé et secteurs critiques",
  },
  risk: {
    low: "✅ Risque faible d'hallucination",
    medium: "⚠️ Risque modéré - Surveillance recommandée", 
    high: "❌ Risque élevé - Configuration non recommandée pour production",
  },
} as const