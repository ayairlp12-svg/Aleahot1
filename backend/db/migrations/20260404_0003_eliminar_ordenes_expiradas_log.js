/**
 * MIGRACIÓN: eliminar tabla redundante ordenes_expiradas_log
 *
 * Razón:
 * - El sistema actual ya conserva el estado de cada orden en `ordenes`.
 * - No existe ninguna escritura activa a `ordenes_expiradas_log`.
 * - Mantenerla genera confusión y endpoints fantasma.
 */

exports.up = async function up(knex) {
  const existe = await knex.schema.hasTable('ordenes_expiradas_log');
  if (!existe) return;

  await knex.schema.dropTable('ordenes_expiradas_log');
};

exports.down = async function down(knex) {
  const existe = await knex.schema.hasTable('ordenes_expiradas_log');
  if (existe) return;

  await knex.schema.createTable('ordenes_expiradas_log', (table) => {
    table.increments('id').primary();
    table.integer('orden_id').notNullable();
    table.string('numero_orden', 50).notNullable();
    table.integer('cantidad_boletos').notNullable().defaultTo(0);
    table.text('boletos_liberados').nullable();
    table.string('motivo', 255).notNullable();
    table.timestamp('fecha_liberacion').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('numero_orden');
    table.index('fecha_liberacion');
    table.index('created_at');
  });
};
