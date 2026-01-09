/**
 * ============================================================
 * ARCHIVO: backend/services/oportunidadesOrdenService.js
 * DESCRIPCIÓN: Servicio para gestionar oportunidades en órdenes
 * - Guardar oportunidades cuando se crea una orden
 * - Liberar oportunidades cuando se cancela una orden
 * - Consultar oportunidades de una orden
 * ============================================================
 */

const db = require('../db');

class OportunidadesOrdenService {
    /**
     * Guardar oportunidades de una orden
     * @param {string} numeroOrden - Número de la orden
     * @param {Array} boletosOcultos - Array de números de oportunidades
     * @returns {Promise<{success: boolean, cantidad: number}>}
     */
    static async guardarOportunidades(numeroOrden, boletosOcultos = []) {
        if (!numeroOrden || !Array.isArray(boletosOcultos) || boletosOcultos.length === 0) {
            return { success: true, cantidad: 0 };
        }

        try {
            // Verificar que la orden existe
            const ordenExiste = await db('ordenes')
                .where('numero_orden', numeroOrden)
                .first();

            if (!ordenExiste) {
                console.warn(`⚠️ Orden ${numeroOrden} no encontrada para guardar oportunidades`);
                return { success: false, cantidad: 0 };
            }

            // Crear registros de oportunidades
            const registros = boletosOcultos.map(num => ({
                numero_orden: numeroOrden,
                numero_oportunidad: Number(num),
                estado: 'reservado',
                created_at: new Date(),
                updated_at: new Date()
            }));

            // Insertar en transacción para garantizar atomicidad
            await db.transaction(async (trx) => {
                await trx('orden_oportunidades').insert(registros);
            });

            console.log(`✅ Guardadas ${boletosOcultos.length} oportunidades para orden ${numeroOrden}`);
            return { success: true, cantidad: boletosOcultos.length };
        } catch (error) {
            console.error(`❌ Error guardando oportunidades para ${numeroOrden}:`, error.message);
            throw error;
        }
    }

    /**
     * Obtener oportunidades de una orden
     * @param {string} numeroOrden - Número de la orden
     * @returns {Promise<Array>}
     */
    static async obtenerOportunidades(numeroOrden) {
        try {
            const oportunidades = await db('orden_oportunidades')
                .where('numero_orden', numeroOrden)
                .where('estado', '!=', 'cancelado')
                .orderBy('numero_oportunidad', 'asc')
                .pluck('numero_oportunidad');

            return oportunidades || [];
        } catch (error) {
            console.error(`❌ Error obteniendo oportunidades para ${numeroOrden}:`, error.message);
            return [];
        }
    }

    /**
     * Liberar oportunidades cuando se cancela una orden
     * Marcarlas como 'cancelado' pero no las borra para auditoría
     * @param {string} numeroOrden - Número de la orden
     * @returns {Promise<{success: boolean, cantidad: number}>}
     */
    static async liberarOportunidades(numeroOrden) {
        if (!numeroOrden) {
            return { success: false, cantidad: 0 };
        }

        try {
            const ahora = new Date();
            const cantidad = await db('orden_oportunidades')
                .where('numero_orden', numeroOrden)
                .where('estado', 'reservado')
                .update({
                    estado: 'cancelado',
                    updated_at: ahora
                });

            console.log(`✅ Liberadas ${cantidad} oportunidades de orden ${numeroOrden}`);
            return { success: true, cantidad };
        } catch (error) {
            console.error(`❌ Error liberando oportunidades para ${numeroOrden}:`, error.message);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de oportunidades
     * @returns {Promise<Object>}
     */
    static async obtenerEstadisticas() {
        try {
            const resultado = await db('orden_oportunidades')
                .select(
                    db.raw('COUNT(*) as total'),
                    db.raw('SUM(CASE WHEN estado = "reservado" THEN 1 ELSE 0 END) as reservadas'),
                    db.raw('SUM(CASE WHEN estado = "cancelado" THEN 1 ELSE 0 END) as canceladas'),
                    db.raw('SUM(CASE WHEN estado = "disponible" THEN 1 ELSE 0 END) as disponibles')
                )
                .first();

            return {
                total: resultado?.total || 0,
                reservadas: resultado?.reservadas || 0,
                canceladas: resultado?.canceladas || 0,
                disponibles: resultado?.disponibles || 0
            };
        } catch (error) {
            console.error(`❌ Error obteniendo estadísticas:`, error.message);
            return {
                total: 0,
                reservadas: 0,
                canceladas: 0,
                disponibles: 0
            };
        }
    }

    /**
     * Obtener oportunidades por rango de números
     * Útil para validar disponibilidad
     * @param {number} inicio - Número inicial
     * @param {number} fin - Número final
     * @returns {Promise<Array>}
     */
    static async obtenerOportunidadesEnRango(inicio, fin) {
        try {
            const oportunidades = await db('orden_oportunidades')
                .where('numero_oportunidad', '>=', inicio)
                .where('numero_oportunidad', '<=', fin)
                .where('estado', 'reservado')
                .pluck('numero_oportunidad');

            return oportunidades || [];
        } catch (error) {
            console.error(`❌ Error obteniendo oportunidades en rango:`, error.message);
            return [];
        }
    }
}

module.exports = OportunidadesOrdenService;
