-- Script SQL pour corriger les noms de modèles dans la base de données
-- Remplace l'ancien nom de modèle Sonnet par le bon

UPDATE agents 
SET model = 'claude-3-5-sonnet-20241022'
WHERE model = 'claude-3-5-sonnet-20241204';

-- Afficher les modèles utilisés après la mise à jour
SELECT DISTINCT model, COUNT(*) as count 
FROM agents 
GROUP BY model;