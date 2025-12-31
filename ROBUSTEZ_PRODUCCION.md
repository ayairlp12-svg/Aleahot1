# 🛡️ Guía de Robustez para Producción

## Mejoras Implementadas para Estabilidad en Producción

### 1. Frontend (js/orden-formal.js) - Función `guardarOrden()`

#### ✅ Validaciones en Capas (Defense in Depth)
- **Capa 1**: Validación de existencia de `ordenActual`
- **Capa 2**: Validación de estructura básica
- **Capa 3**: Validación de array de boletos
- **Capa 4**: Validación individual de cada boleto
- **Capa 5**: Validación de datos del cliente (nombre, teléfono)
- **Capa 6**: Validación de datos monetarios
- **Capa 7**: Consistency check entre precio calculado y enviado

#### 🔒 Prevención de Comportamientos Inesperados
```javascript
// Prevenir múltiples clics simultáneos
if (window.guardandoOrden) {
    console.warn('⚠️  Ya hay una orden en proceso');
    return;
}
window.guardandoOrden = true;
```

#### ⏱️ Timeouts y Reintentos
- **Timeout**: 15 segundos por petición
- **Reintentos**: 3 intentos automáticos
- **Backoff exponencial**: Espera 2s, 4s, 6s entre reintentos
- **Discriminación inteligente**: Solo reintentar en errores 5xx

```javascript
for (let intento = 1; intento <= maxReintentos; intento++) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
            ...
        });
        
        clearTimeout(timeoutId);
        // ...procesamiento...
    } catch (fetchError) {
        if (intento < maxReintentos) {
            await new Promise(resolve => setTimeout(resolve, 2000 * intento));
            continue;
        }
    }
}
```

#### 🎯 Manejo Específico de Errores
- **409 Conflict**: Boletos duplicados → Error específico
- **409 Duplicate Order**: Orden ya existe → Mensaje claro
- **5xx Errors**: Error temporal → Reintentar
- **Network errors**: Timeout → Mensaje específico
- **Type errors**: Validación de datos → Mensaje claro

#### 🧹 Limpieza y Finalmente
- Limpieza de localStorage incluso si falla
- Actualización de UI de carrito
- Flag `window.guardandoOrden` siempre se resetea en `finally`
- Historial de órdenes guardado en localStorage como backup

---

### 2. Backend - Servicio de Boletos (boletoService.js)

#### 🔐 Transacciones Atómicas
```javascript
return db.transaction(async (trx) => {
    try {
        // PASO 1: Validar orden no existe
        const ordenExistente = await trx('ordenes')
            .where('numero_orden', ordenId)
            .first();
        if (ordenExistente) throw new Error('DUPLICATE_ORDER');
        
        // PASO 2: Lock y verificación de disponibilidad
        const boletosActuales = await trx('boletos_estado')
            .whereIn('numero', numerosValidos)
            .forUpdate()  // ← LOCK EXCLUSIVO en PostgreSQL
            .select('numero', 'estado');
        
        // PASO 3: Crear orden
        const insertResult = await trx('ordenes').insert(ordenData);
        
        // PASO 4: Actualizar boletos (ATÓMICO)
        const updateResult = await trx('boletos_estado')
            .whereIn('numero', numerosValidos)
            .update({...});
            
    } catch (transactionError) {
        throw transactionError; // Rollback automático
    }
});
```

**Garantías**:
- ✅ No hay race conditions (LOCK exclusivo)
- ✅ Todo o nada (rollback automático)
- ✅ Inconsistencias detectadas (validación post-update)

#### 📊 Validaciones en 5 Capas

1. **Parámetros requeridos**: ¿Existen numeros, ordenId, datos?
2. **Tipo correcto**: ¿Es numeros un array? ¿Tiene datos numéricos válidos?
3. **Rangos**: ¿Están entre 1 y 1,000,000? ¿Son enteros positivos?
4. **Datos cliente**: ¿Nombre no vacío? ¿Teléfono válido (10+ dígitos)?
5. **Datos monetarios**: ¿Precios positivos? ¿Total válido?

#### 🔍 Validaciones de Integridad
```javascript
// Verificar que TODOS los boletos existen
if (boletosActuales.length !== numerosValidos.length) {
    const faltantes = numerosValidos.filter(
        n => !new Set(boletosActuales.map(b => b.numero)).has(n)
    );
    throw new Error(`Boletos no existen: ${faltantes.join(', ')}`);
}

// Verificar que count de actualización coincida
if (updateResult !== numerosValidos.length) {
    throw new Error(
        `Inconsistencia: actualizados ${updateResult} de ${numerosValidos.length}`
    );
}
```

#### 💾 Sanitización de Datos
```javascript
nombre_cliente: (datos.nombreCliente || '').trim().slice(0, 100),
estado_cliente: (datos.estadoCliente || '').trim().slice(0, 50),
telefono_cliente: (datos.telefonoCliente || '').trim().slice(0, 20),
// Redondear dinero a 2 decimales
precio_unitario: Math.round(datos.precioUnitario * 100) / 100,
```

#### 📝 Logging Detallado
```javascript
console.log('[BoletoService] Orden completada:', { 
    ordenId, 
    boletos: numerosValidos.length,
    total: ordenData.total
});
```

---

### 3. Backend - Endpoint HTTP (server.js)

#### 🎯 Validación de Request
```javascript
// 1. Validar estructura JSON
if (!orden.cliente || typeof orden.cliente !== 'object') {
    return res.status(400).json({ success: false, message: 'Cliente requerido' });
}

// 2. Validar ranges
if (orden.boletos.length > 1000) {
    return res.status(400).json({ success: false, message: 'Máx. 1000 boletos' });
}

// 3. Validar formatos
if (!esTelefonoValido(whatsapp)) {
    return res.status(400).json({ success: false, message: 'Teléfono inválido' });
}
```

#### 🔄 Manejo de Errores Específicos
```javascript
if (serviceError.message.includes('Boletos no disponibles')) {
    return res.status(409).json({...}); // 409 Conflict
}
if (serviceError.message === 'DUPLICATE_ORDER') {
    return res.status(409).json({...}); // 409 Conflict
}
if (serviceError.message.includes('no existe')) {
    return res.status(404).json({...}); // 404 Not Found
}
```

#### 🆔 Error Tracking
```javascript
const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
log('error', 'POST /api/ordenes error', { 
    errorId,           // Identificar en logs
    error: error.message,
    stack: error.stack?.split('\n').slice(0, 3).join(' | '),
    ordenId: ordenId,
    ip: req.ip
});

// Responder con errorId para debugging
return res.status(500).json({ 
    success: false, 
    errorId: errorId,  // Cliente puede reportar esto
    error: isDevMode ? error.message : undefined
});
```

#### 🛡️ Prevención de Double-Send
```javascript
if (!res.headersSent) {
    return res.status(500).json({...});
}
```

---

## 🚀 Escenarios Cubiertos

### Escenario 1: Error Temporal de Red
**Qué pasa**: Cliente pierde conexión por 3 segundos
**Cobertura**:
- ✅ Timeout: Detectado en 15s
- ✅ Reintento automático: 3 intentos
- ✅ Backoff: Espera exponencial
- ✅ Usuario ve: "Reintentando..." → Éxito o error claro

### Escenario 2: Boletos Ya Comprados
**Qué pasa**: Otro cliente compró los mismos boletos
**Cobertura**:
- ✅ Verificación de disponibilidad ANTES de lock
- ✅ Lock exclusivo DURANTE actualización
- ✅ Transacción rollback automático
- ✅ Respuesta 409 con boletos conflictivos
- ✅ Usuario ve: "Estos boletos ya fueron comprados: 123, 456"

### Escenario 3: Orden Duplicada (User Rage-Clicks)
**Qué pasa**: Usuario hace clic 3 veces en "Apartar"
**Cobertura**:
- ✅ Flag `window.guardandoOrden` previene requests múltiples
- ✅ BD rechaza segunda orden con error DUPLICATE_ORDER
- ✅ Usuario ve: "Esta orden ya existe"
- ✅ No hay cobros duplicados

### Escenario 4: Error en la BD
**Qué pasa**: PostgreSQL se desconecta
**Cobertura**:
- ✅ Transacción rollback automático
- ✅ Error capturado con stack trace
- ✅ Error ID para tracking
- ✅ Usuario ve: "Error al guardar orden [ERR-xxx]"
- ✅ Logs contienen toda la información

### Escenario 5: Cliente Cierra Tab Antes de Confirmar
**Qué pasa**: Orden creada pero confirmación nunca se muestra
**Cobertura**:
- ✅ Orden guardada en BD primero
- ✅ Orden guardada en localStorage como backup
- ✅ Usuario puede recuperar en "Mis Boletos"
- ✅ Expiration service limpia órdenes vencidas

### Escenario 6: Datos Inválidos Enviados
**Qué pasa**: Frontend envía boletos inválidos o precio 0
**Cobertura**:
- ✅ Frontend valida ANTES de enviar
- ✅ Backend valida NUEVAMENTE (defense in depth)
- ✅ Servicio valida ranges y tipos
- ✅ Transacción no se inicia si fallan validaciones
- ✅ Respuesta 400 con error específico

---

## 📋 Checklist para Producción

- [x] Validaciones en múltiples capas (frontend + backend)
- [x] Timeouts en requests (15s)
- [x] Reintentos automáticos con backoff
- [x] Prevención de double-submit
- [x] Transacciones atómicas en BD
- [x] Locks exclusivos para race conditions
- [x] Error tracking con IDs únicos
- [x] Manejo específico de cada tipo de error
- [x] Rollback automático en fallos
- [x] Sanitización de inputs
- [x] Validación post-operación
- [x] Logging detallado para debugging
- [x] Modo development para más detalles
- [x] Prevención de double-send en responses

---

## 🔧 Monitoreo Recomendado

### Logs a Revisar Regularmente
```bash
# Órdenes exitosas
grep "Orden creada exitosamente" server.log

# Intentos de boletos duplicados
grep "409.*conflicto" server.log

# Órdenes duplicadas (rage-clicks)
grep "DUPLICATE_ORDER" server.log

# Errores en BD
grep "POST /api/ordenes error" server.log | grep "5[0-9][0-9]"

# Timeouts
grep "AbortError\|timeout" server.log
```

### Métricas a Monitorear
- Tiempo promedio de guardado de orden
- Tasa de éxito / fallos
- Tasa de reintentos
- Órdenes duplicadas (debería ser 0)
- Errores 500 (debería ser 0 o muy bajo)

---

## 🎓 Notas de Implementación

Esta implementación está diseñada para **hosting en producción con alto tráfico**:

1. **Sin estado**: Cada request es independiente
2. **Idempotente**: Ordenar 2 veces = solo 1 orden
3. **Resiliente**: Puede fallar temporalmente sin perder datos
4. **Observable**: Todos los errores tienen ID para tracking
5. **Rápida**: Validaciones eficientes, locks mínimos
6. **Segura**: Sanitización de inputs, SQL injection proof

Está listo para **Railway, Render, Vercel o cualquier PaaS** ✅

