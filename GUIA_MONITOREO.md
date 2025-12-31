# 🔍 Guía de Monitoreo del Servicio de Expiración de Órdenes

## Instalación y Uso del Monitor

El monitor es una herramienta Node.js que verifica el estado del servicio de expiración en tiempo real.

### 📥 Archivo Creado
```
backend/monitor-expiration.js
```

### 🚀 Cómo Usar

#### 1. Verificación Única (Una sola ejecución)

```bash
cd /Users/ayair/Desktop/rifas-web

# Verificar estado actual
node backend/monitor-expiration.js
```

**Output esperado:**
```
╔═════════════════════════════════════════════════════════════╗
║  📊 MONITOR DE SERVICIO DE EXPIRACIÓN DE ÓRDENES            ║
╚═════════════════════════════════════════════════════════════╝

⏰ 1/15/2024, 10:30:15 AM

1️⃣  ESTADO DEL SERVICIO
────────────────────────────────────────────────────────────
  Estado: ✅ SÍ
  Ejecutando: ✅ NO (listo)
  Tiempo apartado: 4 horas
  Intervalo limpieza: 5 minutos

2️⃣  ESTADÍSTICAS DE EXPIRACIÓN
────────────────────────────────────────────────────────────
  Total ejecuciones: 48
  Órdenes canceladas: 12
  Boletos liberados: 2450
  Última ejecución: hace 2 minutos (10:28:15 AM)
  Próxima ejecución: en 178s (10:35:15 AM)

3️⃣  ÓRDENES EN EL SISTEMA
────────────────────────────────────────────────────────────
  Pendientes (sin pago): 3
  Confirmadas (pagadas): 245
  Canceladas (expiradas): 23
  Comprobante recibido: 8
  Boletos apartados sin pago: 450
  Órdenes próximas a expirar (<1h): 1

  Límite de expiración: 2024-01-15T06:30:15.000Z

4️⃣  ÓRDENES PRÓXIMAS A EXPIRAR
────────────────────────────────────────────────────────────
  ORD-5234 (user@example.com):
    ⏳ 3.87h de 4h (0.13h restantes)
```

#### 2. Monitoreo Continuo (Refrescar cada 10 segundos)

```bash
# Refrescar cada 10 segundos
node backend/monitor-expiration.js --watch
```

**Útil para:**
- Verificar que la limpieza ocurre cada 5 minutos
- Monitorear órdenes próximas a expirar en tiempo real
- Detectar errores en el servicio

**Presiona `Ctrl+C` para salir**

### 📊 Qué Verifica el Monitor

#### 1️⃣ Estado del Servicio
- ✅ Si el servicio está activo
- ⏳ Si está ejecutando una limpieza
- ⏱️ Cuánto tiempo dura apartado una orden
- 🔄 Intervalo de limpieza configurado

#### 2️⃣ Estadísticas de Ejecución
- Total de veces que se ha ejecutado la limpieza
- Órdenes canceladas por expiración
- Boletos liberados en total
- Última ejecución (hace X minutos)
- Próxima ejecución (en X segundos)
- Últimos errores (si existen)

#### 3️⃣ Órdenes en el Sistema
- Órdenes pendientes (sin pago)
- Órdenes confirmadas (pagadas)
- Órdenes canceladas (expiradas)
- Órdenes con comprobante siendo revisadas
- Boletos apartados sin pago
- Órdenes próximas a expirar (<1 hora)

#### 4️⃣ Órdenes Próximas a Expirar
Lista detallada de órdenes que van a expirar pronto:
- Número de orden
- Email del cliente
- Horas transcurridas vs límite
- Horas restantes

#### 5️⃣ Configuración Cargada
- Tiempo apartado (desde config.js)
- Intervalo de limpieza (desde config.js)
- Fuente (config.js o variables de entorno)

---

## 🔧 Requisitos

1. **Servidor debe estar corriendo:**
   ```bash
   # Terminal 1: Servidor Node.js
   npm start
   # O con PM2
   pm2 start server.js --name rifas
   ```

2. **Base de datos accesible:**
   - PostgreSQL debe estar corriendo
   - Debe haber tabla `ordenes` con órdenes pendientes

3. **Node.js v14+**
   ```bash
   node --version  # v14.0.0 o superior
   ```

---

## 🐛 Troubleshooting

### "Cannot connect to http://localhost:5001"

**Causa:** El servidor no está corriendo

**Solución:**
```bash
# Terminal nueva
npm start

# Verificar que escucha en puerto 5001
lsof -i :5001
```

### "ECONNREFUSED"

**Causa:** Servidor escucha en puerto diferente

**Solución:**
```javascript
// backend/monitor-expiration.js línea 20
const SERVIDOR = 'http://localhost:5001';  // ← Cambiar puerto si es necesario
```

### Database timeout errors

**Causa:** Base de datos muy lenta o desconectada

**Solución:**
```bash
# Verificar conexión a BD
psql -U usuario -d nombre_bd -c "SELECT 1"

# Aumentar timeout en backend/monitor-expiration.js
// Buscar "hacerRequest" y aumentar timeout
```

### "No matches found"

**Causa:** Monitor no puede conectar a servidor

**Verificar:**
1. ¿Servidor está en localhost:5001?
2. ¿CORS permitido?
3. ¿Firewall bloqueando?

---

## 📈 Interpretación de Resultados

### ✅ Sistema Saludable

```
Estado: ✅ SÍ
Ejecutando: ✅ NO (listo)
Última ejecución: hace 2 minutos
Órdenes próximas a expirar: 0
Último error: null
```

✔️ Todo funciona correctamente

### ⚠️ Investigar

```
Órdenes próximas a expirar: 3
Estado: ✅ SÍ
```

✔️ Sistema funciona pero hay órdenes próximas a expirar (normal)

### ❌ Problemas

```
Estado: ❌ NO
Ejecutando: 🔄 SÍ (limpieza en progreso)
```

❌ Servicio no está activo o está atascado

---

## 🌐 Endpoints HTTP Utilizados

El monitor usa estos endpoints internos (sin autenticación):

```bash
# 1. Estado del servicio
GET http://localhost:5001/api/admin/expiration-status
# Respuesta: { activo, ejecutando, tiempoApartado, intervalo, estadisticas }

# 2. Estadísticas de órdenes
GET http://localhost:5001/api/admin/expiration-stats
# Respuesta: { total_pendientes, total_confirmadas, ordenes_proximas_expirar, ... }
```

---

## 📋 Script de Ejemplo (Cron Job)

**Monitorear cada 30 minutos y guardar en archivo:**

```bash
#!/bin/bash
# archivo: /home/usuario/monitor-rifas.sh

LOGFILE="/home/usuario/logs/expiration-monitor.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "[$TIMESTAMP] Ejecutando monitoreo..." >> $LOGFILE
node /Users/ayair/Desktop/rifas-web/backend/monitor-expiration.js >> $LOGFILE 2>&1

if [ $? -eq 0 ]; then
    echo "[$TIMESTAMP] ✅ Monitoreo completado" >> $LOGFILE
else
    echo "[$TIMESTAMP] ❌ Error en monitoreo" >> $LOGFILE
    # Enviar alerta por email o Slack
fi
```

**Agregar a crontab:**
```bash
crontab -e

# Añadir línea:
*/30 * * * * /home/usuario/monitor-rifas.sh
```

---

## 📊 Métricas Típicas

En producción con ~250 órdenes/día:

| Métrica | Normal | Alerta |
|---------|--------|--------|
| Órdenes pendientes | 1-10 | >30 |
| Última ejecución | <5 min | >10 min |
| Órdenes próximas expirar | 0-2 | >5 |
| Boletos apartados | 100-500 | >2000 |
| Error rate | 0 | >1 error/día |

---

## 🔐 Seguridad

El monitor **NO requiere autenticación JWT** para conectarse.

**Endpoints públicos sin autenticación:**
- `GET /api/admin/expiration-status`
- `GET /api/admin/expiration-stats`

**Por qué es seguro:**
- Solo devuelven información de estado (no datos sensibles)
- Se pueden restringir por IP en nginx/firewall si es necesario
- Solo en ambiente de desarrollo/admin

---

## 💾 Guardar Logs

**Ejecutar monitor y guardar output:**

```bash
# Guardar en archivo
node backend/monitor-expiration.js > monitor-output.txt 2>&1

# Ver en tiempo real
node backend/monitor-expiration.js | tee monitor-live.log

# Monitoreo continuo con timestamp
node backend/monitor-expiration.js --watch | ts '[%Y-%m-%d %H:%M:%S]' > monitor.log
```

---

## ✨ Resumen

| Acción | Comando |
|--------|---------|
| Verificar estado una vez | `node backend/monitor-expiration.js` |
| Monitoreo continuo | `node backend/monitor-expiration.js --watch` |
| Guardar en archivo | `node backend/monitor-expiration.js > log.txt` |
| Con timestamp | `node backend/monitor-expiration.js --watch \| ts` |
| Ver solo errores | `grep -i "error\|❌" monitor.log` |
| Ver próximas expirar | `grep -A5 "PRÓXIMAS" monitor-output.txt` |

¡El sistema está completamente operativo y monitorizado!
