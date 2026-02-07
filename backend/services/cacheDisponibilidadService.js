/**
 * CacheDisponibilidadService
 * 
 * Mantiene caché en memoria de:
 * - Total de oportunidades disponibles
 * - Total de boletos disponibles
 * - Se actualiza cuando se crean/liberan órdenes
 * 
 * Beneficio: Evita queries COUNT(*) costosas en cada request
 */

const db = require('../db');

class CacheDisponibilidadService {
    constructor() {
        this.disponibles = {
            oportunidades: 0,
            boletos: 0
        };
        this.lastUpdate = null;
        this.updateInProgress = false;
        this.ttl = 5000; // 5 segundos
    }

    /**
     * Obtener disponibles con caché
     * Si caché expiró (> 5s), recalcula
     */
    async obtenerDisponibles() {
        const ahora = Date.now();
        
        // Si caché es fresco, devolverlo
        if (this.lastUpdate && (ahora - this.lastUpdate) < this.ttl && !this.updateInProgress) {
            return {
                ...this.disponibles,
                fromCache: true,
                edad: ahora - this.lastUpdate
            };
        }

        // Si ya se está actualizando, devolver valor actual
        if (this.updateInProgress) {
            return {
                ...this.disponibles,
                fromCache: true,
                actualizando: true
            };
        }

        // Si caché expiró, actualizar en background
        if (this.lastUpdate && (ahora - this.lastUpdate) >= this.ttl) {
            this.actualizarEnBackground();
            return {
                ...this.disponibles,
                fromCache: true,
                edad: ahora - this.lastUpdate
            };
        }

        // Primera vez, esperar actualización
        return await this.actualizarAhora();
    }

    /**
     * Actualizar caché AHORA (bloqueante)
     */
    async actualizarAhora() {
        this.updateInProgress = true;
        try {
            const [opp, bol] = await Promise.all([
                db('orden_oportunidades')
                    .where('estado', 'disponible')
                    .whereNull('numero_orden')
                    .count('*', { as: 'total' })
                    .first(),
                db('boletos_estado')
                    .where('estado', 'disponible')
                    .whereNull('numero_orden')
                    .count('*', { as: 'total' })
                    .first()
            ]);

            this.disponibles = {
                oportunidades: parseInt(opp?.total || 0),
                boletos: parseInt(bol?.total || 0)
            };
            this.lastUpdate = Date.now();

            console.log(`♻️  [Cache] Actualizado: ${this.disponibles.oportunidades} opp, ${this.disponibles.boletos} boletos`);
            return {
                ...this.disponibles,
                fromCache: false
            };
        } finally {
            this.updateInProgress = false;
        }
    }

    /**
     * Actualizar en background (sin esperar)
     */
    actualizarEnBackground() {
        this.updateInProgress = true;
        
        Promise.all([
            db('orden_oportunidades')
                .where('estado', 'disponible')
                .whereNull('numero_orden')
                .count('*', { as: 'total' })
                .first(),
            db('boletos_estado')
                .where('estado', 'disponible')
                .whereNull('numero_orden')
                .count('*', { as: 'total' })
                .first()
        ])
        .then(([opp, bol]) => {
            this.disponibles = {
                oportunidades: parseInt(opp?.total || 0),
                boletos: parseInt(bol?.total || 0)
            };
            this.lastUpdate = Date.now();
            console.log(`♻️  [Cache] Actualizado (background): ${this.disponibles.oportunidades} opp, ${this.disponibles.boletos} boletos`);
        })
        .catch(err => {
            console.error('❌ [Cache] Error actualizando:', err.message);
        })
        .finally(() => {
            this.updateInProgress = false;
        });
    }

    /**
     * Invalidar caché (cuando se crean/liberan órdenes)
     */
    invalidar() {
        console.log('🗑️  [Cache] Invalidado');
        this.lastUpdate = null;
        this.actualizarEnBackground();
    }

    /**
     * Restar manualmente (cuando se crea una orden)
     * Más rápido que recalcular
     */
    restarOportunidades(cantidad = 1) {
        this.disponibles.oportunidades = Math.max(0, this.disponibles.oportunidades - cantidad);
    }

    restarBoletos(cantidad = 1) {
        this.disponibles.boletos = Math.max(0, this.disponibles.boletos - cantidad);
    }

    /**
     * Sumar manualmente (cuando se liberan órdenes)
     */
    sumarOportunidades(cantidad = 1) {
        this.disponibles.oportunidades += cantidad;
    }

    sumarBoletos(cantidad = 1) {
        this.disponibles.boletos += cantidad;
    }

    /**
     * Estado actual del caché
     */
    getStatus() {
        return {
            disponibles: this.disponibles,
            lastUpdate: this.lastUpdate,
            edad: this.lastUpdate ? Date.now() - this.lastUpdate : null,
            actualizando: this.updateInProgress,
            ttl: this.ttl
        };
    }
}

module.exports = new CacheDisponibilidadService();
