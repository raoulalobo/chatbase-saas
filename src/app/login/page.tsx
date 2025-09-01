"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/stores/authStore"

/**
 * Page de connexion avec design glassmorphism moderne
 * - Formulaire de connexion email/mot de passe
 * - Validation côté client
 * - Design cohérent avec la homepage verte
 * - Animations fluides et micro-interactions
 * - Redirection vers dashboard après connexion
 */

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  // Validation simple côté client
  const validateForm = () => {
    const newErrors: typeof fieldErrors = {}
    
    if (!formData.email) {
      newErrors.email = "L'email est requis"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }
    
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis"
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères"
    }
    
    setFieldErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumission du formulaire avec Zustand
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    // Effacer les erreurs précédentes
    clearError()
    
    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      })
      
      if (result.success) {
        // Redirection vers dashboard
        router.push("/dashboard")
      }
      // L'erreur sera gérée automatiquement par le store Zustand
    } catch (error) {
      console.error("Erreur lors de la connexion:", error)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Effacer l'erreur du champ quand l'utilisateur tape
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
    // Effacer l'erreur générale
    if (error) {
      clearError()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 flex items-center justify-center p-6">
      {/* Background décoratif */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        {/* Particules flottantes */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Container principal avec glassmorphism */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-emerald-500/10 p-8">
          {/* En-tête */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4" />
              Bon retour parmi nous
            </motion.div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Se connecter
            </h1>
            <p className="text-slate-600">
              Accédez à votre tableau de bord Agent IA
            </p>
          </motion.div>

          {/* Formulaire */}
          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
            {/* Erreur générale */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Champ Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Adresse email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 h-12 border-2 rounded-xl transition-all duration-300 ${
                    fieldErrors.email 
                      ? "border-red-300 focus:border-red-500" 
                      : "border-slate-200 focus:border-emerald-500"
                  }`}
                  placeholder="votre@email.com"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm"
                >
                  {fieldErrors.email}
                </motion.p>
              )}
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`pl-10 pr-10 h-12 border-2 rounded-xl transition-all duration-300 ${
                    fieldErrors.password 
                      ? "border-red-300 focus:border-red-500" 
                      : "border-slate-200 focus:border-emerald-500"
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </div>
              {fieldErrors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm"
                >
                  {fieldErrors.password}
                </motion.p>
              )}
            </div>

            {/* Lien mot de passe oublié */}
            <div className="text-right">
              <Link 
                href="/forgot-password" 
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton de connexion */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.div>

            {/* Lien vers inscription */}
            <motion.div variants={itemVariants} className="text-center pt-4">
              <p className="text-slate-600">
                Pas encore de compte ?{" "}
                <Link 
                  href="/register" 
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  S'inscrire
                </Link>
              </p>
            </motion.div>
          </motion.form>
        </div>

        {/* Retour à l'accueil */}
        <motion.div
          variants={itemVariants}
          className="text-center mt-6"
        >
          <Link 
            href="/" 
            className="text-slate-500 hover:text-emerald-600 text-sm transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}