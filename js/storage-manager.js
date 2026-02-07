/**
 * ============================================================
 * ARCHIVO: js/storage-manager.js
 * DESCRIPCIÓN: Gestor robusto de almacenamiento con fallback
 * Maneja localStorage con try-catch y fallback a memoria
 * NUNCA falla - siempre tiene un plan B
 * ============================================================
 */

/**
 * 🛡️ ALMACENAMIENTO ROBUSTO CON FALLBACK
 * 
 * Estrategia:
 * 1. Intenta guardar en localStorage
 * 2. Si falla QuotaExceeded → fallback a memoria
 * 3. Si falla por otra razón → log pero continúa
 * 4. Siempre retorna true/false para indicar éxito
 * 
 * Lectors NO cambian - localStorage.getItem() sigue funcionando normalmente
 */

// Almacenamiento en memoria como fallback
window.StorageMemoryFallback = window.StorageMemoryFallback || {};

/**
 * Guarda datos en localStorage con fallback a memoria
 * @param {string} key - Clave de almacenamiento
 * @param {string} value - Valor (ya serializado)
 * @returns {boolean} true si se guardó, false si tuvo que usar fallback
 */
function safeTrySetItem(key, value) {
    try {
        localStorage.setItem(key, value);
        console.debug(`✅ [Storage] Guardado en localStorage: ${key} (${(value.length / 1024).toFixed(2)}KB)`);
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.warn(`⚠️  [Storage] localStorage LLENO para clave '${key}' (${(value.length / 1024).toFixed(2)}KB), usando memoria`);
            // Guardar en memoria como fallback
            window.StorageMemoryFallback[key] = value;
            return false;
        } else {
            console.error(`❌ [Storage] Error insertando '${key}':`, error.message);
            // Intentar fallback a memoria de todas formas
            window.StorageMemoryFallback[key] = value;
            return false;
        }
    }
}

/**
 * Lee datos de localStorage o memoria
 * @param {string} key - Clave de almacenamiento
 * @returns {string|null} Valor o null
 */
function safeTryGetItem(key) {
    try {
        // PRIMERO intentar localStorage (donde debería estar)
        const value = localStorage.getItem(key);
        if (value !== null) {
            return value;
        }
        
        // FALLBACK a memoria si no está en localStorage
        if (window.StorageMemoryFallback[key]) {
            console.debug(`📦 [Storage] Leyendo fallback de memoria: ${key}`);
            return window.StorageMemoryFallback[key];
        }
        
        return null;
    } catch (error) {
        console.warn(`⚠️  [Storage] Error leyendo '${key}':`, error.message);
        // Intentar fallback a memoria como último recurso
        return window.StorageMemoryFallback[key] || null;
    }
}

/**
 * Elimina datos de localStorage y memoria
 * @param {string} key - Clave de almacenamiento
 */
function safeTryRemoveItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn(`⚠️  [Storage] Error removiendo '${key}':`, error.message);
    }
    // Siempre remover de fallback también
    delete window.StorageMemoryFallback[key];
}

/**
 * Limpia localStorage de forma segura
 * IMPORTANTE: Solo limpia claves de RifaPlus, NO todo localStorage
 */
function safeCleanupRifaPlusStorage() {
    const keysToClean = [
        'rifaplusSelectedNumbers',
        'rifaplus_cliente',
        'rifaplus_boletos',
        'rifaplus_total',
        'rifaplus_orden_actual',
        'rifaplus_oportunidades',
        'rifaplus_orden_confirmada',
        'rifaplus_orden_url',
        'rifaplus_orden_final',
        'rifaplusOrdenEnviada',
        'rifaplusFiltroDisponibles',
        'rifaplusIniciarFlujoPago',
        'rifaplus_config_actual_v2'
    ];
    
    let cleaned = 0;
    for (const key of keysToClean) {
        try {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                cleaned++;
            }
        } catch (e) {
            console.debug(`Could not clean ${key}`);
        }
    }
    
    console.log(`🧹 [Storage] Limpiadas ${cleaned} claves de RifaPlus en localStorage`);
}

/**
 * Retorna estado del almacenamiento
 */
function getStorageStatus() {
    let totalSize = 0;
    try {
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
    } catch (e) {
        console.warn('Error calculando tamaño:', e.message);
    }
    
    return {
        localStorage_size_kb: (totalSize / 1024).toFixed(2),
        fallback_items: Object.keys(window.StorageMemoryFallback).length,
        fallback_size_kb: (Object.values(window.StorageMemoryFallback).reduce((sum, v) => sum + (v?.length || 0), 0) / 1024).toFixed(2)
    };
}

console.log('✅ [Storage] StorageManager inicializado - localStorage con fallback a memoria');
