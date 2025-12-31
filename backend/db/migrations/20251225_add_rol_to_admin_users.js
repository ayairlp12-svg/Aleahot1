/**
 * Migración: Agregar columna rol a admin_users
 * Roles: admin, operador, solo_lectura
 */

exports.up = function(knex) {
  return knex.schema.table('admin_users', table => {
    // Agregar columna rol si no existe
    table.string('rol', 50).notNullable().defaultTo('operador');
    table.string('creado_por', 100);
    table.timestamp('actualizado_en');
  });
};

exports.down = function(knex) {
  return knex.schema.table('admin_users', table => {
    table.dropColumn('rol');
    table.dropColumn('creado_por');
    table.dropColumn('actualizado_en');
  });
};
