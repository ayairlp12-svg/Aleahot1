/**
 * Migración: Agregar columnas estado_cliente y ciudad_cliente a ordenes
 */

exports.up = function(knex) {
  return knex.schema.table('ordenes', table => {
    table.string('estado_cliente', 100).nullable().after('nombre_cliente'); // Estado/Provincia
    table.string('ciudad_cliente', 100).nullable().after('estado_cliente');  // Ciudad
    table.string('nombre_beneficiario', 255).nullable().after('ciudad_cliente'); // Nombre del beneficiario para transferencia
  });
};

exports.down = function(knex) {
  return knex.schema.table('ordenes', table => {
    table.dropColumn('estado_cliente');
    table.dropColumn('ciudad_cliente');
    table.dropColumn('nombre_beneficiario');
  });
};
