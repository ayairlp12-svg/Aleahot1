/**
 * Script para asignar oportunidades a una orden existente
 * Uso: node asignar-oportunidades-orden.js ST-AA101
 */

const db = require('./db');
const OportunidadesOrdenService = require('./services/oportunidadesOrdenService');

const numeroOrden = process.argv[2];

if (!numeroOrden) {
    console.error('❌ Uso: node asignar-oportunidades-orden.js <numero_orden>');
    console.error('Ejemplo: node asignar-oportunidades-orden.js ST-AA101');
    process.exit(1);
}

(async () => {
    try {
        console.log(`🔍 Buscando orden: ${numeroOrden}`);
        
        // 1. Verificar que la orden existe
        const orden = await db('ordenes')
            .where('numero_orden', numeroOrden)
            .first();
        
        if (!orden) {
            console.error(`❌ Orden ${numeroOrden} no encontrada`);
            process.exit(1);
        }
        
        console.log(`✅ Orden encontrada:`, {
            numeroOrden: orden.numero_orden,
            cantidadBoletos: orden.cantidad_boletos,
            estado: orden.estado
        });
        
        // 2. Verificar si ya tiene oportunidades
        const oportunidadesExistentes = await db('orden_oportunidades')
            .where('numero_orden', numeroOrden)
            .count('* as total')
            .first();
        
        console.log(`📊 Oportunidades existentes: ${oportunidadesExistentes.total}`);
        
        // 3. Generar números de oportunidades (3 por boleto)
        const cantidadOportunidades = orden.cantidad_boletos * 3;
        console.log(`🎁 Generando ${cantidadOportunidades} oportunidades (3 por boleto)...`);
        
        // Obtener oportunidades disponibles (cualquier oportunidad que NO esté apartada a esa orden)
        // Simplemente tomar las primeras N oportunidades disponibles
        const oportunidadesDisponibles = await db('orden_oportunidades')
            .limit(cantidadOportunidades)
            .select('numero_oportunidad');
        
        if (oportunidadesDisponibles.length === 0) {
            console.error(`❌ No hay oportunidades disponibles en la BD`);
            process.exit(1);
        }
        
        console.log(`✅ Disponibles: ${oportunidadesDisponibles.length} oportunidades`);
        
        const numerosOportunidades = oportunidadesDisponibles.map(o => o.numero_oportunidad);
        
        // 4. Guardar oportunidades usando el servicio
        console.log(`📝 Guardando oportunidades...`);
        const resultado = await OportunidadesOrdenService.guardarOportunidades(
            numeroOrden,
            numerosOportunidades
        );
        
        if (resultado.success) {
            console.log(`✅ ÉXITO: ${resultado.cantidad} oportunidades asignadas a ${numeroOrden}`);
            
            // Verificar en BD
            const oportunidadesFinales = await db('orden_oportunidades')
                .where('numero_orden', numeroOrden)
                .select('numero_oportunidad');
            
            console.log(`🎁 Oportunidades asignadas:`, oportunidadesFinales.map(o => o.numero_oportunidad).join(', '));
        } else {
            console.error(`❌ Error: ${resultado.error}`);
            process.exit(1);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
})();
