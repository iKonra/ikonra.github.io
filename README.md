# ikonra.github.io

Portfolio de Conrado De Napoli — React + Vite + [Motion](https://motion.dev) + Three.js (React Three Fiber), con componentes inspirados en [React Bits](https://reactbits.dev).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

## Editar contenido

Todo el texto (español e inglés), los proyectos y los links están en `src/i18n/content.ts`. Es la única fuente: de ahí salen la página, el HTML inicial, el título, la meta description y el Open Graph, así que no se desincronizan.

- `links`: GitHub, LinkedIn, email y CV. Lo que dejes en `''` no se muestra.
- Cada proyecto acepta, además de título y descripción: `period`, `features`, `metrics` (tarjetas con contador), `featured` (proyecto destacado, con `result` opcional), `game` (nombre, descripción y estado del juego), `stack` y `url`.
- Si agregás o sacás un proyecto, hay que mantener el orden en la lista `models` de `src/three/ProjectsScene.tsx` (un modelo 3D por proyecto) y su color en `fields` de `src/sections/Projects.tsx`.
- **CV**: poné el PDF en `public/cv.pdf`. El build avisa si falta.
- **Imagen al compartir el link**: `public/og.png` (1200×630).

## Qué hace el HTML inicial

`index.html` tiene marcadores (`<!--seo-head-->`, `<!--static-root-->`, `<!--boot-script-->`) que el plugin `seo` de `vite.config.ts` rellena con `src/seo/staticHtml.ts`: meta tags, Open Graph, Twitter Card, hreflang, datos estructurados (JSON-LD) y el texto completo en español e inglés. Se ve apenas llega el CSS y React lo reemplaza al montar. Los buscadores y las vistas previas de links leen eso sin ejecutar JavaScript. Las vistas previas siempre muestran la versión en español (el hosting es estático y no puede elegir idioma por URL).

## Rendimiento y accesibilidad

- **Reducir movimiento** (`prefers-reduced-motion`): sin scroll suave, Sobre mí y Proyectos pasan a versiones estáticas (sin pantallas fijas ni cortinas), el 3D de fondo se dibuja una sola vez y no hay cursor ni polvo de estrellas.
- **Modo liviano** (`html.lite`): se activa solo en equipos con 4 núcleos o menos, 4 GB de RAM o menos, ahorro de datos o "reducir movimiento". Baja la resolución del 3D, usa menos partículas, apaga las líneas de velocidad y deja el scroll nativo. Además, un monitor de fps baja de nivel si el equipo no sostiene los cuadros (completo → liviano → quieto). Se puede forzar con `?lite=1` o `?lite=0`. Ver `src/lib/perf.ts`.
- El 3D de Proyectos se crea cuando el navegador queda libre, y los modelos compilan sus shaders por adelantado para no trabar el scroll.

## Deploy

```bash
npm run deploy
```

Compila y sube `dist/` a la rama `gh-pages`. En el repo: **Settings → Pages → Source: Deploy from a branch → `gh-pages` / root**.
El workflow de Actions (`.github/workflows/deploy.yml`) queda como alternativa manual.

## Componentes

- `src/components/ui/` sigue la convención de shadcn (alias `@/`). Ahí está `parallax-scrolling.tsx` (Osmo, vía 21st.dev), con GSAP ScrollTrigger.
- `src/hooks/useLenis.ts` activa el scroll suave (Lenis) para todo el sitio, salvo en modo liviano o con "reducir movimiento".
- `src/components/effects.tsx` tiene efectos adaptados de motion-primitives: Magnetic y SlidingNumber.
- `src/components/ContactLinks.tsx` define los cuatro canales de contacto (header, barra fija en celular y sección Contacto).

## Créditos de imágenes

- Tierra, nubes y Luna (`public/textures/earth*.webp`, `moon.webp`): NASA, dominio público, tomadas de los ejemplos de three.js.
- Gigante gaseoso, planeta con anillos, anillos y nebulosa: generadas para este sitio. `public/og.png` usa el Saturno de `public/images`.
