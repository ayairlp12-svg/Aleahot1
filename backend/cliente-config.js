/**
 * ============================================================
 * ARCHIVO: backend/cliente-config.js
 * DESCRIPCIÓN: Configuración MÍNIMA del servidor
 * 
 * ⚠️  IMPORTANTE:
 * - Las configuraciones principales (cliente, rifa, cuentas, etc.)
 *   se definen en js/config.js del FRONTEND
 * - Este archivo solo contiene datos específicos del servidor
 * - NO DUPLICAR datos de js/config.js aquí
 * ============================================================
 */

module.exports = {
  /* ============================================================ */
  /* SECCIÓN 1: INFORMACIÓN BÁSICA DEL CLIENTE                   */
  /* NOTA: Datos principales en js/config.js (frontend)          */
  /* ============================================================ */
  
  cliente: {
    id: "sorteos_yepe",
    nombre: "SORTEOS YEPE",
    email: "ayairlp12@gmail.com",
    telefono: "459 115 3960"
  },

  /* ============================================================ */
  /* SECCIÓN 2: INFORMACIÓN DEL SORTEO (mínima)                 */
  /* NOTA: Fechas y detalles en js/config.js (frontend)          */
  /* ============================================================ */
  
  rifa: {
    nombre_sorteo: "iPhone 15 Pro Max",
    totalBoletos: 100000,
    precioBoleto: 50,
    tiempoApartadoHoras: 4,
    advertenciaExpirationHoras: 1,
    intervaloLimpiezaMinutos: 5
  },

  /* ============================================================ */
  /* SECCIÓN 3: CONFIGURACIÓN DEL SERVIDOR                       */
  /* Específico para operación del backend                        */
  /* ============================================================ */
  
  servidor: {
    puerto: process.env.PORT || 5001,
    ambiente: process.env.NODE_ENV || 'development',
    database: {
      type: process.env.DB_TYPE || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      puerto: process.env.DB_PORT || 5432
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      expiresIn: '24h'
    }
  },

  /* ============================================================ */
  /* METADATA (No editar)                                         */
  /* ============================================================ */
  
  meta: {
    createdAt: new Date().toISOString(),
    version: "2.0.0",
    nota: "Configuración simplificada - datos principales en js/config.js"
  }
};
