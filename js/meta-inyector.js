/**
 * ============================================================
 * ARCHIVO: js/meta-inyector.js
 * DESCRIPCIÓN: Inyecta dinámicamente metadatos SEO
 * Extrae datos de config.js y actualiza el <head> en tiempo real
 * 
 * Este script DEBE cargarse ANTES que main.js
 * 
 * VENTAJAS:
 * ✅ Cambiar sorteo = editar SOLO config.js
 * ✅ Cambiar dominio = editar SOLO config.js
 * ✅ Sin hardcoding en HTML
 * ✅ SEO profesional
 * ✅ Escalable y mantenible
 * ============================================================
 */

(function InyectorMetadat() {
    'use strict';

    // Función para esperar a que config.js cargue
    function esperarConfig(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const verificar = () => {
                if (window.rifaplusConfig && window.rifaplusConfig.seo) {
                    console.log('✅ [Meta-Inyector] config.js detectado correctamente');
                    resolve(window.rifaplusConfig);
                } else if (Date.now() - startTime > timeout) {
                    console.warn('⚠️  [Meta-Inyector] config.js tardó más de ' + timeout + 'ms');
                    reject(new Error('config.js no cargó a tiempo'));
                } else {
                    setTimeout(verificar, 50);
                }
            };
            
            verificar();
        });
    }

    // Función para actualizar metadato existente O crear uno nuevo
    function actualizarMeta(propiedad, contenido, atributo = 'property') {
        if (!contenido) {
            console.warn(`⚠️  [Meta-Inyector] Contenido vacío para: ${propiedad}`);
            return false;
        }

        try {
            let meta = document.querySelector(`meta[${atributo}="${propiedad}"]`);
            
            if (meta) {
                // Actualizar existente
                meta.content = contenido;
                console.log(`✅ Actualizado: ${propiedad}`);
            } else {
                // Crear nuevo
                meta = document.createElement('meta');
                meta.setAttribute(atributo, propiedad);
                meta.content = contenido;
                document.head.appendChild(meta);
                console.log(`✅ Creado: ${propiedad}`);
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Error actualizando ${propiedad}:`, error);
            return false;
        }
    }

    // Función para actualizar el título de la página
    function actualizarTitulo(titulo) {
        if (!titulo) {
            console.warn('⚠️  [Meta-Inyector] Título vacío');
            return false;
        }

        try {
            document.title = titulo;
            console.log(`✅ Título actualizado: ${titulo}`);
            return true;
        } catch (error) {
            console.error('❌ Error actualizando título:', error);
            return false;
        }
    }

    // Función principal para inyectar todos los metadatos
    async function inyectarMetadatos() {
        try {
            console.log('🔄 [Meta-Inyector] Iniciando inyección de metadatos...');
            
            // Esperar a que config.js cargue
            const config = await esperarConfig();
            const seo = config.seo;
            const cliente = config.cliente;

            if (!seo) {
                throw new Error('config.seo no está disponible');
            }

            console.log('📝 [Meta-Inyector] Datos SEO encontrados:');
            console.log('  - Título:', seo.titulo);
            console.log('  - Descripción:', seo.descripcion.substring(0, 50) + '...');

            // 1. ACTUALIZAR TÍTULO DE LA PÁGINA
            actualizarTitulo(seo.titulo);

            // 2. ACTUALIZAR META DESCRIPTION (nombre)
            actualizarMeta('description', seo.descripcion, 'name');

            // 3. ACTUALIZAR PALABRAS CLAVE
            if (seo.palabrasLlave) {
                actualizarMeta('keywords', seo.palabrasLlave, 'name');
            }

            // 4. ACTUALIZAR OPEN GRAPH (Facebook, WhatsApp)
            const og = seo.openGraph;
            if (og) {
                actualizarMeta('og:title', og.titulo || seo.titulo);
                actualizarMeta('og:description', og.descripcion || seo.descripcion);
                actualizarMeta('og:image', seo.urlBase + og.imagen);
                actualizarMeta('og:url', seo.urlBase);
                actualizarMeta('og:type', og.tipo || 'website');
                actualizarMeta('og:locale', og.locale || 'es_MX');
                
                // También agregar site_name
                actualizarMeta('og:site_name', cliente.nombre || 'Sorteos');
            }

            // 5. ACTUALIZAR TWITTER CARD
            const twitter = seo.twitter;
            if (twitter) {
                actualizarMeta('twitter:card', twitter.card || 'summary_large_image', 'name');
                actualizarMeta('twitter:title', twitter.titulo || seo.titulo, 'name');
                actualizarMeta('twitter:description', twitter.descripcion || seo.descripcion, 'name');
                actualizarMeta('twitter:image', seo.urlBase + twitter.imagen, 'name');
                if (twitter.creador) {
                    actualizarMeta('twitter:creator', twitter.creador, 'name');
                }
            }

            // 6. ACTUALIZAR AUTOR Y COPYRIGHT
            actualizarMeta('author', seo.autor || cliente.nombre, 'name');
            actualizarMeta('copyright', seo.copyright, 'name');

            // 7. ACTUALIZAR VIEWPORT (responsivo)
            actualizarMeta('viewport', 'width=device-width, initial-scale=1.0', 'name');

            // 8. ACTUALIZAR ROBOTS (indexación)
            actualizarMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', 'name');

            // 9. ACTUALIZAR LANGUAGE
            actualizarMeta('language', 'Spanish', 'name');

            // 10. ACTUALIZAR CHARSET (debe estar presente)
            let charset = document.querySelector('meta[charset]');
            if (!charset) {
                charset = document.createElement('meta');
                charset.charset = 'UTF-8';
                document.head.insertBefore(charset, document.head.firstChild);
                console.log('✅ Charset agregado');
            }

            // 11. ACTUALIZAR CANONICAL (para evitar contenido duplicado)
            const urlActual = window.location.origin + window.location.pathname;
            let canonical = document.querySelector('link[rel="canonical"]');
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.rel = 'canonical';
                document.head.appendChild(canonical);
            }
            canonical.href = urlActual;
            console.log('✅ Canonical actualizado:', urlActual);

            // 12. VALIDACIÓN FINAL
            console.log('');
            console.log('═══════════════════════════════════════════════');
            console.log('✅ [Meta-Inyector] INYECCIÓN COMPLETADA CON ÉXITO');
            console.log('═══════════════════════════════════════════════');
            console.log('📄 Página:', document.title);
            console.log('🔗 URL: ', urlActual);
            console.log('🏢 Cliente:', cliente.nombre);
            console.log('🎰 Sorteo: ', cliente.nombreSorteo);
            console.log('═══════════════════════════════════════════════');
            console.log('');

            // Marcar como completado
            window.metadatosInyectados = true;
            
            return true;

        } catch (error) {
            console.error('❌ [Meta-Inyector] ERROR:', error);
            window.metadatosInyectados = false;
            return false;
        }
    }

    // EJECUTAR: Iniciar inyección cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inyectarMetadatos);
    } else {
        inyectarMetadatos();
    }

})();

// Para debugging: acceder a window.metadatosInyectados para ver si se completó
