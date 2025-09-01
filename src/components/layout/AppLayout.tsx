"use client"

import * as React from "react"
import { Navbar } from "./Navbar"
import { Header } from "./Header"

/**
 * Layout principal de l'application avec navigation horizontale
 * - Navigation horizontale moderne en haut
 * - Zone de contenu principale sous la navbar
 * - Design responsive avec menu mobile
 */
interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Navigation horizontale */}
      <Navbar />
      
      {/* Header avec breadcrumbs */}
      <Header />
      
      {/* Zone de contenu principale */}
      <main className="p-4 lg:p-6 bg-gray-50/30 min-h-[calc(100vh-7rem)]">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}