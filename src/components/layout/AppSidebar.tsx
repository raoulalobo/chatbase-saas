"use client"

import * as React from "react"
import { 
  Home,
  Bot,
  MessageSquare,
  FileText,
  Settings,
  ChevronUp,
  User2
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Navigation principale de l'application
 * - Logo et branding en haut
 * - Menu de navigation avec icônes vertes
 * - Section utilisateur en bas
 * - Textes foncés pour excellente lisibilité
 */

// Configuration de la navigation
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Agents IA",
    url: "/agents",
    icon: Bot,
  },
  {
    title: "Conversations",
    url: "/conversations",
    icon: MessageSquare,
  },
  {
    title: "Fichiers",
    url: "/files", 
    icon: FileText,
  },
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-gray-200">
      {/* Header avec logo */}
      <SidebarHeader className="px-4 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">ChatBase</h1>
            <p className="text-xs text-slate-600">SaaS Agents IA</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Contenu principal */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-700 font-medium text-xs uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={cn(
                        "w-full justify-start px-3 py-2.5 rounded-lg transition-colors",
                        "text-slate-700 hover:text-slate-900 hover:bg-green-50",
                        isActive && "bg-primary text-primary-foreground shadow-sm font-medium"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer avec utilisateur */}
      <SidebarFooter className="px-4 py-4 border-t border-gray-100">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full justify-between px-3 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User2 className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900">Utilisateur</p>
                      <p className="text-xs text-slate-600">test@example.com</p>
                    </div>
                  </div>
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="text-slate-700">
                  <User2 className="w-4 h-4 mr-2" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}