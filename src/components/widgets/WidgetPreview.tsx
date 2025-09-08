"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"

/**
 * Interface pour la configuration du widget
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

/**
 * Props du composant WidgetPreview
 */
interface WidgetPreviewProps {
  config: WidgetConfig
  agentName?: string
}

/**
 * Composant de prévisualisation du widget ChatBase
 * Affiche un aperçu en temps réel de l'apparence du widget selon la configuration
 */
export function WidgetPreview({ config, agentName }: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calculer les styles de positionnement selon la configuration
  const getPositionStyles = () => {
    const offset = isOpen ? '80px' : '20px'
    
    switch (config.position) {
      case 'bottom-left':
        return { bottom: offset, left: '20px' }
      case 'top-right':
        return { top: offset, right: '20px' }
      case 'top-left':
        return { top: offset, left: '20px' }
      case 'bottom-right':
      default:
        return { bottom: offset, right: '20px' }
    }
  }

  // Parser les dimensions pour s'assurer qu'elles sont valides
  const getWidgetDimensions = () => {
    const parseSize = (size: string) => {
      if (size.includes('px')) return size
      if (size.includes('%')) return size
      return `${size}px`
    }
    
    return {
      width: parseSize(config.width),
      height: parseSize(config.height)
    }
  }

  const positionStyles = getPositionStyles()
  const dimensions = getWidgetDimensions()

  return (
    <div className="relative h-96 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden border">
      {/* Fond simulé d'un site web */}
      <div className="absolute inset-0 p-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="h-3 bg-slate-300 rounded mb-2 w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded mb-2 w-1/2"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="h-3 bg-slate-300 rounded mb-2 w-2/3"></div>
          <div className="h-3 bg-slate-200 rounded mb-2 w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>

      {/* Widget en prévisualisation */}
      <div 
        className="absolute transition-all duration-300 ease-out z-10"
        style={{ 
          ...positionStyles,
          transform: isOpen ? 'scale(0.7)' : 'scale(0.8)',
          transformOrigin: config.position.includes('top') 
            ? config.position.includes('left') ? 'top left' : 'top right'
            : config.position.includes('left') ? 'bottom left' : 'bottom right'
        }}
      >
        {/* Bouton du widget (quand fermé) */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white text-xl font-semibold transition-transform hover:scale-110"
            style={{ backgroundColor: config.primaryColor }}
          >
            <MessageCircle size={24} />
          </button>
        )}

        {/* Interface de chat (quand ouvert) */}
        {isOpen && (
          <div 
            className="bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border"
            style={{ 
              width: dimensions.width,
              height: dimensions.height,
              maxWidth: '300px', // Limite pour la prévisualisation
              maxHeight: '400px'
            }}
          >
            {/* Header du chat */}
            <div 
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: config.primaryColor }}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {config.title}
                </h3>
                <p className="text-xs opacity-90 truncate">
                  {config.subtitle}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="ml-2 p-1 rounded opacity-80 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>

            {/* Zone des messages */}
            <div className="flex-1 p-3 bg-gray-50 overflow-hidden">
              <div className="bg-white rounded-lg p-3 shadow-sm text-xs max-w-[80%]">
                Bonjour ! {config.subtitle}
              </div>
            </div>

            {/* Zone de saisie */}
            <div className="p-3 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={config.placeholder}
                  className="flex-1 border rounded-full px-3 py-2 text-xs outline-none focus:ring-1"
                  style={{ '--tw-ring-color': config.primaryColor } as any}
                  disabled
                />
                <button
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center"
                  style={{ backgroundColor: config.primaryColor }}
                  disabled
                >
                  →
                </button>
              </div>
            </div>

            {/* Branding optionnel */}
            {config.showBranding && (
              <div className="px-3 py-2 text-center text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
                Propulsé par ChatBase
              </div>
            )}
          </div>
        )}
      </div>

      {/* Indicateur de position */}
      <div className="absolute top-2 left-2 bg-black/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
        Position: {config.position}
      </div>
      
      {/* Information sur l'agent */}
      {agentName && (
        <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
          Agent: {agentName}
        </div>
      )}
      
      {/* Instructions d'interaction */}
      <div className="absolute bottom-2 left-2 right-2 text-center">
        <p className="text-xs text-gray-600 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
          {isOpen ? 'Cliquez sur ✕ pour fermer' : 'Cliquez sur le bouton pour ouvrir'}
        </p>
      </div>
    </div>
  )
}