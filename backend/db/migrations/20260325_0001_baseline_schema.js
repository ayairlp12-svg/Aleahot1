/**
 * Puente de compatibilidad para el historial de migraciones.
 *
 * Contexto:
 * - Algunas bases nuevas se inicializaron con `KNEX_MIGRATIONS_DIR=./db/migrations_baseline`.
 * - Eso registró `20260325_0001_baseline_schema.js` en `knex_migrations`.
 * - El runner normal usa `./db/migrations`, así que si este archivo no existe ahí,
 *   Knex marca el directorio como corrupto y bloquea migraciones posteriores.
 *
 * Este archivo NO vuelve a crear el baseline. Solo mantiene íntegro el historial.
 * El baseline real vive en `db/migrations_baseline/20260325_0001_baseline_schema.js`.
 */

exports.up = async function up() {
  return true;
};

exports.down = async function down() {
  return true;
};
