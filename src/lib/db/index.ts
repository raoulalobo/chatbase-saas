import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

/**
 * Configuration de la connexion à la base de données PostgreSQL avec Drizzle
 * Utilise postgres-js comme driver de connexion
 */

// Vérification de la variable d'environnement
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

// Configuration de la connexion PostgreSQL
const client = postgres(process.env.DATABASE_URL, {
  // Configuration pour la production
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Instance Drizzle avec le schéma complet
export const db = drizzle(client, { schema })

// Export des types pour l'utilisation dans l'application
export type Database = typeof db
export * from "./schema"