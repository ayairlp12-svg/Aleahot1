/**
 * Config Loader - Carga configuración de js/config.js hacia Node.js
 * 
 * Permite que el backend lea la misma configuración del cliente (config.js)
 * Prioridad:
 * 1. Variables de entorno (.env)
 * 2. Archivo config.js 
 * 3. Valores por defecto
 */

const fs = require('fs');
const path = require('path');

/**
 * Carga la configuración extrayendo la sección 'rifa' de config.js
 * Usa regex para evitar ejecutar todo el código
 */
function cargarConfigJavaScript() {
    try {
        const configPath = path.join(__dirname, '..', 'js', 'config.js');
        const codigo = fs.readFileSync(configPath, 'utf8');
        
        // Buscar la sección rifa: { ... }
        const rifaMatch = codigo.match(/rifa:\s*\{([\s\S]*?)\n\s*\},/);
        if (!rifaMatch) {
            throw new Error('No se encontró la sección "rifa" en config.js');
        }
        
        const rifaContent = rifaMatch[1];
        
        // Extraer valores específicos con regex
        const extraerValor = (nombre) => {
            // Buscar: nombreVariable: valor,
            const regex = new RegExp(`${nombre}:\\s*([^,\n]+)`, 'i');
            const match = rifaContent.match(regex);
            if (!match) return null;
            
            const valor = match[1].trim();
            
            // Si es un número (entero o decimal), parsearlo
            if (!isNaN(valor) && valor !== '') {
                return parseFloat(valor);  // ✅ Cambio: parseFloat en vez de parseInt para soportar decimales
            }
            
            // Si es string entre comillas
            if (valor.startsWith("'") || valor.startsWith('"')) {
                return valor.slice(1, -1);
            }
            
            return valor;
        };
        
        return {
            tiempoApartadoHoras: extraerValor('tiempoApartadoHoras'),
            intervaloLimpiezaMinutos: extraerValor('intervaloLimpiezaMinutos'),
            advertenciaExpirationHoras: extraerValor('advertenciaExpirationHoras'),
            maxBoletosApartadosSinPago: extraerValor('maxBoletosApartadosSinPago'),
            precioBoleto: extraerValor('precioBoleto'),
            totalBoletos: extraerValor('totalBoletos')
        };
    } catch (error) {
        console.warn('⚠️  No se pudo cargar config.js:', error.message);
        return {};
    }
}

/**
 * Obtiene la configuración de expiración de órdenes y PRECIO
 * Prioridad: .env > config.js > defaults
 */
function obtenerConfigExpiracion() {
    const config = cargarConfigJavaScript();
    
    return {
        tiempoApartadoHoras: parseFloat(process.env.ORDEN_APARTADO_HORAS) 
            || config.tiempoApartadoHoras 
            || 4,  // ✅ Cambio: defecto 4 horas (no 12)
        
        intervaloLimpiezaMinutos: parseInt(process.env.ORDEN_LIMPIEZA_MINUTOS) 
            || config.intervaloLimpiezaMinutos 
            || 5,
        
        advertenciaExpirationHoras: config.advertenciaExpirationHoras || 1,
        
        maxBoletosApartadosSinPago: config.maxBoletosApartadosSinPago || null,
        
        // NUEVA: Precio del boleto dinámico desde config.js
        precioBoleto: parseInt(process.env.PRECIO_BOLETO) 
            || config.precioBoleto 
            || 15,
        
        // NUEVA: Total de boletos desde config.js
        totalBoletos: parseInt(process.env.TOTAL_BOLETOS)
            || config.totalBoletos
            || 1000000
    };
}

module.exports = {
    cargarConfigJavaScript,
    obtenerConfigExpiracion
};
