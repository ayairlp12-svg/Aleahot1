/**
 * ============================================================
 * ARCHIVO: js/carrito-oportunidades.js
 * DESCRIPCIÓN: Sistema unificado de oportunidades para carrito
 * Usa OportunidadesManager (professional, robusto, optimizado)
 * ============================================================
 */

const CARRITO_OPPS_DEBUG_KEY = 'rifaplus_debug_carrito_oportunidades';

function debugCarritoOportunidades() {
    let enabled = window.RIFAPLUS_DEBUG_CARRITO_OPPS === true;

    if (!enabled) {
        try {
            enabled = localStorage.getItem(CARRITO_OPPS_DEBUG_KEY) === 'true';
        } catch (error) {
            enabled = false;
        }
    }

    if (enabled && typeof console !== 'undefined' && typeof console.debug === 'function') {
        console.debug('[CARRITO-OPPS]', ...arguments);
    }
}

function asegurarCacheOportunidadesCarrito() {
    if (!window.rifaplusOportunidadesCarrito) {
        window.rifaplusOportunidadesCarrito = {};
    }

    return window.rifaplusOportunidadesCarrito;
}

function normalizarOportunidadesCarrito(oportunidades) {
    if (!Array.isArray(oportunidades) || oportunidades.length === 0) {
        return [];
    }

    return [...new Set(
        oportunidades
            .map(o => Number(o))
            .filter(o => !Number.isNaN(o) && Number.isFinite(o) && o > 0)
    )].sort((a, b) => a - b);
}

function obtenerBoletosSeleccionadosCarritoOportunidades() {
    if (typeof obtenerBoletosSelecionados === 'function') {
        return obtenerBoletosSelecionados();
    }

    return Array.isArray(window.rifaplusSelectedNumbers)
        ? window.rifaplusSelectedNumbers
        : [];
}

/**
 * 🎯 FUNCIÓN PRINCIPAL: Actualizar oportunidades EN CARRITO Y EN DOM
 * ✅ COMPLETA: Guarda datos + ACTUALIZA UI
 * Se llama cuando el OportunidadesManager termina de cargar
 */
function actualizarOportunidadesEnCarrito(numerosOrdenados) {
    if (!window.oportunidadesManager) {
        console.warn('[CARRITO-OPPS] ⚠️ OportunidadesManager no disponible');
        return;
    }

    const cacheOportunidades = asegurarCacheOportunidadesCarrito();
    debugCarritoOportunidades('Actualizando oportunidades en carrito');
    
    // Obtener oportunidades del manager en batch
    const oportunidadesPorBoleto = window.oportunidadesManager.obtenerMultiples(numerosOrdenados);
    
    let actualizadosGlobales = 0;
    let actualizadosUI = 0;
    
    for (const numero of numerosOrdenados) {
        if (Number(numero) in oportunidadesPorBoleto) {
            const opps = oportunidadesPorBoleto[numero];
            
            // ✅ PASO 1: GUARDAR EN ESTRUCTURA GLOBAL (para orden-formal.js y otros módulos)
            const oppsUnicos = normalizarOportunidadesCarrito(opps);

            if (oppsUnicos.length > 0) {
                cacheOportunidades[String(numero)] = oppsUnicos;
                actualizadosGlobales++;
            }
            
            // ✅ PASO 2: ACTUALIZAR DOM (mostrar en pantalla)
            if (_actualizarDOMOportunidad(numero)) {
                actualizadosUI++;
            }
        }
    }

    debugCarritoOportunidades(`Actualizacion completada: ${actualizadosGlobales} en memoria, ${actualizadosUI} en DOM`);
}

/**
 * 🎨 FUNCIÓN INTERNA: Actualizar UN boleto en el DOM
 * Usa datos de window.rifaplusOportunidadesCarrito
 * Inteligente: Solo intenta si el boleto aún existe en el carrito
 */
function _actualizarDOMOportunidad(numero) {
    const opps = window.rifaplusOportunidadesCarrito?.[String(numero)];
    
    if (!opps || !Array.isArray(opps) || opps.length === 0) {
        debugCarritoOportunidades(`Boleto #${numero}: sin oportunidades`);
        return false;
    }
    
    // ✅ VALIDACIÓN CRÍTICA: Verificar que el boleto aún existe en carrito
    const boletoPrincipal = document.querySelector(`.carrito-item[data-numero="${numero}"]`);
    if (!boletoPrincipal) {
        // El boleto fue borrado del carrito - no intentar más
        debugCarritoOportunidades(`Boleto #${numero}: ya no esta en el carrito`);
        return false;
    }
    
    const container = document.querySelector(`.carrito-item-oportunidades-container[data-numero="${numero}"]`);
    if (!container) {
        // El container debería existir si el item principal existe
        console.warn(`[CARRITO-OPPS] ⚠️  Boleto #${numero}: container de oportunidades no encontrado`);
        return false;
    }
    
    try {
        const formatearNumero = typeof window.rifaplusConfig?.formatearNumeroBoleto === 'function'
            ? window.rifaplusConfig.formatearNumeroBoleto.bind(window.rifaplusConfig)
            : (n => String(n));
        const oppStr = opps.map(formatearNumero).join(', ');
        
        // Actualizar HTML
        container.innerHTML = `<div class="carrito-item-numero carrito-item-numero--full"><span class="carrito-item-oportunidades-text"><i class="fas fa-check-circle carrito-item-oportunidades-check"></i><strong>Oportunidades:</strong> ${oppStr}</span></div>`;
        container.style.opacity = '1';
        container.setAttribute('data-oportunidades', 'loaded');

        debugCarritoOportunidades(`Boleto #${numero}: ${opps.length} oportunidades mostradas`);
        return true;
    } catch (error) {
        console.error(`[CARRITO-OPPS] ❌ Error actualizando boleto #${numero}:`, error);
        return false;
    }
}

/**
 * � FUNCIÓN CRÍTICA: Sincronizar todas las oportunidades del carrito actual
 * Se debe llamar SIEMPRE después de cargar oportunidades o cambiar carrito
 * Asegura que window.rifaplusOportunidadesCarrito esté poblado para orden-formal.js
 */
function sincronizarOportunidadesAlCarrito() {
    if (!window.oportunidadesManager) {
        console.warn('[CARRITO-OPPS] ⚠️ OportunidadesManager no disponible para sincronizar');
        return;
    }

    const cacheOportunidades = asegurarCacheOportunidadesCarrito();
    const boletosSelecionados = obtenerBoletosSeleccionadosCarritoOportunidades();
    
    if (!Array.isArray(boletosSelecionados) || boletosSelecionados.length === 0) {
        debugCarritoOportunidades('No hay boletos para sincronizar');
        return;
    }
    
    try {
        const allOpps = window.oportunidadesManager.obtenerMultiples(boletosSelecionados);
        
        let sincronizados = 0;
        for (const numero of boletosSelecionados) {
            const numStr = String(numero);
            if (Number(numero) in allOpps && Array.isArray(allOpps[Number(numero)])) {
                const oppsLimpias = normalizarOportunidadesCarrito(allOpps[Number(numero)]);
                
                if (oppsLimpias.length > 0) {
                    cacheOportunidades[numStr] = oppsLimpias;
                    sincronizados++;
                }
            }
        }
        
        const totalOppsGlobal = Object.values(cacheOportunidades)
            .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

        debugCarritoOportunidades(`Sincronizadas ${sincronizados}/${boletosSelecionados.length} boletos (${totalOppsGlobal} oportunidades)`);
        return cacheOportunidades;
    } catch (error) {
        console.error('[CARRITO-OPPS] ❌ Error sincronizando:', error);
        return null;
    }
}

/**
 * 📊 Obtener estadísticas del sistema de oportunidades
 */
function obtenerEstadisticasOportunidades() {
    if (!window.oportunidadesManager) return null;
    return window.oportunidadesManager.getStats();
}

/**
 * 🧹 Limpiar cache de oportunidades (para debugging/testing)
 */
function limpiarCacheOportunidades() {
    if (window.oportunidadesManager) {
        window.oportunidadesManager.limpiar();
        debugCarritoOportunidades('Cache limpiado');
    }
}

// ============================================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================================
window.actualizarOportunidadesEnCarrito = actualizarOportunidadesEnCarrito;
window.sincronizarOportunidadesAlCarrito = sincronizarOportunidadesAlCarrito;
window.obtenerEstadisticasOportunidades = obtenerEstadisticasOportunidades;
window.limpiarCacheOportunidades = limpiarCacheOportunidades;
