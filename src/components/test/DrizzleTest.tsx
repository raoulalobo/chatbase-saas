"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Composant de test pour vérifier la configuration Drizzle
 * Teste l'API de connexion à la base de données
 */
export default function DrizzleTest() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  /**
   * Tester la connexion à la base de données via l'API
   */
  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ 
        error: "Erreur lors du test", 
        details: error instanceof Error ? error.message : "Erreur inconnue" 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 12 2 2 4-4" />
          </svg>
          Test Drizzle ORM + PostgreSQL
        </CardTitle>
        <CardDescription>
          Vérifiez la configuration de la base de données et des requêtes typées
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDatabase} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Test en cours..." : "Tester la Connexion DB"}
        </Button>

        {testResult && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Résultat du test :</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}