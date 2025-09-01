"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/stores/authStore"

/**
 * Page d'inscription avec design glassmorphism moderne
 * - Formulaire d'inscription complet avec validation
 * - Vérification de la force du mot de passe
 * - Confirmation du mot de passe
 * - Design cohérent avec la homepage verte
 * - Animations fluides et feedback visuel
 * - Redirection vers dashboard après inscription
 */

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
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

  // Vérification de la force du mot de passe
  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    strength = Object.values(checks).filter(Boolean).length
    
    return {
      strength,
      checks,
      level: strength < 2 ? 'weak' : strength < 4 ? 'medium' : 'strong'
    }
  }

  const passwordAnalysis = formData.password ? getPasswordStrength(formData.password) : null

  // Validation du formulaire
  const validateForm = () => {
    const newErrors: typeof fieldErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères"
    }
    
    if (!formData.email) {
      newErrors.email = "L'email est requis"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }
    
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis"
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères"
    } else if (passwordAnalysis && passwordAnalysis.strength < 3) {
      newErrors.password = "Le mot de passe doit être plus fort"
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer le mot de passe"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas"
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
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })
      
      if (result.success) {
        // Redirection vers dashboard
        router.push("/dashboard")
      }
      // L'erreur sera gérée automatiquement par le store Zustand
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
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
          className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl"
          animate={{ scale: [1.3, 1, 1.3], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        
        {/* Particules flottantes */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-emerald-400/50 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -120, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 6,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative w-full max-w-lg"
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
              Rejoignez-nous dès aujourd'hui
            </motion.div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Créer un compte
            </h1>
            <p className="text-slate-600">
              Commencez votre aventure avec l'IA
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

            {/* Champ Nom */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium">
                Nom complet
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`pl-10 h-12 border-2 rounded-xl transition-all duration-300 ${
                    fieldErrors.name 
                      ? "border-red-300 focus:border-red-500" 
                      : "border-slate-200 focus:border-emerald-500"
                  }`}
                  placeholder="Votre nom complet"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm"
                >
                  {fieldErrors.name}
                </motion.p>
              )}
            </div>

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
              
              {/* Indicateur de force du mot de passe */}
              {formData.password && passwordAnalysis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 rounded-full flex-1 transition-colors ${
                            level <= passwordAnalysis.strength
                              ? passwordAnalysis.level === 'weak'
                                ? 'bg-red-400'
                                : passwordAnalysis.level === 'medium'
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordAnalysis.level === 'weak'
                        ? 'text-red-600'
                        : passwordAnalysis.level === 'medium'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {passwordAnalysis.level === 'weak' ? 'Faible' : 
                       passwordAnalysis.level === 'medium' ? 'Moyen' : 'Fort'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {Object.entries({
                      'Au moins 8 caractères': passwordAnalysis.checks.length,
                      'Majuscule': passwordAnalysis.checks.uppercase,
                      'Minuscule': passwordAnalysis.checks.lowercase,
                      'Chiffre': passwordAnalysis.checks.number,
                    }).map(([label, valid]) => (
                      <div key={label} className={`flex items-center gap-1 ${valid ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className={`w-3 h-3 ${valid ? 'text-green-500' : 'text-gray-300'}`} />
                        {label}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              
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

            {/* Champ Confirmation mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={`pl-10 pr-10 h-12 border-2 rounded-xl transition-all duration-300 ${
                    fieldErrors.confirmPassword 
                      ? "border-red-300 focus:border-red-500" 
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? "border-green-300 focus:border-green-500"
                      : "border-slate-200 focus:border-emerald-500"
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && !fieldErrors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-500 text-sm flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Les mots de passe correspondent
                </motion.p>
              )}
              {fieldErrors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm"
                >
                  {fieldErrors.confirmPassword}
                </motion.p>
              )}
            </div>

            {/* Bouton d'inscription */}
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
                    Créer mon compte
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.div>

            {/* Lien vers connexion */}
            <motion.div variants={itemVariants} className="text-center pt-4">
              <p className="text-slate-600">
                Déjà un compte ?{" "}
                <Link 
                  href="/login" 
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Se connecter
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