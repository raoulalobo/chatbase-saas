/**
 * Test direct de l'agent via une requête simulée avec session
 */

// Simuler une requête avec les données qu'on connaît
const testData = {
  agentId: "test-final-company-name",
  message: "Quelle est la capitale de la France ?",
  visitorId: "test-visitor-" + Date.now()
}

console.log('🧪 Test direct de l\'agent anti-hallucination')
console.log('📊 Données de test:', testData)

// Nous allons vérifier d'abord si l'agent existe via les pages publiques
console.log('\n🔍 Vérification de l\'agent:')
console.log(`URL de base: http://localhost:3001`)

// Pour tester l'API sans auth, créons une version temporaire du endpoint
console.log('\n💡 Solution: Créer un endpoint de test temporaire sans authentification')
console.log('Cela permettra de tester la logique anti-hallucination directement')

const testApiPayload = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
}

console.log('\n📝 Payload pour test API:', JSON.stringify(testApiPayload, null, 2))