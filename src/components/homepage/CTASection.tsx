"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { 
  ArrowRight, 
  CheckCircle, 
  Sparkles,
  Shield,
  Clock,
  Users,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

/**
 * Section Call-to-Action finale avec design moderne
 * - Fond en dégradé avec effets visuels
 * - Garanties et indicateurs de confiance
 * - CTAs doubles avec hiérarchie claire
 * - Animations d'entrée progressives
 * - Témoignages de confiance intégrés
 */

const trustIndicators = [
  {
    icon: Shield,
    text: "Sécurité garantie RGPD",
    color: "emerald"
  },
  {
    icon: Clock,
    text: "Configuration en 5 minutes",
    color: "blue"
  },
  {
    icon: Users,
    text: "Support français inclus",
    color: "purple"
  }
]

const guarantees = [
  "07 jours d'essai gratuit",
  "Pas de frais cachés",
  "Annulation à tout moment",
  "Support dédié français"
]

export function CTASection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  }

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  }

  return (
    <section 
      ref={ref}
      id="cta" 
      className="py-24 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 relative overflow-hidden"
    >
      {/* Background décoratif */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Pattern de grille subtile */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} 
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Badge de lancement */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 rounded-full text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Lancez votre Agent IA dès aujourd'hui
            <motion.div
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={pulseAnimation}
            />
          </motion.div>

          {/* Titre principal */}
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
          >
            Prêt à transformer votre{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
              service client
            </span>{" "}
            ?
          </motion.h2>

          {/* Sous-titre */}
          <motion.p
            variants={itemVariants}
            className="text-xl text-emerald-100/90 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Rejoignez les entreprises qui ont déjà fait le choix de l'excellence 
            avec nos agents IA personnalisés. Configuration simple, résultats garantis.
          </motion.p>

          {/* CTAs principaux */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 text-xl font-bold rounded-2xl shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all duration-300 group border-2 border-emerald-400/50"
              >
                Créer mon Agent IA
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              className="border-2 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 px-10 py-5 text-xl font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300"
            >
              Essai gratuit 07 jours
            </Button>
          </motion.div>

          {/* Indicateurs de confiance */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {trustIndicators.map((indicator, index) => {
              const Icon = indicator.icon
              
              return (
                <motion.div
                  key={indicator.text}
                  className="flex items-center gap-4 p-4 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10"
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${
                    indicator.color === "emerald"
                      ? "from-emerald-400 to-emerald-600"
                      : indicator.color === "blue"
                      ? "from-blue-400 to-blue-600"
                      : "from-purple-400 to-purple-600"
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-emerald-100 font-medium">{indicator.text}</span>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Garanties */}
          <motion.div
            variants={itemVariants}
            className="p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Star className="w-6 h-6 text-emerald-400 fill-emerald-400" />
              <h3 className="text-2xl font-bold text-white">
                Notre Engagement Qualité
              </h3>
              <Star className="w-6 h-6 text-emerald-400 fill-emerald-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {guarantees.map((guarantee, index) => (
                <motion.div
                  key={guarantee}
                  className="flex items-center gap-3 text-emerald-100"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">{guarantee}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Message de fin */}
          <motion.div
            variants={itemVariants}
            className="mt-12 text-center"
          >
            <p className="text-emerald-200/80 text-lg font-medium">
              Rejoignez l'avenir du service client dès maintenant 🚀
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Effet de glow en bas */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-t from-emerald-500/20 to-transparent blur-xl" />
    </section>
  )
}