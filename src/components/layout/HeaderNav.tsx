"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Menu, 
  X, 
  Bot, 
  Home, 
  Zap, 
  Cog, 
  MessageSquare, 
  Users,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Settings,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAuth } from "@/stores/authStore"

/**
 * Header de navigation horizontal avec design moderne
 * - Navigation sticky avec background blur
 * - Logo à gauche, navigation au centre, auth à droite
 * - Menu hamburger responsive sur mobile
 * - Smooth scroll vers les sections de la homepage
 * - Intégration Login/Register
 * - Design glassmorphism cohérent avec la homepage
 */

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  action?: () => void
}

const navigationItems: NavigationItem[] = [
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

const authItems: NavigationItem[] = [
  {
    id: "login",
    label: "Se connecter",
    icon: LogIn,
    href: "/login",
  },
  {
    id: "register",
    label: "S'inscrire",
    icon: UserPlus,
    href: "/register",
  },
]

export function HeaderNav() {
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("hero")
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

  // Afficher le header avec blur après un scroll de 50px
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50
      setIsVisible(scrolled)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Observer les sections pour déterminer la section active
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -20% 0px",
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
    setIsMobileMenuOpen(false) // Fermer le menu mobile après navigation
  }

  // Fermer le menu mobile lors du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isMobileMenuOpen])

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserDropdownOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Gestion de la déconnexion
  const handleLogout = async () => {
    await logout()
    setIsUserDropdownOpen(false)
  }

  return (
    <>
      {/* Header principal */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isVisible
            ? "backdrop-blur-xl bg-white/90 border-b border-emerald-200/50 shadow-lg shadow-emerald-500/5"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                ChatbaseAI
              </span>
            </motion.div>

            {/* Navigation desktop */}
            <nav className="hidden lg:flex items-center gap-8">
              {navigationItems.map((item) => {
                const isActive = activeSection === item.id
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl font-medium transition-all duration-300 relative",
                      isActive
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </nav>

            {/* Section authentification desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated && user ? (
                // Menu utilisateur connecté
                <div className="relative">
                  <motion.button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    
                    {/* Nom utilisateur */}
                    <span className="text-slate-700 font-medium">
                      {user.name || 'Utilisateur'}
                    </span>
                    
                    {/* Chevron */}
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${
                      isUserDropdownOpen ? 'rotate-180' : ''
                    }`} />
                  </motion.button>

                  {/* Dropdown menu */}
                  <AnimatePresence>
                    {isUserDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-56 backdrop-blur-xl bg-white/90 border border-emerald-200/50 rounded-2xl shadow-2xl py-2 z-50"
                      >
                        {/* Info utilisateur */}
                        <div className="px-4 py-3 border-b border-emerald-100">
                          <p className="text-sm text-slate-500">Connecté en tant que</p>
                          <p className="font-semibold text-slate-900 truncate">{user.email}</p>
                        </div>
                        
                        {/* Menu items */}
                        <div className="py-2">
                          <Link 
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-emerald-50 transition-colors"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            Dashboard
                          </Link>
                          
                          <Link 
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-emerald-50 transition-colors"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            Profil
                          </Link>
                          
                          <hr className="my-2 border-emerald-100" />
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                            disabled={isLoading}
                          >
                            <LogOut className="w-4 h-4" />
                            {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Boutons login/register pour utilisateurs non connectés
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-medium transition-all duration-300"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Se connecter
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300">
                      <UserPlus className="w-4 h-4 mr-2" />
                      S'inscrire
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Bouton menu mobile */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Menu mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
            
            {/* Menu drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-16 right-0 bottom-0 w-80 backdrop-blur-xl bg-white/95 border-l border-emerald-200/50 shadow-2xl z-50 lg:hidden"
            >
              <div className="p-6 space-y-8">
                {/* Navigation mobile */}
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Navigation
                  </h3>
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeSection === item.id
                    
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                          isActive
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-600"
                        )}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Section authentification mobile */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Compte
                  </h3>
                  
                  {isAuthenticated && user ? (
                    // Menu utilisateur connecté mobile
                    <div className="space-y-3">
                      {/* Info utilisateur */}
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-600 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions utilisateur */}
                      <div className="space-y-2">
                        <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start h-12">
                            <User className="w-5 h-5 mr-3" />
                            Dashboard
                          </Button>
                        </Link>
                        
                        <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start h-12">
                            <Settings className="w-5 h-5 mr-3" />
                            Profil
                          </Button>
                        </Link>
                        
                        <Button
                          onClick={() => {
                            handleLogout()
                            setIsMobileMenuOpen(false)
                          }}
                          variant="outline"
                          className="w-full justify-start h-12 text-red-600 border-red-200 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          <LogOut className="w-5 h-5 mr-3" />
                          {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Boutons login/register mobile
                    <div className="space-y-3">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button
                          variant="outline"
                          className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-medium h-12"
                        >
                          <LogIn className="w-5 h-5 mr-3" />
                          Se connecter
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 shadow-lg shadow-emerald-500/25">
                          <UserPlus className="w-5 h-5 mr-3" />
                          S'inscrire
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Footer mobile */}
                <div className="pt-6 border-t border-emerald-200/50">
                  <p className="text-xs text-slate-500 text-center">
                    Rejoignez l'avenir du service client
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}