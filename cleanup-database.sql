-- Script de nettoyage complet de la base de données
-- Objectif: Vider toutes les tables et supprimer les éléments obsolètes

-- ========================================
-- ÉTAPE 1: VIDAGE DES TABLES (ordre des contraintes)
-- ========================================

-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = replica;

-- Vider les tables dans l'ordre des dépendances
DELETE FROM "Messages";
DELETE FROM "Conversations"; 
DELETE FROM "Sessions";
DELETE FROM "Agents";

-- Vider les autres tables si elles existent
DELETE FROM "User" WHERE true;
DELETE FROM "Account" WHERE true;
DELETE FROM "VerificationToken" WHERE true;

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = DEFAULT;

-- ========================================
-- ÉTAPE 2: RÉINITIALISATION DES SÉQUENCES
-- ========================================

-- Réinitialiser les séquences auto-increment
DO $$
BEGIN
    -- Réinitialiser les séquences principales
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'Messages_id_seq') THEN
        ALTER SEQUENCE "Messages_id_seq" RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'Conversations_id_seq') THEN
        ALTER SEQUENCE "Conversations_id_seq" RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'Sessions_id_seq') THEN
        ALTER SEQUENCE "Sessions_id_seq" RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'Agents_id_seq') THEN
        ALTER SEQUENCE "Agents_id_seq" RESTART WITH 1;
    END IF;
    
    -- Réinitialiser les autres séquences si elles existent
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'User_id_seq') THEN
        ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
    END IF;
END $$;

-- ========================================
-- ÉTAPE 3: SUPPRESSION TABLE OBSOLÈTE
-- ========================================

-- Supprimer la table Agent_files si elle existe
DROP TABLE IF EXISTS "Agent_files" CASCADE;
DROP TABLE IF EXISTS "agent_files" CASCADE;

-- ========================================
-- ÉTAPE 4: SUPPRESSION COLONNES OBSOLÈTES
-- ========================================

-- Supprimer la colonne anthropic_file_ids de la table Agents si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Agents' 
        AND column_name = 'anthropic_file_ids'
    ) THEN
        ALTER TABLE "Agents" DROP COLUMN "anthropic_file_ids";
    END IF;
END $$;

-- ========================================
-- ÉTAPE 5: VÉRIFICATION DU NETTOYAGE
-- ========================================

-- Afficher les comptes pour vérification
SELECT 'Agents' as table_name, COUNT(*) as count FROM "Agents"
UNION ALL
SELECT 'Conversations' as table_name, COUNT(*) as count FROM "Conversations"
UNION ALL
SELECT 'Messages' as table_name, COUNT(*) as count FROM "Messages"
UNION ALL
SELECT 'Sessions' as table_name, COUNT(*) as count FROM "Sessions";

-- Vérifier que Agent_files n'existe plus
SELECT CASE 
    WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name = 'Agent_files' OR table_name = 'agent_files')
    ) 
    THEN 'Table Agent_files EXISTS (à supprimer manuellement)'
    ELSE 'Table Agent_files SUPPRIMÉE ✓'
END as agent_files_status;

-- Vérifier que anthropic_file_ids n'existe plus dans Agents
SELECT CASE 
    WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Agents' 
        AND column_name = 'anthropic_file_ids'
    ) 
    THEN 'Colonne anthropic_file_ids EXISTS (à supprimer manuellement)'
    ELSE 'Colonne anthropic_file_ids SUPPRIMÉE ✓'
END as anthropic_file_ids_status;

-- Afficher les tables restantes
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ========================================
-- RÉSUMÉ DU NETTOYAGE
-- ========================================

SELECT 
    'NETTOYAGE TERMINÉ' as status,
    NOW() as timestamp,
    'Base de données prête pour restrict_to_promptsystem' as next_step;