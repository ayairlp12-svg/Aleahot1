/**
 * ============================================================
 * ARCHIVO: backend/cache-manager.js
 * DESCRIPCIÓN: Caché en memoria para queries costosas
 * 
 * Características:
 * - Caché simple sin dependencias externas
 * - TTL configurable por tipo de dato
 * - Auto-refresco en background
 * - Invalidación manual si es necesario
 * ============================================================
 */

class CacheManager {
  constructor() {
    this.cache = {};
    this.timers = {};
    this.ttls = {
      'boleto-stats': 5000,      // 5 segundos para stats
      'sorteo-info': 60000,       // 60 segundos para info
      'health': 10000             // 10 segundos para health
    };
  }

  /**
   * Obtener valor del caché
   * @param {string} key - Clave del caché
   * @returns {any} Valor o null si expiró
   */
  get(key) {
    const entry = this.cache[key];
    
    if (!entry) {
      return null;
    }

    // Verificar si expiró
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Guardar valor en caché
   * @param {string} key - Clave
   * @param {any} value - Valor a cachear
   * @param {number} ttl - Time to live en ms (opcional, usa default)
   */
  set(key, value, ttl) {
    // Limpiar timer anterior si existe
    if (this.timers[key]) {
      clearTimeout(this.timers[key]);
    }

    // Usar TTL específico o default por tipo
    const finalTTL = ttl || this.ttls[key] || 5000;
    const expiresAt = Date.now() + finalTTL;

    // Guardar en caché
    this.cache[key] = {
      value,
      expiresAt,
      savedAt: Date.now()
    };

    // Auto-limpiar cuando expire
    this.timers[key] = setTimeout(() => {
      delete this.cache[key];
      delete this.timers[key];
    }, finalTTL);

    return true;
  }

  /**
   * Eliminar entrada del caché
   */
  delete(key) {
    if (this.timers[key]) {
      clearTimeout(this.timers[key]);
    }
    delete this.cache[key];
    delete this.timers[key];
    return true;
  }

  /**
   * Limpiar todo el caché
   */
  clear() {
    for (const key in this.timers) {
      clearTimeout(this.timers[key]);
    }
    this.cache = {};
    this.timers = {};
    return true;
  }

  /**
   * Obtener o ejecutar función
   * Si existe en caché, retorna el valor cacheado
   * Si no existe, ejecuta la función y cachea el resultado
   */
  async getOrSet(key, fn, ttl) {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    // Ejecutar función
    const result = await fn();
    
    // Cachear resultado
    this.set(key, result, ttl);
    
    return result;
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    const keys = Object.keys(this.cache);
    return {
      size: keys.length,
      keys: keys,
      memory: keys.reduce((sum, k) => {
        return sum + JSON.stringify(this.cache[k]).length;
      }, 0)
    };
  }
}

// Singleton
let instance = null;

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new CacheManager();
    }
    return instance;
  },

  CacheManager
};
