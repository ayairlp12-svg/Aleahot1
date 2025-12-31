/**
 * Seed: Inicializar contadores de IDs de orden para clientes
 * Se ejecuta automáticamente con `npm run migrate`
 */

exports.seed = async function(knex) {
    // Verificar si ya existe un registro para el cliente principal
    const existe = await knex('order_id_counter')
        .where('cliente_id', 'sorteos_yepe')
        .first();

    if (!existe) {
        await knex('order_id_counter').insert({
            cliente_id: 'sorteos_yepe',
            ultima_secuencia: 'AA',
            ultimo_numero: 0,
            proximo_numero: 1,
            contador_total: 0,
            activo: true,
            fecha_ultimo_reset: new Date(),
            created_at: new Date(),
            updated_at: new Date()
        });
        
        console.log('✅ Contador de orden inicializado para "sorteos_yepe"');
    } else {
        console.log('ℹ️ Contador de orden ya existe para "sorteos_yepe", omitiendo inicialización');
    }
};
