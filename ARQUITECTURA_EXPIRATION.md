# 📐 Arquitectura: Sistema de Expiración de Órdenes

## 🏗️ Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          🖥️ SERVIDOR NODE.JS                             │
│                        (backend/server.js)                              │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ├─ Lee configuración
        │  └─► backend/config-loader.js
        │     └─► js/config.js (líneas 183-191)
        │
        ├─ Inicializa servicio
        │  └─► backend/services/ordenExpirationService.js
        │     ├─ iniciar(intervaloMin, tiempoHoras)
        │     ├─ limpiarOrdenesExpiradas()
        │     ├─ liberarOrden(orden)
        │     └─ obtenerEstado()
        │
        ├─ Endpoints de Monitoreo [NUEVOS]
        │  ├─ GET /api/admin/expiration-status
        │  └─ GET /api/admin/expiration-stats
        │
        └─ Cada 5 minutos
           └─► Busca órdenes pendientes expiradas
               └─► PostgreSQL
                   └─► Libera boletos
```

---

## 🔄 Flujo de Expiración

```
ARRANQUE DEL SERVIDOR
│
├─► 1. config-loader.js lee js/config.js
│   │  tiempoApartadoHoras: 4
│   │  intervaloLimpiezaMinutos: 5
│
├─► 2. server.js inicializa OrdenExpirationService
│   │   ordenExpirationService.iniciar(5, 4)
│
├─► 3. Servicio comienza a contar tiempo
│   │
│   ├─► MOMENTO 1: T=0 (tiempo inicial)
│   │   └─► Primero ejecuta después de 2 segundos
│   │
│   ├─► MOMENTO 2: T=5 min
│   │   ├─► Busca órdenes pendiente creadas hace > 4 horas
│   │   │
│   │   ├─ Encontradas 3 órdenes expiradas
│   │   │
│   │   └─► Para cada orden:
│   │       ├─► 1. UPDATE ordenes SET estado='cancelada'
│   │       ├─► 2. UPDATE boletos_estado SET estado='disponible'
│   │       └─► 3. Log: "✓ ORD-123 → CANCELADA (120 boletos)"
│   │
│   ├─► MOMENTO 3: T=10 min
│   │   └─► Ejecuta nueva limpieza (no encuentra expiradas)
│   │
│   ├─► MOMENTO 4: T=15 min
│   │   └─► Ejecuta nueva limpieza...
│   │
│   └─► MOMENTO N: Continúa cada 5 minutos hasta que se detiene servidor
```

---

## 📊 Estados de Orden y Boleto

### Estados de Orden

```
PENDIENTE (sin comprobante)
├─► Creada hace < 4 horas → PROTEGIDA
├─► Creada hace > 4 horas → EXPIRA
│   └─► Cambia a CANCELADA
│
COMPROBANTE_RECIBIDO (admin revisando)
├─► PROTEGIDA (no expira)
├─► Si admin aprueba → CONFIRMADA
├─► Si admin rechaza → CANCELADA
│
CONFIRMADA (pagó exitosamente)
├─► PROTEGIDA (no expira)
└─► Estado final
```

### Estados de Boleto

```
DISPONIBLE (inicial)
│
├─► Cliente compra
│   └─► RESERVADO (en orden pendiente)
│       ├─► Cliente paga → VENDIDO
│       ├─► Cliente no paga + 4 horas → DISPONIBLE (expiración libera)
│       └─► Admin rechaza → DISPONIBLE
│
└─► VENDIDO (final, cliente confirmado)
    └─► PROTEGIDO (no expira)
```

---

## 🔐 Lógica de Expiración (Detallada)

```javascript
┌──────────────────────────────────────────────────────────────┐
│ limpiarOrdenesExpiradas() - Cada 5 minutos                  │
└──────────────────────────────────────────────────────────────┘

// 1. Evitar ejecuciones simultáneas
if (this.isExecuting) {
    console.warn('Ya hay limpieza en progreso');
    return;  // ← Previene problemas de concurrencia
}

// 2. Calcular límite de tiempo
ahora = new Date()
tiempoLimite = new Date(ahora - (4 horas en ms))
// Si una orden fue creada ANTES de tiempoLimite → EXPIRA

// 3. Buscar órdenes pendientes
SELECT * FROM ordenes
WHERE estado = 'pendiente'  // ← Solo sin comprobante
AND created_at < tiempoLimite  // ← Creadas hace > 4 horas

// 4. Para cada orden expirada
BEGIN TRANSACTION
    UPDATE ordenes 
    SET estado='cancelada'
    WHERE id=orden.id
    
    UPDATE boletos_estado
    SET estado='disponible'
    WHERE numero IN (orden.boletos)
    
    // Si todo OK → COMMIT
    // Si error → ROLLBACK (nada cambia)
END TRANSACTION

// 5. Actualizar estadísticas
stats.ordenesLiberadas += cantidad
stats.ultimaEjecucion = new Date()
stats.proximaEjecucion = new Date() + 5 minutos

// 6. Log resultado
╔════════════════════════════════════════════════════════════╗
║              ✅ LIMPIEZA COMPLETADA                       ║
╠════════════════════════════════════════════════════════════╣
║ Órdenes canceladas: 3
║ Boletos liberados: 360
║ Duración: 0.45s
║ Próxima: 2024-01-15T10:35:00Z
╚════════════════════════════════════════════════════════════╝
```

---

## 📡 Endpoints HTTP

### 🔧 Configuración

```
POST /api/admin/ordenes-expiradas/configurar [CON JWT]

Request Body:
{
    "tiempoApartadoHoras": 6,
    "intervaloLimpiezaMinutos": 10
}

Response:
{
    "success": true,
    "message": "Configuración actualizada",
    "data": {
        "tiempoApartadoHoras": 6,
        "intervaloLimpiezaMinutos": 10
    }
}
```

### 📊 Monitoreo (Público - Sin JWT)

```
GET /api/admin/expiration-status

Response:
{
    "success": true,
    "activo": true,
    "ejecutando": false,
    "tiempoApartado": "4 horas",
    "intervalo": "5 minutos",
    "estadisticas": {
        "totalEjecuciones": 48,
        "ordenesLiberadas": 12,
        "boletosTotalesLiberados": 2450,
        "ultimaEjecucion": "2024-01-15T10:30:15.234Z",
        "ultimoError": null,
        "proximaEjecucion": "2024-01-15T10:35:15.234Z"
    }
}
```

### 📈 Estadísticas de Órdenes (Público - Sin JWT)

```
GET /api/admin/expiration-stats

Response:
{
    "success": true,
    "total_pendientes": 3,
    "total_confirmadas": 245,
    "total_canceladas": 23,
    "total_comprobante_recibido": 8,
    "boletos_apartados_sin_pago": 450,
    "ordenes_proximas_expirar": 1,
    "detalles": {
        "ahora": "2024-01-15T10:30:15.234Z",
        "limiteExpiracion": "2024-01-15T06:30:15.234Z",
        "tiempoApartadoMs": 14400000
    }
}
```

### 🔄 Limpiar Manualmente (Con JWT)

```
POST /api/admin/ordenes-expiradas/limpiar

Response:
{
    "success": true,
    "message": "Limpieza ejecutada",
    "data": {
        "ordenesLiberadas": 2,
        "boletosCancelados": 240,
        "duracion": "0.52s"
    }
}
```

---

## 🗄️ Estructura de Base de Datos

### Tabla: ordenes

```sql
CREATE TABLE ordenes (
    id UUID PRIMARY KEY,
    numero_orden VARCHAR(50) UNIQUE,
    email_cliente VARCHAR(255),
    
    estado VARCHAR(20),  -- pendiente, comprobante_recibido, confirmada, cancelada
    
    boletos JSON,  -- ["100", "101", "102", ...]
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- ... otros campos ...
);
```

### Tabla: boletos_estado

```sql
CREATE TABLE boletos_estado (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) UNIQUE,
    estado VARCHAR(20),  -- disponible, reservado, vendido, etc
    
    numero_orden VARCHAR(50),  -- FK a ordenes
    reservado_en TIMESTAMP,
    
    updated_at TIMESTAMP,
    
    -- ... otros campos ...
);
```

### Índices Importantes

```sql
-- Para limpieza eficiente
CREATE INDEX idx_ordenes_estado_created 
ON ordenes(estado, created_at);

CREATE INDEX idx_boletos_estado_numero 
ON boletos_estado(numero);

CREATE INDEX idx_boletos_numero_orden 
ON boletos_estado(numero_orden);
```

---

## ⚙️ Configuración Dinámica

### Jerarquía de Prioridad

```
┌──────────────────────────────┐
│ Variables de Entorno (.env)  │ ← MÁXIMA PRIORIDAD
│ ORDEN_APARTADO_HORAS=6       │
└──────────────────────────────┘
         ▲
         │ Si no existe
         ▼
┌──────────────────────────────┐
│ Archivo config.js            │ ← MEDIA PRIORIDAD
│ tiempoApartadoHoras: 4       │
└──────────────────────────────┘
         ▲
         │ Si no existe
         ▼
┌──────────────────────────────┐
│ Valores por Defecto          │ ← MÍNIMA PRIORIDAD
│ tiempoApartadoHoras = 4      │
│ intervaloLimpiezaMinutos = 5 │
└──────────────────────────────┘
```

### Cargar en Runtime

```javascript
// backend/config-loader.js
function obtenerConfigExpiracion() {
    const config = cargarConfigJavaScript();  // Lee js/config.js
    
    return {
        tiempoApartadoHoras: 
            process.env.ORDEN_APARTADO_HORAS ||  // .env
            config.tiempoApartadoHoras ||         // config.js
            4,  // default
        
        intervaloLimpiezaMinutos:
            process.env.ORDEN_LIMPIEZA_MINUTOS ||  // .env
            config.intervaloLimpiezaMinutos ||     // config.js
            5   // default
    };
}
```

---

## 🧠 Clase OrdenExpirationService

```javascript
class OrdenExpirationService {
    constructor() {
        this.interval = null;           // setInterval ID
        this.isRunning = false;         // Servicio activo
        this.isExecuting = false;       // Limpieza en progreso
        this.tiempoApartadoMs = null;   // 4 horas en ms
        this.intervaloMs = null;        // 5 minutos en ms
        this.stats = {                  // Estadísticas
            totalEjecuciones: 0,
            ordenesLiberadas: 0,
            boletosTotalesLiberados: 0,
            ultimaEjecucion: null,
            ultimoError: null,
            proximaEjecucion: null
        };
    }
    
    // Métodos públicos
    iniciar(intervaloMinutos, tiempoApartadoHoras)
    detener()
    async limpiarOrdenesExpiradas()
    async liberarOrden(orden)
    obtenerEstado()
    async obtenerEstadisticas()
    configurar(tiempoApartadoHoras, intervaloMinutos)
}
```

---

## 📈 Ejemplo de Ejecución en Logs

```
2024-01-15T10:00:00.000Z 🚀 Servidor iniciando...

2024-01-15T10:00:02.000Z ⚙️  Configuración de expiración cargada:
   - Tiempo apartado: 4 horas
   - Intervalo limpieza: 5 minutos
   - Precio boleto: $15

2024-01-15T10:00:02.150Z ╔════════════════════════════════════════════════════════╗
                         ║         🚀 SERVICIO DE EXPIRACIÓN INICIADO             ║
                         ╠════════════════════════════════════════════════════════╣
                         ║ Intervalo: 5 minutos
                         ║ Tiempo apartado: 4 horas
                         ║ Próxima ejecución: 2024-01-15T10:05:02.150Z
                         ╚════════════════════════════════════════════════════════╝

2024-01-15T10:05:02.200Z [2024-01-15T10:05:02.200Z] 🔍 [ExpService] INICIANDO LIMPIEZA
                         Límite: 2024-01-15T06:05:02.200Z
                         Búsqueda: órdenes 'pendiente' creadas ANTES de 2024-01-15T06:05:02.200Z

2024-01-15T10:05:02.210Z ✅ [ExpService] No hay órdenes pendientes sin comprobante

2024-01-15T10:05:02.230Z ✅ LIMPIEZA COMPLETADA
                         Órdenes canceladas: 0
                         Boletos liberados: 0
                         Duración: 0.03s
                         Próxima: 2024-01-15T10:10:02.230Z
```

---

## 🎯 Casos de Uso

### Caso 1: Cliente Compra Pero No Paga

```
T=0:00     Cliente compra 10 boletos
           Estado orden: pendiente
           Estado boletos: reservado
           
T=3:00     Cliente no completó pago
           Orden sigue pendiente
           
T=4:05     Limpieza encuentra orden expirada (>4 horas)
           ✓ Orden → cancelada
           ✓ 10 boletos → disponible
           
T=4:06     Otros clientes pueden comprar esos boletos nuevamente
```

### Caso 2: Cliente Sube Comprobante

```
T=0:00     Cliente compra 5 boletos
           Estado orden: pendiente
           
T=0:30     Cliente sube comprobante de transferencia
           Estado orden: comprobante_recibido
           
T=4:05     Limpieza intenta buscar expiradas
           ⚠️ Orden tiene estado 'comprobante_recibido'
           ✓ NO SE CANCELA (está protegida, admin la revisa)
           
T=4:15     Admin verifica y aprueba pago
           Estado orden: confirmada
           ✓ Orden permanece en el sistema
           ✓ Boletos quedan en estado vendido
```

### Caso 3: Cliente Completa el Pago

```
T=0:00     Cliente compra 3 boletos
           Estado orden: pendiente
           
T=0:45     Cliente paga exitosamente
           Servidor recibe confirmación de banco
           Estado orden: confirmada
           Estado boletos: vendido
           
T=4:05     Limpieza ejecuta
           ✓ Orden está confirmada
           ✓ NO EXPIRA (ya pagó)
           ✓ Boletos permanecen vendidos
```

---

## 🔍 Monitoreo en Tiempo Real

### Monitor Script

```bash
┌─ Verificación Única
│  node backend/monitor-expiration.js
│
├─ Monitoreo Continuo (cada 10s)
│  node backend/monitor-expiration.js --watch
│
└─ Guardar en Archivo
   node backend/monitor-expiration.js > monitor.log
```

### Dashboard

```
1️⃣  ESTADO DEL SERVICIO
   Estado: ✅ SÍ
   Ejecutando: ✅ NO (listo)

2️⃣  ESTADÍSTICAS
   Total ejecuciones: 48
   Órdenes canceladas: 12
   Última ejecución: hace 2 minutos

3️⃣  ÓRDENES EN SISTEMA
   Pendientes: 3
   Confirmadas: 245
   Canceladas: 23
   Próximas expirar: 1

4️⃣  ÓRDENES PRÓXIMAS A EXPIRAR
   ORD-5234: 3.87h de 4h (0.13h restantes) 🔴
```

---

## ✨ Resumen Visual

```
ENTRADA (config.js)
    ↓
LOADER (config-loader.js)
    ↓
SERVICE (ordenExpirationService.js)
    ↓
CADA 5 MINUTOS
    ├─► Busca (ordenes pendiente > 4 horas)
    ├─► Actualiza (estado → cancelada)
    ├─► Libera (boletos → disponible)
    └─► Log (estadísticas)
    ↓
SALIDA
    ├─► ordenes: canceladas ✓
    ├─► boletos: disponibles ✓
    ├─► estadísticas: actualizadas ✓
    └─► logs: detallados ✓
```

Este es el flujo completo, desde la configuración hasta la ejecución del sistema de expiración.
