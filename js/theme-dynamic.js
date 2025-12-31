/**
 * ============================================================
 * ARCHIVO: js/theme-dynamic.js
 * DESCRIPCIÓN: Inyección dinámica de logos y temas desde config
 * Se ejecuta después de config.js para actualizar todos los logos
 * automáticamente sin necesidad de hardcodear rutas
 * ============================================================
 */

(function initDynamicTheme() {
    // Esperar a que config esté cargado
    const waitForConfig = setInterval(() => {
        if (window.rifaplusConfig && window.rifaplusConfig.cliente) {
            clearInterval(waitForConfig);
            // Esperar a que el DOM esté listo antes de modificar elementos
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', applyDynamicTheme);
            } else {
                applyDynamicTheme();
            }
        }
    }, 50);

    // Timeout de seguridad (5 segundos)
    setTimeout(() => clearInterval(waitForConfig), 5000);
})();

/**
 * Aplicar tema dinámico: logo, colores, etc.
 */
function applyDynamicTheme() {
    if (!window.rifaplusConfig) {
        console.warn('⚠️  Config no disponible para tema dinámico');
        return;
    }

    const config = window.rifaplusConfig;
    const cliente = config.cliente;
    const tema = config.tema?.colores || {};

    console.log('🎨 Aplicando tema dinámico desde config...');

    // 1. Actualizar favicon dinámicamente
    updateFavicon(cliente.logo);

    // 2. Actualizar todos los logos en la página
    updateAllLogos(cliente.logo);

    // 3. Actualizar CSS variables para colores
    updateCSSVariables(tema);

    // 4. Actualizar título de página
    updatePageTitle(cliente, config.rifa);

    // 5. Actualizar contenido de la página (hero, subtítulos, footer)
    updatePageContent(cliente, config.rifa);

    console.log('✅ Tema dinámico aplicado correctamente');
}

/**
 * Actualizar favicon dinámicamente
 * @param {String} logoPath - Ruta del logo desde config
 */
function updateFavicon(logoPath) {
    if (!logoPath) {
        console.warn('⚠️  Logo no especificado en config');
        return;
    }

    // Buscar o crear link del favicon
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
    }
    favicon.href = logoPath;

    // Actualizar apple-touch-icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
        appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = logoPath;

    console.log(`📱 Favicon actualizado: ${logoPath}`);
}

/**
 * Actualizar todos los logos en la página
 * Busca imágenes con clase o atributo especial y actualiza src
 * @param {String} logoPath - Ruta del logo
 */
function updateAllLogos(logoPath) {
    if (!logoPath) return;

    // Actualizar imágenes con clase "dynamic-logo"
    const dynamicLogos = document.querySelectorAll('img[data-dynamic-logo="true"], img.dynamic-logo');
    dynamicLogos.forEach(img => {
        const oldSrc = img.src;
        img.src = logoPath;
        console.log(`🖼️  Logo actualizado: ${oldSrc} → ${logoPath}`);
    });

    // Fallback: si hay imágenes con src hardcodeado a logos antiguos, reemplazarlas
    const fallbackLogos = [
        'images/logo.png',
        'images/logo-anterior.png',
        'images/logo.webp'
    ];

    fallbackLogos.forEach(oldLogo => {
        const imgs = document.querySelectorAll(`img[src="${oldLogo}"]`);
        imgs.forEach(img => {
            if (img.getAttribute('data-dynamic-logo') !== 'false') { // Excluir si está marcado como estático
                img.src = logoPath;
                img.setAttribute('data-dynamic-logo', 'true');
                console.log(`🖼️  Logo fallback actualizado: ${oldLogo} → ${logoPath}`);
            }
        });
    });
}

/**
 * Actualizar variables CSS con colores del tema
 * @param {Object} tema - Objeto de colores del tema
 */
function updateCSSVariables(tema) {
    if (!tema || typeof tema !== 'object') return;

    const root = document.documentElement;

    // Mapear colores del config a variables CSS
    const colorMap = {
        primary: '--primary',
        primaryDark: '--primary-dark',
        primaryLight: '--primary-light',
        secondary: '--secondary',
        success: '--success',
        danger: '--danger',
        textDark: '--text-dark',
        textLight: '--text-light',
        bgLight: '--bg-light',
        bgWhite: '--bg-white',
        borderColor: '--border-color'
    };

    Object.entries(colorMap).forEach(([configKey, cssVar]) => {
        if (tema[configKey]) {
            root.style.setProperty(cssVar, tema[configKey]);
            console.log(`🎨 CSS var ${cssVar} = ${tema[configKey]}`);
        }
    });
}

/**
 * Actualizar título de la página dinámicamente
 * @param {Object} cliente - Datos del cliente
 * @param {Object} rifa - Datos de la rifa
 */
function updatePageTitle(cliente, rifa) {
    // Usar exactamente lo que está en `rifa.titulo` como título de la página
    if (rifa && rifa.titulo) {
        document.title = rifa.titulo;
    } else if (cliente && cliente.nombre) {
        document.title = cliente.nombre;
    }

    // Actualizar meta description usando la descripción del sorteo si existe
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        if (rifa && rifa.descripcion) {
            metaDesc.content = rifa.descripcion;
        } else if (cliente && cliente.nombre) {
            metaDesc.content = `${cliente.nombre} - Rifas 100% Transparentes`;
        }
    }

    console.log('📄 Título actualizado:', document.title);
}

/**
 * Actualizar contenido visible en la página: hero, subtítulos y footer
 */
function updatePageContent(cliente, rifa) {
    try {
        // Hero
        const heroTitle = document.getElementById('heroTitle');
        const heroHighlight = document.getElementById('heroHighlight');
        const heroDescription = document.getElementById('heroDescription');
        if (heroTitle && rifa && rifa.titulo) {
            // Usar exactamente el título definido en config (sin prefijos)
            heroTitle.innerHTML = `<span class="highlight" id="heroHighlight">${rifa.titulo}</span>`;
        } else if (heroHighlight && rifa && rifa.titulo) {
            heroHighlight.textContent = rifa.titulo;
        }
        if (heroDescription && rifa && rifa.descripcion) {
            heroDescription.textContent = rifa.descripcion;
        }

        // Countdown subtitle
        const countdownSubtitle = document.getElementById('countdownSubtitle');
        if (countdownSubtitle && rifa && rifa.descripcion) {
            countdownSubtitle.innerHTML = `No pierdas tu oportunidad de ganar este increíble ${rifa.titulo}. <strong>Cada boleto comprado aumenta tus posibilidades de ser el afortunado ganador.</strong>`;
        }

        // Footer nombre y copyright
        const footerNombre = document.getElementById('footerNombre');
        if (footerNombre && cliente && cliente.nombre) {
            footerNombre.textContent = cliente.nombre;
        }
        const footerCopyright = document.getElementById('footerCopyright');
        if (footerCopyright && cliente && cliente.nombre) {
            const year = (new Date()).getFullYear();
            footerCopyright.innerHTML = `&copy; ${year} <strong>${cliente.nombre}</strong>. Todos los derechos reservados.`;
        }

    } catch (err) {
        console.warn('⚠️ Error actualizando contenido de la página:', err && err.message);
    }
}

// Exportar funciones para uso manual si es necesario
window.applyDynamicTheme = applyDynamicTheme;
window.updateAllLogos = updateAllLogos;
window.updateCSSVariables = updateCSSVariables;
