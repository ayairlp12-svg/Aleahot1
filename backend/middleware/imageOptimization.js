/**
 * Middleware de optimización de imágenes on-demand
 * Comprime imágenes automáticamente cuando se solicitan
 */

const fs = require('fs');
const path = require('path');

let imagemin, imageminJpegtran, imageminPngquant;

// Intentar cargar imagemin
try {
  imagemin = require('imagemin');
  imageminJpegtran = require('imagemin-jpegtran');
  imageminPngquant = require('imagemin-pngquant');
} catch (e) {
  console.warn('⚠️  imagemin no disponible, imágenes se servirán sin compresión');
  imagemin = null;
}

/**
 * Middleware para servir y optimizar imágenes automáticamente
 * Uso: app.use('/images', imageOptimizationMiddleware);
 */
function imageOptimizationMiddleware(req, res, next) {
  // Si no tenemos imagemin disponible, solo servir la imagen
  if (!imagemin) {
    return next();
  }

  const imageName = req.path.substring(1); // Remover / del inicio
  const originalPath = path.join(__dirname, '..', 'images', imageName);
  const optimizedDir = path.join(__dirname, '..', 'public', 'build', 'img');
  const optimizedPath = path.join(optimizedDir, imageName);

  // Verificar si el archivo original existe
  if (!fs.existsSync(originalPath)) {
    return next();
  }

  // Si ya existe versión optimizada, servirla
  if (fs.existsSync(optimizedPath)) {
    // Comparar tiempos de modificación
    const originalStats = fs.statSync(originalPath);
    const optimizedStats = fs.statSync(optimizedPath);
    
    if (originalStats.mtime <= optimizedStats.mtime) {
      console.log(`📦 Imagen optimizada en caché: ${imageName}`);
      return res.sendFile(optimizedPath);
    }
  }

  // Crear versión optimizada on-demand
  console.log(`🖼️  Optimizando imagen on-demand: ${imageName}`);
  
  const ext = path.extname(imageName).toLowerCase();
  
  // Crear directorio si no existe
  const imageDir = path.dirname(optimizedPath);
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  // Optimizar según el tipo de archivo
  (async () => {
    try {
      if (ext === '.jpg' || ext === '.jpeg') {
        // Optimizar JPEG
        const files = await imagemin([originalPath], {
          destination: imageDir,
          plugins: [
            imageminJpegtran({ progressive: true, quality: 80 })
          ]
        });
        
        if (files.length > 0) {
          console.log(`✅ JPEG optimizado: ${imageName}`);
          return res.sendFile(optimizedPath);
        }
      } else if (ext === '.png') {
        // Optimizar PNG
        const files = await imagemin([originalPath], {
          destination: imageDir,
          plugins: [
            imageminPngquant({ quality: [0.6, 0.8] })
          ]
        });
        
        if (files.length > 0) {
          console.log(`✅ PNG optimizado: ${imageName}`);
          return res.sendFile(optimizedPath);
        }
      }
      
      // Si la optimización no funcionó, servir original
      console.log(`⚠️  No se pudo optimizar, sirviendo original: ${imageName}`);
      res.sendFile(originalPath);
    } catch (error) {
      console.error(`❌ Error optimizando ${imageName}:`, error.message);
      // Servir original en caso de error
      res.sendFile(originalPath);
    }
  })();
}

module.exports = imageOptimizationMiddleware;
