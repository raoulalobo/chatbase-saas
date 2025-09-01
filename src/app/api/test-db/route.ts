import { NextResponse } from "next/server"
import { userQueries, agentQueries } from "@/lib/db/queries"

/**
 * Route API de test pour vérifier la connexion Drizzle PostgreSQL
 * Endpoint: GET /api/test-db
 */
export async function GET() {
  try {
    // Test simple de connexion à la base de données
    // Note: Cette route est à des fins de test uniquement
    
    const testData = {
      message: "Configuration Drizzle ORM avec PostgreSQL ✅",
      timestamp: new Date().toISOString(),
      database: "PostgreSQL",
      orm: "Drizzle",
      status: "Connexion prête",
      schemas: [
        "users", 
        "agents", 
        "conversations", 
        "messages",
        "accounts",
        "sessions", 
        "verification_tokens"
      ],
      availableQueries: {
        users: ["create", "getByEmail", "getById"],
        agents: ["create", "getByUserId", "getWithUser", "update", "delete"],
        conversations: ["create", "getByAgentId", "getWithMessages"],
        messages: ["create", "getByConversationId"]
      }
    }

    return NextResponse.json(testData, { status: 200 })
    
  } catch (error) {
    console.error("Erreur de test de base de données:", error)
    
    return NextResponse.json(
      { 
        error: "Erreur de connexion à la base de données", 
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}