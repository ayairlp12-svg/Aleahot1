/**
 * ============================================================
 * Configuración de Cloudinary para almacenamiento de comprobantes
 * ============================================================
 * 
 * Variables requeridas en .env:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 * 
 * Signup gratis: https://cloudinary.com/users/register/free
 */

const cloudinary = require('cloudinary').v2;

// Validar que las variables de entorno existan
const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
    console.warn('⚠️ Cloudinary no completamente configurado:');
    missingVars.forEach(v => console.warn(`   - ${v} no definida`));
    console.warn('\nPara usar Cloudinary:');
    console.warn('1. Signup gratis en: https://cloudinary.com/users/register/free');
    console.warn('2. Obtén tus credenciales del Dashboard');
    console.warn('3. Agrega a .env:');
    console.warn('   CLOUDINARY_CLOUD_NAME=tu-cloud-name');
    console.warn('   CLOUDINARY_API_KEY=tu-api-key');
    console.warn('   CLOUDINARY_API_SECRET=tu-api-secret');
} else {
    // Configurar Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('✅ Cloudinary configurado correctamente');
    console.log(`   Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
}

module.exports = cloudinary;
