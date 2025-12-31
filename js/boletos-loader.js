/**
 * ============================================================
 * ARCHIVO: js/boletos-loader.js
 * DESCRIPCIÓN: Carga inteligente de boletos con pagination
 * Para soportar 1M de boletos sin cargar todos en memoria
 * 
 * Características:
 * - Carga bajo demanda (lazy loading)
 * - Scroll infinito
 * - Cache de boletos cargados
 * - Validación rápida de disponibilidad
 * ============================================================
 */

/**
 * BoletoLoader: Gestor de carga de boletos con pagination
 */
const BoletoLoader = (function() {
    const CONFIG = {
        batchSize: 100,           // Boletos por página
        cacheMax: 5000,          // Máximo de boletos en caché
        apiEndpoint: '/api/boletos'
    };

    let state = {
        boletosEnCache: new Map(),   // Mapa: número -> info del boleto
        totalDisponibles: 0,
        offset: 0,
        loading: false,
        mostrandoFiltrados: false
    };

    /**
     * Obtener boletos disponibles paginados
     * @param {number} cantidad - Cuántos boletos descargar
     * @param {number} offset - Desde dónde empezar
     * @returns {Promise<Array>}
     */
    async function cargarBoletos(cantidad = CONFIG.batchSize, offset = 0) {
        if (state.loading) return [];

        state.loading = true;

        try {
            const response = await fetch(
                `${CONFIG.apiEndpoint}/disponibles?limit=${cantidad}&offset=${offset}`
            );

            if (!response.ok) throw new Error('Error cargando boletos');

            const data = await response.json();

            if (!data.success || !Array.isArray(data.boletos)) {
                throw new Error('Formato de respuesta inválido');
            }

            // Actualizar total disponibles
            state.totalDisponibles = data.paginacion.total;

            // Agregar a caché
            data.boletos.forEach(numero => {
                state.boletosEnCache.set(numero, { numero, estado: 'disponible' });
            });

            // Limpiar caché si excede máximo
            if (state.boletosEnCache.size > CONFIG.cacheMax) {
                const keysToDelete = Array.from(state.boletosEnCache.keys()).slice(0, 1000);
                keysToDelete.forEach(k => state.boletosEnCache.delete(k));
            }

            state.offset = data.paginacion.proximo_offset;

            return data.boletos;

        } catch (error) {
            console.error('BoletoLoader.cargarBoletos error:', error);
            window.rifaplusUtils?.showFeedback(
                'Error cargando boletos disponibles',
                'error'
            );
            return [];
        } finally {
            state.loading = false;
        }
    }

    /**
     * Verificar disponibilidad de boletos específicos
     * RÁPIDO: No carga todos, solo verifica los solicitados
     * @param {Array<number>} numeros - Números a verificar
     * @returns {Promise<{disponibles: Array, conflictos: Array}>}
     */
    async function verificarDisponibilidad(numeros) {
        if (!Array.isArray(numeros) || numeros.length === 0) {
            return { disponibles: numeros, conflictos: [] };
        }

        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/verificar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numeros: numeros })
            });

            if (!response.ok) throw new Error('Error verificando disponibilidad');

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error en verificación');
            }

            return {
                disponibles: data.disponibles || [],
                conflictos: data.conflictos || []
            };

        } catch (error) {
            console.error('BoletoLoader.verificarDisponibilidad error:', error);
            window.rifaplusUtils?.showFeedback(
                'Error verificando disponibilidad',
                'error'
            );
            return { disponibles: [], conflictos: [] };
        }
    }

    /**
     * Obtener estadísticas de boletos
     * Para mostrar en dashboard
     * @returns {Promise<Object>}
     */
    async function obtenerEstadisticas() {
        try {
            const token = localStorage.getItem('adminToken');
            
            const response = await fetch(`${CONFIG.apiEndpoint}/estadisticas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error obteniendo estadísticas');

            const data = await response.json();
            return data.estadisticas || {};

        } catch (error) {
            console.error('BoletoLoader.obtenerEstadisticas error:', error);
            return {};
        }
    }

    /**
     * Obtener boletos en caché (sin hacer API call)
     * @param {number} cantidad - Cuántos devolver
     * @returns {Array}
     */
    function obtenerDelCache(cantidad = CONFIG.batchSize) {
        const cached = Array.from(state.boletosEnCache.keys()).slice(0, cantidad);
        return cached;
    }

    /**
     * Limpiar caché (liberar memoria)
     */
    function limpiarCache() {
        state.boletosEnCache.clear();
        state.offset = 0;
    }

    /**
     * Obtener estado actual
     */
    function obtenerEstado() {
        return {
            enCache: state.boletosEnCache.size,
            totalDisponibles: state.totalDisponibles,
            offset: state.offset,
            loading: state.loading
        };
    }

    // API pública
    return {
        cargarBoletos,
        verificarDisponibilidad,
        obtenerEstadisticas,
        obtenerDelCache,
        limpiarCache,
        obtenerEstado
    };
})();
