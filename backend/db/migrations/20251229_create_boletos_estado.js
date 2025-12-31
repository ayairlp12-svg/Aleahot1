/**
 * Migración: Crear tabla boletos_estado
 * Almacena estado individual de cada boleto para soporte de 1M boletos
 * Optimización crítica: Una fila por boleto = queries muy rápidas
 */

exports.up = function(knex) {
  return knex.schema.createTable('boletos_estado', table => {
    table.increments('id').primary();
    
    // Número del boleto: llave natural
    table.integer('numero').notNullable().unique();
    
    // Estado del boleto: 'disponible', 'apartado', 'vendido', 'cancelado'
    table.enum('estado', ['disponible', 'apartado', 'vendido', 'cancelado']).notNullable().defaultTo('disponible');
    
    // Referencia a la orden (si está reservado/vendido)
    table.string('numero_orden', 50).nullable();
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('reservado_en').nullable();  // Cuándo fue reservado
    table.timestamp('vendido_en').nullable();     // Cuándo fue vendido
    
    // ÍNDICES CRÍTICOS para performance con 1M registros
    // Estos hacen que las búsquedas sean O(log n) en lugar de O(n)
    table.index('estado', 'idx_estado_boleto');           // Para buscar disponibles
    table.index('numero_orden', 'idx_numero_orden_boleto'); // Para búsqueda por orden
    table.index(['estado', 'reservado_en'], 'idx_estado_tiempo'); // Para limpiar expirados
    table.index('numero', 'idx_numero_boleto');           // Acceso rápido por número
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('boletos_estado');
};
