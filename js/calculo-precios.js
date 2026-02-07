/**
 * ============================================================
 * ARCHIVO: js/calculo-precios.js
 * DESCRIPCIÓN: Módulo CENTRALIZADO para cálculo de precios
 * ÚNICA FUENTE DE VERDAD para totales, descuentos y cálculos
 * ============================================================
 */

/**
 * Obtiene el precio unitario del boleto desde config
 * @returns {number} Precio unitario del boleto
 */
function obtenerPrecioBoleto() {
    // Prioridad 1: desde window.rifaplusConfig (cargado por config.js)
    if (window.rifaplusConfig?.rifa?.precioBoleto) {
        const price = Number(window.rifaplusConfig.rifa.precioBoleto);
        if (!Number.isNaN(price) && isFinite(price) && price > 0) {
            return price;
        }
    }
    
    // Fallback: valor por defecto
    return 15;
}

/**
 * Calcula el total incluyendo promociones
 * @param {number} cantidad - Cantidad de boletos
 * @param {number} precioBoleto - (Opcional) Precio unitario. Si no se proporciona, se obtiene dinámicamente
 * @returns {Object} Objeto con detalles de cálculo: {
 *      cantidadBoletos, precioUnitario, subtotal, descuentoMonto, 
 *      descuentoPorcentaje, totalFinal, promocionAplicada
 * }
 */
function calcularTotalConPromociones(cantidad, precioBoleto = null) {
    // Usar precio dinámico si no se proporciona
    if (!precioBoleto) {
        precioBoleto = obtenerPrecioBoleto();
    }

    // Validar cantidad
    if (!Number.isInteger(cantidad) || cantidad < 0) {
        return {
            cantidadBoletos: 0,
            precioUnitario: precioBoleto,
            subtotal: 0,
            descuentoMonto: 0,
            descuentoPorcentaje: 0,
            totalFinal: 0,
            promocionAplicada: null
        };
    }

    // Usar la función centralizada de cálculo de descuentos si está disponible
    if (window.rifaplusConfig && typeof window.rifaplusConfig.calcularDescuento === 'function') {
        const resultado = window.rifaplusConfig.calcularDescuento(cantidad, precioBoleto);
        return {
            cantidadBoletos: cantidad,
            precioUnitario: precioBoleto,
            subtotal: resultado.subtotal,
            descuentoMonto: resultado.monto,
            descuentoPorcentaje: resultado.porcentaje,
            totalFinal: resultado.total,
            promocionAplicada: resultado.regla || null,
            descuentoAplicable: resultado.descuentoAplicable
        };
    }

    // Fallback si config no está disponible
    const subtotal = cantidad * precioBoleto;
    return {
        cantidadBoletos: cantidad,
        precioUnitario: precioBoleto,
        subtotal: subtotal,
        descuentoMonto: 0,
        descuentoPorcentaje: 0,
        totalFinal: subtotal,
        promocionAplicada: null
    };
}

/**
 * Función de compatibilidad: alias para calcularTotalConPromociones
 * Mantiene compatibilidad con código existente
 */
function calcularTotales(cantidad, precioBoleto = null) {
    return calcularTotalConPromociones(cantidad, precioBoleto);
}

/**
 * Función de compatibilidad: alias para obtenerPrecioBoleto
 * Mantiene compatibilidad con código existente que usa obtenerPrecioDinamico
 */
function obtenerPrecioDinamico() {
    return obtenerPrecioBoleto();
}

/**
 * Función de compatibilidad: alias que sigue la nomenclatura antigua
 * Reemplaza calcularDescuentoGlobal de carrito-global.js
 */
function calcularDescuentoGlobal(cantidad, precioBoleto = null) {
    return calcularTotalConPromociones(cantidad, precioBoleto);
}

// Exportar para Node.js si es necesario (para testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        obtenerPrecioBoleto,
        calcularTotalConPromociones,
        calcularTotales,
        obtenerPrecioDinamico,
        calcularDescuentoGlobal
    };
}
