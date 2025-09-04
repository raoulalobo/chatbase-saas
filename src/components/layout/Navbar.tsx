"use client"

import * as React from "react"
import { 
  Home,
  Bot,
  MessageSquare,
  FileText,
  Settings,
  ChevronDown,
  User2,
  Bell,
  Search,
  Menu,
  X,
  LogOut
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAuth } from "@/stores/authStore"

/**
 * Navigation horizontale principale de l'application
 * - Logo et branding à gauche
 * - Menu de navigation horizontal au centre
 * - Actions utilisateur à droite (recherche, notifications, profil)
 * - Version responsive avec menu burger sur mobile
 */

// Configuration des éléments de navigation
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

export function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const { user, logout, isLoading } = useAuth()
  
  // Gestion de la déconnexion
  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo et branding */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">ChatBase</h1>
                <p className="text-xs text-slate-600 hidden sm:block">SaaS Agents IA</p>
              </div>
            </Link>
          </div>

          {/* Navigation principale - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.url
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  title={item.title}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                    "hover:bg-green-50 hover:text-slate-900",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-slate-700"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </Link>
              )
            })}
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-2">
            {/* Recherche - Hidden sur très petit écran */}
            <Button 
              variant="ghost" 
              size="sm"
              className="hidden sm:flex text-slate-700 hover:text-slate-900 hover:bg-gray-100"
            >
              <Search className="w-4 h-4" />
              <span className="sr-only">Rechercher</span>
            </Button>

            {/* Notifications - Hidden sur très petit écran */}
            <Button 
              variant="ghost" 
              size="sm"
              className="hidden sm:flex text-slate-700 hover:text-slate-900 hover:bg-gray-100 relative"
            >
              <Bell className="w-4 h-4" />
              <span className="sr-only">Notifications</span>
              {/* Badge de notification */}
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
            </Button>

            {/* Menu utilisateur */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-gray-50"
                >
                  <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                    <User2 className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-900">{user?.name || 'Utilisateur'}</p>
                    <p className="text-xs text-slate-600">{user?.email || 'test@example.com'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
                </Button>
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
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>{isLoading ? 'Déconnexion...' : 'Déconnexion'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu mobile */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-slate-700 hover:text-slate-900"
                >
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <div className="flex flex-col space-y-4 mt-6">
                  {/* Actions mobiles */}
                  <div className="flex flex-col space-y-2 pb-4 border-b">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="justify-start text-slate-700 hover:text-slate-900"
                    >
                      <Search className="w-4 h-4 mr-3" />
                      Rechercher
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="justify-start text-slate-700 hover:text-slate-900 relative"
                    >
                      <Bell className="w-4 h-4 mr-3" />
                      Notifications
                      <span className="absolute left-7 top-1 w-2 h-2 bg-primary rounded-full"></span>
                    </Button>
                  </div>

                  {/* Navigation mobile */}
                  <div className="space-y-1">
                    {navigationItems.map((item) => {
                      const isActive = pathname === item.url
                      return (
                        <SheetClose asChild key={item.title}>
                          <Link
                            href={item.url}
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors w-full",
                              "hover:bg-green-50 hover:text-slate-900",
                              isActive 
                                ? "bg-primary text-primary-foreground shadow-sm" 
                                : "text-slate-700"
                            )}
                          >
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                          </Link>
                        </SheetClose>
                      )
                    })}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}