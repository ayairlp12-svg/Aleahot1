/**
 * ============================================================
 * performance-rendering-optimizer.js
 * 
 * Optimizaciones para rendering de 50+ cards
 * - Batch DOM updates
 * - Virtualization hints
 * - Debounced scroll handlers
 * - requestAnimationFrame para smooth rendering
 * ============================================================
 */

const PerformanceOptimizer = (function() {
    'use strict';

    // Configuración
    const CONFIG = {
        batchSize: 25,              // Renderizar en lotes de 25
        debounceDelay: 150,         // Debounce scroll 150ms
        enableVirtualization: true, // Para futuros lotes
        logPerformance: false       // Debug
    };

    let state = {
        isRendering: false,
        pendingUpdates: [],
        scrollTimeout: null
    };

    /**
     * Renderizar múltiples elementos en lotes para mejor performance
     * @param {Array} elementos - Array de elementos a renderizar
     * @param {Function} renderFn - Función que retorna HTML para cada elemento
     * @param {HTMLElement} container - Contenedor donde insertar
     * @returns {Promise<void>}
     */
    async function renderBatch(elementos, renderFn, container) {
        if (!container || !Array.isArray(elementos)) return;

        const totalItems = elementos.length;
        const batchCount = Math.ceil(totalItems / CONFIG.batchSize);

        log(`📊 Rendering ${totalItems} items in ${batchCount} batches`);

        // Usar DocumentFragment para mejor performance
        const fragment = document.createDocumentFragment();

        for (let batch = 0; batch < batchCount; batch++) {
            const start = batch * CONFIG.batchSize;
            const end = Math.min(start + CONFIG.batchSize, totalItems);
            const batchItems = elementos.slice(start, end);

            // Renderizar este lote
            const batchHTML = batchItems.map(item => renderFn(item)).join('');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = batchHTML;

            // Agregar al fragment
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            // Esperar al siguiente frame para no bloquear
            if (batch < batchCount - 1) {
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
        }

        // Insert all at once
        container.innerHTML = '';
        container.appendChild(fragment);

        log(`✅ Batch rendering complete`);
    }

    /**
     * Optimizar contenedor para scroll performance
     * Añade propiedades CSS críticas dinámicamente
     * @param {HTMLElement} container - Contenedor
     */
    function optimizeContainerForScroll(container) {
        if (!container) return;

        // Aplicar propiedades de performance
        const style = container.style;
        style.contain = 'content';
        style.willChange = 'scroll-position';
        style.transform = 'translateZ(0)'; // GPU acceleration
        style.backfaceVisibility = 'hidden';

        log('🎯 Container optimized for scroll');
    }

    /**
     * Debounced scroll handler para mejor performance
     * @param {Function} callback - Función a ejecutar cuando scroll termina
     * @param {HTMLElement} element - Elemento a monitorear (default: window)
     */
    function onScrollEnd(callback, element = window) {
        const handler = () => {
            clearTimeout(state.scrollTimeout);
            state.scrollTimeout = setTimeout(() => {
                callback();
            }, CONFIG.debounceDelay);
        };

        element.addEventListener('scroll', handler, { passive: true });

        return {
            remove: () => element.removeEventListener('scroll', handler)
        };
    }

    /**
     * Marcar elementos para lazy loading
     * @param {NodeList|Array} elements - Elementos a marcar
     */
    function markForLazyLoad(elements) {
        elements.forEach((el, index) => {
            // Usar loading="lazy" si es img
            if (el.tagName === 'IMG') {
                el.setAttribute('loading', 'lazy');
            }
            
            // Marcar con atributo de observación
            el.dataset.lazyIndex = index;
        });

        log(`📍 Marked ${elements.length} elements for lazy loading`);
    }

    /**
     * Usar Intersection Observer para virtualization
     * @param {HTMLElement} container - Contenedor
     * @param {Object} options - Observer options
     */
    function observeVisibility(container, options = {}) {
        if (!('IntersectionObserver' in window)) {
            log('⚠️  IntersectionObserver not available');
            return null;
        }

        const defaultOptions = {
            root: null,
            rootMargin: '50px', // Preload 50px antes de entrar en viewport
            threshold: 0.01
        };

        const mergedOptions = { ...defaultOptions, ...options };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Elemento es visible, asegurar que esté renderizado
                    entry.target.classList.add('in-viewport');
                    entry.target.style.opacity = '1';
                } else {
                    // Elemento está fuera del viewport
                    entry.target.classList.remove('in-viewport');
                }
            });
        }, mergedOptions);

        // Observar todos los children del contenedor
        const children = container.querySelectorAll('[data-lazy-index]');
        children.forEach(child => observer.observe(child));

        return observer;
    }

    /**
     * Batch update DOM elements con propiedades
     * @param {Array<{element, properties}>} updates - Array de {element, properties}
     */
    function batchUpdate(updates) {
        // Agrupar por tipo de cambio
        const reads = [];
        const writes = [];

        updates.forEach(({ element, properties }) => {
            if (properties.read) {
                reads.push({ element, callback: properties.read });
            }
            if (properties.write) {
                writes.push({ element, callback: properties.write });
            }
        });

        // Ejecutar lecturas primero
        reads.forEach(({ element, callback }) => {
            callback.call(element);
        });

        // Luego escrituras (agrupar para un solo reflow)
        requestAnimationFrame(() => {
            writes.forEach(({ element, callback }) => {
                callback.call(element);
            });
        });

        log(`📝 Batch updated ${updates.length} elements`);
    }

    /**
     * Medir performance de un bloque de código
     * @param {string} name - Nombre del medidor
     * @param {Function} fn - Función a medir
     */
    function measure(name, fn) {
        if (!window.performance || !CONFIG.logPerformance) {
            return fn();
        }

        const start = performance.now();
        const result = fn();
        const end = performance.now();

        console.log(`⏱️  [${name}] ${(end - start).toFixed(2)}ms`);
        return result;
    }

    /**
     * Log helper
     */
    function log(msg) {
        if (CONFIG.logPerformance) {
            console.log(`🚀 ${msg}`);
        }
    }

    /**
     * Export public API
     */
    return {
        renderBatch,
        optimizeContainerForScroll,
        onScrollEnd,
        markForLazyLoad,
        observeVisibility,
        batchUpdate,
        measure,
        config: CONFIG,
        enableDebug: () => {
            CONFIG.logPerformance = true;
            console.log('🐛 Performance debugging enabled');
        },
        disableDebug: () => {
            CONFIG.logPerformance = false;
        }
    };
})();

/**
 * HOWTO USE:
 * 
 * 1. Para renderizar muchas cards:
 *    PerformanceOptimizer.renderBatch(
 *        elementos,
 *        item => `<div class="card">${item.name}</div>`,
 *        document.getElementById('container')
 *    );
 * 
 * 2. Para optimizar scroll:
 *    PerformanceOptimizer.optimizeContainerForScroll(container);
 *    PerformanceOptimizer.onScrollEnd(() => {
 *        console.log('Scroll ended');
 *    }, container);
 * 
 * 3. Para lazy loading:
 *    const elements = document.querySelectorAll('.lazy-item');
 *    PerformanceOptimizer.markForLazyLoad(elements);
 *    PerformanceOptimizer.observeVisibility(container);
 * 
 * 4. Para debug:
 *    PerformanceOptimizer.enableDebug();
 */
