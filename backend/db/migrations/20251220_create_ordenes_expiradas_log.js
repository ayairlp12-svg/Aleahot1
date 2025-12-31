/**
 * Migración: Crear tabla de auditoría para órdenes expiradas
 * Registra historial de órdenes que fueron liberadas automáticamente
 */

exports.up = async function(knex) {
    const existe = await knex.schema.hasTable('ordenes_expiradas_log');
    
    if (!existe) {
        await knex.schema.createTable('ordenes_expiradas_log', (table) => {
            table.increments('id').primary();
            table.integer('orden_id').notNullable();
            table.string('numero_orden', 50).notNullable();
            table.integer('cantidad_boletos').notNullable().defaultTo(0);
            table.text('boletos_liberados').nullable();  // JSON array
            table.string('motivo', 255).notNullable();
            table.timestamp('fecha_liberacion').notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.index('numero_orden');
            table.index('fecha_liberacion');
            table.index('created_at');
        });
        
        console.log('✅ Tabla ordenes_expiradas_log creada exitosamente');
    } else {
        console.log('ℹ️ Tabla ordenes_expiradas_log ya existe');
    }
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('ordenes_expiradas_log');
    console.log('✅ Tabla ordenes_expiradas_log eliminada');
};
