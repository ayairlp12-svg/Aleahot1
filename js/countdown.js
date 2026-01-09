// countdown.js - neutralizado: contenido eliminado por limpieza
// Archivo dejado intencionalmente vacío para evitar ejecución de código obsoleto.
// Si necesitas restaurarlo, recupera la versión anterior desde el historial del repositorio.
    const objetivo = obtenerTimestampObjetivo();
    const diferencia = objetivo - ahora;

    if (diferencia <= 0) {
        // Si el sorteo ya pasó
        document.getElementById('countdown-days').textContent = '00';
        document.getElementById('countdown-hours').textContent = '00';
        document.getElementById('countdown-minutes').textContent = '00';
        document.getElementById('countdown-seconds').textContent = '00';
        return;
    }

    // Calcular días, horas, minutos, segundos
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    document.getElementById('countdown-days').textContent = String(dias).padStart(2, '0');
    document.getElementById('countdown-hours').textContent = String(horas).padStart(2, '0');
    document.getElementById('countdown-minutes').textContent = String(minutos).padStart(2, '0');
    document.getElementById('countdown-seconds').textContent = String(segundos).padStart(2, '0');
}

/* ============================================================ */
/* SECCIÓN 5: ACTUALIZACIÓN DE BARRA DE PROGRESO              */
/* ============================================================ */

async function actualizarBarraProgreso() {
    try {
        const apiBase = (window.rifaplusConfig && window.rifaplusConfig.backend && window.rifaplusConfig.backend.apiBase) 
            ? window.rifaplusConfig.backend.apiBase 
            : 'http://localhost:3000';
        const url = `${apiBase}/api/public/ordenes-stats`;
        const totalBoletos = window.rifaplusConfig?.rifa?.totalBoletos || 10000;
        
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            console.warn('⚠️ No se pudo obtener estadísticas de boletos');
            actualizarInterfazProgreso(0, totalBoletos);
            return;
        }

        const datos = await respuesta.json();
        
        if (datos.success && datos.data) {
            const boletosVendidos = datos.data.total_boletos_vendidos || 0;
            actualizarInterfazProgreso(boletosVendidos, totalBoletos);
        } else {
            console.warn('[countdown] Invalid API response format');
            actualizarInterfazProgreso(0, totalBoletos);
        }
    } catch (error) {
        console.error('[countdown] Error obteniendo estadísticas:', error);
    }
}

/* ============================================================ */
/* SECCIÓN 6: ACTUALIZACIÓN DE INTERFAZ DE USUARIO             */
/* ============================================================ */

/**
 * actualizarInterfazProgreso - Actualiza elementos UI con datos de boletos
 * @param {number} boletosVendidos - Número de boletos vendidos
 * @param {number} totalBoletos - Total de boletos disponibles
 * @returns {void}
 */
function actualizarInterfazProgreso(boletosVendidos, totalBoletos) {
    // ✅ Si oportunidades está habilitada, calcular solo en rango visible
    const oportunidadesConfig = window.rifaplusConfig && window.rifaplusConfig.rifa && window.rifaplusConfig.rifa.oportunidades;
    let boletosVendidosEnRango = boletosVendidos;
    let totalEnRango = totalBoletos;
    
    if (oportunidadesConfig && oportunidadesConfig.enabled && oportunidadesConfig.rango_visible) {
        const rangoVisible = oportunidadesConfig.rango_visible;
        
        // Contar solo boletos vendidos/apartados que están en el rango visible
        const sold = (window.rifaplusSoldNumbers && Array.isArray(window.rifaplusSoldNumbers)) ? window.rifaplusSoldNumbers : [];
        const reserved = (window.rifaplusReservedNumbers && Array.isArray(window.rifaplusReservedNumbers)) ? window.rifaplusReservedNumbers : [];
        
        let vendidosEnRangoVisible = 0;
        let apartadosEnRangoVisible = 0;
        
        // Contar vendidos en el rango visible
        sold.forEach(num => {
            const n = Number(num);
            if (n >= rangoVisible.inicio && n <= rangoVisible.fin) {
                vendidosEnRangoVisible++;
            }
        });
        
        // Contar apartados en el rango visible
        reserved.forEach(num => {
            const n = Number(num);
            if (n >= rangoVisible.inicio && n <= rangoVisible.fin) {
                apartadosEnRangoVisible++;
            }
        });
        
        boletosVendidosEnRango = vendidosEnRangoVisible + apartadosEnRangoVisible;
        totalEnRango = (rangoVisible.fin - rangoVisible.inicio) + 1;
    }
    
    const boletosRestantes = totalEnRango - boletosVendidosEnRango;
    const porcentaje = totalEnRango > 0 ? Math.round((boletosVendidosEnRango / totalEnRango) * 100) : 0;

    console.debug('[countdown] actualizarInterfazProgreso called:', {
        boletosVendidos: boletosVendidosEnRango,
        totalBoletos: totalEnRango,
        boletosRestantes,
        porcentaje,
        oportunidadesActiva: oportunidadesConfig && oportunidadesConfig.enabled
    });

    // Actualizar números - con validación de elementos
    const elemVendidos = document.getElementById('boletos-vendidos');
    const elemRestantes = document.getElementById('boletos-restantes');
    const elemPorcentaje = document.getElementById('porcentaje-vendido');
    const elemProgressFill = document.getElementById('progress-fill');

    if (!elemVendidos || !elemRestantes || !elemPorcentaje || !elemProgressFill) {
        console.warn('[countdown] Missing UI elements:', {
            'boletos-vendidos': !!elemVendidos,
            'boletos-restantes': !!elemRestantes,
            'porcentaje-vendido': !!elemPorcentaje,
            'progress-fill': !!elemProgressFill
        });
        return;
    }

    elemVendidos.textContent = boletosVendidosEnRango;
    elemRestantes.textContent = boletosRestantes;
    elemPorcentaje.textContent = `${porcentaje}%`;

    // Actualizar barra de progreso con color dinámico
    elemProgressFill.style.width = `${porcentaje}%`;
    
    console.debug('[countdown] Progress bar width set to:', elemProgressFill.style.width);

    // Cambiar color según el porcentaje
    if (porcentaje < 50) {
        elemProgressFill.style.background = 'linear-gradient(90deg, #10B981 0%, #34D399 100%)';
    } else if (porcentaje < 75) {
        elemProgressFill.style.background = 'linear-gradient(90deg, #E8563B 0%, #F97316 100%)';
    } else {
        elemProgressFill.style.background = 'linear-gradient(90deg, #1B5FB8 0%, #0F3A7D 100%)';
    }

    console.debug('[countdown] UI updated successfully');

    // Actualizar mensaje de urgencia dinámico
    actualizarMensajeUrgencia(porcentaje);
}

// Actualizar mensaje de urgencia según el porcentaje
function actualizarMensajeUrgencia(porcentaje) {
    const urgencyText = document.querySelector('.urgency-text');
    const countdownCard = document.querySelector('.countdown-card');

    if (!urgencyText) return;

    let mensaje = '';
    let clase = '';

    if (porcentaje < 50) {
        mensaje = '💡 ¡No pierdas esta oportunidad! Aún hay muchos boletos disponibles - Participa ahora';
        clase = 'urgency-low';
    } else if (porcentaje < 75) {
        mensaje = '⚠️ ¡SE AGOTAN LOS BOLETOS! Más del 50% ya vendido - ¡Asegura tu boleto ahora!';
        clase = 'urgency-medium';
    } else {
        mensaje = '🔥 ¡ÚLTIMAS OPORTUNIDADES! Más del 75% vendido - ¡Solo quedan ' + 
                  Math.round(100 - porcentaje) + '% disponibles!';
        clase = 'urgency-high';
    }

    urgencyText.textContent = mensaje;
    urgencyText.className = `urgency-text ${clase}`;

    // Aplicar animación según urgencia
    if (clase === 'urgency-high') {
        countdownCard.classList.add('urgent-pulse');
    } else {
        countdownCard.classList.remove('urgent-pulse');
    }
}

/* ============================================================ */
/* SECCIÓN 7B: ACTUALIZAR TOTALES DE BOLETOS EN UI             */
/* ============================================================ */

/**
 * actualizarTotalBoletosEnUI - Actualiza los elementos que muestran el total de boletos
 * @returns {void}
 */
function actualizarTotalBoletosEnUI() {
    const totalBoletos = window.rifaplusConfig?.rifa?.totalBoletos || 10000;
    
    const totalBoletosInfo = document.getElementById('total-boletos-info');
    if (totalBoletosInfo) {
        totalBoletosInfo.textContent = totalBoletos.toLocaleString();
    }
}

/* ============================================================ */
/* SECCIÓN 8: INICIALIZACIÓN DE EVENT LISTENERS               */
/* ============================================================ */

/**
 * Inicializa los intervalos de actualización cuando el DOM está listo
 */
function inicializarCountdown() {
    console.debug('[countdown] Initialization triggered');
    
    // Actualizar totales de boletos desde config.js
    actualizarTotalBoletosEnUI();
    console.debug('[countdown] actualizarTotalBoletosEnUI() called');
    
    // Actualizar cuenta regresiva cada segundo
    actualizarCuentaRegresiva();
    setInterval(actualizarCuentaRegresiva, 1000);

    // Actualizar barra de progreso cada 60 segundos (reducido de 5s para evitar 429)
    console.debug('[countdown] About to call actualizarBarraProgreso()');
    actualizarBarraProgreso();
    setInterval(actualizarBarraProgreso, 60000);
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', inicializarCountdown);

// Also run immediately in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
    console.debug('[countdown] DOM still loading, waiting for DOMContentLoaded');
} else {
    console.debug('[countdown] DOM already loaded, initializing now');
    inicializarCountdown();
}