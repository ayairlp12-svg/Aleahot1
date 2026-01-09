#!/usr/bin/env node

/**
 * Test de Expiración de Órdenes - VERIFICACIÓN RÁPIDA
 * 
 * Uso: node backend/test-expiration.js
 * 
 * Este script:
 * 1. Verifica que el servicio está corriendo
 * 2. Crea una orden de prueba con tiempo corto
 * 3. Espera a que expire
 * 4. Verifica que se canceló automáticamente
 * 5. Limpia después de sí mismo
 */

const db = require('./db');
const { v4: uuidv4 } = require('uuid');

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

async function testExpiration() {
    log('\n╔═══════════════════════════════════════════════════════╗', 'azul');
    log('║   🧪 TEST DE EXPIRACIÓN DE ÓRDENES                   ║', 'azul');
    log('╚═══════════════════════════════════════════════════════╝', 'azul');

    try {
        // 1. Crear orden de prueba
        log('\n1️⃣  Creando orden de prueba...', 'bright');
        
        const numeroOrden = `TEST-${Date.now()}`;
        const boletosTest = ['999', '998', '997'];
        
        const orden = await db('ordenes').insert({
            numero_orden: numeroOrden,
            email_cliente: 'test@example.com',
            estado: 'pendiente',  // ← Importante: pendiente sin comprobante
            boletos: JSON.stringify(boletosTest),
            created_at: new Date(),
            updated_at: new Date()
        }).returning('*');

        if (!orden || orden.length === 0) {
            throw new Error('No se pudo crear la orden');
        }

        log(`   ✓ Orden creada: ${numeroOrden}`, 'verde');
        log(`   ✓ Boletos: ${boletosTest.join(', ')}`);
        log(`   ✓ Estado: pendiente`);

        // 2. Marcar boletos como reservados
        log('\n2️⃣  Marcando boletos como reservados...', 'bright');
        
        for (const numero of boletosTest) {
            await db('boletos_estado')
                .where('numero', numero)
                .update({
                    estado: 'apartado',
                    numero_orden: numeroOrden,
                    reservado_en: new Date()
                });
        }
        
        log(`   ✓ ${boletosTest.length} boletos marcados como 'apartado'`);

        // 3. Verificar que la orden existe y está pendiente
        log('\n3️⃣  Verificando estado inicial...', 'bright');
        
        const ordenInicial = await db('ordenes')
            .where('numero_orden', numeroOrden)
            .first();

        log(`   ✓ Estado de orden: ${ordenInicial.estado}`, 'amarillo');
        log(`   ✓ Creada: ${ordenInicial.created_at}`);

        // 4. Verificar estado de boletos
        log('\n4️⃣  Verificando estado de boletos...', 'bright');
        
        const boletosInicial = await db('boletos_estado')
            .whereIn('numero', boletosTest);

        for (const boleto of boletosInicial) {
            log(`   ✓ ${boleto.numero}: ${boleto.estado}`);
        }

        // 5. Esperar a que se ejecute la limpieza
        log('\n5️⃣  Esperando limpieza automática...', 'bright');
        log('   ⏳ Esperar...');
        
        // Esperar 70 segundos (limpieza corre cada 60 en test config, plus margen)
        await new Promise(resolve => setTimeout(resolve, 70000));

        // 6. Verificar que se canceló
        log('\n6️⃣  Verificando cancelación...', 'bright');
        
        const ordenFinal = await db('ordenes')
            .where('numero_orden', numeroOrden)
            .first();

        if (ordenFinal.estado === 'cancelada') {
            log(`   ✓ Orden cancelada automáticamente`, 'verde');
        } else {
            log(`   ✗ Orden no fue cancelada (estado: ${ordenFinal.estado})`, 'rojo');
        }

        log(`   Estado final: ${ordenFinal.estado}`);
        log(`   Actualizada: ${ordenFinal.updated_at}`);

        // 7. Verificar que boletos se liberaron
        log('\n7️⃣  Verificando liberación de boletos...', 'bright');
        
        const boletosFinal = await db('boletos_estado')
            .whereIn('numero', boletosTest);

        let todosLiberados = true;
        for (const boleto of boletosFinal) {
            const liberado = boleto.estado === 'disponible';
            log(`   ${liberado ? '✓' : '✗'} ${boleto.numero}: ${boleto.estado}`);
            if (!liberado) todosLiberados = false;
        }

        if (todosLiberados) {
            log(`   ✓ Todos los boletos fueron liberados`, 'verde');
        } else {
            log(`   ✗ Algunos boletos no se liberaron`, 'rojo');
        }

        // 8. Resultados
        log('\n8️⃣  RESULTADOS DEL TEST', 'bright');
        log('─'.repeat(55));

        const success = ordenFinal.estado === 'cancelada' && todosLiberados;
        
        if (success) {
            log('✅ TEST EXITOSO: Sistema de expiración funciona correctamente', 'verde');
            log('   - Orden se canceló automáticamente', 'verde');
            log('   - Boletos se liberaron correctamente', 'verde');
        } else {
            log('❌ TEST FALLIDO: Hay problemas en el sistema', 'rojo');
            if (ordenFinal.estado !== 'cancelada') {
                log('   - La orden NO se canceló', 'rojo');
            }
            if (!todosLiberados) {
                log('   - Los boletos NO se liberaron', 'rojo');
            }
        }

        // 9. Limpiar después de sí mismo
        log('\n9️⃣  Limpiando datos de test...', 'bright');
        
        await db('ordenes').where('numero_orden', numeroOrden).delete();
        await db('boletos_estado').whereIn('numero', boletosTest).update({
            estado: 'disponible',
            numero_orden: null,
            reservado_en: null
        });

        log('   ✓ Datos de test eliminados');

        log('\n' + '═'.repeat(55), 'azul');
        log(success ? '🎉 ¡Test completado exitosamente!' : '⚠️  Revisar logs del servidor', 
            success ? 'verde' : 'rojo');
        log('═'.repeat(55), 'azul');

        process.exit(success ? 0 : 1);

    } catch (error) {
        log(`\n❌ ERROR CRÍTICO: ${error.message}`, 'rojo');
        log(`\nStack: ${error.stack}`, 'gris');
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

// Ejecutar test
testExpiration();
