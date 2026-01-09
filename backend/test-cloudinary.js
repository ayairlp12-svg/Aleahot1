#!/usr/bin/env node

/**
 * Script para probar la integración de Cloudinary
 * 
 * Uso:
 *   node test-cloudinary.js
 * 
 * Requiere:
 *   - Archivo .env configurado con credenciales de Cloudinary
 *   - Archivo de prueba (test-comprobante.jpg o similar)
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

console.log('🧪 Test de Cloudinary Integration\n');

// 1. Verificar variables de entorno
console.log('1️⃣ Verificando configuración...');
const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
let configOK = true;

requiredVars.forEach(v => {
    const exists = !!process.env[v];
    console.log(`   ${exists ? '✅' : '❌'} ${v}: ${exists ? 'OK' : 'FALTA'}`);
    if (!exists) configOK = false;
});

if (!configOK) {
    console.error('\n❌ Error: Falta configurar variables en .env');
    console.error('Ver CLOUDINARY_SETUP.md para instrucciones');
    process.exit(1);
}

// 2. Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('✅ Cloudinary configurado\n');

// 3. Probar credenciales
console.log('2️⃣ Probando credenciales...');

cloudinary.api.ping((error, result) => {
    if (error) {
        console.error('❌ Error al conectar con Cloudinary:');
        console.error(error.message);
        console.error('\nVerifica que tus credenciales sean correctas en .env');
        process.exit(1);
    }
    
    console.log('✅ Credenciales válidas\n');
    
    // 4. Test de upload
    console.log('3️⃣ Test de upload:');
    
    // Crear imagen de prueba (1x1 pixel PNG)
    const testFile = path.join(__dirname, 'test-comprobante.png');
    const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
        0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
        0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testFile, pngBuffer);
    
    // Subir archivo de prueba
    cloudinary.uploader.upload(testFile, {
        folder: 'rifas-comprobantes',
        public_id: `test_${Date.now()}`,
        tags: ['test', 'rifaplus']
    }, (error, result) => {
        if (error) {
            console.error('❌ Error al subir archivo:');
            console.error(error.message);
            process.exit(1);
        }
        
        console.log('✅ Upload exitoso');
        console.log(`   Archivo: ${result.public_id}`);
        console.log(`   URL: ${result.secure_url}`);
        console.log(`   Tamaño: ${result.bytes} bytes\n`);
        
        // 5. Verificar que el archivo está accesible
        console.log('4️⃣ Verificando acceso...');
        fetch(result.secure_url)
            .then(res => {
                if (res.ok) {
                    console.log('✅ Archivo accesible vía URL\n');
                } else {
                    console.warn(`⚠️ Status ${res.status} al acceder URL\n`);
                }
                
                // Limpiar: eliminar archivo de prueba
                cloudinary.uploader.destroy(result.public_id, (err) => {
                    if (err) {
                        console.warn('⚠️ No se pudo eliminar archivo de prueba');
                        console.warn('   (Eliminarlo manualmente en Cloudinary dashboard)');
                    } else {
                        console.log('🧹 Archivo de prueba eliminado\n');
                    }
                    
                    // Limpiar archivo local
                    try {
                        fs.unlinkSync(testFile);
                    } catch (e) {
                        // Ignorar
                    }
                    
                    console.log('✅ ¡Cloudinary está completamente funcional!\n');
                    console.log('Puedes proceder a:');
                    console.log('  1. Iniciar servidor: npm start');
                    console.log('  2. Subir comprobantes vía la aplicación');
                    console.log('  3. Ver archivos en: https://cloudinary.com (Dashboard → Media Library)');
                    process.exit(0);
                });
            })
            .catch(err => {
                console.error('❌ Error al acceder URL:', err.message);
                process.exit(1);
            });
    });
});
