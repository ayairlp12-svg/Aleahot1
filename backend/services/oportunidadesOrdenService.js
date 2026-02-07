/**
 * ============================================================
 * ARCHIVO: backend/services/oportunidadesOrdenService.js (NUEVO)
 * DESCRIPCIÓN: Servicio para gestionar oportunidades
 * ESTRATEGIA: Idéntico a BoletoService - sin complicaciones
 * ============================================================
 */

const db = require('../db');

class OportunidadesOrdenService {
    /**
     * Guardar oportunidades - IDÉNTICO A BOLETOS
     * 
     * ESTRATEGIA SIMPLE Y ROBUSTA:
     * ✅ UPDATE ATÓMICO: Solo actualiza si disponible (como boletos)
     * ✅ DESPUÉS de actualizar: Detecta conflictos si falló
     * ✅ AUTO-REEMPLAZO: Si hay apartado/vendido, busca reemplazo
     * ✅ RECHAZO: Si está asignado a otra orden
     * 
     * @param {string} numeroOrden - Número de la orden
     * @param {Array} boletosOcultos - Array de números de oportunidades
     * @returns {Promise<{success: boolean, cantidad: number, reemplazos: Array}>}
     */
    static async guardarOportunidades(numeroOrden, boletosOcultos = []) {
        if (!numeroOrden || !Array.isArray(boletosOcultos) || boletosOcultos.length === 0) {
            return { success: true, cantidad: 0, reemplazos: [] };
        }

        try {
            console.log(`📝 [OportunidadesService] Guardando ${boletosOcultos.length} oportunidades para ${numeroOrden}`);

            return await db.transaction(async (trx) => {
                // Validar orden
                const orden = await trx('ordenes').where('numero_orden', numeroOrden).first();
                if (!orden) throw new Error(`Orden ${numeroOrden} no existe`);

                // ✅ VALIDAR RANGO: Oportunidades deben estar en rango 250k-999k
                const RANGO_INICIO = 250000;
                const RANGO_FIN = 999999;

                // Validar y convertir números
                const nums = boletosOcultos.map(n => {
                    const num = Number(n);
                    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
                        throw new Error(`Número inválido: ${n}`);
                    }
                    // ✅ Validar rango
                    if (num < RANGO_INICIO || num > RANGO_FIN) {
                        throw new Error(`Número fuera de rango: ${num} (debe estar entre ${RANGO_INICIO} y ${RANGO_FIN})`);
                    }
                    return num;
                });

                // Detectar duplicados EN LA ORDEN
                if (new Set(nums).size !== nums.length) {
                    const dups = [...new Set(nums.filter((n, i) => nums.indexOf(n) !== i))];
                    throw new Error(`Duplicados en orden: ${dups.join(', ')}`);
                }

                // Verificar estado actual en BD
                const existentes = await trx('orden_oportunidades')
                    .whereIn('numero_oportunidad', nums)
                    .select('numero_oportunidad', 'estado', 'numero_orden');

                const existentesMap = new Map(existentes.map(e => [e.numero_oportunidad, e]));

                // Clasificar
                const disponibles = [];
                const apartadosVendidos = [];
                const bloqueados = [];
                const faltantes = [];

                nums.forEach(n => {
                    const opp = existentesMap.get(n);
                    
                    if (!opp) {
                        faltantes.push(n);
                    } else if (opp.estado === 'disponible' && !opp.numero_orden) {
                        disponibles.push(n);
                    } else if ((opp.estado === 'apartado' || opp.estado === 'vendido') && opp.numero_orden !== numeroOrden) {
                        apartadosVendidos.push({ n, estado: opp.estado, orden: opp.numero_orden });
                    } else if (opp.numero_orden && opp.numero_orden !== numeroOrden) {
                        bloqueados.push({ n, orden: opp.numero_orden });
                    }
                });

                console.log(`  📊 Disp:${disponibles.length} Apart/Vend:${apartadosVendidos.length} Bloq:${bloqueados.length} Falt:${faltantes.length}`);

                // RECHAZAR SI HAY BLOQUEADOS
                if (bloqueados.length > 0) {
                    throw {
                        code: 'BLOQUEADOS',
                        message: `${bloqueados.length} oportunidades asignadas a otras órdenes`,
                        cantidad: bloqueados.length
                    };
                }

                // ✅ RECHAZAR SI HAY FALTANTES (en lugar de crear)
                // Si la BD está pre-poblada correctamente, no debería haber faltantes
                if (faltantes.length > 0) {
                    throw {
                        code: 'FALTANTES',
                        message: `${faltantes.length} oportunidades no existen en BD: [${faltantes.slice(0, 5).join(', ')}${faltantes.length > 5 ? '...' : ''}]`,
                        cantidad: faltantes.length,
                        faltantes: faltantes
                    };
                }

                // AUTO-REEMPLAZO PARA APARTADOS/VENDIDOS
                const reemplazos = [];
                let aReemplazar = [];

                if (apartadosVendidos.length > 0) {
                    const disponiblesEnBD = await trx('orden_oportunidades')
                        .where('estado', 'disponible')
                        .whereNull('numero_orden')
                        .limit(apartadosVendidos.length)
                        .select('numero_oportunidad');

                    if (disponiblesEnBD.length < apartadosVendidos.length) {
                        throw { code: 'SIN_REEMPLAZOS', message: `Solo hay ${disponiblesEnBD.length} disponibles para ${apartadosVendidos.length}` };
                    }

                    apartadosVendidos.forEach((av, i) => {
                        reemplazos.push({ original: av.n, reemplazo: disponiblesEnBD[i].numero_oportunidad });
                    });
                    
                    aReemplazar = reemplazos.map(r => r.reemplazo);
                }

                // UPDATE ATÓMICO CON AUTO-REEMPLAZO SELECTIVO
                const aAsignar = [...disponibles, ...aReemplazar];
                
                if (aAsignar.length > 0) {
                    const ahora = new Date();
                    const result = await trx.raw(
                        `UPDATE orden_oportunidades
                         SET estado = 'apartado', numero_orden = ?, updated_at = ?
                         WHERE numero_oportunidad = ANY(?::int[])
                         AND estado = 'disponible'
                         AND numero_orden IS NULL
                         RETURNING numero_oportunidad`,
                        [numeroOrden, ahora, aAsignar]
                    );

                    const actualizadas = new Set((result.rows || []).map(r => r.numero_oportunidad));
                    const fallaron = aAsignar.filter(n => !actualizadas.has(n));

                    // ✅ AUTO-REEMPLAZO SELECTIVO: Solo para los números que fallaron por race condition
                    if (fallaron.length > 0) {
                        console.log(`  ⚠️  Race condition detectada: ${fallaron.length} números fueron tomados, buscando reemplazos...`);
                        
                        // Buscar reemplazos SOLO para los que fallaron
                        const disponiblesParaReemplazo = await trx('orden_oportunidades')
                            .where('estado', 'disponible')
                            .whereNull('numero_orden')
                            .limit(fallaron.length)
                            .select('numero_oportunidad');

                        // Si no hay suficientes reemplazos, rechazar SOLO los números que no se pueden reemplazar
                        if (disponiblesParaReemplazo.length < fallaron.length) {
                            const sinReemplazo = fallaron.length - disponiblesParaReemplazo.length;
                            throw { 
                                code: 'INSUFFICIENT_REPLACEMENTS', 
                                message: `${sinReemplazo} oportunidades no pudieron ser reemplazadas (no hay suficientes disponibles)`, 
                                cantidad: sinReemplazo,
                                fallaron: fallaron 
                            };
                        }

                        // Intentar actualizar con los reemplazos
                        const reemplazosNumerosOportunidad = disponiblesParaReemplazo.map(r => r.numero_oportunidad);
                        const resultReemplazo = await trx.raw(
                            `UPDATE orden_oportunidades
                             SET estado = 'apartado', numero_orden = ?, updated_at = ?
                             WHERE numero_oportunidad = ANY(?::int[])
                             AND estado = 'disponible'
                             AND numero_orden IS NULL
                             RETURNING numero_oportunidad`,
                            [numeroOrden, ahora, reemplazosNumerosOportunidad]
                        );

                        const reemplazosActualizadas = new Set((resultReemplazo.rows || []).map(r => r.numero_oportunidad));
                        const reemplazosQué = reemplazosNumerosOportunidad.filter(n => !reemplazosActualizadas.has(n));

                        if (reemplazosQué.length > 0) {
                            throw { 
                                code: 'RACE_CONDITION', 
                                message: `Incluso los reemplazos fueron tomados (${reemplazosQué.length} números)`, 
                                cantidad: reemplazosQué.length 
                            };
                        }

                        // Registrar los reemplazos realizados
                        fallaron.forEach((original, i) => {
                            reemplazos.push({ original, reemplazo: reemplazosNumerosOportunidad[i], razon: 'race_condition' });
                        });
                    }
                }

                return {
                    success: true,
                    cantidad: aAsignar.length,
                    reemplazos: reemplazos
                };
            });
        } catch (error) {
            const code = error.code || 'ERROR';
            const msg = error.message || 'Error desconocido';
            
            console.error(`  ❌ [${code}] ${msg}`);

            return {
                success: false,
                cantidad: 0,
                reemplazos: [],
                error: msg,
                tipo: code
            };
        }
    }

    /**
     * NUEVO MÉTODO: Generar Y guardar oportunidades DESDE EL SERVIDOR
     * 
     * ✅ SOLUCIÓN AL PROBLEMA DE OPORTUNIDADES NO DISPONIBLES
     * 
     * Antes: Cliente generaba números → podían no estar disponibles cuando llegaba al servidor
     * Ahora: Servidor genera números EN EL MOMENTO de guardar → garantizado disponibles
     * 
     * @param {string} numeroOrden - Número de la orden
     * @param {number} cantidadRequerida - Cantidad de oportunidades a generar (ej: 360 para 120 boletos)
     * @returns {Promise<{success: boolean, cantidad: number, oportunidades: Array}>}
     */
    static async generarYGuardarOportunidades(numeroOrden, cantidadRequerida = 0) {
        if (!numeroOrden || cantidadRequerida <= 0) {
            return { success: true, cantidad: 0, oportunidades: [] };
        }

        try {
            console.log(`🎁 [OportunidadesService] GENERANDO ${cantidadRequerida} oportunidades EN SERVIDOR para ${numeroOrden}`);

            return await db.transaction(async (trx) => {
                // Validar orden
                const orden = await trx('ordenes').where('numero_orden', numeroOrden).first();
                if (!orden) throw new Error(`Orden ${numeroOrden} no existe`);

                // ✅ OBTENER DISPONIBLES DIRECTAMENTE DESDE BD (sin cache)
                // Esto garantiza que obtenemos EXACTAMENTE lo que está disponible AHORA
                console.log(`  📊 Buscando ${cantidadRequerida} números disponibles en BD...`);
                
                const disponiblesEnBD = await trx('orden_oportunidades')
                    .where('estado', 'disponible')
                    .whereNull('numero_orden')
                    .limit(cantidadRequerida)
                    .select('numero_oportunidad')
                    .orderBy('numero_oportunidad', 'asc');

                if (disponiblesEnBD.length < cantidadRequerida) {
                    throw {
                        code: 'INSUFFICIENT_OPORTUNIDADES',
                        message: `Solo hay ${disponiblesEnBD.length} disponibles, se solicitaron ${cantidadRequerida}`,
                        disponibles: disponiblesEnBD.length,
                        solicitadas: cantidadRequerida
                    };
                }

                const numerosSeleccionados = disponiblesEnBD.map(r => r.numero_oportunidad);
                console.log(`  ✅ Seleccionadas: ${numerosSeleccionados.length} oportunidades disponibles`);
                console.log(`     Primeras 5: ${numerosSeleccionados.slice(0, 5).join(', ')}`);
                console.log(`     Últimas 5: ${numerosSeleccionados.slice(-5).join(', ')}`);

                // ✅ UPDATE ATÓMICO: Asignar TODOS los números en una transacción
                const ahora = new Date();
                const result = await trx.raw(
                    `UPDATE orden_oportunidades
                     SET estado = 'apartado', numero_orden = ?, updated_at = ?
                     WHERE numero_oportunidad = ANY(?::int[])
                     AND estado = 'disponible'
                     AND numero_orden IS NULL
                     RETURNING numero_oportunidad`,
                    [numeroOrden, ahora, numerosSeleccionados]
                );

                const actualizadas = new Set((result.rows || []).map(r => r.numero_oportunidad));
                const fallaron = numerosSeleccionados.filter(n => !actualizadas.has(n));

                if (fallaron.length > 0) {
                    console.log(`  ⚠️  RACE CONDITION: ${fallaron.length} números fueron tomados entre SELECT y UPDATE`);
                    throw {
                        code: 'RACE_CONDITION',
                        message: `${fallaron.length} oportunidades fueron tomadas por otro usuario`,
                        cantidad: fallaron.length,
                        fallaron: fallaron
                    };
                }

                const exitosas = Array.from(actualizadas);
                console.log(`  ✅ ASIGNADAS: ${exitosas.length} oportunidades a orden ${numeroOrden}`);

                return {
                    success: true,
                    cantidad: exitosas.length,
                    oportunidades: exitosas
                };
            });
        } catch (error) {
            const code = error.code || 'ERROR';
            const msg = error.message || 'Error desconocido';
            
            console.error(`  ❌ [${code}] ${msg}`);

            return {
                success: false,
                cantidad: 0,
                oportunidades: [],
                error: msg,
                tipo: code
            };
        }
    }

    /**
     * Obtener oportunidades de una orden
     */
    static async obtenerOportunidades(numeroOrden) {
        try {
            const opps = await db('orden_oportunidades')
                .where('numero_orden', numeroOrden)
                .pluck('numero_oportunidad');
            
            // ✅ Retornar estructura CORRECTA con 'tipo'
            if (opps.length === 0) {
                return { tipo: 'no_data', data: [], error: null };
            }
            
            return { tipo: 'success', data: opps, error: null };
        } catch (error) {
            console.error(`Error obtenerOportunidades:`, error.message);
            return { tipo: 'error', data: [], error: error.message };
        }
    }

    /**
     * Liberar oportunidades cuando se cancela orden
     */
    static async liberarOportunidades(numeroOrden) {
        try {
            const cantidad = await db('orden_oportunidades')
                .where('numero_orden', numeroOrden)
                .whereIn('estado', ['apartado', 'vendido'])
                .update({
                    numero_orden: null,
                    estado: 'disponible',
                    updated_at: new Date()
                });

            console.log(`✅ Liberadas ${cantidad} oportunidades de ${numeroOrden}`);
            return { success: true, cantidad };
        } catch (error) {
            console.error(`Error liberarOportunidades:`, error.message);
            throw error;
        }
    }

    /**
     * Estadísticas
     */
    static async obtenerEstadisticas() {
        try {
            const resultado = await db('orden_oportunidades')
                .select(
                    db.raw('COUNT(*) as total'),
                    db.raw(`SUM(CASE WHEN estado = 'disponible' AND numero_orden IS NULL THEN 1 ELSE 0 END) as disponibles`),
                    db.raw(`SUM(CASE WHEN estado = 'apartado' THEN 1 ELSE 0 END) as apartadas`),
                    db.raw(`SUM(CASE WHEN estado = 'vendido' THEN 1 ELSE 0 END) as vendidas`)
                )
                .first();

            return {
                total: resultado?.total || 0,
                disponibles: resultado?.disponibles || 0,
                apartadas: resultado?.apartadas || 0,
                vendidas: resultado?.vendidas || 0
            };
        } catch (error) {
            console.error(`Error obtenerEstadisticas:`, error.message);
            return { total: 0, disponibles: 0, apartadas: 0, vendidas: 0 };
        }
    }
}

module.exports = OportunidadesOrdenService;
