/**
 * Aplica de forma puntual la optimización de índices para orden_oportunidades
 * sin depender del historial completo de knex_migrations.
 *
 * Útil cuando la BD fue inicializada con baseline y el historial completo de
 * migraciones no coincide 1:1 con el directorio estándar.
 */

const db = require('./db');
const migration = require('./db/migrations/20260404_0001_optimizar_indices_oportunidades_precargadas');

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  OPTIMIZAR ÍNDICES DE OPORTUNIDADES PRECARGADAS          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    await migration.up(db);

    const indices = await db.raw(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'orden_oportunidades'
        AND indexname IN (
          'idx_numero_opu_activo',
          'idx_opp_disponibles',
          'idx_opp_numero_boleto_disponibles',
          'idx_opp_numero_boleto_oportunidad',
          'idx_opp_numero_oportunidad',
          'idx_opp_numero_orden_oportunidad'
        )
      ORDER BY indexname ASC
    `);

    console.log('✅ Índices finales detectados en orden_oportunidades:\n');
    for (const row of indices.rows || []) {
      console.log(`- ${row.indexname}`);
      console.log(`  ${row.indexdef}`);
    }

    console.log('\n✅ Optimización aplicada correctamente.\n');
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error aplicando optimización de índices:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    await db.destroy();
    process.exit(1);
  }
}

main();
