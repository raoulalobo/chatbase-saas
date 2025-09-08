/**
 * Système de Rate Limiting pour l'API publique des widgets
 * 
 * Fonctionnalités:
 * - Limitation par IP et par agent
 * - Fenêtres glissantes avec Redis ou mémoire locale
 * - Différents niveaux selon le type d'usage
 * - Headers standards de rate limiting
 */

interface RateLimitConfig {
  windowMs: number // Fenêtre en millisecondes
  maxRequests: number // Nombre max de requêtes
  keyGenerator: (ip: string, agentId?: string) => string // Générateur de clé
  message?: string // Message d'erreur personnalisé
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

// Configuration par défaut des limites de taux
export const RATE_LIMITS = {
  // Limite globale par IP (toutes APIs confondues)
  global: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requêtes par minute par IP
    keyGenerator: (ip: string) => `global:${ip}`,
    message: "Trop de requêtes depuis cette adresse IP"
  },
  
  // Limite par agent et IP (API widget)
  widget: {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 30, // 30 messages par minute par IP/agent
    keyGenerator: (ip: string, agentId?: string) => `widget:${ip}:${agentId}`,
    message: "Trop de messages envoyés à cet agent"
  },
  
  // Limite par domaine (protection contre l'abus)
  domain: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requêtes par minute par domaine
    keyGenerator: (domain: string) => `domain:${domain}`,
    message: "Limite de taux dépassée pour ce domaine"
  }
} satisfies Record<string, RateLimitConfig>

// Store en mémoire pour le développement
// TODO: Remplacer par Redis en production
class MemoryRateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()
  
  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    
    // Nettoyer les entrées expirées
    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      return null
    }
    
    return entry
  }
  
  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const resetTime = now + windowMs
    
    const existing = await this.get(key)
    
    if (existing) {
      existing.count++
      this.store.set(key, existing)
      return existing
    } else {
      const newEntry = { count: 1, resetTime }
      this.store.set(key, newEntry)
      return newEntry
    }
  }
  
  // Nettoyage périodique des entrées expirées
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Instance du store
const store = new MemoryRateLimitStore()

// Nettoyage automatique toutes les 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000)

/**
 * Vérifier et appliquer le rate limiting
 */
export class RateLimiter {
  /**
   * Vérifier la limite pour une configuration donnée
   */
  static async checkLimit(
    config: RateLimitConfig, 
    ip: string, 
    agentId?: string
  ): Promise<RateLimitResult> {
    try {
      const key = config.keyGenerator(ip, agentId)
      const entry = await store.increment(key, config.windowMs)
      
      const success = entry.count <= config.maxRequests
      const remaining = Math.max(0, config.maxRequests - entry.count)
      const retryAfter = success ? undefined : Math.ceil((entry.resetTime - Date.now()) / 1000)
      
      return {
        success,
        limit: config.maxRequests,
        remaining,
        resetTime: entry.resetTime,
        retryAfter
      }
      
    } catch (error) {
      console.error('Erreur rate limiter:', error)
      // En cas d'erreur, autoriser la requête mais logger l'incident
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      }
    }
  }
  
  /**
   * Vérifier les limites globales (IP)
   */
  static async checkGlobalLimit(ip: string): Promise<RateLimitResult> {
    return this.checkLimit(RATE_LIMITS.global, ip)
  }
  
  /**
   * Vérifier les limites widget (IP + Agent)
   */
  static async checkWidgetLimit(ip: string, agentId: string): Promise<RateLimitResult> {
    return this.checkLimit(RATE_LIMITS.widget, ip, agentId)
  }
  
  /**
   * Vérifier les limites par domaine
   */
  static async checkDomainLimit(domain: string): Promise<RateLimitResult> {
    const config = {
      ...RATE_LIMITS.domain,
      keyGenerator: (d: string) => `domain:${d}`
    }
    return this.checkLimit(config, domain)
  }
  
  /**
   * Générer les headers de réponse standard
   */
  static generateHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    }
    
    if (result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString()
    }
    
    return headers
  }
}

/**
 * Middleware de rate limiting pour les routes API
 */
export function createRateLimitMiddleware(configName: keyof typeof RATE_LIMITS) {
  return async function rateLimitMiddleware(
    request: Request, 
    agentId?: string
  ): Promise<{ success: boolean; headers: Record<string, string>; message?: string }> {
    
    // Extraire l'IP de la requête
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded 
      ? forwarded.split(',')[0].trim()
      : request.headers.get('x-real-ip') || '127.0.0.1'
    
    const config = RATE_LIMITS[configName]
    const result = await RateLimiter.checkLimit(config, ip, agentId)
    
    return {
      success: result.success,
      headers: RateLimiter.generateHeaders(result),
      message: result.success ? undefined : config.message
    }
  }
}

/**
 * Rate limiter spécialisé pour l'API widget
 */
export async function checkWidgetRateLimit(
  request: Request,
  agentId: string
): Promise<{ success: boolean; headers: Record<string, string>; message?: string }> {
  
  // Extraire IP et domaine
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded 
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || '127.0.0.1'
    
  const origin = request.headers.get('origin')
  const domain = origin ? new URL(origin).hostname : 'unknown'
  
  // Vérification globale (IP)
  const globalCheck = await RateLimiter.checkGlobalLimit(ip)
  if (!globalCheck.success) {
    return {
      success: false,
      headers: RateLimiter.generateHeaders(globalCheck),
      message: RATE_LIMITS.global.message
    }
  }
  
  // Vérification widget (IP + Agent)
  const widgetCheck = await RateLimiter.checkWidgetLimit(ip, agentId)
  if (!widgetCheck.success) {
    return {
      success: false,
      headers: RateLimiter.generateHeaders(widgetCheck),
      message: RATE_LIMITS.widget.message
    }
  }
  
  // Vérification domaine
  const domainCheck = await RateLimiter.checkDomainLimit(domain)
  if (!domainCheck.success) {
    return {
      success: false,
      headers: RateLimiter.generateHeaders(domainCheck),
      message: RATE_LIMITS.domain.message
    }
  }
  
  // Toutes les vérifications passent - utiliser les headers les plus restrictifs
  const mostRestrictive = [globalCheck, widgetCheck, domainCheck]
    .reduce((min, current) => current.remaining < min.remaining ? current : min)
  
  return {
    success: true,
    headers: RateLimiter.generateHeaders(mostRestrictive)
  }
}

/**
 * Utilitaires pour les statistiques de rate limiting
 */
export class RateLimitStats {
  /**
   * Obtenir les statistiques actuelles pour une clé
   */
  static async getStats(key: string): Promise<{
    current: number
    resetTime: number
    remaining: number
  } | null> {
    const entry = await store.get(key)
    if (!entry) return null
    
    return {
      current: entry.count,
      resetTime: entry.resetTime,
      remaining: Math.max(0, RATE_LIMITS.widget.maxRequests - entry.count)
    }
  }
  
  /**
   * Réinitialiser les compteurs pour une clé (admin uniquement)
   */
  static async resetKey(key: string): Promise<boolean> {
    try {
      // En production, ceci devrait vérifier les permissions admin
      store.store.delete(key)
      return true
    } catch {
      return false
    }
  }
}