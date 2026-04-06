/**
 * ============================================================
 * ARCHIVO: js/theme-loader.js
 * DESCRIPCIÓN: Cargador de temas dinámicos
 * Aplica automáticamente los colores de config.js al sitio
 * SE DEBE CARGAR ANTES QUE config.js
 * ============================================================
 */

(function() {
    // Contador de reintentos para evitar spam en consola
    let attemptCount = 0;
    const MAX_ATTEMPTS = 50; // Máximo 50 reintentos (2.5 segundos)
    const THEME_RGBA_SUFFIXES = ['-rgb', '-06', '-08', '-10', '-15', '-20', '-25', '-30', '-35', '-40', '-50'];
    const BASE_THEME_KEYS = [
        'colorPrimario',
        'colorSecundario',
        'colorAccento',
        'colorExito',
        'colorPeligro',
        'colorAdvertencia',
        'colorTexto',
        'colorTextoSecundario',
        'colorFondo',
        'colorFondoSecundario'
    ];

    function clearThemeVars() {
        const root = document.documentElement;
        BASE_THEME_KEYS.forEach((key) => {
            const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.removeProperty(cssVar);
            THEME_RGBA_SUFFIXES.forEach((suffix) => {
                root.style.removeProperty(`${cssVar}${suffix}`);
            });
        });
    }

    function isCustomThemeEnabled() {
        return window.rifaplusConfig?.tema?.personalizado === true;
    }

    // Aplicar tema cuando config está listo
    function applyTheme() {
        // Verificar que config.js esté cargado
        if (!window.rifaplusConfig || !window.rifaplusConfig.tema || !window.rifaplusConfig.tema.colores) {
            if (attemptCount < MAX_ATTEMPTS) {
                attemptCount++;
                // Solo loguear cada 10 intentos para no saturar consola
                if (attemptCount % 10 === 1) {
                    console.warn('[Theme] Config no cargada aún, reintentando... (' + attemptCount + ')');
                }
                setTimeout(applyTheme, 50);
            } else {
                console.error('[Theme] Config no se pudo cargar después de múltiples intentos');
            }
            return;
        }

        if (!isCustomThemeEnabled()) {
            clearThemeVars();
            console.log('[Theme] Tema personalizado inactivo; se conservan colores base del sitio');
            return;
        }

        const colores = window.rifaplusConfig.tema.colores;
        const root = document.documentElement;

        console.log('[Theme] Aplicando colores:', colores);

        // Función para convertir hex a RGB
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        // Aplicar cada color como variable CSS
        Object.entries(colores).forEach(([key, value]) => {
            // Convertir camelCase a kebab-case para CSS
            const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.setProperty(cssVar, value);
            console.log(`[Theme] ${cssVar} = ${value}`);

            // También crear versiones RGBA con diferentes opacidades
            const rgb = hexToRgb(value);
            if (rgb) {
                root.style.setProperty(`${cssVar}-rgb`, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
                
                // Crear variantes de opacidad comunes
                root.style.setProperty(`${cssVar}-06`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`);
                root.style.setProperty(`${cssVar}-08`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`);
                root.style.setProperty(`${cssVar}-10`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
                root.style.setProperty(`${cssVar}-15`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
                root.style.setProperty(`${cssVar}-20`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`);
                root.style.setProperty(`${cssVar}-25`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
                root.style.setProperty(`${cssVar}-30`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
                root.style.setProperty(`${cssVar}-35`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
                root.style.setProperty(`${cssVar}-40`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
                root.style.setProperty(`${cssVar}-50`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
            }
        });

        console.log('[Theme] ✓ Tema aplicado exitosamente');
    }

    // Intentar aplicar inmediatamente (si config ya está)
    setTimeout(applyTheme, 0);

    // También aplicar cuando el DOM esté completamente listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTheme);
    } else {
        applyTheme();
    }

    // Exportar función para cambiar tema dinámicamente
    window.cambiarTema = function(nuevosTemas) {
        if (!window.rifaplusConfig.tema.colores) {
            console.error('[Theme] Config no disponible');
            return;
        }

        window.rifaplusConfig.tema.personalizado = true;
        const colores = window.rifaplusConfig.tema.colores;
        
        // Mezclar nuevos colores con los existentes
        Object.assign(colores, nuevosTemas);
        
        // Reaplicar el tema
        applyTheme();
        console.log('[Theme] Tema actualizado dinámicamente');
    };
})();
