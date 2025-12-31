# Respaldo y checklist para migración `boletos -> jsonb`

Este documento contiene pasos seguros y los comandos sugeridos para respaldar la base de datos PostgreSQL, aplicar la migración `boletos -> jsonb` en un entorno de staging y validar el resultado. NO ejecutes la migración en producción sin confirmar respaldos y pruebas en staging.

---

Requisitos previos:
- Tener `pg_dump` y `pg_restore` instalados (cliente PostgreSQL).
- Tener `NODE_ENV`, `DATABASE_URL` (o variables `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) disponibles.
- Ejecutar comandos desde la máquina con acceso a la base de datos (staging/prod).
- Detener el servidor Node.js antes de correr migraciones en la misma base (opcional pero recomendado).

1) Crear respaldo completo (formato custom, rápido y fiable)

Usando la variable `DATABASE_URL` (recomendada):

```bash
# Timestamp para nombre de archivo
TS=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump --dbname="$DATABASE_URL" -Fc -f rifaplus_backup_${TS}.dump
```

Si no tienes `DATABASE_URL` pero sí variables por separado:

```bash
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p ${DB_PORT:-5432} -U "$DB_USER" -Fc -f rifaplus_backup_${TS}.dump "$DB_NAME"
unset PGPASSWORD
```

Verificar tamaño y que el archivo exita:

```bash
ls -lh rifaplus_backup_${TS}.dump
```

2) (Opcional) Exportar sólo tabla `ordenes` como JSON para inspección rápida

```bash
psql "$DATABASE_URL" -Atc "COPY (SELECT row_to_json(t) FROM (SELECT * FROM ordenes ORDER BY created_at DESC LIMIT 1000) t) TO STDOUT" > ordenes_preview_${TS}.ndjson
```

3) Checklist seguro antes de migrar en staging

- [ ] Confirmar respaldo `.dump` válido.
- [ ] Detener servidor Node.js (ej: `pm2 stop rifaplus` o `pkill -f node` en staging) o `npm stop` según setup.
- [ ] Ejecutar migración dentro de una ventana de mantenimiento pequeña.
- [ ] Ejecutar migración en staging primero y validar endpoints clave:
  - `GET /api/admin/boleto-simple/10`
  - `GET /api/admin/ordenes?limit=1`
  - `GET /api/admin/ordenes-estado-resumen`
- [ ] Validar que `ordenes.boletos` es tipo `jsonb`:

```sql
-- en psql
\d+ ordenes
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='ordenes' AND column_name='boletos';
```

4) Comandos para aplicar migraciones (Knex)

Desde el directorio `backend` del repo:

```bash
# (detener servidor primero)
cd /path/to/rifas-web/backend
npx knex migrate:latest --knexfile ./knexfile.js
```

Si necesitas ejecutar con `DATABASE_URL` env:

```bash
DATABASE_URL="$DATABASE_URL" npx knex migrate:latest --knexfile ./knexfile.js
```

5) Validación post-migración (rápida)

- Comprobar columna `boletos` ahora es `jsonb`.
- Hacer una consulta rápida para ver que valores se parsean correctamente:

```sql
-- Buscar órdenes que contengan el boleto 10
SELECT id, numero_orden, estado, boletos FROM ordenes WHERE CAST(boletos AS text) LIKE '%10%' LIMIT 10;
```

- Probar endpoint admin específico (usar token admin):

```bash
# Obtener token (staging) y luego
curl -s -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:5001/api/admin/boleto-simple/10"
```

6) Rollback (si algo falla)

- `knex migrate:down` puede devolver la última migración, pero la migración `ALTER COLUMN TYPE` puede no ser fácilmente reversible si los datos ya cambiaron. Siempre conservar el `.dump` y, si es necesario, restaurar la BD completa:

```bash
# Restaurar (ATENCIÓN: esto borra datos actuales en la BD destino)
pg_restore --dbname="$DATABASE_URL" --clean --no-owner --format=custom rifaplus_backup_${TS}.dump
```

7) Notas y consideraciones

- La migración incluida en `backend/db/migrations/20251229_convert_boletos_to_jsonb.js` intenta convertir strings CSV y JSON a `jsonb`. Revisión manual recomendada si los datos históricos tienen formatos extraños.
- Ejecutar scripts de limpieza (`backend/scripts/clean_malformed_boletos.js`) antes de migrar puede reducir riesgos.
- Mantener `rifaplus_backup_*.dump` en almacenamiento seguro antes de modificar prod.

---

Si quieres, puedo: (A) verificar `DATABASE_URL` y listar tamaño de la BD (no correré migraciones sin tu autorización), (B) preparar y ejecutar la migración en staging si confirmas, o (C) revertir la desconexión de git cuando lo solicites.
