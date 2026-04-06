# Conectar Una BD Nueva De Supabase Y Migrar La Estructura

Este documento explica solo lo importante para este caso:

- conectar una **base nueva** de Supabase
- correr la **migración correcta de estructura**
- validar que la BD quedó bien
- dejar lista la configuración base

Está pensado para este proyecto:

- frontend estático
- backend Node + Knex
- base de datos PostgreSQL en Supabase

---

## Objetivo

Cuando hagas una copia del proyecto para un cliente nuevo, lo normal es:

1. crear una BD nueva en Supabase
2. conectar esa BD al backend
3. crear la estructura de tablas e índices
4. subir la configuración del nuevo sorteo

La idea es que la base quede:

- limpia
- separada de la BD anterior
- lista para poblar boletos y operar

---

## Dónde se configura la BD

La conexión principal está en:

- [backend/.env](/Users/ayair/Desktop/rifas-web/backend/.env)

La variable más importante es:

```env
DATABASE_URL=
```

Si esa variable apunta a una BD, el backend usa esa BD.

---

## Resumen Rápido

Si ya tienes una Supabase nueva, estos son los pasos:

```bash
cd /Users/ayair/Desktop/rifas-web/backend
npm run migrate:baseline
npm run validate
npm run sync:config
npm start
```

Pero antes de eso debes poner la nueva `DATABASE_URL` en [backend/.env](/Users/ayair/Desktop/rifas-web/backend/.env).

Más abajo te explico todo con calma.

---

## Paso 1. Crear la nueva BD en Supabase

En Supabase:

1. crea un proyecto nuevo
2. espera a que termine de crearse
3. entra al proyecto
4. abre `Project Settings`
5. abre `Database`
6. copia la cadena de conexión PostgreSQL

Debe verse más o menos así:

```text
postgresql://usuario:password@host:5432/postgres?sslmode=require
```

Eso es lo que vas a pegar en `DATABASE_URL`.

---

## Paso 2. Conectar la nueva BD al proyecto

Abre:

- [backend/.env](/Users/ayair/Desktop/rifas-web/backend/.env)

Y deja `DATABASE_URL` apuntando a la nueva base:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/postgres?sslmode=require
```

Ejemplo:

```env
DATABASE_URL=postgresql://postgres.xxxxx:tu_password@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
```

Importante:

- no pongas la URL de la base anterior
- no dejes esta variable vacía si quieres migrar
- no necesitas tocar el código para cambiar de BD

---

## Paso 3. Verificar que la conexión funciona

En terminal:

```bash
cd /Users/ayair/Desktop/rifas-web/backend
npm run validate
```

Qué esperar en este punto:

- si la conexión está bien, el script logrará hablar con Supabase
- si la BD está vacía, puede marcar faltantes de estructura
- eso todavía es normal

La función de este paso es confirmar:

- que la URL es correcta
- que la contraseña funciona
- que sí estás conectado a la nueva BD

Si aquí falla, todavía no sigas.

Primero corrige:

- `DATABASE_URL`
- password
- proyecto de Supabase

---

## Paso 4. Elegir la migración correcta

Para este proyecto hay dos caminos:

### Opción A: BD nueva y vacía

Usa:

```bash
npm run migrate:baseline
```

Esta es la opción recomendada para una base nueva porque:

- no depende de todo el historial antiguo
- crea la estructura operativa actual
- es más limpia para empezar desde cero

### Opción B: BD ya existente

Usa:

```bash
npm run migrate
```

Esta opción sirve cuando:

- la base ya existía
- solo quieres aplicar migraciones pendientes

---

## Paso 5. Crear la estructura de la BD

Si la base es nueva, corre:

```bash
cd /Users/ayair/Desktop/rifas-web/backend
npm run migrate:baseline
```

Ese comando ya está definido en:

- [backend/package.json](/Users/ayair/Desktop/rifas-web/backend/package.json)

Y usa la baseline de:

- [20260325_0001_baseline_schema.js](/Users/ayair/Desktop/rifas-web/backend/db/migrations_baseline/20260325_0001_baseline_schema.js)

La baseline crea lo principal:

- `ordenes`
- `admin_users`
- `boletos_estado`
- `orden_oportunidades`
- `ganadores`
- `order_id_counter`
- `sorteo_configuracion`
- `ordenes_expiradas_log`

Y además crea índices críticos.

---

## Paso 6. Validar que la estructura quedó bien

Después de la migración, corre:

```bash
cd /Users/ayair/Desktop/rifas-web/backend
npm run validate
```

Ahora sí este paso ya no es solo para probar conexión.

Ahora lo usas para verificar que:

- las tablas existen
- los índices críticos existen
- no faltan piezas importantes

Si aquí marca faltantes críticos, no sigas todavía.

---

## Paso 7. Subir la configuración del nuevo sorteo a la BD

Este proyecto no trabaja solo con tablas vacías.  
También necesita guardar la configuración del sorteo en la base.

La configuración base sale de:

- [backend/config.json](/Users/ayair/Desktop/rifas-web/backend/config.json)

Antes de sincronizar, asegúrate de que este archivo ya tenga los datos del nuevo cliente:

- nombre del organizador
- nombre del sorteo
- precio del boleto
- total de boletos
- redes
- cuentas
- branding

Luego corre:

```bash
cd /Users/ayair/Desktop/rifas-web/backend
npm run sync:config
```

Ese comando:

- valida `config.json`
- lo guarda en `sorteo_configuracion`
- confirma que quedó sincronizado

---

## Paso 8. Arrancar el backend

Después de migrar y sincronizar config:

```bash
cd /Users/ayair/Desktop/rifas-web/backend
npm start
```

Si todo va bien, el backend debería arrancar sin errores de base de datos.

---

## Paso 9. Lo que todavía falta después de migrar

Tener la BD conectada y migrada **no significa que ya esté lista al 100%**.

Todavía faltan pasos operativos:

- inicializar boletos
- poblar oportunidades si aplica
- probar compra
- probar comprobante
- probar confirmación de orden

La migración crea la **estructura**.  
No crea automáticamente toda la data operativa del sorteo.

---

## Flujo Completo Recomendado

Si estás estrenando una BD nueva para un cliente nuevo, este es el flujo correcto:

1. crear el proyecto nuevo en Supabase
2. copiar la `DATABASE_URL`
3. pegarla en [backend/.env](/Users/ayair/Desktop/rifas-web/backend/.env)
4. revisar [backend/config.json](/Users/ayair/Desktop/rifas-web/backend/config.json)
5. correr:

```bash
cd /Users/ayair/Desktop/rifas-web/backend
npm run migrate:baseline
```

6. correr:

```bash
npm run validate
```

7. correr:

```bash
npm run sync:config
```

8. correr:

```bash
npm start
```

9. entrar al admin
10. inicializar boletos
11. probar el flujo completo

---

## Qué comando usar en cada caso

### Si la BD está nueva

Usa:

```bash
npm run migrate:baseline
```

### Si la BD ya existía

Usa:

```bash
npm run migrate
```

### Si quieres verificar estructura

Usa:

```bash
npm run validate
```

### Si quieres subir la config del sorteo a BD

Usa:

```bash
npm run sync:config
```

---

## Cómo saber si todo salió bien

Debes poder decir que la migración quedó bien si se cumple esto:

- `npm run migrate:baseline` terminó sin error
- `npm run validate` no marca faltantes críticos
- `npm run sync:config` confirma cliente y sorteo
- `npm start` arranca el backend sin error de BD

Si además quieres estar tranquilo de verdad, luego prueba:

- `/api/public/config`
- `/api/public/boletos/stats`
- orden de prueba
- confirmación desde admin

---

## Error común

Un error común es pensar:

- “ya conecté la BD, entonces ya está lista”

No.

Conectar la BD solo hace que el backend sepa a dónde apuntar.

Luego todavía necesitas:

1. crear estructura
2. validar estructura
3. subir configuración
4. poblar datos operativos

---

## Los 5 comandos importantes

Si ya pusiste la nueva `DATABASE_URL`, estos son los 5 comandos importantes:

```bash
cd /Users/ayair/Desktop/rifas-web/backend
npm run migrate:baseline
npm run validate
npm run sync:config
npm start
```

Y luego ya haces la parte operativa desde admin.

