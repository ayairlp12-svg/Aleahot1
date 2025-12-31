/**
 * Migración: Agregar campos de control de expiración a tabla ordenes
 * - created_at: Cuándo se creó la orden
 * - comprobante_pagado_at: Cuándo se confirmó el pago
 * - liberada_at: Cuándo se liberaron los boletos por expiración
 * - estado_pago: pending, confirmed, expired, cancelled
 */

exports.up = async function(knex) {
    const existe = await knex.schema.hasColumn('ordenes', 'created_at');
    
    if (!existe) {
        await knex.schema.table('ordenes', (table) => {
            // Timestamp de creación de la orden
            table.timestamp('created_at').defaultTo(knex.fn.now());
            
            // Timestamp de confirmación de pago
            table.timestamp('comprobante_pagado_at').nullable();
            
            // Timestamp de liberación (cuando se liberaron los boletos por expiración)
            table.timestamp('liberada_at').nullable();
            
            // Estado del pago: pending, confirmed, expired, cancelled
            table.enum('estado_pago', ['pending', 'confirmed', 'expired', 'cancelled'])
                .defaultTo('pending');
            
            // Booleano para marcar si fue liberada automáticamente
            table.boolean('liberada_automaticamente').defaultTo(false);
            
            // Índices para búsquedas rápidas
            table.index('created_at');
            table.index('estado_pago');
            table.index('liberada_at');
            table.index('comprobante_pagado_at');
        });
        
        console.log('✅ Campos de expiración agregados a tabla ordenes');
    } else {
        console.log('ℹ️ Campos de expiración ya existen en tabla ordenes');
    }
};

exports.down = async function(knex) {
    await knex.schema.table('ordenes', (table) => {
        table.dropIndex('created_at');
        table.dropIndex('estado_pago');
        table.dropIndex('liberada_at');
        table.dropIndex('comprobante_pagado_at');
        table.dropColumn('created_at');
        table.dropColumn('comprobante_pagado_at');
        table.dropColumn('liberada_at');
        table.dropColumn('estado_pago');
        table.dropColumn('liberada_automaticamente');
    });
    console.log('✅ Campos de expiración removidos de tabla ordenes');
};
