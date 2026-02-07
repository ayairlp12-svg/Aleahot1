/**
 * ============================================================
 * SISTEMA DE PREMIOS DINÁMICO
 * ============================================================
 * Renderiza automáticamente la sección de premios desde config.js
 * 
 * Características:
 * - 3 categorías: Sorteo, Presorteo, Ruletazos
 * - Totalmente configurable desde config.js
 * - Responsivo y animado
 * - Se oculta automáticamente si está deshabilitado
 * ============================================================
 */

// Ejecutar cuando el DOM esté completamente listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Premios] DOMContentLoaded disparado');
    setTimeout(() => {
        inicializarSistemaPremios();
    }, 500); // Esperar 500ms para que config.js se cargue completamente
});

// También ejecutar después de un tiempo como fallback
setTimeout(() => {
    if (!window.sistemaPremiosInicializado) {
        console.warn('[Premios] Ejecutando por timeout');
        inicializarSistemaPremios();
    }
}, 2000);

function inicializarSistemaPremios() {
    'use strict';

    if (window.sistemaPremiosInicializado) {
        console.log('[Premios] Ya fue inicializado');
        return;
    }
    window.sistemaPremiosInicializado = true;

    console.log('[Premios] Buscando config...');
    console.log('[Premios] window.rifaplusConfig:', typeof window.rifaplusConfig);
    
    // Esperar a que config esté disponible Y completamente cargado
    if (!window.rifaplusConfig || !window.rifaplusConfig.rifa) {
        console.error('❌ [Premios] Config no disponible:', {
            hasConfig: !!window.rifaplusConfig,
            hasRifa: !!window.rifaplusConfig?.rifa,
            configKeys: Object.keys(window.rifaplusConfig || {})
        });
        window.sistemaPremiosInicializado = false;
        return;
    }

    const config = window.rifaplusConfig;
    const sistemaPremios = config.rifa?.sistemaPremios;

    console.log('[Premios] sistemaPremios config:', sistemaPremios);

    // Validar que premios esté habilitado
    if (!sistemaPremios || !sistemaPremios.enabled) {
        console.log('ℹ️  [Premios] Sistema de premios deshabilitado');
        const seccion = document.getElementById('sistema-premios');
        if (seccion) seccion.style.display = 'none';
        return;
    }

    console.log('✅ [Premios] Inicializando sistema de premios...');
    console.log('📊 [Premios] Config:', sistemaPremios);

    try {
        // Renderizar mensaje
        if (sistemaPremios.mensaje) {
            const mensajeEl = document.getElementById('premios-mensaje');
            if (mensajeEl) {
                // Eliminar emojis del mensaje
                const mensajeLimpio = sistemaPremios.mensaje.replace(/[\p{Emoji}]/gu, '').trim();
                mensajeEl.textContent = mensajeLimpio;
            }
        }

        // PREMIOS DEL SORTEO
        if (sistemaPremios.sorteo && sistemaPremios.sorteo.length > 0) {
            renderizarPremios(
                sistemaPremios.sorteo,
                'premios-sorteo-grid',
                'premios-sorteo-container'
            );
        } else {
            ocultarCategoria('premios-sorteo-container');
        }

        // PREMIOS DE PRESORTEO
        if (sistemaPremios.presorteo && sistemaPremios.presorteo.length > 0) {
            renderizarPremios(
                sistemaPremios.presorteo,
                'premios-presorteo-grid',
                'premios-presorteo-container'
            );
        } else {
            ocultarCategoria('premios-presorteo-container');
        }

        // PREMIOS DE RULETAZOS
        if (sistemaPremios.ruletazos && Array.isArray(sistemaPremios.ruletazos) && sistemaPremios.ruletazos.length > 0) {
            renderizarRuletazos(sistemaPremios.ruletazos);
        } else {
            ocultarCategoria('premios-ruletazos-container');
        }

        console.log('✅ [Premios] Sistema de premios renderizado correctamente');

    } catch (error) {
        console.error('❌ [Premios] Error al renderizar premios:', error);
    }
}

/**
 * Renderiza un array de premios en una tarjeta HTML
 * @param {Array} premios - Array de objetos premio
 * @param {string} gridId - ID del contenedor grid
 * @param {string} containerId - ID del contenedor de categoría
 */
function renderizarPremios(premios, gridId, containerId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    // Limpiar contenedor
    grid.innerHTML = '';

    // Crear tarjeta para cada premio
    premios.forEach((premio, index) => {
        const tarjeta = crearTarjetaPremio(premio);
        grid.appendChild(tarjeta);
    });

    // Mostrar contenedor
    const container = document.getElementById(containerId);
    if (container) container.style.display = 'block';
}

/**
 * Crea una tarjeta de premio individual
 * @param {Object} premio - Objeto con datos del premio
 * @returns {HTMLElement} Elemento de tarjeta
 */
function crearTarjetaPremio(premio) {
    const card = document.createElement('div');
    card.className = 'premio-card';

    // Agregar clase especial según posición
    if (premio.posicion === 2) card.classList.add('segundo');
    if (premio.posicion === 3) card.classList.add('tercero');

    // Limpiar nombre de emojis
    const nombreLimpio = premio.nombre.replace(/[\p{Emoji}]/gu, '').trim();

    const html = `
        <div class="premio-badge ${premio.posicion > 1 ? (premio.posicion === 2 ? 'segundo' : 'tercero') : ''}">
            ${nombreLimpio}
        </div>
        <div class="premio-content">
            <div class="premio-icono">${premio.icono || ''}</div>
            <h4 class="premio-descripcion">${premio.premio}</h4>
            <p class="premio-texto">${premio.descripcion || ''}</p>
        </div>
    `;

    card.innerHTML = html;
    return card;
}

/**
 * Renderiza la sección de ruletazos
 * @param {Object} ruletazos - Objeto con datos de ruletazos
 */
function renderizarRuletazos(ruletazosArray) {
    const gridEl = document.getElementById('premios-ruletazos-grid');
    const containerEl = document.getElementById('premios-ruletazos-container');

    if (!gridEl || !containerEl) return;

    // Limpiar contenedor
    gridEl.innerHTML = '';

    // Si es un array, renderizar cada ruletazo
    if (Array.isArray(ruletazosArray)) {
        ruletazosArray.forEach((ruletazo) => {
            const card = crearTarjetaRuletazo(ruletazo);
            gridEl.appendChild(card);
        });
    }

    containerEl.style.display = 'block';
}

/**
 * Crea una tarjeta de ruletazo individual con formato de premio regular
 * @param {Object} ruletazo - Objeto con datos del ruletazo
 * @returns {HTMLElement} Elemento de tarjeta
 */
function crearTarjetaRuletazo(ruletazo) {
    const card = document.createElement('div');
    card.className = 'premio-card';

    // Crear badge con cantidad de ruletazos
    const badge = document.createElement('div');
    badge.className = 'premio-badge';
    badge.textContent = `${ruletazo.cantidad} Ruletazos`;

    // Crear contenido
    const content = document.createElement('div');
    content.className = 'premio-content';
    content.innerHTML = `
        <div class="premio-icono">${ruletazo.icono || ''}</div>
        <h4 class="premio-descripcion">Ruletazos en el ${ruletazo.evento}</h4>
        <p class="premio-texto">${ruletazo.premio}</p>
    `;

    card.appendChild(badge);
    card.appendChild(content);
    return card;
}

/**
 * Oculta una categoría de premios
 * @param {string} containerId - ID del contenedor
 */
function ocultarCategoria(containerId) {
    const container = document.getElementById(containerId);
    if (container) container.style.display = 'none';
}

/**
 * Actualizar premios dinámicamente (para cambios en tiempo real)
 * Uso: actualizarPremios(nuevoConfig)
 */
window.actualizarPremios = function(nuevoConfig) {
    console.log('🔄 [Premios] Actualizando premios...');
    
    if (nuevoConfig && nuevoConfig.sistemaPremios) {
        window.rifaplusConfig.rifa.sistemaPremios = nuevoConfig.sistemaPremios;
        // Reinicializar
        inicializarSistemaPremios();
    }
};
