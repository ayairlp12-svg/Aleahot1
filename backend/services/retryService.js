/**
 * RetryService
 * 
 * Reintenta operaciones con backoff exponencial:
 * - 1er intento: inmediato
 * - 2do intento: espera 100-500ms aleatorio
 * - 3er intento: espera 500-1500ms aleatorio
 * - 4to intento: espera 1000-2000ms aleatorio
 * 
 * Beneficio: Muchas órdenes que fallan por timeout se recuperan
 */

class RetryService {
    constructor() {
        this.maxRetries = 3; // intentos totales = 4
        this.baseDelayMs = 100;
        this.maxDelayMs = 2000;
    }

    /**
     * Ejecutar función con reintentos automáticos
     * 
     * @param {Function} fn - Función a ejecutar
     * @param {string} name - Nombre para logging
     * @param {number} maxRetries - Máximo de reintentos (default: 3)
     * @returns {Promise} - Resultado de fn
     */
    async execute(fn, name = 'operation', maxRetries = null) {
        const retries = maxRetries ?? this.maxRetries;
        let lastError = null;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = this.calculateDelay(attempt);
                    console.log(`🔄 [Retry] ${name} - Intento ${attempt + 1}/${retries + 1}, esperando ${delay}ms...`);
                    await this.sleep(delay);
                }

                const result = await fn();
                
                if (attempt > 0) {
                    console.log(`✅ [Retry] ${name} - Éxito en intento ${attempt + 1}`);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️  [Retry] ${name} - Intento ${attempt + 1} falló:`, error.message);
                
                if (attempt === retries) {
                    console.error(`❌ [Retry] ${name} - Todos los ${retries + 1} intentos fallaron`);
                    throw lastError;
                }
            }
        }

        throw lastError;
    }

    /**
     * Calcular delay con backoff exponencial + jitter
     * 
     * Intento 1: 100-500ms
     * Intento 2: 500-1500ms
     * Intento 3: 1000-2000ms
     */
    calculateDelay(attempt) {
        const exponentialDelay = Math.min(
            this.baseDelayMs * Math.pow(2, attempt),
            this.maxDelayMs
        );
        
        // Agregar jitter aleatorio (±30%)
        const jitter = exponentialDelay * 0.3;
        const randomDelay = exponentialDelay - jitter + Math.random() * (jitter * 2);
        
        return Math.round(Math.max(100, randomDelay));
    }

    /**
     * Sleep promisificado
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Ejecutar múltiples operaciones con retry
     */
    async executeParallel(operations) {
        return Promise.all(
            operations.map((op, idx) =>
                this.execute(op.fn, `${op.name} [${idx + 1}/${operations.length}]`)
            )
        );
    }
}

module.exports = new RetryService();
