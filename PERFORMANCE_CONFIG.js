/**
 * Backend Performance Configuration
 * Para Node.js/Express - agregar a server.js
 */

module.exports = {
    // Compression y Caching headers
    performanceHeaders: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept-Encoding',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
    },

    // Assets estáticos con versionado
    assetVersioning: {
        css: '20251229.1',
        js: '20251229.1',
        images: '20251229.1'
    },

    // Gzip compression levels
    compressionOptions: {
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return /json|text|javascript|xml|css|svg/.test(res.getHeader('content-type'));
        }
    },

    // Connection pooling optimization
    poolConfig: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },

    // API response caching (Redis)
    cacheConfig: {
        defaultTTL: 3600,
        patterns: {
            '/api/boletos': 300,
            '/api/config': 86400,
            '/api/promociones': 3600,
        }
    }
};
