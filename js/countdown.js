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


/* ============================================================ */
/* SECCIÓN 5: ACTUALIZACIÓN DE BARRA DE PROGRESO              */
/* ============================================================ */

async function actualizarBarraProgreso() {
    try {
        // 🎯 PASO 1: Determinar total y rango de boletos a mostrar
        // Si oportunidades está habilitada, usar SOLO el rango visible
        // Si no, usar el totalBoletos configurado
        const oportunidadesConfig = window.rifaplusConfig?.rifa?.oportunidades;
        const totalBoletosConfiguracion = window.rifaplusConfig?.rifa?.totalBoletos || 10000;
        
        let totalParaMostrar = totalBoletosConfiguracion;
        let rangoVisible = null;
        
        if (oportunidadesConfig && oportunidadesConfig.enabled && oportunidadesConfig.rango_visible) {
            rangoVisible = oportunidadesConfig.rango_visible;
            // El total a mostrar es el TAMAÑO del rango visible, no el config.totalBoletos
            totalParaMostrar = (rangoVisible.fin - rangoVisible.inicio) + 1;
            console.debug('[countdown] Oportunidades enabled, usando rango visible:', rangoVisible, 'Total:', totalParaMostrar);
        } else {
            console.debug('[countdown] Oportunidades disabled, usando totalBoletos:', totalParaMostrar);
        }
        
        // 🎯 PASO 2: Obtener datos de boletos (PRIMERO en memoria, LUEGO backend)
        const sold = (window.rifaplusSoldNumbers && Array.isArray(window.rifaplusSoldNumbers)) ? window.rifaplusSoldNumbers : [];
        const reserved = (window.rifaplusReservedNumbers && Array.isArray(window.rifaplusReservedNumbers)) ? window.rifaplusReservedNumbers : [];
        
        // Si tenemos datos en memoria, usarlos
        if (window.rifaplusBoletosLoaded && (sold.length > 0 || reserved.length > 0)) {
            console.debug('[countdown] Usando datos en memoria (tiempo real)');
            // Pasar tanto el total como el rango para que la función calcule correctamente
            actualizarInterfazProgreso(sold, reserved, totalParaMostrar, rangoVisible);
            return;
        }
        
        // 🎯 PASO 3: FALLBACK - Obtener del backend si no hay datos en memoria
        const apiBase = (window.rifaplusConfig && window.rifaplusConfig.backend && window.rifaplusConfig.backend.apiBase) 
            ? window.rifaplusConfig.backend.apiBase 
            : 'http://localhost:3000';
        const url = `${apiBase}/api/public/ordenes-stats`;
        
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            console.warn('⚠️ No se pudo obtener estadísticas de boletos');
            actualizarInterfazProgreso([], [], totalParaMostrar, rangoVisible);
            return;
        }

        const datos = await respuesta.json();
        
        if (datos.success && datos.data) {
            const boletosVendidos = datos.data.total_boletos_vendidos || 0;
            console.debug('[countdown] Usando datos del backend:', { boletosVendidos });
            actualizarInterfazProgreso([], [], totalParaMostrar, rangoVisible, boletosVendidos);
        } else {
            console.warn('[countdown] Invalid API response format');
            actualizarInterfazProgreso([], [], totalParaMostrar, rangoVisible);
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
/**
 * actualizarInterfazProgreso - Actualiza elementos UI con datos de boletos
 * 🎯 LÓGICA CORRECTA:
 * - Si oportunidades ESTÁ ENABLED: Mostrar solo boletos del rango visible
 *   * Vendidos: Contar solo boletos vendidos/reservados en el rango visible
 *   * Total: Tamaño del rango visible (ya ajustado en actualizarBarraProgreso)
 * 
 * - Si oportunidades NO ESTÁ: Mostrar todos los boletos
 *   * Vendidos: Todos los vendidos (sin filtrar)
 *   * Total: totalParaMostrar (que es totalBoletos)
 * 
 * @param {Array} sold - Array de boletos vendidos
 * @param {Array} reserved - Array de boletos reservados
 * @param {number} totalParaMostrar - Total de boletos a considerar
 * @param {Object|null} rangoVisible - Rango visible si oportunidades está enabled
 * @param {number} backendVendidos - (Opcional) Total de vendidos del backend (fallback)
 */
function actualizarInterfazProgreso(sold = [], reserved = [], totalParaMostrar = 10000, rangoVisible = null, backendVendidos = null) {
    // 🎯 CALCULAR BOLETOS VENDIDOS SEGÚN MODALIDAD
    // ⭐ IMPORTANTE: Contar SOLO boletos vendidos (sold), no apartados/reservados
    // Los reservados son boletos temporales sin pago confirmado
    let boletosVendidosParaMostrar = 0;
    
    if (rangoVisible && rangoVisible.inicio !== undefined && rangoVisible.fin !== undefined) {
        // 🎯 MODO OPORTUNIDADES: Contar solo boletos VENDIDOS del rango visible
        // NO incluir reservados (apartados sin pago)
        sold.forEach(num => {
            const n = Number(num);
            if (n >= rangoVisible.inicio && n <= rangoVisible.fin) {
                boletosVendidosParaMostrar++;
            }
        });
        
        console.debug('[countdown] MODO OPORTUNIDADES - Rango visible:', rangoVisible, 'Vendidos en rango:', boletosVendidosParaMostrar, 'Total sold:', sold.length, 'Total reserved:', reserved.length);
    } else if (backendVendidos !== null) {
        // FALLBACK: Si solo tenemos data del backend
        boletosVendidosParaMostrar = backendVendidos;
        console.debug('[countdown] FALLBACK BACKEND - Vendidos:', boletosVendidosParaMostrar);
    } else {
        // 🎯 MODO NORMAL (sin oportunidades): Contar SOLO los vendidos
        boletosVendidosParaMostrar = sold.length;
        console.debug('[countdown] MODO NORMAL - Total vendidos:', boletosVendidosParaMostrar, 'Total reserved:', reserved.length);
    }
    
    // 🎯 CALCULAR DISPONIBLES Y PORCENTAJE
    const boletosRestantes = totalParaMostrar - boletosVendidosParaMostrar;
    const porcentaje = totalParaMostrar > 0 ? Math.round((boletosVendidosParaMostrar / totalParaMostrar) * 100) : 0;

    console.debug('[countdown] RESULTADO FINAL:', {
        boletosVendidos: boletosVendidosParaMostrar,
        boletosRestantes,
        totalParaMostrar,
        porcentaje
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

    elemVendidos.textContent = boletosVendidosParaMostrar;
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
    
    // 🔥 NUEVO: Escuchar evento cuando boletos se cargan en main.js
    // Esto asegura que la barra se actualice apenas los datos estén listos
    window.addEventListener('boletosListos', function(e) {
        console.debug('[countdown] Evento boletosListos recibido, actualizando barra:', e.detail);
        // Llamar INMEDIATAMENTE cuando los boletos estén listos
        actualizarBarraProgreso();
    });
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