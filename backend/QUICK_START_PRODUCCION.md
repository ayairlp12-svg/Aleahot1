# 🚀 QUICK START - DEPLOY EN 5 MINUTOS

## Opción 1: Render (Más Fácil - Recomendado)

### Paso 1: Preparar Variables
```bash
# Genera JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copia el resultado
```

### Paso 2: Conectar a Render
1. Ve a [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Conecta tu GitHub repo
4. Elige la rama (main, master, etc)

### Paso 3: Configurar
- **Name**: `rifaplus-api`
- **Runtime**: Node
- **Build command**: `npm install --production`
- **Start command**: `npm run prod`

### Paso 4: Variables de Entorno
Click "Add Environment Variable":

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Tu URL de Render PostgreSQL |
| `JWT_SECRET` | El que generaste en Paso 1 |

### Paso 5: Deploy
Click "Create Web Service" → Render hace el deploy automáticamente

**¡Listo! Tu API está en producción en 2-3 minutos.** ✅

---

## Opción 2: Local/VPS (Si quieres control total)

### Paso 1: Clonar
```bash
cd tu-proyecto
cd backend
```

### Paso 2: Copiar Configuración
```bash
cp .env.example .env
nano .env
# Edita y completa los valores
```

### Paso 3: Instalar
```bash
npm install --production
```

### Paso 4: Setup
```bash
chmod +x setup-production.sh
./setup-production.sh
```

### Paso 5: Iniciar
```bash
npm run prod
```

**Verificar**:
```bash
curl http://localhost:5001/api/health
# Debe devolver: {"status":"healthy","database":{"healthy":true}}
```

---

## Verificaciones Rápidas

```bash
# 1. ¿API funciona?
curl http://tu-dominio.com/api/health

# 2. ¿BD conectada?
curl http://tu-dominio.com/api/public/sorteo-info

# 3. ¿Crear orden funciona?
curl -X POST http://tu-dominio.com/api/ordenes \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": {"nombre":"Test","apellidos":"User","whatsapp":"123","email":"test@test.com"},
    "boletos": [100,101,102],
    "cantidad": 3,
    "precioUnitario": 4,
    "totales": {"cantidad":3,"subtotal":12,"descuento":0,"totalFinal":12}
  }'

# 4. ¿Health check?
curl http://tu-dominio.com/api/health
# O si estás en local: npm run health
```

---

## 🔧 Cambios Frecuentes (Sin Redeploy)

**Cambiar precio boleto**:
```bash
# Editar backend/config.json
{
  "rifa": {
    "precioBoleto": 5  // ← Cambiar aquí
  }
}
# Cambio automático, sin reinicio
```

**Cambiar total boletos**:
```bash
# Editar backend/config.json
{
  "rifa": {
    "totalBoletos": 500000  // ← Cambiar aquí
  }
}
```

**Cambiar rate limits**:
```bash
# Editar backend/config.json
{
  "rate_limits": {
    "production": {
      "general": 200,  // ← Cambiar aquí
      "login": 10,     // ← Cambiar aquí
      "ordenes": 20    // ← Cambiar aquí
    }
  }
}
```

---

## 🚨 Troubleshooting

**"Database connection failed"**
```bash
# Verifica que DATABASE_URL es correcto
echo $DATABASE_URL
# Debe ser: postgresql://usuario:pass@host/db?sslmode=require
```

**"JWT_SECRET not set"**
```bash
# Genera uno nuevo
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Agrégalo a .env
```

**"Port 5001 already in use"**
```bash
# Cambiar puerto en .env
echo "PORT=5002" >> .env

# O matar proceso
lsof -ti:5001 | xargs kill -9
```

**"Servidor lento"**
```bash
# Revisar health
npm run health

# Ver logs
tail -f /tmp/server.log
```

---

## 📊 Archivos Importantes

```
backend/
├── .env                    ← Variables (NUNCA commitear)
├── .env.example            ← Plantilla (SÍ commitear)
├── config.json             ← Configuración (SÍ commitear)
├── config-manager.js       ← Caché config
├── cache-manager.js        ← Caché queries
├── health-check.js         ← Monitoreo
├── server.js               ← API principal
└── DEPLOYMENT.md           ← Guía completa
```

---

## ✅ Checklist Final

- [ ] Variables en `.env` están configuradas
- [ ] DATABASE_URL es válida
- [ ] JWT_SECRET es seguro y largo
- [ ] Base de datos está accesible
- [ ] `npm run health` retorna OK
- [ ] Usuario admin creado (`node create-admin.js`)
- [ ] Deploy realizado (Render o local)
- [ ] `/api/health` retorna 200

---

## 🎉 ¡Listo!

Tu sistema RifaPlus está en producción. 🚀

**Próximos pasos**:
1. Actualizar frontend para apuntar a tu API
2. Configurar dominio personalizado
3. Monitorear con `npm run health`
4. Cambiar configuración según necesites en `config.json`

**Documentación completa**: Ver `DEPLOYMENT.md` y `OPTIMIZACIONES_PRODUCCION.md`
