# Checklist de staging para carga de ordenes

Esta guia existe para correr `load:orders` de forma segura y util.

Objetivo:

- medir creacion de ordenes sin ensuciar produccion
- evitar que una prueba de carga toque una BD compartida
- dejar evidencia clara de capacidad real antes de vender eventos grandes

## 1. Regla principal

No correr `load:orders` si se cumple cualquiera de estas condiciones:

- `DATABASE_URL` apunta a la misma BD que produccion
- la rifa activa es una rifa real de cliente
- el backend comparte infraestructura con trafico real
- no sabes exactamente a donde apunta el entorno

Si hay duda, se asume que `no` es seguro.

## 2. Que debe tener un staging valido

Un staging confiable para esta prueba debe tener:

- una BD separada de produccion
- un backend separado de produccion
- un frontend o baseUrl separados
- una rifa de prueba claramente identificada
- boletos de prueba fuera de cualquier rango real si aplica

## 3. Verificacion minima antes de arrancar

Revisar estas variables:

```bash
cd backend
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
node -e "require('dotenv').config(); console.log(process.env.CORS_ORIGINS)"
```

Debes confirmar:

- que `DATABASE_URL` no sea la de produccion
- que `CORS_ORIGINS` incluya tu origen de staging o local
- que el backend responde con su URL esperada

## 4. Preparar rifa de prueba

Antes de la carga:

- crear una rifa de staging con nombre visible tipo `STAGING - Prueba de Carga`
- usar premios y textos falsos de prueba
- confirmar fecha futura
- dejar claro que no es una rifa comercial real

## 5. Smoke test antes de carga

Antes de estresar ordenes:

```bash
npm run health-check -- http://localhost:5001
npm run load:public -- --baseUrl=http://localhost:5001 --path=/api/public/boletos/stats --duration=10 --concurrency=2
npm run load:public -- --baseUrl=http://localhost:5001 --path=/api/public/ordenes-stats --duration=10 --concurrency=2
```

Criterio:

- `0` fallos
- sin errores `500`
- sin errores de conexion

## 6. Prueba inicial de ordenes

Primera corrida, conservadora:

```bash
npm run load:orders -- --baseUrl=http://localhost:5001 --duration=30 --concurrency=2 --ticketStart=200000 --ticketsPerOrder=3 --pricePerTicket=6
```

Luego subir gradualmente:

```bash
npm run load:orders -- --baseUrl=http://localhost:5001 --duration=30 --concurrency=5 --ticketStart=210000 --ticketsPerOrder=3 --pricePerTicket=6
npm run load:orders -- --baseUrl=http://localhost:5001 --duration=30 --concurrency=10 --ticketStart=220000 --ticketsPerOrder=3 --pricePerTicket=6
```

Notas:

- usar rangos distintos de boletos por corrida
- no reusar el mismo `ticketStart`
- subir la concurrencia solo si la corrida previa sale limpia

## 7. Si el staging es remoto

`load:orders` bloquea hosts remotos por defecto.

Para un staging remoto aislado:

```bash
npm run load:orders -- --baseUrl=https://tu-staging-ejemplo.com --allowRemote=true --duration=30 --concurrency=2 --ticketStart=200000 --ticketsPerOrder=3 --pricePerTicket=6
```

Si el host parece de produccion, ademas exigira:

```bash
--allowProduction=true
```

Eso no significa que sea buena idea. Solo elimina el bloqueo tecnico.

## 8. Que medir y guardar

Guardar por cada corrida:

- fecha y hora
- entorno usado
- `baseUrl`
- concurrencia
- duracion
- boletos por orden
- TPS aproximado
- fallos
- `P95`
- `P99`
- muestra de errores si los hubo

## 9. Criterios minimos para considerar la prueba sana

- `0` errores `500`
- `0` ordenes corruptas
- `0` inconsistencias entre ordenes y boletos
- conflictos de boletos solo si fueron provocados por el test
- errores `503 ORDEN_TEMPORALMENTE_BLOQUEADA` raros o nulos
- latencia estable sin degradacion brusca

## 10. Revision posterior a cada corrida

Despues de cada prueba revisar:

- conteo total de ordenes creadas
- conteo de boletos apartados o vendidos
- que no existan duplicados imposibles
- que admin pueda seguir cargando ordenes
- que `api/health` siga sana

## 11. Condicion de no-go

No avanzar a vender eventos grandes si ocurre cualquiera de estas:

- errores `500`
- deadlocks frecuentes
- `503 ORDEN_TEMPORALMENTE_BLOQUEADA` repetidos
- conflictos de boletos no explicables
- caida del admin o del backend
- degradacion fuerte desde concurrencias bajas

## 12. Resultado esperado

Al terminar deberias poder decir, con datos:

- cuantas ordenes por minuto soporta el entorno probado
- con que concurrencia empieza a sufrir
- si el problema aparece en DB, backend o frontend
- si el evento requiere mas capacidad o mas operacion humana
