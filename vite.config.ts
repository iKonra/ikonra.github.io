import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { bootScript, renderBody, renderHead } from './src/seo/staticHtml'

/** Inyecta en index.html el texto inicial y las meta tags (generados desde content.ts) y precarga la tipografía del hero. */
function seo(): Plugin {
  return {
    name: 'seo-static-html',
    buildStart() {
      if (!existsSync(fileURLToPath(new URL('./public/cv.pdf', import.meta.url)))) {
        this.warn('Falta public/cv.pdf: el botón "Descargar CV" va a dar 404 hasta que lo agregues.')
      }
      if (!existsSync(fileURLToPath(new URL('./public/og.png', import.meta.url)))) {
        this.warn('Falta public/og.png: el link compartido no va a mostrar imagen.')
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const out = html
          .replace('<!--seo-head-->', renderHead())
          .replace('<!--boot-script-->', `<script>${bootScript}</script>`)
          .replace('<!--static-root-->', renderBody())
        // En el build, precarga el subset latino de Bricolage para que el nombre no "salte" al cambiar de fuente
        const font = Object.keys(ctx.bundle ?? {}).find(f => /bricolage-grotesque-latin-opsz-normal-.*\.woff2$/.test(f))
        const tags = font
          ? [{ tag: 'link', injectTo: 'head-prepend' as const, attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${font}`, crossorigin: '' } }]
          : []
        return { html: out, tags }
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), seo()],
  base: '/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2020',
    // three.js vive en un chunk diferido (solo lo pide el hero 3D)
    chunkSizeWarningLimit: 1000,
  },
})
