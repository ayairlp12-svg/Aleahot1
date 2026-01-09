/**
 * Migration: Agregar campo cantidad_boletos_comprados
 * 🍀 Para separar boletos reales de oportunidades
 * 
 * Contexto:
 * - cantidad_boletos: TOTAL de boletos asignados (reales + oportunidades)
 * - cantidad_boletos_comprados: Solo los boletos que se PAGARON (NEW)
 * 
 * Esto permite:
 * 1. Mostrar separación visual de boletos en mis-boletos.html
 * 2. Calcular subtotal/total correctamente (solo usa los comprados)
 * 3. Mantener compatibilidad con sistema de descuentos
 */

exports.up = function(knex) {
  return knex.schema.table('ordenes', function(table) {
    // Si la columna ya existe, no lanzar error
    table.integer('cantidad_boletos_comprados')
      .nullable()
      .comment('Boletos que realmente se pagaron (sin oportunidades)');
  });
};

exports.down = function(knex) {
  return knex.schema.table('ordenes', function(table) {
    table.dropColumn('cantidad_boletos_comprados');
  });
};
