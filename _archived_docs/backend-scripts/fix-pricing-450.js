/**
 * Script para corregir órdenes con precios incorrectos
 * Lee el precio DINÁMICAMENTE desde config.js
 * Soluciona cualquier discrepancia entre totales almacenados y lo esperado
 */

// NO cargar server.js para evitar que intente escuchar el puerto
// Crear instancia de knex directamente con PostgreSQL
const knex = require('knex')({
    client: 'pg',
    connection: process.env.DATABASE_URL || {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'rifaplus_dev'
    }
});

// Cargar configuración dinámicamente
const { obtenerConfigExpiracion } = require('../config-loader');
const configExpiracion = obtenerConfigExpiracion();
const PRECIO_BOLETO = configExpiracion.precioBoleto || 15;

console.log(`💡 Precio dinámico cargado desde config.js: $${PRECIO_BOLETO}\n`);

// Función de cálculo de descuentos
function calcularDescuentoBackend(cantidad, precio) {
    // Promociones según config.js
    const promociones = [
        { cantidad: 50, descuento: 700 },
        { cantidad: 20, descuento: 200 },
        { cantidad: 10, descuento: 50 }
    ];
    
    for (const promo of promociones) {
        if (cantidad >= promo.cantidad) {
            return promo.descuento;
        }
    }
    return 0;
}

async function fixPricing() {
    console.log('🔧 Iniciando corrección de precios...\n');
    
    try {
        // 1. Obtener todas las órdenes
        const ordenes = await knex('ordenes').select('*');
        console.log(`📋 Total de órdenes en BD: ${ordenes.length}\n`);
        
        if (ordenes.length === 0) {
            console.log('✅ No hay órdenes para procesar');
            await knex.destroy();
            process.exit(0);
        }
        
        let ordenesCorregidas = 0;
        let listaOrdenes = [];
        
        // 2. Para cada orden, recalcular el total
        for (const orden of ordenes) {
            const cantidadBoletos = orden.cantidad_boletos || 0;
            const precioActual = parseFloat(orden.precio_unitario) || PRECIO_BOLETO;
            const totalActual = parseFloat(orden.total) || 0;
            
            // Recalcular con precio DINÁMICO desde config.js
            const precioCorrect = PRECIO_BOLETO;
            const subtotalCorrect = cantidadBoletos * precioCorrect;
            const descuentoCorrect = calcularDescuentoBackend(cantidadBoletos, precioCorrect);
            const totalCorrect = subtotalCorrect - descuentoCorrect;
            
            // Verificar si necesita corrección
            const necesitaCorreccion = Math.abs(totalActual - totalCorrect) > 0.01;
            
            if (necesitaCorreccion) {
                listaOrdenes.push({
                    numero_orden: orden.numero_orden,
                    cantidadBoletos,
                    precioActual,
                    totalActual,
                    precioCorrect,
                    totalCorrect,
                    cambio: (totalCorrect - totalActual).toFixed(2)
                });
                
                // Actualizar en BD
                await knex('ordenes')
                    .where('numero_orden', orden.numero_orden)
                    .update({
                        precio_unitario: precioCorrect,
                        subtotal: parseFloat(subtotalCorrect.toFixed(2)),
                        descuento: parseFloat(descuentoCorrect.toFixed(2)),
                        total: parseFloat(totalCorrect.toFixed(2))
                    });
                
                ordenesCorregidas++;
            }
        }
        
        // 3. Mostrar resultados
        if (ordenesCorregidas === 0) {
            console.log('✅ No se encontraron órdenes que necesitaran corrección\n');
        } else {
            console.log(`✅ Órdenes corregidas: ${ordenesCorregidas}\n`);
            console.log('📊 Detalle de correcciones:\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('ID ORDEN          | BOLETOS | PRECIO | TOTAL ANTES | TOTAL DESPUÉS | CAMBIO');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            listaOrdenes.forEach(o => {
                const idPadded = o.numero_orden.padEnd(17);
                const boletos = String(o.cantidadBoletos).padStart(7);
                const precio = `$${o.precioCorrect}`.padStart(6);
                const antes = `$${o.totalActual.toFixed(2)}`.padStart(11);
                const despues = `$${o.totalCorrect.toFixed(2)}`.padStart(13);
                const cambio = `${o.cambio > 0 ? '+' : ''}$${o.cambio}`.padStart(7);
                
                console.log(`${idPadded} | ${boletos} | ${precio} | ${antes} | ${despues} | ${cambio}`);
            });
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
            // Calcular totales
            const totalDineroRecuperado = listaOrdenes.reduce((sum, o) => sum + parseFloat(o.cambio), 0);
            console.log(`💰 Total de dinero recuperado: $${totalDineroRecuperado.toFixed(2)}`);
            console.log(`   (Diferencia entre lo cobrado mal y lo que se debe cobrar)\n`);
        }
        
        console.log('✅ Corrección completada exitosamente\n');
        await knex.destroy();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error durante la corrección:', error.message);
        console.error('\nStack:', error.stack);
        await knex.destroy();
        process.exit(1);
    }
}

// Ejecutar
fixPricing();
