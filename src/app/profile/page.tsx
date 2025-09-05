"use client"

import * as React from "react"
import { useState } from "react"
import { 
  User2, 
  Mail, 
  Calendar, 
  Shield, 
  Bell, 
  Download,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAuth } from "@/stores/authStore"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Page Profil Utilisateur
 * - Informations personnelles modifiables
 * - Sécurité du compte (changement mot de passe)
 * - Préférences utilisateur
 * - Gestion du compte (export données, suppression)
 */

interface ProfileFormData {
  name: string
  email: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  
  // États pour l'édition des informations personnelles
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: user?.name || "",
    email: user?.email || ""
  })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // États pour le changement de mot de passe
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // États pour les préférences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [securityNotifications, setSecurityNotifications] = useState(true)

  // Mettre à jour le formulaire quand les données utilisateur changent
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || ""
      })
    }
  }, [user])

  /**
   * Gestion des informations personnelles
   */
  const handleEditProfile = () => {
    setIsEditingInfo(true)
    setProfileMessage(null)
  }

  const handleCancelEditProfile = () => {
    setIsEditingInfo(false)
    setProfileForm({
      name: user?.name || "",
      email: user?.email || ""
    })
    setProfileMessage(null)
  }

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true)
    setProfileMessage(null)

    try {
      // Validation basique
      if (!profileForm.name.trim()) {
        setProfileMessage({type: 'error', text: 'Le nom est requis'})
        return
      }

      if (!profileForm.email.trim()) {
        setProfileMessage({type: 'error', text: 'L\'email est requis'})
        return
      }

      // TODO: Appel API pour mettre à jour le profil
      // const response = await fetch('/api/profile/update', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profileForm)
      // })

      // Simulation pour le moment
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsEditingInfo(false)
      setProfileMessage({type: 'success', text: 'Profil mis à jour avec succès'})
    } catch (error) {
      setProfileMessage({type: 'error', text: 'Erreur lors de la mise à jour du profil'})
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  /**
   * Gestion du changement de mot de passe
   */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingPassword(true)
    setPasswordMessage(null)

    try {
      // Validation
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setPasswordMessage({type: 'error', text: 'Tous les champs sont requis'})
        return
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordMessage({type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas'})
        return
      }

      if (passwordForm.newPassword.length < 8) {
        setPasswordMessage({type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères'})
        return
      }

      // TODO: Appel API pour changer le mot de passe
      // const response = await fetch('/api/profile/password', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     currentPassword: passwordForm.currentPassword,
      //     newPassword: passwordForm.newPassword
      //   })
      // })

      // Simulation pour le moment
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      setPasswordMessage({type: 'success', text: 'Mot de passe modifié avec succès'})
    } catch (error) {
      setPasswordMessage({type: 'error', text: 'Erreur lors du changement de mot de passe'})
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  /**
   * Gestion de l'export des données
   */
  const handleExportData = async () => {
    try {
      // TODO: Appel API pour exporter les données
      setProfileMessage({type: 'success', text: 'Export des données en cours... Vous recevrez un email.'})
    } catch (error) {
      setProfileMessage({type: 'error', text: 'Erreur lors de l\'export des données'})
    }
  }

  if (isLoading || !user) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mon Profil</h1>
          <p className="text-slate-600 mt-2">
            Gérez vos informations personnelles et paramètres de compte
          </p>
        </div>

        {/* Messages globaux */}
        {profileMessage && (
          <Alert variant={profileMessage.type === 'success' ? 'success' : 'destructive'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {profileMessage.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche */}
          <div className="space-y-6">
            {/* Informations personnelles */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                      <User2 className="w-5 h-5" />
                      Informations personnelles
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Vos informations de compte
                    </CardDescription>
                  </div>
                  {!isEditingInfo && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleEditProfile}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Modifier
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditingInfo ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Nom complet</Label>
                      <p className="text-slate-900">{user.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Email</Label>
                      <p className="text-slate-900">{user.email}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({...prev, name: e.target.value}))}
                        placeholder="Votre nom complet"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({...prev, email: e.target.value}))}
                        placeholder="votre@email.com"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={isUpdatingProfile}
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <Check className="w-4 h-4" />
                        {isUpdatingProfile ? "Sauvegarde..." : "Sauvegarder"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEditProfile}
                        disabled={isUpdatingProfile}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Annuler
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Sécurité du compte */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sécurité du compte
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Changez votre mot de passe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordMessage && (
                  <Alert variant={passwordMessage.type === 'success' ? 'success' : 'destructive'} className="mb-4">
                    <AlertDescription>
                      {passwordMessage.text}
                    </AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                      placeholder="Mot de passe actuel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                      placeholder="Nouveau mot de passe (8 caractères min.)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                      placeholder="Confirmer le nouveau mot de passe"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isUpdatingPassword}
                    className="w-full"
                  >
                    {isUpdatingPassword ? "Modification..." : "Changer le mot de passe"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Préférences */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Préférences
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Gérez vos notifications et préférences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Notifications par email</Label>
                    <p className="text-sm text-slate-600">Recevoir les mises à jour importantes</p>
                  </div>
                  <Switch 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Alertes de sécurité</Label>
                    <p className="text-sm text-slate-600">Notifications en cas d'activité suspecte</p>
                  </div>
                  <Switch 
                    checked={securityNotifications}
                    onCheckedChange={setSecurityNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Gestion du compte */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Gestion du compte</CardTitle>
                <CardDescription className="text-slate-600">
                  Actions avancées sur votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  className="w-full flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exporter mes données
                </Button>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-red-700">Zone de danger</Label>
                  <Button 
                    variant="destructive" 
                    className="w-full flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer mon compte
                  </Button>
                  <p className="text-xs text-slate-500">
                    Cette action est irréversible et supprimera définitivement votre compte et toutes vos données.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}