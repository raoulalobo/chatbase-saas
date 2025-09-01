"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { 
  Upload, 
  Settings, 
  Puzzle, 
  ArrowRight,
  FileText,
  Bot,
  Globe,
  CheckCircle,
  Sparkles
} from "lucide-react"

/**
 * Section Comment Ça Marche avec timeline verticale animée
 * - 3 étapes claires avec animations progressives
 * - Timeline verticale avec connecteurs animés
 * - Icônes et illustrations pour chaque étape
 * - Design moderne avec effets de révélation au scroll
 */

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Uploadez vos Documents",
    description: "Glissez-déposez vos FAQ, guides produits, documentation technique ou tout contenu qui représente votre expertise métier.",
    details: [
      "PDF, Word, Excel, texte brut",
      "Traitement automatique du contenu",
      "Analyse sémantique avancée",
    ],
    color: "emerald",
    illustration: FileText,
  },
  {
    number: "02", 
    icon: Settings,
    title: "Configurez votre Agent",
    description: "Personnalisez le ton, l'apparence et les comportements de votre agent IA pour qu'il reflète parfaitement votre marque.",
    details: [
      "Personnalité et ton de voix",
      "Design et couleurs de marque",
      "Règles de conversation",
    ],
    color: "blue",
    illustration: Bot,
  },
  {
    number: "03",
    icon: Puzzle,
    title: "Intégrez à votre Site",
    description: "Copiez-collez notre widget ou utilisez notre API pour intégrer l'agent directement dans votre site web existant.",
    details: [
      "Widget JavaScript simple",
      "API REST complète",
      "Support technique inclus",
    ],
    color: "purple",
    illustration: Globe,
  },
]

export function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  }

  const stepVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  }

  const timelineVariants = {
    hidden: { height: 0 },
    visible: {
      height: "100%",
      transition: {
        duration: 2,
        ease: "easeInOut",
      },
    },
  }

  return (
    <section 
      ref={ref}
      id="how-it-works" 
      className="py-24 bg-gradient-to-b from-emerald-50/50 to-white relative overflow-hidden"
    >
      {/* Background décoratif */}
      <div className="absolute inset-0">
        <div className="absolute top-40 right-20 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl" />
        <div className="absolute bottom-40 left-20 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-200/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* En-tête */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4" />
            Simple et Efficace
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Comment{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">
              ça marche
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            En seulement 3 étapes simples, créez un agent IA qui transformera 
            votre service client et ravira vos utilisateurs.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="relative"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {/* Ligne de timeline */}
            <div className="absolute left-6 md:left-1/2 md:-translate-x-0.5 top-24 w-0.5 bg-emerald-200 h-full hidden md:block">
              <motion.div
                className="w-full bg-emerald-500 origin-top"
                variants={timelineVariants}
              />
            </div>

            {/* Étapes */}
            <div className="space-y-20">
              {steps.map((step, index) => {
                const Icon = step.icon
                const Illustration = step.illustration
                const isEven = index % 2 === 0

                return (
                  <motion.div
                    key={step.number}
                    variants={stepVariants}
                    className={`relative flex flex-col md:flex-row items-center gap-12 ${
                      !isEven ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Contenu */}
                    <div className="flex-1">
                      <div className={`${!isEven ? "md:text-right" : ""}`}>
                        {/* Numéro d'étape */}
                        <motion.div
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${
                            step.color === "emerald"
                              ? "from-emerald-400 to-emerald-600"
                              : step.color === "blue"
                              ? "from-blue-400 to-blue-600"
                              : "from-purple-400 to-purple-600"
                          } text-white font-bold text-lg mb-6 shadow-lg`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          {step.number}
                        </motion.div>

                        {/* Titre */}
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                          {step.title}
                        </h3>

                        {/* Description */}
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                          {step.description}
                        </p>

                        {/* Détails */}
                        <div className={`space-y-3 ${!isEven ? "md:flex md:flex-col md:items-end" : ""}`}>
                          {step.details.map((detail, detailIndex) => (
                            <motion.div
                              key={detailIndex}
                              className="flex items-center gap-3"
                              initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isEven ? -20 : 20 }}
                              transition={{ delay: 0.5 + index * 0.3 + detailIndex * 0.1 }}
                            >
                              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              <span className="text-slate-700 font-medium">{detail}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Illustration centrale */}
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      {/* Circle de fond avec glassmorphism */}
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full backdrop-blur-xl bg-white/70 border border-white/20 shadow-2xl flex items-center justify-center">
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r ${
                          step.color === "emerald"
                            ? "from-emerald-400 to-emerald-600"
                            : step.color === "blue"
                            ? "from-blue-400 to-blue-600"
                            : "from-purple-400 to-purple-600"
                        } flex items-center justify-center shadow-lg`}>
                          <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                      </div>

                      {/* Effet de glow */}
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${
                        step.color === "emerald"
                          ? "from-emerald-400/20 to-emerald-600/20"
                          : step.color === "blue"
                          ? "from-blue-400/20 to-blue-600/20"
                          : "from-purple-400/20 to-purple-600/20"
                      } blur-xl -z-10 scale-125`} />

                      {/* Orbites animées */}
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-emerald-200 scale-150"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>

                    {/* Illustration secondaire (uniquement desktop) */}
                    <div className="flex-1 hidden lg:block">
                      <motion.div
                        className={`${isEven ? "text-left" : "text-right"}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                        transition={{ delay: 0.8 + index * 0.2 }}
                      >
                        <div className={`inline-flex p-8 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/60 to-emerald-50/60 border border-white/20 shadow-xl ${
                          step.color === "emerald"
                            ? "shadow-emerald-500/10"
                            : step.color === "blue"
                            ? "shadow-blue-500/10"
                            : "shadow-purple-500/10"
                        }`}>
                          <Illustration className={`w-16 h-16 ${
                            step.color === "emerald"
                              ? "text-emerald-600"
                              : step.color === "blue"
                              ? "text-blue-600"
                              : "text-purple-600"
                          }`} />
                        </div>
                      </motion.div>
                    </div>

                    {/* Flèche vers l'étape suivante */}
                    {index < steps.length - 1 && (
                      <motion.div
                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
                        initial={{ opacity: 0, y: -20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                        transition={{ delay: 1 + index * 0.3 }}
                      >
                        <ArrowRight className="w-6 h-6 text-emerald-400" />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* CTA de fin de section */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-emerald-100 text-emerald-800 rounded-full text-lg font-semibold">
            <CheckCircle className="w-6 h-6" />
            Configuration complète en moins de 10 minutes
          </div>
        </motion.div>
      </div>
    </section>
  )
}