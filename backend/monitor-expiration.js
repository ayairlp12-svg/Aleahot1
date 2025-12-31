#!/usr/bin/env node

/**
 * Monitor de Servicio de Expiración de Órdenes
 * 
 * Uso: node backend/monitor-expiration.js
 * 
 * Verifica:
 * 1. Si el servicio está corriendo
 * 2. Órdenes pendientes próximas a expirar
 * 3. Última limpieza ejecutada
 * 4. Estadísticas del sistema
 */

const http = require('http');
const db = require('./db');

const SERVIDOR = 'http://localhost:5001';

// Colores para terminal
const COLORES = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    verde: '\x1b[32m',
    rojo: '\x1b[31m',
    amarillo: '\x1b[33m',
    azul: '\x1b[36m',
    gris: '\x1b[90m'
};

function log(mensaje, color = 'reset') {
    console.log(COLORES[color] + mensaje + COLORES.reset);
}

function hacerRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let datos = '';
            res.on('data', chunk => datos += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(datos));
                } catch (e) {
                    reject(new Error(`Respuesta inválida de ${url}`));
                }
            });
        }).on('error', reject);
    });
}

async function verificarServicio() {
    console.clear();
    
    log('╔═════════════════════════════════════════════════════════════╗', 'azul');
    log('║  📊 MONITOR DE SERVICIO DE EXPIRACIÓN DE ÓRDENES            ║', 'azul');
    log('╚═════════════════════════════════════════════════════════════╝', 'azul');
    
    const ahora = new Date();
    log(`\n⏰ ${ahora.toLocaleString()}\n`, 'gris');

    try {
        // 1. Estado del servicio
        log('1️⃣  ESTADO DEL SERVICIO', 'bright');
        log('─'.repeat(60));
        
        let estado;
        try {
            estado = await hacerRequest(SERVIDOR + '/api/admin/expiration-status');
        } catch (e) {
            log(`❌ No se pudo conectar a ${SERVIDOR}`, 'rojo');
            log(`   Asegúrate de que el servidor está corriendo: npm start`, 'amarillo');
            process.exit(1);
        }

        const activo = estado.activo ? '✅ SÍ' : '❌ NO';
        const ejecutando = estado.ejecutando ? '🔄 SÍ (limpieza en progreso)' : '✅ NO (listo)';
        
        log(`  Estado: ${activo}`, estado.activo ? 'verde' : 'rojo');
        log(`  Ejecutando: ${ejecutando}`, estado.ejecutando ? 'amarillo' : 'verde');
        log(`  Tiempo apartado: ${estado.tiempoApartado}`);
        log(`  Intervalo limpieza: ${estado.intervalo}`);

        // 2. Estadísticas
        log('\n2️⃣  ESTADÍSTICAS DE EXPIRACIÓN', 'bright');
        log('─'.repeat(60));

        const stats = estado.estadisticas;
        log(`  Total ejecuciones: ${stats.totalEjecuciones}`, 'verde');
        log(`  Órdenes canceladas: ${stats.ordenesLiberadas}`);
        log(`  Boletos liberados: ${stats.boletosTotalesLiberados}`);
        
        if (stats.ultimaEjecucion) {
            const ultima = new Date(stats.ultimaEjecucion);
            const minutos = Math.round((ahora - ultima) / 1000 / 60);
            log(`  Última ejecución: hace ${minutos} minutos (${ultima.toLocaleTimeString()})`);
        }
        
        if (stats.proximaEjecucion) {
            const proxima = new Date(stats.proximaEjecucion);
            const segundos = Math.round((proxima - ahora) / 1000);
            log(`  Próxima ejecución: en ${segundos}s (${proxima.toLocaleTimeString()})`);
        }

        if (stats.ultimoError) {
            log(`  ⚠️  Último error: ${stats.ultimoError.mensaje || stats.ultimoError}`, 'amarillo');
        }

        // 3. Órdenes en el sistema
        log('\n3️⃣  ÓRDENES EN EL SISTEMA', 'bright');
        log('─'.repeat(60));

        let sistemaStats;
        try {
            sistemaStats = await hacerRequest(SERVIDOR + '/api/admin/expiration-stats');
        } catch (e) {
            log(`⚠️  No se pudo cargar estadísticas de órdenes`, 'amarillo');
            sistemaStats = null;
        }

        if (sistemaStats) {
            log(`  Pendientes (sin pago): ${sistemaStats.total_pendientes}`, 'amarillo');
            log(`  Confirmadas (pagadas): ${sistemaStats.total_confirmadas}`, 'verde');
            log(`  Canceladas (expiradas): ${sistemaStats.total_canceladas}`);
            log(`  Comprobante recibido: ${sistemaStats.total_comprobante_recibido}`, 'azul');
            log(`  Boletos apartados sin pago: ${sistemaStats.boletos_apartados_sin_pago}`);
            log(`  Órdenes próximas a expirar (<1h): ${sistemaStats.ordenes_proximas_expirar}`, 'rojo');

            log(`\n  Límite de expiración: ${sistemaStats.detalles.limiteExpiracion}`);
        }

        // 4. Órdenes próximas a expirar
        log('\n4️⃣  ÓRDENES PRÓXIMAS A EXPIRAR', 'bright');
        log('─'.repeat(60));

        try {
            const ordenesProximas = await db('ordenes')
                .where('estado', 'pendiente')
                .select('numero_orden', 'created_at', 'email_cliente')
                .orderBy('created_at', 'asc')
                .limit(5);

            if (ordenesProximas.length === 0) {
                log('  ✅ No hay órdenes pendientes en el sistema', 'verde');
            } else {
                const tiempoApartado = estado.tiempoApartado.match(/\d+/)[0]; // Extrae horas
                const tiempoMs = tiempoApartado * 60 * 60 * 1000;
                
                for (const orden of ordenesProximas) {
                    const creada = new Date(orden.created_at);
                    const edad = ahora - creada;
                    const edadHoras = edad / (1000 * 60 * 60);
                    const horasRestantes = tiempoApartado - edadHoras;
                    
                    const color = horasRestantes < 1 ? 'rojo' : (horasRestantes < 2 ? 'amarillo' : 'gris');
                    log(`  ${orden.numero_orden} (${orden.email_cliente}):`, color);
                    log(`    ⏳ ${edadHoras.toFixed(2)}h de ${tiempoApartado}h (${horasRestantes.toFixed(2)}h restantes)`);
                }
            }
        } catch (dbError) {
            log(`  ⚠️  Error consultando órdenes: ${dbError.message}`, 'amarillo');
        }

        // 5. Configuración
        log('\n5️⃣  CONFIGURACIÓN (from config.js)', 'bright');
        log('─'.repeat(60));

        try {
            const configLoader = require('./config-loader');
            const config = configLoader.obtenerConfigExpiracion();
            
            log(`  Tiempo apartado: ${config.tiempoApartadoHoras} horas`);
            log(`  Intervalo limpieza: ${config.intervaloLimpiezaMinutos} minutos`);
            log(`  Fuente: config.js o variables de entorno`, 'verde');
        } catch (e) {
            log(`  ⚠️  Error cargando configuración`, 'amarillo');
        }

        log('\n' + '═'.repeat(60), 'azul');
        log('✅ Sistema operativo y monitorizado', 'verde');
        log('═'.repeat(60), 'azul');

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'rojo');
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

// Ejecutar
verificarServicio();

// Modo watch (refrescar cada 10 segundos)
if (process.argv.includes('--watch')) {
    setInterval(verificarServicio, 10000);
}
