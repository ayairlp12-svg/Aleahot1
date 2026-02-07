const db = require('./db');

(async () => {
  try {
    console.log('\n🔧 LIMPIANDO BOLETOS DUPLICADOS/INVÁLIDOS...\n');

    // Boletos que están fuera de rango válido
    const boletosInvalidos = [562736, 562737, 949278, 949279, 978516, 978517, 999001, 999002];

    const deleted = await db('boletos_estado')
      .whereIn('numero', boletosInvalidos)
      .delete();

    console.log(`✅ Eliminados ${deleted} registros inválidos`);
    console.log(`   Números: ${boletosInvalidos.join(', ')}`);

    // Verificar resultado
    const boletosRestantes = await db('boletos_estado')
      .where('numero', '<', 0)
      .orWhere('numero', '>=', 250000)
      .count('* as total')
      .first();

    console.log(`\n✅ Boletos fuera de rango ahora: ${boletosRestantes.total}`);
    console.log('\n✨ Base de datos limpia\n');

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
