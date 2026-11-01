# Despliegue del sitio (`web/`)

El sitio es estático (Astro, `output: 'static'`): se compila en `web/dist/` y no necesita servidor ni variables de entorno.

## Probarlo en local

```bash
cd web
npm install
npm run build      # genera las páginas estáticas en dist/
npm run preview    # sirve dist/ en http://localhost:4321
```

Páginas generadas: `/`, `/nivel/1` a `/nivel/6` (los seis temas), `/cierre`, `/fuentes` y `/glosario`.

## Publicarlo (Vercel)

1. Importa este repositorio desde GitHub en Vercel.
2. Configura:
   - **Root Directory:** `web`
   - **Framework Preset:** Astro
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Cada `git push` a la rama principal redespliega el sitio.
