# 🚀 GUÍA DE DEPLOYMENT A PRODUCCIÓN

## 📋 Checklist Pre-Deployment

- [ ] Todas las variables de `.env` están configuradas
- [ ] Base de datos PostgreSQL disponible y accesible
- [ ] JWT_SECRET está cambiado a un valor seguro y largo
- [ ] NODE_ENV=production en variables de entorno
- [ ] Migraciones de base de datos ejecutadas (`npm run migrate:prod`)
- [ ] Usuario admin creado (`node create-admin.js`)
- [ ] Health check pasa exitosamente (`npm run health`)
- [ ] Backups automáticos configurados en BD
- [ ] SSL/TLS configurado en servidor web
- [ ] Logs y monitoreo configurados

---

## 🔧 PASO 1: Configuración Inicial

### 1.1 Configurar Variables de Entorno

```bash
# Copiar plantilla
cp .env.example .env

# Editar .env con tus valores
nano .env
```

Variables CRÍTICAS que DEBEN estar configuradas:
```
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://usuario:pass@host/db?sslmode=require
JWT_SECRET=<generar-valor-seguro-aleatorio-largo>
```

### 1.2 Generar JWT_SECRET Seguro

```bash
# En Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copiar el resultado a .env en JWT_SECRET
```

### 1.3 Instalar Dependencias

```bash
npm install --production
```

---

## 🗄️ PASO 2: Base de Datos

### 2.1 Ejecutar Migraciones

```bash
# En producción
npm run migrate:prod

# Esto creará todas las tablas necesarias
```

### 2.2 Crear Usuario Admin

```bash
node create-admin.js
# Sigue los prompts para configurar usuario/contraseña
```

### 2.3 Poblar Boletos Iniciales (si es necesario)

```bash
# Si la tabla boletos_estado está vacía:
node crear-boletos.js
```

---

## 🔒 PASO 3: Verificación de Salud

```bash
# Correr health check completo
npm run health

# Debe mostrar todos los checks en verde (✅)
```

---

## 🚀 PASO 4: Iniciar Servidor

### Opción A: Ejecución Manual
```bash
npm run prod
```

### Opción B: Con PM2 (Recomendado para Producción)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar con PM2
pm2 start server.js --name "rifaplus-api" --env production

# Configurar auto-reinicio
pm2 startup
pm2 save

# Ver logs
pm2 logs rifaplus-api
```

### Opción C: En Render (Recomendado)

1. Conectar repositorio GitHub a Render
2. Crear nuevo "Web Service"
3. Configurar variables de entorno en Render Dashboard:
   - `NODE_ENV=production`
   - `DATABASE_URL=...`
   - `JWT_SECRET=...`
4. Build command: `npm install --production`
5. Start command: `npm run prod`
6. Render ejecutará automáticamente

---

## 📊 Monitoreo Continuo

### Health Check Automático

```bash
# En cron (cada 5 minutos):
*/5 * * * * cd /path/to/rifas-web/backend && npm run health >> health.log 2>&1
```

### Logs

```bash
# Ver últimas líneas de logs
tail -f /path/to/server.log

# Con PM2
pm2 logs rifaplus-api
```

### Métricas Importantes

Monitor estos endpoints en Uptime Monitoring:
- `GET /api/health` → Debe retornar 200 OK
- `GET /api/public/boletos/stats` → Debe responder en < 10 segundos
- `POST /api/ordenes` → Debe aceptar órdenes válidas

---

## 🔄 Configuración Post-Deployment

### Actualizar config.json en Producción

Si necesitas cambiar valores (sin código):

```bash
# 1. Editar config.json
nano config.json

# 2. El servidor cargará automáticamente los nuevos valores
# No requiere reiniciar (se cachea en memoria inteligentemente)
```

### Ejemplo - Cambiar Precio de Boleto

```json
{
  "rifa": {
    "precioBoleto": 5  // Cambió de 4 a 5
  }
}
```

---

## 🛡️ Seguridad en Producción

### Rate Limiting Automático

En `config.json`, los límites se ajustan automáticamente según NODE_ENV:

**Development**: Deshabilitado (permite debugging)
- General: 10,000 req/15min
- Login: 1,000 req/15min
- Órdenes: 1,000 req/min

**Production**: Activado (protege contra ataques)
- General: 100 req/15min
- Login: 5 req/15min  
- Órdenes: 15 req/min

### Cambiar Límites

Editar `backend/config.json`:
```json
{
  "rate_limits": {
    "production": {
      "general": 150,      // ← Cambiar aquí
      "login": 10,         // ← Cambiar aquí
      "ordenes": 20,       // ← Cambiar aquí
      "windowMs": 900000
    }
  }
}
```

---

## 📈 Optimizaciones por Entorno

### Development (npm run dev)
- Nodemon recarga automáticamente con cambios
- Logging detallado
- Rate limiting deshabilitado
- Debugger accesible

### Production (npm run prod)
- No recarga automática
- Logging optimizado
- Rate limiting activado
- Compresión gzip habilitada
- Caché de configuración activado
- Pool de conexiones BD optimizado (min: 2, max: 10)

---

## 🐛 Troubleshooting

### Error: "Database connection failed"
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Probar conexión manual
psql "$DATABASE_URL"
```

### Error: "JWT_SECRET not set"
```bash
# Verificar en .env
grep JWT_SECRET .env

# Si no existe, agregarlo
echo "JWT_SECRET=$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')" >> .env
```

### Error: "Port 5001 already in use"
```bash
# Cambiar puerto en .env
echo "PORT=5002" >> .env

# O matar proceso existente
lsof -ti:5001 | xargs kill -9
```

### Servidor lento (queries tardías)
```bash
# Verificar índices en BD
# Editar migraciones y ejecutar: npm run migrate:prod

# Ver logs de queries lentas
tail -f /tmp/server.log | grep "Query lenta"
```

---

## 📦 Estructura de Archivos en Producción

```
rifas-web/backend/
├── .env                          # Variables de entorno (CONFIDENCIAL)
├── .env.example                  # Plantilla (commit a git)
├── config.json                   # Configuración en JSON (más rápido)
├── config-manager.js             # Gestor de config (caché en memoria)
├── server.js                     # Servidor Express principal
├── package.json                  # Scripts de npm
├── package-lock.json             # Lock file
├── health-check.js               # Monitoreo de salud
├── setup-production.sh            # Script de inicialización
├── db.js                         # Conexión a PostgreSQL
├── knexfile.js                   # Configuración Knex
├── migrations/                   # Scripts de BD
│   ├── 001_initial.js
│   └── optimize-production.js
├── services/                     # Lógica de negocio
│   ├── boletoService.js
│   └── ordenExpirationService.js
└── public/                       # Assets estáticos
```

---

## ✅ Post-Deployment Verification

```bash
# 1. Verificar salud
curl http://localhost:5001/api/health

# Debe retornar:
# {
#   "status": "healthy",
#   "database": { "healthy": true }
# }

# 2. Verificar login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"tu-password"}'

# 3. Verificar stats de boletos
curl http://localhost:5001/api/public/boletos/stats
```

---

## 📞 Soporte y Escalabilidad

### Si necesitas cambiar:

| Aspecto | Dónde | Requiere Reinicio |
|--------|-------|------------------|
| Precio boleto | `config.json` | ❌ No |
| Total boletos | `config.json` | ❌ No |
| JWT_SECRET | `.env` | ✅ Sí |
| DATABASE_URL | `.env` | ✅ Sí |
| Rate limits | `config.json` | ❌ No |

---

**¡Listo para producción!** 🎉

Si tienes problemas, verifica los logs y ejecuta `npm run health`.
