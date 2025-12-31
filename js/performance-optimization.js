/**
 * Performance Optimization Module
 * Lazy load modales y eventos, optimizar reflows
 */

(function initPerformanceOptimization() {
    'use strict';

    /**
     * Lazy Load Intersection Observer para Modal
     */
    const initLazyLoadModals = () => {
        if (!('IntersectionObserver' in window)) return;

        const modales = document.querySelectorAll('.modal-overlay, .modal-carrito-overlay');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Preload cuando entra en viewport
                    const modal = entry.target;
                    modal.style.visibility = 'visible';
                }
            });
        }, { rootMargin: '50px' });

        modales.forEach(modal => observer.observe(modal));
    };

    /**
     * Debounce para eventos de scroll/resize
     */
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    /**
     * Optimizar eventos de scroll
     */
    const optimizeScrollEvents = () => {
        const scrollHandler = debounce(() => {
            // Actualizar elementos visibles solo cuando scroll termina
            document.querySelectorAll('[data-scroll-optimize]').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    el.classList.add('in-viewport');
                } else {
                    el.classList.remove('in-viewport');
                }
            });
        }, 200);

        window.addEventListener('scroll', scrollHandler, { passive: true });
    };

    /**
     * Optimizar cálculos de layout
     */
    const batchDOMUpdates = (updates) => {
        requestAnimationFrame(() => {
            updates.forEach(update => update());
        });
    };

    /**
     * Cache de elementos DOM frecuentemente accedidos
     */
    const createDOMCache = () => {
        const cache = {
            header: document.querySelector('.header'),
            modals: document.querySelectorAll('.modal-overlay'),
            buttons: document.querySelectorAll('.btn'),
            inputs: document.querySelectorAll('input[type="text"], input[type="number"]')
        };
        return Object.freeze(cache);
    };

    /**
     * Preload de imágenes críticas
     */
    const preloadCriticalImages = () => {
        const imagenes = [
            'images/logo.png',
            'images/hero-bg.jpg'
        ];

        imagenes.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    };

    /**
     * Resource Hints para conexiones
     */
    const addResourceHints = () => {
        // DNS Prefetch
        const dnsPrefetch = document.createElement('link');
        dnsPrefetch.rel = 'dns-prefetch';
        dnsPrefetch.href = '//127.0.0.1:3000';
        document.head.appendChild(dnsPrefetch);
    };

    // Inicializar cuando DOM está listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initLazyLoadModals();
            optimizeScrollEvents();
            addResourceHints();
        });
    } else {
        initLazyLoadModals();
        optimizeScrollEvents();
        addResourceHints();
    }

    // Exponer para debugging
    if (window.__DEBUG__) {
        window.performanceTools = {
            debounce,
            batchDOMUpdates,
            createDOMCache
        };
    }
})();
