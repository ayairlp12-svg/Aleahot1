# Nueva Version Para Otro Cliente

Esta guia sirve para crear una nueva version del proyecto sin arrastrar datos, branding o configuraciones del cliente anterior.

La idea es simple:
- copiar la base actual
- cambiar solo configuracion, branding y despliegue
- probar
- publicar

No deberias rehacer el proyecto desde cero cada vez.

## 1. Duplicar el proyecto

Haz una copia completa de la carpeta del proyecto.

Ejemplo:

```bash
cp -R rifas-web rifas-cliente-nuevo
```

Renombra la carpeta con algo claro:
- `rifas-cliente-demo`
- `rifas-sorteo-moto`
- `rifas-100k-cliente-x`

Trabaja siempre sobre la copia, no sobre el proyecto anterior.

## 2. Decidir si sera repo nuevo

Si el nuevo cliente tendra su propio repositorio, reinicia Git.

```bash
rm -rf .git
git init
git add .
git commit -m "Base project for new client"
```

Si solo sera otra variante temporal en tu misma maquina, puedes dejar Git como esta, pero para clientes reales conviene repo nuevo.

## 3. Cambiar la configuracion del cliente

El archivo principal a revisar primero es:

- [backend/config.json](/Users/ayair/Desktop/rifas-web/backend/config.json)

Debes actualizar como minimo:
- nombre del organizador
- eslogan
- logo
- imagen principal
- redes sociales
- WhatsApp
- correo
- nombre del sorteo
- nombre de la edicion
- descripcion
- total de boletos
- precio por boleto
- fecha y hora del sorteo
- bonos
- descuentos
- oportunidades
- promociones
- cuentas de pago
- SEO
- colores/tema

## 4. Limpiar branding viejo

Antes de seguir, busca textos del cliente anterior.

Ejemplo:

```bash
rg "SaDev|SORTEOS YEPE|SORTEOS EL TREBOL|Sorteos Torres|RAM 1200|iPhone 15"
```

Si aparece algo del cliente anterior:
- revisa si es visible al usuario
- si si, cambialo o dejalo neutro
- si es un fallback tecnico, asegurate de que no muestre branding viejo

## 5. Revisar assets

Verifica si vas a cambiar:
- logo
- imagen principal
- galeria
- imagenes para Open Graph

Si el cliente tendra imagenes nuevas:
- subelas y enlazalas desde configuracion
- no dejes imágenes del cliente anterior

## 6. Crear base de datos nueva

Lo recomendable es:
- una base por cliente
o
- una base por sorteo activo

No mezcles clientes distintos en la misma base si puedes evitarlo.

Debes tener lista una nueva:
- `DATABASE_URL`

Si reutilizas una base:
- haz backup primero
- limpia registros del sorteo anterior
- vuelve a poblar boletos

## 7. Preparar variables de entorno

Revisa `backend/.env` y las variables del hosting.

Variables comunes:

```env
NODE_ENV=production
JWT_SECRET=...
DATABASE_URL=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CORS_ORIGINS=https://tu-frontend.pages.dev
PUBLIC_BASE_URL=https://tu-frontend.pages.dev
```

Y en Cloudflare Pages:

```env
RIFAPLUS_API_BASE=https://tu-backend.up.railway.app
```

## 8. Revisar deploy-config

Confirma que el frontend apunte al backend correcto.

Archivo a revisar:
- [js/deploy-config.js](/Users/ayair/Desktop/rifas-web/js/deploy-config.js)

Debes confirmar:
- `apiBase`
- `socketScriptUrl` si aplica

## 9. Probar localmente

Antes de subir nada, prueba local.

Checklist minimo:
- `index.html`
- `compra.html`
- `ayuda.html`
- `cuentas-pago.html`
- `mis-boletos.html`
- admin

Flujos a probar:
- carga de branding
- hero sin textos viejos
- compra manual
- maquina de la suerte
- búsqueda avanzada
- crear orden
- subir comprobante
- confirmar orden
- ver orden confirmada en mis boletos
- descarga de orden PDF
- modal de conflicto
- compartir link

## 10. Subir a GitHub

Si es repo nuevo:

```bash
git remote add origin TU_REPO
git branch -M main
git push -u origin main
```

## 11. Desplegar backend

En Railway:
- conectar repo
- `Root Directory = backend`
- `Start Command = npm start`
- cargar variables

Probar:
- `/api/public/config`
- `/api/public/boletos/stats`

## 12. Desplegar frontend

En Cloudflare Pages:
- conectar repo
- framework: `None`
- build command: vacio
- output directory: `/`

Agregar variable:

```env
RIFAPLUS_API_BASE=https://tu-backend.up.railway.app
```

## 13. Validacion en produccion

Prueba ya en las URLs reales:
- home
- compra
- búsqueda avanzada
- cuentas de pago
- mis boletos
- admin

Validaciones clave:
- branding correcto
- sin textos del cliente anterior
- sin logos viejos
- sin errores de CORS
- sin errores de CSP
- sin errores 500
- WhatsApp preview correcto

## 14. Checklist final antes de entregar

Confirma esto:
- nombre del cliente correcto
- nombre del sorteo correcto
- edición correcta
- precio correcto
- boletos correctos
- cuentas correctas
- redes correctas
- logo correcto
- imágenes correctas
- fechas correctas
- dominio correcto
- backend correcto
- base de datos correcta

## 15. Regla de oro

Para un cliente nuevo, normalmente solo deberias cambiar:
- configuracion
- branding
- imágenes
- variables/env
- dominio/deploy

No deberias tocar logica del sistema salvo que:
- encontraste un bug real
- vas a mejorar el producto base

## 16. Proceso resumido

Usa este orden siempre:

1. Copiar carpeta
2. Renombrar proyecto
3. Reiniciar Git si aplica
4. Cambiar `backend/config.json`
5. Revisar branding residual
6. Preparar nueva BD
7. Configurar variables
8. Probar local
9. Subir a GitHub
10. Desplegar Railway
11. Desplegar Cloudflare
12. Validar producción

## 17. Nota importante

Si alguna vez ves en la web algo como:
- nombre viejo del cliente
- premio viejo
- edición vieja
- logo viejo

antes de corregir a mano el HTML, haz esto:

1. revisa `backend/config.json`
2. revisa cache/localStorage
3. revisa `js/deploy-config.js`
4. revisa si ese texto es fallback visible

La meta es que cada nueva web salga de configuracion, no de hardcodes.
