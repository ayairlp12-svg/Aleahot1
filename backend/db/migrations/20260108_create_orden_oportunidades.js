/**
 * Migration: Create tabla orden_oportunidades
 * Descripción: Almacena las oportunidades asignadas a cada orden
 * Propósito: Persistencia de datos y auditoría
 */

exports.up = async function(knex) {
    const exists = await knex.schema.hasTable('orden_oportunidades');
    if (exists) return;

    return knex.schema.createTable('orden_oportunidades', (table) => {
        table.increments('id').primary();
        
        // Relación con la orden
        table.string('numero_orden', 50).notNullable();
        table.foreign('numero_orden').references('numero_orden').inTable('ordenes').onDelete('CASCADE');
        
        // Boleto oculto asignado (oportunidad)
        table.integer('numero_oportunidad').notNullable();
        
        // Estado del boleto oculto
        table.enum('estado', ['reservado', 'disponible', 'cancelado']).defaultTo('reservado');
        
        // Metadata
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        
        // Índices para búsquedas rápidas
        table.index('numero_orden');
        table.index('numero_oportunidad');
        table.index('estado');
        table.unique(['numero_orden', 'numero_oportunidad']); // Evitar duplicados
    });
};

exports.down = async function(knex) {
    return knex.schema.dropTableIfExists('orden_oportunidades');
};
