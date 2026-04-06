/**
 * Elimina la tabla redundante `ordenes_expiradas_log` directamente en la BD actual.
 * Se usa cuando no conviene depender del historial completo de migraciones.
 */

const db = require('./db');
const migration = require('./db/migrations/20260404_0003_eliminar_ordenes_expiradas_log');

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ELIMINAR TABLA REDUNDANTE ORDENES_EXPIRADAS_LOG         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    await migration.up(db);

    const resultado = await db.raw(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'ordenes_expiradas_log'
      ) AS existe
    `);

    const existe = resultado?.rows?.[0]?.existe === true;
    if (existe) {
      throw new Error('La tabla ordenes_expiradas_log sigue existiendo después del cleanup');
    }

    console.log('✅ Tabla ordenes_expiradas_log eliminada correctamente.\n');
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error eliminando ordenes_expiradas_log:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    await db.destroy();
    process.exit(1);
  }
}

main();
