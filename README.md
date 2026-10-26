# ikonra.github.io

Portfolio de Conrado De Napoli — React + Vite + [Motion](https://motion.dev) + Three.js (React Three Fiber), con componentes inspirados en [React Bits](https://reactbits.dev).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

## Editar contenido

Todo el texto (español e inglés), los proyectos y los links están en `src/i18n/content.ts`.
Para agregar LinkedIn, email o el link de TwoBones Studio, completá `links` en ese archivo.

## Deploy

`.github/workflows/deploy.yml` compila y publica en GitHub Pages en cada push a `main`.
En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Componentes

- `src/components/ui/` sigue la convención de shadcn (alias `@/`). Ahí está `parallax-scrolling.tsx` (Osmo, vía 21st.dev), con GSAP ScrollTrigger.
- `src/hooks/useLenis.ts` activa el scroll suave (Lenis) para todo el sitio.
- `src/components/effects.tsx` tiene efectos adaptados de motion-primitives: TextScramble, Magnetic y SlidingNumber.
