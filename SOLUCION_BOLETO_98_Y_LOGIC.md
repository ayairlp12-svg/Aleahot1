# Solución: Boleto #98 e Inconsistencias de Estado

## 🔍 Problema Identificado

El boleto #98 fue encontrado en estado inconsistente:
- **En la UI (grid)**: Mostraba como "apartado" (reservado)
- **En la BD**: Estaba marcado como "vendido" en una orden anterior
- **Resultado**: Posibilidad de crear órdenes con boletos ya vendidos

Esto ocurría porque había **dos problemas críticos independientes**:

### Problema 1: Falta de Validación en `verificarDisponibilidad()`
**Ubicación**: `backend/services/boletoService.js` (Línea 91-106)

**Síntoma**: El código aceptaba boletos en estado 'vendido' como disponibles
```javascript
// ❌ ANTES: Lógica incorrecta
if (boleto.estado === 'disponible') {
    disponibles.push(num);
} else if (!boleto) {
    disponibles.push(num);  // ⚠️ BUG: aceptaba no-existent como disponible
}
```

**Solución**: Rechazar explícitamente cualquier boleto que NO esté en estado 'disponible'
```javascript
// ✅ DESPUÉS: Lógica correcta
if (boleto.estado === 'disponible') {
    disponibles.push(num);
} else {
    // CUALQUIER otro estado = conflicto
    conflictos.push({
        numero: num,
        estado: boleto.estado,
        razon: boleto.estado === 'vendido' ? 'Ya fue pagado y vendido' : `Estado: ${boleto.estado}`
    });
}
```

**Estado**: ✅ CORREGIDO

### Problema 2: Falta de Transiciones de Estado en Órdenes
**Ubicación**: `backend/server.js` PATCH `/api/ordenes/:id/estado` (Línea 2620-2745)

**Síntoma**: Cuando admin confirmaba una orden, los boletos NO cambiaban de 'reservado' a 'vendido'

**Causa Root**: El endpoint solo actualizaba el estado de la orden, no el de los boletos

**Solución Implementada**: Transacciones ATÓMICAS que actualizan AMBOS:
```javascript
// Cuando orden pasa a 'confirmada'
if (estado === 'confirmada' && ordenActual.estado !== 'confirmada') {
    // Actualizar boletos a 'vendido' en la misma transacción
    await trx('boletos_estado')
        .whereIn('numero', boletos)
        .update({
            estado: 'vendido',
            numero_orden: id,
            vendido_en: new Date()
        });
}

// Cuando orden pasa a 'cancelada'
if (estado === 'cancelada' && ordenActual.estado !== 'cancelada') {
    // Devolver boletos a 'disponible'
    await trx('boletos_estado')
        .whereIn('numero', boletos)
        .update({
            estado: 'disponible',
            numero_orden: null
        });
}
```

**Características**:
- ✅ Transacciones ATÓMICAS (todo o nada)
- ✅ Procesa en chunks de 1000 para evitar timeouts con muchos boletos
- ✅ Usa `forUpdate()` para locks exclusivos en PostgreSQL
- ✅ Logs detallados de cambios

**Estado**: ✅ IMPLEMENTADO Y OPERATIVO

## 📋 Ciclo de Vida Correcto de Órdenes y Boletos

### Estado 1: Cliente crea orden
```
POST /api/ordenes
├─ Valida boletos con verificarDisponibilidad()
├─ Rechaza boletos que NO estén en estado 'disponible'
├─ Crea orden con estado 'pendiente'
└─ Cambia boletos: 'disponible' → 'reservado'
   └─ Se muestran como "apartado" en el grid
```

### Estado 2: Cliente sube comprobante de pago
```
POST /api/public/ordenes-cliente/:numero_orden/comprobante
├─ Valida que orden esté en estado 'pendiente'
├─ Cambia orden: 'pendiente' → 'comprobante_recibido'
└─ Boletos: permanecen 'reservado'
   └─ Se siguen mostrando como "apartado"
   └─ La orden NO expirará (esperará confirmación de admin)
```

### Estado 3: Admin confirma orden
```
PATCH /api/ordenes/:id/estado
Body: { estado: 'confirmada' }
├─ Cambia orden: 'comprobante_recibido' → 'confirmada'
└─ Cambia boletos: 'reservado' → 'vendido' ✅
   └─ Se muestran como "vendido" en el grid
   └─ NO PUEDEN comprarse nuevamente
```

### Estado 4: Orden expira (sin comprobante)
```
Servicio automático cada 10 minutos:
- Si orden está 'pendiente' por > 4 horas
- Y NO tiene comprobante
├─ Cambia orden: 'pendiente' → 'cancelada'
└─ Cambia boletos: 'reservado' → 'disponible'
   └─ Se liberan y pueden comprarse nuevamente
```

### Estado 5: Admin cancela orden
```
PATCH /api/ordenes/:id/estado
Body: { estado: 'cancelada' }
├─ Cambia orden: 'pendiente'/'comprobante_recibido' → 'cancelada'
└─ Cambia boletos: 'reservado' → 'disponible' ✅
   └─ Se liberan para que otros clientes las compren
```

## 🗄️ Tabla de Transiciones Permitidas

| Estado Actual | → Nuevo Estado | Acción en Boletos | Condición |
|---|---|---|---|
| pendiente | comprobante_recibido | Ninguna (stay reservado) | Cliente sube comprobante |
| comprobante_recibido | confirmada | reservado → vendido | Admin confirma |
| pendiente | cancelada | reservado → disponible | Admin cancela o expira (sin proof) |
| comprobante_recibido | cancelada | reservado → disponible | Admin cancela |
| cualquiera | cualquiera | Transacción atómica | Usa lock SQL para consistencia |

## 🔬 Cómo Verificar la Solución

### Test 1: Crear orden con boleto vendido (debe fallar)
```bash
curl -X POST http://localhost:5001/api/ordenes \
  -H "Content-Type: application/json" \
  -d '{
    "boletos": [98],
    "nombreCliente": "Test",
    "apellidos": "User",
    "cliente": {"estado": "Test", "ciudad": "Test"},
    "telefonoCliente": "5551234567",
    "metodoPago": "transferencia",
    "cuenta": {"accountNumber": "123"}
  }'

# Respuesta esperada:
{
  "success": false,
  "message": "Los siguientes boletos no están disponibles: 98",
  "boletosConflicto": [98]
}
```

### Test 2: Crear orden y confirmar (boletos deben cambiar a vendido)
```bash
# Crear orden
curl -X POST http://localhost:5001/api/ordenes \
  -H "Content-Type: application/json" \
  -d '{"boletos": [1000, 1001], ...}'

# Obtener token admin
curl -X POST http://localhost:5001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"usuario": "admin", "contraseña": "password"}'

# Confirmar orden (boletos deben estar 'reservado' antes)
curl -X PATCH http://localhost:5001/api/ordenes/ORDER123/estado \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"estado": "confirmada"}'

# Verificar que boletos estén vendidos
curl http://localhost:5001/api/public/boletos | jq '.sold'
# Debe incluir: [1000, 1001, ...]
```

### Test 3: Verificación de sincronización
```bash
# Ejecutar sincronización completa (detect y fix inconsistencias)
curl http://localhost:5001/api/boletos/sync-full

# Respuesta esperada:
{
  "success": true,
  "cambios": {
    "reservados_liberados": 0,      # Boletos huérfanos liberados
    "inconsistencias_reparadas": 0  # Órdenes reparadas
  },
  "stats": {
    "disponible": 16987,
    "reservado": 45,
    "vendido": 43000
  }
}
```

## 🛡️ Garantías de Seguridad

### 1. Transacciones ATÓMICAS
- Usa `db.transaction()` de Knex.js
- Si algo falla, TODO se revierte (rollback automático)
- Garantiza que una orden NUNCA tenga boletos inconsistentes

### 2. Locks SQL (forUpdate)
- En PostgreSQL: `FOR UPDATE` lock exclusivo
- Previene race conditions cuando 2 clientes compran el mismo boleto
- El primero gana, el segundo recibe error 409

### 3. Validación en dos niveles
- **Frontend**: `orden-formal.js` valida antes de enviar
- **Backend**: Valida de nuevo con `verificarDisponibilidad()`
- Protege contra cliente hacker que bypasea validación frontend

### 4. Sincronización Automática
- Endpoint `/api/boletos/sync-full` detecta inconsistencias
- Se ejecuta manualmente o por cron job
- Libera boletos huérfanos
- Repara órdenes con inconsistencias

## 📊 Estadísticas Esperadas (Post-solución)

```
Boleto #98:
- Estado anterior: 'vendido' (en orden confirmada)
- Está 100% protegido: NO puede comprarse nuevamente
- Si se intenta: Error 409 con mensaje claro

Otros boletos:
- 'disponible': Pueden comprarse
- 'reservado': Tienen orden pendiente/comprobante
- 'vendido': Están pagos y confirmados (protegidos)
```

## 🔄 Migración a Production

**Requerimientos**:
1. ✅ PostgreSQL running
2. ✅ Migrations ejecutadas (crea tabla `boletos_estado`)
3. ✅ Seeds ejecutadas (crea los 60,000 boletos iniciales)
4. ✅ Variables de entorno correctas (DATABASE_URL o DB_NAME)

**Paso 1**: Ejecutar migrations
```bash
cd backend
npx knex migrate:latest --env production
```

**Paso 2**: Ejecutar seeds (opcional, solo si necesitas resetear boletos)
```bash
npx knex seed:run --env production
```

**Paso 3**: Iniciar servidor
```bash
NODE_ENV=production node server.js
```

**Paso 4**: Verificar que todo funciona
```bash
curl http://localhost:5001/api/public/boletos | jq '.stats'
```

## 📝 Notas de Implementación

- **Cambios en `boletoService.js`**: Líneas 91-106 (verificarDisponibilidad)
- **Cambios en `server.js`**: Líneas 2620-2745 (PATCH /api/ordenes/:id/estado)
- **NO hay cambios** en:
  - POST /api/ordenes (ya estaba correcto)
  - POST /api/public/ordenes-cliente/comprobante (ya estaba correcto)
  - GET /api/public/boletos (no tiene cache)
  - Expiration service (ya solo expira órdenes sin comprobante)

## ✅ Checklist de Validación

- [x] Boleto #98 rechazado si está 'vendido'
- [x] Crear orden pone boletos en 'reservado'
- [x] Subir comprobante pone orden en 'comprobante_recibido' (boletos stay reservado)
- [x] Confirmar orden pone boletos en 'vendido'
- [x] Cancelar orden libera boletos a 'disponible'
- [x] Expiration service solo expira órdenes sin comprobante
- [x] `/api/public/boletos` no tiene cache
- [x] Transacciones son atómicas (all-or-nothing)
- [x] Logs detallados de cambios de estado
- [x] Sincronización puede detectar y reparar inconsistencias
