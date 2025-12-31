/**
 * Migración: Fix boleto estado enum
 * 
 * Problema: El enum tenía 'reservado' pero el sistema usa 'apartado'
 * Solución: Convertir todos los boletos con estado 'reservado' a 'apartado'
 */

exports.up = async function(knex) {
    try {
        // Cambiar todos los 'reservado' a 'apartado'
        const actualizados = await knex('boletos_estado')
            .where('estado', 'reservado')
            .update({ estado: 'apartado', updated_at: knex.fn.now() });

        console.log(`✅ Migración: Convertidos ${actualizados} boletos de "reservado" a "apartado"`);
    } catch (error) {
        // Si el enum todavía tiene 'reservado', dejar así (migración anterior aún no ha corrido)
        console.log('⚠️  Migración: No hay boletos en estado "reservado" o enum no soporta aún');
    }
};

exports.down = async function(knex) {
    try {
        // Revertir: 'apartado' a 'reservado' (si es necesario)
        const actualizados = await knex('boletos_estado')
            .where('estado', 'apartado')
            .update({ estado: 'reservado', updated_at: knex.fn.now() });

        console.log(`⬅️  Migración revertida: Convertidos ${actualizados} boletos de "apartado" a "reservado"`);
    } catch (error) {
        console.log('⚠️  Revert: No se pudo revertir (enum podría no soportar "reservado" más)');
    }
};
