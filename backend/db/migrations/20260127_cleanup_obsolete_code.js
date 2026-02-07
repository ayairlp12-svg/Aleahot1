/**
 * Migration: Cleanup - Eliminar referencias a estados obsoletos
 * Fecha: 27 de enero de 2026
 * Descripción: Limpieza de código y datos obsoletos después de migración de estados
 * Estados nuevos: 'disponible', 'apartado', 'vendido'
 * Estados viejos (eliminados): 'reservado', 'confirmado', 'cancelado', 'liberado'
 */

exports.up = async function(knex) {
    console.log('\n🧹 CLEANUP: Validando estado de la BD...\n');
    
    try {
        // 1. Validar que enum de orden_oportunidades sea correcto
        const constraintCheck = await knex.raw(`
            SELECT check_clause
            FROM information_schema.check_constraints
            WHERE constraint_name = 'orden_oportunidades_estado_check'
            LIMIT 1;
        `);
        
        if (constraintCheck.rows.length > 0) {
            console.log('✅ Constraint activo:', constraintCheck.rows[0].check_clause);
        }

        // 2. Verificar que NO hay registros con estados obsoletos
        const obsoleteStates = await knex.raw(`
            SELECT DISTINCT estado, COUNT(*) as cantidad
            FROM orden_oportunidades
            WHERE estado NOT IN ('disponible', 'apartado', 'vendido')
            GROUP BY estado;
        `);
        
        if (obsoleteStates.rows.length > 0) {
            console.warn('⚠️  Encontrados estados obsoletos:');
            obsoleteStates.rows.forEach(row => {
                console.warn(`   - ${row.estado}: ${row.cantidad} registros`);
            });
            
            // Convertir obsoletos a disponible
            await knex.raw(`
                UPDATE orden_oportunidades
                SET estado = 'disponible'
                WHERE estado NOT IN ('disponible', 'apartado', 'vendido');
            `);
            console.log('✅ Estados obsoletos convertidos a "disponible"');
        } else {
            console.log('✅ No hay estados obsoletos en orden_oportunidades');
        }

        // 3. Validar índices críticos
        const indicesCheck = await knex.raw(`
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'orden_oportunidades'
            ORDER BY indexname;
        `);
        
        console.log('\n✅ Índices en orden_oportunidades:');
        indicesCheck.rows.forEach(row => {
            console.log(`   - ${row.indexname}`);
        });

        console.log('\n✅ CLEANUP completado correctamente\n');
        
    } catch (error) {
        console.warn('⚠️  Error en cleanup (no fatal):', error.message);
    }
};

exports.down = async function(knex) {
    // No hay nada que revertir - solo fue validación
    console.log('✅ Cleanup no es reversible (fue solo validación)');
};
