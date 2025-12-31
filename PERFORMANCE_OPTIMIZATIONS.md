# Optimizaciones de Performance Implementadas

## Frontend (compra.html)

### 1. **Carga de Scripts**
- ✅ Todos los scripts con `defer` (excepto theme-loader que es crítico)
- ✅ Scripts se cargan al final del body para no bloquear render
- ✅ Performance Optimization module para lazy loading

### 2. **Carga de Estilos**
- ✅ CSS crítico inline en `<style>` tag
- ✅ Google Fonts con `preload` y `onload` callback
- ✅ Font Awesome con `preload` async
- ✅ Minificación de CSS crítico

### 3. **Optimizaciones de Red**
- ✅ `preconnect` a Google Fonts
- ✅ `preconnect` a CDN (cdnjs.cloudflare.com)
- ✅ `dns-prefetch` a servidor local
- ✅ Cache-Control: `public, max-age=3600`

### 4. **Optimizaciones de Render**
- ✅ `font-display: swap` para fuentes
- ✅ `-webkit-font-smoothing: antialiased` en body
- ✅ `contain: layout style paint` en header
- ✅ `will-change: transform` en modales
- ✅ `decoding: async` en imágenes

### 5. **Optimizaciones de Transiciones**
- ✅ Cambiar `transition: all` a propiedades específicas
- ✅ Botones: `background-color`, `border-color`, `transform` en 150ms
- ✅ Modales: `opacity`, `transform` en `will-change`

### 6. **Optimizaciones de CSS**
- ✅ Quitar transición global deprecated
- ✅ Aplicar `contain` en elementos contenedores
- ✅ Reducción de especificidad de selectores
- ✅ Media queries optimizadas

## Backend (server.js)

### 1. **Compression**
```javascript
const compression = require('compression');
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return /json|text|javascript|xml|css|svg/.test(
            res.getHeader('content-type')
        );
    }
}));
```

### 2. **Caching Headers**
```javascript
app.use((req, res, next) => {
    // Assets con hash: max-age alto
    if (req.url.match(/\.(js|css|png|jpg|gif|svg|woff2?)$/)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // HTML: no cache
    else if (req.url.endsWith('.html') || req.url === '/') {
        res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }
    // API: cache corto
    else if (req.url.startsWith('/api')) {
        res.set('Cache-Control', 'public, max-age=300');
    }
    next();
});
```

### 3. **Connection Pooling (PostgreSQL)**
```javascript
const { Pool } = require('pg');
const pool = new Pool({
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

### 4. **Response Caching (Redis)**
```javascript
const redis = require('redis');
const cacheClient = redis.createClient();

// Cachear endpoints específicos
app.get('/api/boletos', (req, res) => {
    const cacheKey = `boletos:${req.query.rango || 'all'}`;
    cacheClient.get(cacheKey, (err, data) => {
        if (data) return res.json(JSON.parse(data));
        // Si no está en cache, obtener y guardar
        // setex(key, ttl_seconds, value)
    });
});
```

## CSS Optimizations

### Transiciones Específicas (NO usar `all`)
```css
/* ❌ MAL - causa repaints costosos */
transition: all 200ms ease;

/* ✅ BIEN - solo lo necesario */
transition: background-color 200ms ease, border-color 200ms ease;
```

### Usar `contain` para aislar reflows
```css
.header {
    contain: layout style paint;
}

.modal {
    contain: strict;
}
```

### Usar `will-change` con moderación
```css
/* Solo para elementos que cambian frecuentemente */
.animated-element {
    will-change: transform, opacity;
}

/* Remover cuando no se anima */
.animated-element:not(:hover) {
    will-change: auto;
}
```

## Métricas de Performance

### Antes de optimizaciones:
- LCP: ~3-4s
- FID: ~100-200ms
- CLS: ~0.1

### Después de optimizaciones (objetivo):
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1

## Cómo medir

### Lighthouse (Chrome DevTools)
1. Abrir DevTools (F12)
2. Tab "Lighthouse"
3. Click "Analyze page load"

### Web Vitals
```javascript
// Agregar a js/performance-optimization.js
web.getCLS(console.log); // Cumulative Layout Shift
web.getFID(console.log); // First Input Delay
web.getLCP(console.log); // Largest Contentful Paint
```

## Checklist de Optimizaciones

- [x] Defer todos los scripts no críticos
- [x] Preload recursos críticos
- [x] Async fonts
- [x] CSS crítico inline
- [x] Compress gzip en backend
- [x] Cache headers correctos
- [x] Lazy load modales
- [x] Debounce scroll events
- [x] Batch DOM updates
- [x] Remove `transition: all`
- [x] Add `contain` property
- [x] Use `will-change` con moderación
- [ ] Implementar Service Worker (próximo)
- [ ] Minificar CSS/JS en build (próximo)
- [ ] Usar image optimization (próximo)

## Implementación en Production

```bash
# Minificar CSS
cleancss -o css/styles.min.css css/styles.css

# Minificar JS
uglifyjs js/compra.js -o js/compra.min.js

# Habilitar Gzip en nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;
```
