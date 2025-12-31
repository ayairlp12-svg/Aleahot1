# Sistema de Expiración de Órdenes - Configuración y Funcionamiento

## 🎯 Descripción General

El **Servicio de Expiración de Órdenes** (`ordenExpirationService`) es un sistema automático que cancela órdenes pendientes que no han recibido comprobante de pago después de un tiempo configurable.

### Propósito
- Liberar automáticamente boletos de órdenes abandonadas
- Mantener coherencia entre órdenes y disponibilidad de boletos
- Prevenir que boletos queden "apartados" indefinidamente
- Permitir configuración dinámica por el administrador

---

## ⚙️ Configuración

### Variables de Entorno (Backend)

```bash
# Tiempo que una orden permanece "apartada" sin pago (en horas)
ORDEN_APARTADO_HORAS=12              # Default: 12 horas

# Intervalo de verificación de órdenes expiradas (en minutos)
ORDEN_LIMPIEZA_MINUTOS=5             # Default: 5 minutos
```

### Cómo Cambiar la Configuración

#### Opción 1: Variables de Entorno (Producción)
```bash
# Crear/editar archivo .env en backend/
ORDEN_APARTADO_HORAS=24
ORDEN_LIMPIEZA_MINUTOS=10
```

#### Opción 2: API Admin (En Tiempo Real)
```bash
POST /api/admin/ordenes-expiradas/configurar
Authorization: Bearer <token_jwt>
Content-Type: application/json

{
  "tiempoApartadoHoras": 24,
  "intervaloLimpiezaMinutos": 10
}
```

#### Opción 3: En Código (Desarrollo)
```javascript
// backend/server.js (línea ~29)
const TIEMPO_APARTADO_HORAS = 24;  // Cambiar aquí
const INTERVALO_LIMPIEZA_MINUTOS = 10;  // Cambiar aquí
```

---

## 🚀 Iniciación del Servicio

El servicio se inicia automáticamente cuando el servidor arranca:

```javascript
// backend/server.js (línea ~2140)
app.listen(PORT, () => {
    // ... otros logs ...
    ordenExpirationService.iniciar(INTERVALO_LIMPIEZA_MINUTOS, TIEMPO_APARTADO_HORAS);
});
```

### Flujo de Iniciación

```
1. Servidor Express arranca (npm start)
2. Se cargan variables de entorno
3. Se calcula tiempoApartadoMs (horas × 60 × 60 × 1000)
4. Se calcula intervaloMs (minutos × 60 × 1000)
5. Se inicia el servicio:
   - Primera limpieza: después de 2 segundos
   - Limpiezas posteriores: cada intervaloMs
```

---

## 🔄 Funcionamiento del Servicio

### Criterios de Expiración

Una orden es **EXPIRADA** si cumple TODOS estos requisitos:

1. **Estado = "pendiente"** (no confirmada, no cancelada)
2. **comprobante_path IS NULL** (no tiene comprobante de pago)
3. **created_at < (ahora - 12 horas)** (más vieja que el tiempo configurado)

### Proceso de Limpieza (Cada 5 minutos)

```
1. Verificar que no hay otra limpieza en progreso (flag: isExecuting)
2. Obtener TODAS las órdenes pendientes sin comprobante de BD
3. Filtrar en JavaScript (no en SQL, por problemas de comparación de fechas)
4. Para cada orden EXPIRADA:
   a. Extraer lista de boletos del JSON
   b. Actualizar orden: estado = 'cancelada'
   c. Log detallado de liberación
5. Actualizar estadísticas (cuenta total de órdenes y boletos liberados)
6. Mostrar resumen en logs del servidor
```

### Ejemplo de Salida en Logs

```
[2025-12-21T19:27:05.000Z] 🔍 [ExpService] INICIANDO LIMPIEZA
   Límite: 2025-12-21T07:27:05.000Z

⚠️  [ExpService] Encontradas 5 órdenes EXPIRADAS

  ✓ SY-AA001 → CANCELADA (50 boletos liberados)
  ✓ SY-AA002 → CANCELADA (100 boletos liberados)
  ... (más órdenes)

╔════════════════════════════════════════════════════════╗
║              ✅ LIMPIEZA COMPLETADA                   ║
╠════════════════════════════════════════════════════════╣
║ Órdenes canceladas: 5                              
║ Boletos liberados: 250                             
║ Duración: 1.25s                                    
║ Próxima: 2025-12-21T19:32:05.000Z                
╚════════════════════════════════════════════════════════╝
```

---

## 🔄 Sincronización de Zona Horaria

### Problema Identificado
Las órdenes nuevas se creaban con timestamps en la zona horaria del servidor, no en UTC. Esto causaba discrepancias en el cálculo de expiración.

### Solución Implementada

Todas las órdenes se crean con **timestamps UTC sincronizados**:

```javascript
// backend/server.js (POST /api/ordenes, línea ~730)
const ahora = new Date();
const timestampUTC = new Date(ahora.toISOString());  // Forzar UTC

await db('ordenes').insert({
    // ...
    created_at: timestampUTC,  // UTC sincronizado
    updated_at: timestampUTC   // UTC sincronizado
});
```

### Formato de Fechas
- Base de datos: `YYYY-MM-DD HH:MM:SS` (UTC)
- Comparación: Convertir strings a objetos Date y comparar en JavaScript
- Visualización: Convertir a zona horaria local del usuario

---

## 📊 Endpoints de Monitoreo

### GET `/api/admin/ordenes-expiradas/estado-servicio`
Obtiene el estado **COMPLETO** del servicio (NUEVO):

```json
{
  "success": true,
  "data": {
    "servicio": {
      "activo": true,
      "ejecutando": false,
      "tiempoApartado": "12 horas",
      "intervalo": "5 minutos",
      "estadisticas": {
        "totalEjecuciones": 45,
        "ordenesLiberadas": 87,
        "boletosTotalesLiberados": 3456,
        "ultimaEjecucion": "2025-12-21T19:27:05.123Z",
        "proximaEjecucion": "2025-12-21T19:32:05.123Z",
        "ultimoError": null
      }
    },
    "ordenes": {
      "total_pendientes": 20,
      "total_confirmadas": 33,
      "total_canceladas": 38,
      "total_comprobante_recibido": 1,
      "boletos_apartados_sin_pago": 2743,
      "ordenes_proximas_expirar": 3
    },
    "timestamp": "2025-12-21T19:27:10.123Z"
  }
}
```

### GET `/api/admin/ordenes-expiradas/stats`
Estadísticas de órdenes:

```json
{
  "success": true,
  "data": {
    "total_pendientes": 20,
    "total_confirmadas": 33,
    "total_canceladas": 38,
    "boletos_apartados_sin_pago": 2743,
    "ordenes_proximas_expirar": 3
  }
}
```

### POST `/api/admin/ordenes-expiradas/limpiar`
Ejecuta limpieza **MANUAL** (útil para debugging):

```bash
curl -X POST http://localhost:5001/api/admin/ordenes-expiradas/limpiar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### POST `/api/admin/ordenes-expiradas/configurar`
Cambia tiempos **EN TIEMPO REAL** (sin reiniciar servidor):

```bash
curl -X POST http://localhost:5001/api/admin/ordenes-expiradas/configurar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tiempoApartadoHoras": 24,
    "intervaloLimpiezaMinutos": 10
  }'
```

---

## 🛡️ Características de Robustez para Producción

### 1. Prevención de Ejecuciones Concurrentes
```javascript
if (this.isExecuting) {
    console.warn('Ya hay una limpieza en progreso, saltando...');
    return;
}
this.isExecuting = true;
// ... procesar ...
this.isExecuting = false;  // En finally block
```

### 2. Error Handling Exhaustivo
- Try-catch en cada operación crítica
- Si falla una orden, continúa con las demás
- Registra errores en estadísticas
- No bloquea el servidor

### 3. Transacciones Atómicas
```javascript
await db.transaction(async (trx) => {
    // Todas las operaciones se hacen juntas o ninguna
    // Rollback automático si hay error
});
```

### 4. Timeouts de BD
```javascript
.timeout(10000)  // Evitar queries que cuelguen
```

### 5. Logging Detallado
Cada limpieza registra:
- Hora de inicio/fin
- Cantidad de órdenes procesadas
- Cantidad de boletos liberados
- Duración total
- Próxima ejecución
- Errores (si los hay)

### 6. Estadísticas en Tiempo Real
Disponibles via API para monitoreo:
```javascript
this.stats = {
    totalEjecuciones: 45,
    ordenesLiberadas: 87,
    boletosTotalesLiberados: 3456,
    ultimaEjecucion: new Date(),
    proximaEjecucion: new Date(),
    ultimoError: null
};
```

---

## 🧪 Prueba del Sistema

### Test Manual de Expiración

Crear una orden "vieja" y verificar que se expira (PostgreSQL):

```bash
# 1. Insertar una orden con fecha hace >4 horas
psql "$DATABASE_URL" -c "
INSERT INTO ordenes (numero_orden, created_at, estado, comprobante_path, boletos, cantidad_boletos, precio_unitario, subtotal, descuento, total)
VALUES ('TEST-VIEJO', NOW() - INTERVAL '5 hours', 'pendiente', NULL, '[1001, 1002, 1003]'::jsonb, 3, 100, 300, 0, 300);
"

# 2. Esperar que se ejecute la limpieza automática (5 minutos máx)
# O forzar limpieza manual:
curl -X POST http://localhost:5001/api/admin/ordenes-expiradas/limpiar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# 3. Verificar que la orden ahora está CANCELADA:
psql "$DATABASE_URL" -c "SELECT numero_orden, estado FROM ordenes WHERE numero_orden='TEST-VIEJO';"
# Resultado esperado: TEST-VIEJO|cancelada
```

### Test de Configuración Dinámica

```bash
# 1. Cambiar a 1 hora (en vez de 4)
curl -X POST http://localhost:5001/api/admin/ordenes-expiradas/configurar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tiempoApartadoHoras": 1, "intervaloLimpiezaMinutos": 1}'

# 2. Verificar que el cambio se aplicó:
curl -X GET http://localhost:5001/api/admin/ordenes-expiradas/estado-servicio \
  -H "Authorization: Bearer <token>"
# Debe mostrar: "tiempoApartado": "1 horas"

# 3. Restaurar a 12 horas:
curl -X POST http://localhost:5001/api/admin/ordenes-expiradas/configurar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tiempoApartadoHoras": 12, "intervaloLimpiezaMinutos": 5}'
```

---

## 🐛 Debugging

### Ver Logs en Tiempo Real
```bash
tail -f /tmp/server.log | grep "ExpService"
```

### Forzar Limpieza Inmediata
```bash
curl -X POST http://localhost:5001/api/admin/ordenes-expiradas/limpiar \
  -H "Authorization: Bearer <token>"
```

### Ver Estadísticas Actuales
```bash
curl -X GET http://localhost:5001/api/admin/ordenes-expiradas/estado-servicio \
  -H "Authorization: Bearer <token>" | jq
```

### Verificar Órdenes en BD
```bash
# Órdenes pendientes sin comprobante:
sqlite3 database.sqlite3 "
SELECT numero_orden, created_at, 
       CAST((julianday('now') - julianday(created_at)) * 24 AS INTEGER) as horas_atras
FROM ordenes 
WHERE estado='pendiente' AND comprobante_path IS NULL
ORDER BY created_at DESC;
"

# Órdenes canceladas recientemente:
sqlite3 database.sqlite3 "
SELECT numero_orden, estado, updated_at, cantidad_boletos
FROM ordenes 
WHERE estado='cancelada'
ORDER BY updated_at DESC LIMIT 20;
"
```

---

## 📋 Checklist de Producción

- [x] Servicio inicia automáticamente con servidor
- [x] Configuración via variables de entorno
- [x] Configuración dinámica via API sin reiniciar
- [x] Sincronización de timestamps UTC
- [x] Prevención de ejecuciones concurrentes
- [x] Error handling robusto
- [x] Logging detallado
- [x] Estadísticas en tiempo real
- [x] Transacciones atómicas
- [x] Timeouts de BD
- [x] Monitoreo via API
- [x] Fácil de debuggear

---

## 📞 Soporte

Para cambios o problemas:
1. Ver logs: `tail -f /tmp/server.log`
2. Revisar endpoint de estado: `/api/admin/ordenes-expiradas/estado-servicio`
3. Forzar limpieza: POST `/api/admin/ordenes-expiradas/limpiar`
4. Cambiar config: POST `/api/admin/ordenes-expiradas/configurar`
