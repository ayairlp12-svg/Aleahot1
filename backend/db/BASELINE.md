# Baseline de BD

Para una base nueva no conviene correr todo el historial de migraciones.

Este proyecto tiene una baseline pensada para dejar la BD nueva en un estado operativo actual con una sola migracion.

## Comando recomendado

```bash
cd backend
npm run migrate
```

`npm run migrate` ahora detecta automáticamente el tipo de BD:

- BD vacía: aplica `baseline` + `postbaseline`
- BD creada desde baseline: aplica solo `postbaseline`
- BD legacy con historial completo: aplica `db/migrations`

## Comandos manuales

Forzar baseline en una BD nueva:

```bash
cd backend
KNEX_MIGRATIONS_DIR=./db/migrations_baseline npx knex migrate:latest
```

Forzar historial legacy completo:

```bash
cd backend
npm run migrate:legacy
```

## Qué crea esta baseline

- estructura principal de `ordenes`
- `admin_users`
- `boletos_estado`
- `orden_oportunidades`
- `ganadores`
- `order_id_counter`
- `sorteo_configuracion`
- índices críticos actuales para performance y validación

## Qué no hace

- no corre seeds
- no crea boletos automáticamente
- no crea oportunidades automáticamente
- no copia datos históricos

## Después de baseline debes hacer esto

```bash
cd backend
npm run validate
npm run sync:config
```

Luego:

- inicializar boletos de la nueva rifa
- poblar oportunidades si aplica
- probar orden de compra, comprobante y confirmación

## Cuándo usar baseline manual

Úsala cuando:

- la base sea nueva
- quieras arrancar limpio
- no quieras depender del historial largo de migraciones

## Cuándo usar migrate normal

Usa `npm run migrate` cuando:

- quieres que el proyecto detecte la ruta correcta sin adivinar
- quieres que una BD nueva quede funcional desde la primera ejecución
- quieres evitar que una BD baseline intente correr el historial viejo

## Nota

Para Supabase, mantén `DATABASE_URL` configurada en:

- [backend/.env](/Users/ayair/Desktop/rifas-web/backend/.env)
