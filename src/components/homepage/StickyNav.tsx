"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Zap, Cog, MessageSquare, Users } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Menu de navigation vertical sticky avec effet blur moderne
 * - Position fixe à droite de l'écran
 * - Background blur glassmorphism
 * - Animation d'apparition au scroll
 * - Navigation smooth vers les sections
 * - Indicateur de section active
 */

const navigationItems = [
  {
    id: "hero",
    label: "Accueil",
    icon: Home,
  },
  {
    id: "features",
    label: "Fonctionnalités",
    icon: Zap,
  },
  {
    id: "how-it-works",
    label: "Comment ça marche",
    icon: Cog,
  },
  {
    id: "demo",
    label: "Démonstration",
    icon: MessageSquare,
  },
  {
    id: "cta",
    label: "Nous rejoindre",
    icon: Users,
  },
]

export function StickyNav() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeSection, setActiveSection] = useState("hero")

  // Afficher le menu après un scroll de 100px
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Observer les sections pour déterminer la section active
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, observerOptions)

    // Observer toutes les sections
    navigationItems.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  // Navigation smooth vers une section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:block"
        >
          {/* Container avec effet glassmorphism */}
          <div className="backdrop-blur-xl bg-white/80 border border-emerald-200/50 rounded-2xl p-3 shadow-xl shadow-emerald-500/10">
            <div className="flex flex-col gap-2">
              {navigationItems.map((item) => {
                const isActive = activeSection === item.id
                const Icon = item.icon

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "group relative p-3 rounded-xl transition-all duration-300",
                      "hover:bg-emerald-50 hover:shadow-md",
                      isActive 
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" 
                        : "text-slate-600 hover:text-emerald-600"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    
                    {/* Tooltip au hover */}
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      {item.label}
                      {/* Flèche tooltip */}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
                    </motion.div>
                  </motion.button>
                )
              })}
            </div>

            {/* Indicateur de progression verticale */}
            <motion.div 
              className="absolute left-1 top-3 bottom-3 w-0.5 bg-emerald-100 rounded-full overflow-hidden"
            >
              <motion.div
                className="w-full bg-emerald-500 rounded-full origin-top"
                style={{
                  scaleY: `${(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%`
                }}
                transition={{ duration: 0.1 }}
              />
            </motion.div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}