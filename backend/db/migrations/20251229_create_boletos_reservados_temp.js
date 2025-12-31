/**
 * Migración: Crear tabla de reservas temporales
 * Para manejar boletos reservados durante el checkout (carrito activo)
 * Con expiración automática si no se completa la compra
 */

exports.up = function(knex) {
  return knex.schema.createTable('boletos_reservados_temp', table => {
    table.increments('id').primary();
    
    // Cliente/sesión que está reservando
    table.string('session_id', 100).notNullable();
    table.string('cliente_whatsapp', 20).nullable();
    
    // Boletos en el carrito
    table.json('boletos').notNullable();  // Array de números reservados
    
    // Expiración de la reserva (default 30 minutos)
    table.timestamp('creado_en').defaultTo(knex.fn.now());
    table.timestamp('expira_en').notNullable();
    
    // Índices
    table.index('session_id', 'idx_session_id');
    table.index('expira_en', 'idx_expira_en');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('boletos_reservados_temp');
};
