/**
 * Migración: Actualizar tabla ordenes para arquitectura de 1M boletos
 * Nota: Esta migración es un stub porque la BD ya tiene estos cambios
 */

exports.up = function(knex) {
  // La tabla ordenes ya tiene cantidad_boletos y los índices
  // Esta migración es solo para sincronizar el estado de knex_migrations
  return Promise.resolve();
};

exports.down = function(knex) {
  return Promise.resolve();
};
