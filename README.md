# Praxia Lens — Bot clasificador para Google Sites

Mini-app que ejecuta el clasificador de tareas con IA y se **incrusta** dentro de tu página de Google Sites. La llave de la API queda guardada en secreto en el servidor; nunca se expone al visitante.

## Qué hay aquí
- `index.html` — la interfaz del bot (lo que se ve dentro de Google Sites).
- `api/classify.js` — función serverless que guarda la llave y habla con el modelo.

---

## Paso 0 · Crear la llave de API (lo único de pago, son centavos)
1. Entra a https://console.anthropic.com → crea una cuenta.
2. En **Billing**, añade un crédito pequeño (con $5 sobra para todo el proyecto).
3. En **API Keys**, crea una llave y **cópiala** (empieza con `sk-ant-...`). Guárdala; no la pegues en ningún archivo público.

> Modelo usado: `claude-haiku-4-5`. Cada clasificación cuesta una fracción de centavo.

## Paso 1 · Subir a GitHub (también cumple tu Sección 6)
1. Crea un repositorio nuevo en https://github.com (ej.: `praxia-lens`).
2. Sube estos archivos manteniendo la estructura: `index.html` en la raíz y la carpeta `api/` con `classify.js` adentro.

## Paso 2 · Publicar con Vercel
1. Entra a https://vercel.com e inicia sesión con tu cuenta de GitHub.
2. **Add New → Project →** importa el repositorio `praxia-lens`.
3. Antes de desplegar, abre **Environment Variables** y añade:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** tu llave `sk-ant-...`
4. **Deploy.** Al terminar tendrás una URL pública, ej.: `https://praxia-lens.vercel.app`
5. Ábrela y prueba el bot. Si clasifica, está listo.

## Paso 3 · Incrustar en Google Sites
1. En tu sitio: **Insertar → Insertar (Embed) → Por URL**, y pega la URL de Vercel.
   - Si prefieres controlar el tamaño, usa **Código de inserción** y pega:
     ```html
     <iframe src="https://TU-URL.vercel.app" width="100%" height="900" style="border:0;border-radius:18px"></iframe>
     ```
2. Ajusta el alto del recuadro para que el resultado se vea completo (≈900 px funciona bien).
3. Publica el sitio.

El resto de la página (clase, integrantes, logo, misión, visión, Canvas) lo armas nativo en Google Sites con la misma paleta: navy `#143352` y verde `#1F9D6B`.

---

## Alternativas al host
Funcionan igual con el mismo patrón (carpeta `/api` + variable de entorno secreta):
- **Netlify** — funciones en `netlify/functions/`.
- **Cloudflare Pages** — funciones en `/functions`.

Vercel es el más directo si ya usas GitHub.

## Notas
- El bot y la función están en el **mismo dominio**, así que no hay problemas de permisos entre ellos.
- Si el bot responde "Falta configurar ANTHROPIC_API_KEY", revisa el Paso 2.3 y vuelve a desplegar.
