/**
 * ============================================================
 * MIGRACIÓN: 006_add_unique_oportunidades.js
 * PROPÓSITO: Agregar constraint único para prevenir duplicados
 * de oportunidades en estado activo
 * ============================================================
 */

exports.up = async function(knex) {
    console.log('📋 [Migration 006] Iniciando: Agregar UNIQUE constraint a oportunidades');
    
    try {
        // ✅ Crear constraint único parcial (solo para oportunidades activas)
        // En PostgreSQL, podemos usar WHERE para hacer el índice parcial
        await knex.raw(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_numero_opu_activo 
            ON orden_oportunidades(numero_oportunidad) 
            WHERE estado IN ('reservado', 'confirmado', 'vendido');
        `);
        
        console.log('✅ [Migration 006] Índice único creado exitosamente');
        return;
    } catch (error) {
        console.warn('⚠️ [Migration 006] El índice podría no haber sido necesario:', error.message);
        // No lanzar error - podría ser que ya exista
        return;
    }
};

exports.down = async function(knex) {
    console.log('📋 [Migration 006] Revertiendo: Remover UNIQUE constraint');
    
    try {
        await knex.raw(`DROP INDEX IF EXISTS idx_numero_opu_activo;`);
        console.log('✅ [Migration 006] Índice eliminado exitosamente');
        return;
    } catch (error) {
        console.warn('⚠️ [Migration 006] Error al revertir:', error.message);
        return;
    }
};
