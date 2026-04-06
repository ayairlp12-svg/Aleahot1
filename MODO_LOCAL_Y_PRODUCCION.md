# Modo Local Y Produccion

Esta guia explica como cambiar este proyecto entre:

- modo local
- modo produccion

La idea es que ahora casi todo se controle desde:

- [js/deploy-config.js](/Users/ayair/Desktop/rifas-web/js/deploy-config.js)

## Regla principal

Si vas a trabajar local:
- normalmente no necesitas cambiar nada

Si vas a desplegar:
- cambia solo el bloque `production` en `js/deploy-config.js`

---

## 1. Como funciona ahora

El archivo:

- [js/deploy-config.js](/Users/ayair/Desktop/rifas-web/js/deploy-config.js)

decide estas cosas:

- `apiBase`
- `publicBase`
- `socketScriptUrl`
- si el entorno es local o produccion

Tambien actualiza en runtime:
- `meta[name="rifaplus-api-base"]`
- `meta[property="og:url"]`

---

## 2. Modo local

### Cuando se activa

Se activa automaticamente si abres la web desde:

- `localhost`
- `127.0.0.1`

### Que usa en local

Actualmente el preset local usa:

```js
local: {
    apiBase: 'http://localhost:5001',
    publicBase: origin,
    socketScriptUrl: 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.min.js'
}
```

### Que debes hacer para trabajar local

1. Levanta el backend:

```bash
cd backend
npm start
```

2. Abre el frontend con Live Server o servidor local.

Ejemplo:
- `http://127.0.0.1:5500`
- `http://localhost:5500`

3. Verifica en DevTools > Network que la app haga requests a:

```text
http://localhost:5001
```

### En local no debes cambiar

No deberias cambiar:
- metas HTML
- URLs de API en varios archivos
- `config.js`

Si estas en localhost, `deploy-config.js` ya lo resuelve.

---

## 3. Modo produccion

### Que debes cambiar

Abre:

- [js/deploy-config.js](/Users/ayair/Desktop/rifas-web/js/deploy-config.js)

Busca este bloque:

```js
production: {
    apiBase: '',
    publicBase: '',
    socketScriptUrl: SOCKET_CDN_URL
}
```

Y reemplazalo por tus URLs reales.

Ejemplo:

```js
production: {
    apiBase: 'https://tu-backend.up.railway.app',
    publicBase: 'https://tu-frontend.pages.dev',
    socketScriptUrl: SOCKET_CDN_URL
}
```

### Que significa cada valor

- `apiBase`
  - URL del backend en produccion
  - ejemplo: Railway

- `publicBase`
  - URL publica del frontend
  - ejemplo: Cloudflare Pages o dominio propio

- `socketScriptUrl`
  - URL del cliente Socket.IO
  - normalmente no necesitas cambiarla

---

## 4. Ejemplo real de produccion

Si tu deploy fuera:

- frontend: `https://demo1m.pages.dev`
- backend: `https://demo1m-production.up.railway.app`

entonces seria:

```js
production: {
    apiBase: 'https://demo1m-production.up.railway.app',
    publicBase: 'https://demo1m.pages.dev',
    socketScriptUrl: SOCKET_CDN_URL
}
```

---

## 5. Que hacer despues de cambiar a produccion

1. Guarda cambios en `js/deploy-config.js`
2. Sube el proyecto al repo
3. Despliega frontend
4. Despliega backend
5. Prueba:
- home
- compra
- ayuda
- cuentas de pago
- mis boletos
- admin
- búsqueda avanzada
- crear orden
- subir comprobante

6. Revisa en el navegador que las requests vayan al backend correcto

---

## 6. Que hacer despues de volver a local

1. Asegurate de que el bloque `local` siga así:

```js
local: {
    apiBase: 'http://localhost:5001',
    publicBase: origin,
    socketScriptUrl: SOCKET_CDN_URL
}
```

2. Levanta backend local
3. Abre frontend local
4. Confirma que las requests van a `localhost:5001`

---

## 7. Como saber en que modo estas

Puedes verlo en consola del navegador.

`deploy-config.js` imprime algo como:

```text
⚙️ [DeployConfig] Entorno resuelto: { mode: 'local', ... }
```

o

```text
⚙️ [DeployConfig] Entorno resuelto: { mode: 'production', ... }
```

---

## 8. Que no deberias tocar ya

Con esta centralizacion, normalmente ya no deberias estar cambiando manualmente:

- `meta rifaplus-api-base` en cada HTML
- URLs del backend en muchos archivos
- referencias viejas de Railway/Cloudflare en la app

La idea es tocar solo:

- [js/deploy-config.js](/Users/ayair/Desktop/rifas-web/js/deploy-config.js)

---

## 9. Checklist rapido

### Para local

1. Backend arriba en `localhost:5001`
2. Frontend abierto en localhost
3. Requests apuntando a localhost

### Para produccion

1. `production.apiBase` correcto
2. `production.publicBase` correcto
3. Deploy hecho
4. Requests apuntando al backend real
5. Flujo completo probado

---

## 10. Regla practica final

Si una nueva copia del proyecto sera para desarrollar:
- dejalo en local

Si la nueva copia sera para publicar:
- cambia solo el bloque `production`

Ese es el nuevo flujo correcto.
