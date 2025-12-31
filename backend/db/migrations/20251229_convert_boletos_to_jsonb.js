/**
 * Migración: Conversión de boletos a JSONB (existía en BD, stub local)
 */

exports.up = function(knex) {
  // Esta migración ya fue ejecutada en la BD de Render
  // Este es solo un archivo stub para sincronizar con knex_migrations
  return Promise.resolve();
};

exports.down = function(knex) {
  // Rollback stub
  return Promise.resolve();
};
