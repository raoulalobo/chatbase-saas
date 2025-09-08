#!/bin/bash

# Script pour tester l'agent avec authentification
echo "🔐 Test avec authentification complète..."

# Variables
EMAIL="raoulalobo@yahoo.fr"
PASSWORD="Raoul@lobo.84"
BASE_URL="http://localhost:3001"
COOKIE_JAR="cookies.txt"

# Nettoyer les cookies précédents
rm -f $COOKIE_JAR

echo "1. 🍪 Récupération de la page de login..."
# Récupérer la page de login pour obtenir le token CSRF
curl -c $COOKIE_JAR -b $COOKIE_JAR -s "$BASE_URL/login" > /dev/null

echo "2. 🔑 Tentative de connexion..."
# Se connecter avec les identifiants
LOGIN_RESPONSE=$(curl -c $COOKIE_JAR -b $COOKIE_JAR -X POST \
  "$BASE_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=$EMAIL&password=$PASSWORD" \
  -w "HTTP_CODE:%{http_code}" \
  -s)

echo "3. 📊 Réponse de connexion: $LOGIN_RESPONSE"

echo "4. 🧪 Test de l'agent avec session..."
# Tester l'agent avec la session
curl -b $COOKIE_JAR -X POST \
  "$BASE_URL/api/agents/test-final-company-name/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Quelle est la capitale de la France ?","visitorId":"test-visitor"}' \
  -w "\n\nHTTP_CODE:%{http_code}\n"

echo "5. 🧹 Nettoyage..."
rm -f $COOKIE_JAR