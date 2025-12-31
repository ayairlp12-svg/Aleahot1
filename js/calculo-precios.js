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

    let totalFinal = 0;
    let montoDescuento = 0;
    let boletosRestantes = cantidad;
    let promocionAplicada = null;

    // Obtener promociones desde config, ordenadas por cantidad (descendente)
    const promociones = (window.rifaplusConfig?.rifa?.promociones || [])
        .sort((a, b) => b.cantidad - a.cantidad);

    // Aplicar promociones de mayor a menor cantidad
    for (const promo of promociones) {
        if (boletosRestantes >= promo.cantidad) {
            // Cuántas promociones de este tipo caben
            const cantidadPromos = Math.floor(boletosRestantes / promo.cantidad);
            
            // Calcular costo
            totalFinal += cantidadPromos * promo.precio;
            
            // Calcular descuento
            const precioNormalPromo = cantidadPromos * promo.cantidad * precioBoleto;
            montoDescuento += precioNormalPromo - (cantidadPromos * promo.precio);
            
            // Actualizar boletos restantes
            boletosRestantes -= cantidadPromos * promo.cantidad;
            
            // Guardar promoción aplicada
            if (!promocionAplicada) {
                promocionAplicada = promo;
            }
        }
    }

    // Agregar boletos sueltos a precio normal
    totalFinal += boletosRestantes * precioBoleto;

    const subtotal = cantidad * precioBoleto;

    return {
        cantidadBoletos: cantidad,
        precioUnitario: precioBoleto,
        subtotal: subtotal,
        descuentoMonto: montoDescuento,
        descuentoPorcentaje: montoDescuento > 0 
            ? ((montoDescuento / subtotal) * 100).toFixed(2)
            : 0,
        totalFinal: totalFinal,
        promocionAplicada: promocionAplicada
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
