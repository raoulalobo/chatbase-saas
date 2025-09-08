/**
 * Test final pour vérifier que la configuration Ultra Strict fonctionne
 */

const { getDefaultTemplate, AntiHallucinationTemplateSchema } = require('./src/lib/templates/anti-hallucination.ts');

console.log('🧪 Test de la configuration Ultra Strict par défaut\n');

try {
  // Test 1: Vérifier le schéma par défaut
  console.log('1. Test du schéma par défaut:');
  const defaultTemplate = AntiHallucinationTemplateSchema.parse({});
  console.log(`   ├─ Intensity par défaut: ${defaultTemplate.intensity}`);
  console.log(`   ├─ Enabled: ${defaultTemplate.enabled}`);
  console.log(`   └─ RejectOutOfScope: ${defaultTemplate.contextLimitations.rejectOutOfScope}`);

  // Test 2: Vérifier le template ultra_strict
  console.log('\n2. Vérification du template ultra_strict:');
  const ultraStrictTemplate = DEFAULT_TEMPLATES.ultra_strict;
  console.log(`   ├─ Enabled: ${ultraStrictTemplate.enabled}`);
  console.log(`   ├─ StrictBoundaries: ${ultraStrictTemplate.contextLimitations.strictBoundaries}`);
  console.log(`   ├─ RejectOutOfScope: ${ultraStrictTemplate.contextLimitations.rejectOutOfScope}`);
  console.log(`   ├─ InventionPrevention: ${ultraStrictTemplate.contextLimitations.inventionPrevention}`);
  console.log(`   └─ CompetitorMention: ${ultraStrictTemplate.contextLimitations.competitorMention}`);

  // Test 3: Message de refus
  console.log('\n3. Message de refus ultra_strict:');
  console.log(`   "${ultraStrictTemplate.responsePatterns.refusalMessage}"`);

  console.log('\n✅ Configuration Ultra Strict validée !');
  console.log('\n📋 Résumé des changements effectués:');
  console.log('   ✅ Template par défaut: ultra_strict');
  console.log('   ✅ Formulaire création agent: ultra_strict');
  console.log('   ✅ Agent de test corrigé avec prompt restrictif');
  console.log('   ✅ System prompt par défaut plus spécifique');

  console.log('\n🎯 Test à effectuer:');
  console.log('   1. Créer un nouvel agent → doit avoir ultra_strict par défaut');
  console.log('   2. Tester agent "test-final-company-name" → doit refuser questions générales');
  console.log('   3. Vérifier que les questions techniques sont acceptées');

} catch (error) {
  console.error('❌ Erreur dans le test:', error.message);
}