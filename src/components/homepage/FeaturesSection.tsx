"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { 
  Bot, 
  Clock, 
  Database, 
  Zap, 
  Shield, 
  BarChart3,
  MessageSquare,
  Puzzle,
  Sparkles
} from "lucide-react"

/**
 * Section Fonctionnalités avec design glassmorphism moderne
 * - Cards avec effet verre et blur
 * - Animations au scroll avec Intersection Observer
 * - Grid responsive avec micro-interactions
 * - Icônes animées et couleurs vertes harmonieuses
 */

const features = [
  {
    icon: Bot,
    title: "Agent IA Personnalisé",
    description: "Chaque agent est entraîné spécifiquement avec vos données et votre ton de communication pour une expérience unique.",
    color: "emerald",
    gradient: "from-emerald-400 to-emerald-600",
  },
  {
    icon: Clock,
    title: "Disponible 24/7",
    description: "Vos clients obtiennent des réponses instantanées à toute heure, même quand votre équipe dort.",
    color: "blue",
    gradient: "from-blue-400 to-blue-600",
  },
  {
    icon: Database,
    title: "Intégration de Données",
    description: "Connectez vos documents, FAQ, base de connaissances pour des réponses précises et à jour.",
    color: "purple",
    gradient: "from-purple-400 to-purple-600",
  },
  {
    icon: Zap,
    title: "Réponses Instantanées",
    description: "Intelligence artificielle de pointe pour comprendre le contexte et répondre en moins d'une seconde.",
    color: "yellow",
    gradient: "from-yellow-400 to-yellow-600",
  },
  {
    icon: Shield,
    title: "Sécurité Maximale",
    description: "Vos données sont protégées avec un chiffrement de niveau bancaire et une conformité RGPD.",
    color: "red",
    gradient: "from-red-400 to-red-600",
  },
  {
    icon: BarChart3,
    title: "Analytics Avancées",
    description: "Suivez les performances, satisfaction clients et identifiez les points d'amélioration.",
    color: "indigo",
    gradient: "from-indigo-400 to-indigo-600",
  },
  {
    icon: MessageSquare,
    title: "Conversations Naturelles",
    description: "Interface conversationnelle fluide qui s'adapte au style de communication de vos clients.",
    color: "teal",
    gradient: "from-teal-400 to-teal-600",
  },
  {
    icon: Puzzle,
    title: "Intégration Facile",
    description: "Ajoutez votre agent à votre site en 2 clics sans modification technique complexe.",
    color: "orange",
    gradient: "from-orange-400 to-orange-600",
  },
  {
    icon: Sparkles,
    title: "IA Auto-apprenante",
    description: "L'agent s'améliore automatiquement grâce aux interactions et feedback de vos clients.",
    color: "pink",
    gradient: "from-pink-400 to-pink-600",
  },
]

export function FeaturesSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  }

  return (
    <section 
      ref={ref}
      id="features" 
      className="py-24 bg-gradient-to-b from-white to-emerald-50/50 relative overflow-hidden"
    >
      {/* Background décoratif */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* En-tête de section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4" />
            Fonctionnalités Avancées
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Pourquoi choisir nos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">
              Agents IA
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Découvrez les fonctionnalités qui font de nos agents IA les plus performants 
            du marché pour transformer votre service client.
          </p>
        </motion.div>

        {/* Grid des fonctionnalités */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Glassmorphism card */}
                <div className="relative p-8 rounded-2xl backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl shadow-emerald-500/5 hover:shadow-emerald-500/10 transition-all duration-500">
                  {/* Background gradient subtil */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-emerald-50/80 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Contenu */}
                  <div className="relative z-10">
                    {/* Icône avec animation */}
                    <motion.div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 mb-6 shadow-lg`}
                      whileHover={{ 
                        rotate: [0, -10, 10, 0],
                        scale: 1.1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="w-full h-full text-white" />
                    </motion.div>

                    {/* Titre */}
                    <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-emerald-700 transition-colors duration-300">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Effet de brillance au hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000" />
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTA section en bas */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-lg text-slate-600 mb-6">
            Prêt à transformer votre service client ?
          </p>
          <motion.button
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Découvrir toutes les fonctionnalités
          </motion.button>
        </motion.div>
      </div>

    </section>
  )
}