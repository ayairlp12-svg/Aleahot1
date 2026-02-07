/**
 * MIGRACIÓN: Unificar numero_orden a NULL (FASE 2)
 * 
 * Cambia todos los '0' por NULL en:
 * - orden_oportunidades
 * - boletos_estado
 * 
 * Asegura consistencia en toda la BD
 */

exports.up = async (knex) => {
    console.log('🔄 [Migración] Unificando numero_orden a NULL...');
    
    try {
        // Actualizar orden_oportunidades
        const resultOpp = await knex('orden_oportunidades')
            .where('numero_orden', '0')
            .update({ numero_orden: null });
        
        console.log(`   ✅ orden_oportunidades: Convertidos ${resultOpp} registros '0' → NULL`);

        // Actualizar boletos_estado
        const resultBol = await knex('boletos_estado')
            .where('numero_orden', '0')
            .update({ numero_orden: null });
        
        console.log(`   ✅ boletos_estado: Convertidos ${resultBol} registros '0' → NULL`);

        console.log(`✅ Total unificado: ${resultOpp + resultBol} registros`);
    } catch (error) {
        console.error('❌ Error unificando numero_orden:', error.message);
        throw error;
    }
};

exports.down = async (knex) => {
    console.log('🔄 [Migración] Revirtiendo unificación (NULL → "0")...');
    
    try {
        // Revertir orden_oportunidades
        const resultOpp = await knex('orden_oportunidades')
            .whereNull('numero_orden')
            .where('estado', 'disponible')
            .update({ numero_orden: '0' });
        
        console.log(`   ✅ orden_oportunidades: Convertidos ${resultOpp} registros NULL → '0'`);

        // Revertir boletos_estado  
        const resultBol = await knex('boletos_estado')
            .whereNull('numero_orden')
            .where('estado', 'disponible')
            .update({ numero_orden: '0' });
        
        console.log(`   ✅ boletos_estado: Convertidos ${resultBol} registros NULL → '0'`);

        console.log(`✅ Revertido: ${resultOpp + resultBol} registros`);
    } catch (error) {
        console.error('❌ Error revirtiendo:', error.message);
        throw error;
    }
};
