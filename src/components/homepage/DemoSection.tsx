"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Zap,
  Clock,
  TrendingUp,
  Sparkles,
  Play
} from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Section Démonstration Live avec chat widget interactif
 * - Chat simulation en temps réel
 * - Métriques animées (temps de réponse, satisfaction)
 * - Interface moderne avec glassmorphism
 * - Messages prédéfinis avec typing animation
 */

const demoConversation = [
  {
    id: 1,
    type: "user",
    message: "Bonjour ! J'ai un problème avec ma commande #12345",
    timestamp: "14:32",
  },
  {
    id: 2,
    type: "bot",
    message: "Bonjour ! Je comprends votre préoccupation concernant la commande #12345. Laissez-moi vérifier les détails pour vous aider au mieux. 🔍",
    timestamp: "14:32",
    delay: 1000,
  },
  {
    id: 3,
    type: "bot",
    message: "J'ai trouvé votre commande ! Elle a été expédiée hier et devrait arriver demain entre 9h et 12h. Voici le numéro de suivi : TR123456789. Avez-vous d'autres questions ?",
    timestamp: "14:32",
    delay: 2500,
  },
  {
    id: 4,
    type: "user",
    message: "Parfait ! Puis-je modifier l'adresse de livraison ?",
    timestamp: "14:33",
    delay: 4000,
  },
  {
    id: 5,
    type: "bot",
    message: "Bien sûr ! Je peux vous aider à modifier l'adresse. Comme le colis n'a pas encore été livré, je peux contacter le transporteur pour faire le changement. Quelle est la nouvelle adresse ? 📍",
    timestamp: "14:33",
    delay: 5500,
  },
]

const metrics = [
  {
    icon: Clock,
    label: "Temps de réponse",
    value: "0.8s",
    color: "emerald",
  },
  {
    icon: TrendingUp,
    label: "Satisfaction client",
    value: "96%",
    color: "blue",
  },
  {
    icon: Zap,
    label: "Résolution instantanée",
    value: "84%",
    color: "purple",
  },
]

export function DemoSection() {
  const [messages, setMessages] = useState<typeof demoConversation>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [typingMessage, setTypingMessage] = useState("")
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingMessage])

  const startDemo = () => {
    setIsPlaying(true)
    setMessages([])
    setCurrentMessageIndex(0)
    playNextMessage(0)
  }

  const playNextMessage = (index: number) => {
    if (index >= demoConversation.length) {
      setIsPlaying(false)
      return
    }

    const message = demoConversation[index]
    const delay = message.delay || 0

    setTimeout(() => {
      if (message.type === "bot") {
        // Animation de typing pour les messages bot
        setTypingMessage("Agent IA est en train d'écrire...")
        setTimeout(() => {
          setMessages(prev => [...prev, message])
          setTypingMessage("")
          setCurrentMessageIndex(index + 1)
          playNextMessage(index + 1)
        }, 1500)
      } else {
        setMessages(prev => [...prev, message])
        setCurrentMessageIndex(index + 1)
        playNextMessage(index + 1)
      }
    }, delay)
  }

  return (
    <section 
      ref={ref}
      id="demo" 
      className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden"
    >
      {/* Background décoratif */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-200/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* En-tête */}
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
            Démonstration Interactive
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Voyez votre{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">
              Agent IA
            </span>{" "}
            en action
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Découvrez comment nos agents IA transforment l'expérience client 
            avec des réponses précises et une résolution instantanée des problèmes.
          </p>

          <Button
            onClick={startDemo}
            disabled={isPlaying}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
          >
            <Play className="w-5 h-5 mr-2" />
            {isPlaying ? "Démonstration en cours..." : "Lancer la démonstration"}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {/* Chat Widget */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative">
              {/* Header du chat */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 rounded-t-2xl text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Agent IA - Support Client</h3>
                    <div className="flex items-center gap-2 text-emerald-100 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      En ligne • Répond en 0.8s
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="bg-white rounded-b-2xl shadow-2xl border border-gray-200 h-96 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                          message.type === "user"
                            ? "bg-emerald-500 text-white"
                            : "bg-white text-slate-800 border border-gray-200"
                        }`}>
                          <div className="flex items-start gap-3">
                            {message.type === "bot" && (
                              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bot className="w-4 h-4 text-emerald-600" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm leading-relaxed">{message.message}</p>
                              <span className={`text-xs mt-1 block ${
                                message.type === "user" ? "text-emerald-100" : "text-gray-500"
                              }`}>
                                {message.timestamp}
                              </span>
                            </div>
                            {message.type === "user" && (
                              <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing indicator */}
                    {typingMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white text-slate-800 border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                              <Bot className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex space-x-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 bg-emerald-500 rounded-full"
                                  animate={{ opacity: [0.4, 1, 0.4] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <input
                        type="text"
                        placeholder="Tapez votre message..."
                        className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-500"
                        disabled
                      />
                      <button className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Métriques */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Performance en Temps Réel
              </h3>
              <p className="text-slate-600">
                Métriques actuelles de l'agent IA
              </p>
            </div>

            {metrics.map((metric, index) => {
              const Icon = metric.icon
              
              return (
                <motion.div
                  key={metric.label}
                  className="p-6 rounded-2xl backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${
                      metric.color === "emerald"
                        ? "from-emerald-400 to-emerald-600"
                        : metric.color === "blue"
                        ? "from-blue-400 to-blue-600"
                        : "from-purple-400 to-purple-600"
                    } shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    {metric.value}
                  </div>
                  
                  <div className="text-slate-600 font-medium">
                    {metric.label}
                  </div>
                </motion.div>
              )
            })}

            {/* Statistiques supplémentaires */}
            <motion.div
              className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ delay: 1 }}
            >
              <div className="text-center">
                <MessageSquare className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-emerald-800 mb-1">
                  +150%
                </div>
                <div className="text-emerald-700 font-medium text-sm">
                  D'amélioration de satisfaction client
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}