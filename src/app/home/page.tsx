"use client"

import { StickyNav } from "@/components/homepage/StickyNav"
import { HeroSection } from "@/components/homepage/HeroSection"
import { FeaturesSection } from "@/components/homepage/FeaturesSection"
import { HowItWorksSection } from "@/components/homepage/HowItWorksSection"
import { DemoSection } from "@/components/homepage/DemoSection"
import { CTASection } from "@/components/homepage/CTASection"

/**
 * Page d'accueil principale avec design moderne 2025
 * - Navigation sticky avec glassmorphism
 * - Sections animées au scroll
 * - Design vert cohérent avec effets blur
 * - Présentation détaillée du produit Agent IA
 * - Optimisé pour les performances et l'accessibilité
 */

export default function HomePage() {
  return (
    <main className="relative">
      {/* Navigation sticky */}
      <StickyNav />
      
      {/* Sections de la homepage */}
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <CTASection />
    </main>
  )
}