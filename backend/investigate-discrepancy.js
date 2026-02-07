const db = require('./db');

(async () => {
  try {
    console.log('\n🔍 INVESTIGANDO DISCREPANCIAS...\n');

    // Boletos fuera de rango
    const boletosOutOfRange = await db('boletos_estado')
      .where('numero', '<', 0)
      .orWhere('numero', '>=', 250000)
      .select('numero', 'estado');

    console.log(`📊 BOLETOS fuera de rango (0-249,999):`);
    console.log(`   Encontrados: ${boletosOutOfRange.length}`);
    if (boletosOutOfRange.length > 0) {
      console.log('   Números:', boletosOutOfRange.map(b => b.numero).sort((a,b) => a-b));
    }

    // Oportunidades fuera de rango
    const oppsOutOfRange = await db('orden_oportunidades')
      .where('numero_oportunidad', '<', 250000)
      .orWhere('numero_oportunidad', '>', 999999)
      .select('numero_oportunidad', 'estado');

    console.log(`\n📊 OPORTUNIDADES fuera de rango (250,000-999,999):`);
    console.log(`   Encontrados: ${oppsOutOfRange.length}`);
    if (oppsOutOfRange.length > 0) {
      console.log('   Números:', oppsOutOfRange.map(o => o.numero_oportunidad).sort((a,b) => a-b));
    }

    // Contar en rangos válidos
    const boletosValidos = await db('boletos_estado')
      .where('numero', '>=', 0)
      .andWhere('numero', '<', 250000)
      .count('* as total')
      .first();

    const oppsValidas = await db('orden_oportunidades')
      .where('numero_oportunidad', '>=', 250000)
      .andWhere('numero_oportunidad', '<=', 999999)
      .count('* as total')
      .first();

    console.log(`\n✅ EN RANGO VÁLIDO:`);
    console.log(`   Boletos (0-249,999): ${boletosValidos.total}`);
    console.log(`   Oportunidades (250,000-999,999): ${oppsValidas.total}`);

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
