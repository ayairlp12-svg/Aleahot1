/**
 * Migración: Crear tabla para rastrear IDs de orden generados
 * Previene duplicados y mantiene secuencia alfabética
 * Formato: SY-AA001 → SY-AA999 → SY-AB000 → SY-ZZ999
 */

exports.up = async function(knex) {
    // Crear tabla si no existe
    const existe = await knex.schema.hasTable('order_id_counter');
    
    if (!existe) {
        await knex.schema.createTable('order_id_counter', (table) => {
            table.increments('id').primary();
            
            // Identificador del cliente (ej: "sorteos_yepe")
            table.string('cliente_id', 100).notNullable().unique();
            
            // Última secuencia de 2 letras usada (AA, AB, AC... ZZ)
            table.string('ultima_secuencia', 2).notNullable().defaultTo('AA');
            
            // Último número secuencial usado en esa secuencia (001-999)
            table.integer('ultimo_numero').notNullable().defaultTo(0);
            
            // El siguiente número a asignar (001-999)
            table.integer('proximo_numero').notNullable().defaultTo(1);
            
            // Contador general de IDs generados (para estadísticas)
            table.integer('contador_total').notNullable().defaultTo(0);
            
            // Timestamp del último reset (cuando se reinicia un sorteo)
            table.timestamp('fecha_ultimo_reset').defaultTo(knex.fn.now());
            
            // Indicador si el contador está activo
            table.boolean('activo').notNullable().defaultTo(true);
            
            // Timestamps de auditoría
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            
            // Índices para búsquedas rápidas
            table.index(['cliente_id']);
            table.index(['activo']);
        });
        
        console.log('✅ Tabla order_id_counter creada exitosamente');
    } else {
        console.log('ℹ️ Tabla order_id_counter ya existe, omitiendo creación');
    }
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('order_id_counter');
    console.log('✅ Tabla order_id_counter eliminada');
};
