# RifaPlus Backend

Backend escalable para RifaPlus con soporte para **1 millón de boletos**.

## 🚀 Características principales

- ✅ **Arquitectura escalable**: Soporta 1M+ boletos sin problemas
- ✅ **PostgreSQL optimizado**: Índices y queries rápidas
- ✅ **Transacciones atómicas**: Sin race conditions
- ✅ **API RESTful**: Endpoints bien documentados
- ✅ **JWT Auth**: Autenticación segura para admin
- ✅ **Rate limiting**: Protección contra abuso

## ⚡ Setup Rápido

### 1. Instalación

```bash
cd backend
npm install
```

### 2. Configurar .env

```bash
# Crear archivo .env
DATABASE_URL=postgresql://user:password@localhost:5432/rifa_db
JWT_SECRET=tu-secret-muy-seguro
NODE_ENV=development
PORT=5001
```

### 3. Ejecutar migraciones

```bash
npm run migrate
```

Crea tabla de boletos para 1M registros.

### 4. Inicializar boletos (primera vez)

```bash
# Opción A: Vía API (requiere servidor corriendo)
curl -X POST http://localhost:5001/api/boletos/inicializar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_admin}" \
  -d '{"totalBoletos": 1000000}'

# Opción B: Vía script
npm run init-boletos

# Opción C: Bash
bash ../init-boletos.sh 1000000
```

**Tarda ~5 minutos en background.**

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Servidor en `http://localhost:5001`

### 6. Verificar health

```bash
npm run health
```

Muestra estadísticas y test de performance.

## 📊 API Endpoints (1M Boletos)

### 🎟️ Boletos

```javascript
// Obtener boletos disponibles (pagination)
GET /api/boletos/disponibles?limit=50&offset=0
Response: {
  boletos: [1, 2, 3, ...],
  paginacion: { total, offset, limit, proximo_offset }
}

// Verificar disponibilidad rápidamente
POST /api/boletos/verificar
Body: { numeros: [1, 2, 3, 4, 5] }
Response: {
  disponibles: [2, 3, 4],
  conflictos: [{numero: 1, estado: 'vendido'}, ...]
}

// Estadísticas
GET /api/boletos/estadisticas
(Requiere: Authorization: Bearer token)
Response: {
  estadisticas: {
    total: 1000000,
    disponibles: 999500,
    vendidos: 500,
    porcentaje: { disponibles: "99.95%", vendidos: "0.05%" }
  }
}
```

### 📦 Órdenes

```javascript
// Crear orden (automaticamente reserva boletos)
POST /api/ordenes
Body: {
  ordenId: "ORD-001",
  cliente: { nombre, apellidos, whatsapp, estado, ciudad },
  boletos: [1, 2, 3, 4, 5],
  totales: { subtotal, descuento, totalFinal },
  precioUnitario: 15,
  metodoPago: "transferencia",
  cuenta: { accountNumber, nombreBanco },
  notas: ""
}

// Obtener orden
GET /api/ordenes/{ordenId}
(Devuelve HTML viewable)
```

### 🔐 Admin

```javascript
// Login
POST /api/admin/login
Body: { username, password }

// Limpiar reservas expiradas
POST /api/boletos/limpiar-reservas
(Requiere: Authorization: Bearer token)
```

## 🔧 Arquitectura de BD

### Tabla `boletos_estado`
```sql
id INTEGER PRIMARY KEY
numero INTEGER UNIQUE
estado ENUM('disponible', 'reservado', 'vendido', 'cancelado')
numero_orden VARCHAR(50)
created_at, updated_at TIMESTAMP
reservado_en, vendido_en TIMESTAMP

INDEXES:
- idx_estado (rápido para búsquedas)
- idx_numero_orden (búsqueda por orden)
- idx_estado_tiempo (limpiar expirados)
```

### Tabla `ordenes`
- Guarda referencia a boletos en tabla separada
- Mejor performance con 1M+ órdenes
- Indices en estado, numero_orden, created_at

## ⚡ Performance Garantizado

| Operación | Tiempo | Query Count |
|-----------|--------|------------|
| Verificar 10 boletos | <50ms | O(1) con índices |
| Crear orden 100 boletos | <200ms | Transacción atómica |
| Listar 50 disponibles | <100ms | Pagination |
| Contar disponibles | <100ms | COUNT con índice |

## 🧪 Testing

```bash
# Health check
npm run health

# Crear órdenes test
node backend/scripts/test-orders.js

# Load test (100 órdenes simultáneas)
node backend/scripts/load-test.js
```

## 🚀 Deploy a Producción

### Railway / Render / Heroku

```bash
# 1. Conectar BD PostgreSQL
# 2. Agregar variables de entorno
# 3. npm install && npm run migrate
# 4. npm run init-boletos (una sola vez)
# 5. npm start
```

### Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY backend .
RUN npm install
RUN npm run migrate
CMD ["npm", "start"]
```

```bash
docker build -t rifa-web .
docker run -e DATABASE_URL=... -e JWT_SECRET=... -p 5001:5001 rifa-web
```

## 📚 Más información

Ver [ARQUITECTURA_1M_BOLETOS.md](../ARQUITECTURA_1M_BOLETOS.md) para documentación técnica completa.


## 📝 Licencia

MIT
