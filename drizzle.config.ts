import { defineConfig } from "drizzle-kit"

/**
 * Configuration de Drizzle Kit pour la génération et les migrations
 * Utilise PostgreSQL comme base de données principale
 */
export default defineConfig({
  // Chemin vers les fichiers de schéma
  schema: "./src/lib/db/schema.ts",
  
  // Répertoire de sortie pour les migrations
  out: "./drizzle",
  
  // Dialecte de base de données
  dialect: "postgresql",
  
  // Configuration de la connexion à la base de données
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  
  // Options de génération
  verbose: true,
  strict: true,
})