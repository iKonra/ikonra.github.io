// Analítica con Umami Cloud: sin cookies ni datos personales, así que no hace falta aviso de cookies.
// Mientras `id` esté vacío no se carga nada. En desarrollo (o con ?debug) los eventos solo se muestran en la consola.
// Para no contar tus propias visitas: abrir el sitio una vez con ?analytics=off en cada navegador (se revierte con ?analytics=on).
// El plan gratis cuenta cada vista, cada evento y cada propiedad de un evento: por eso casi todos los eventos van sin datos.

export const UMAMI = {
  /** Website ID del panel de Umami (Settings → Websites → Edit → Tracking code). */
  id: 'bb37c637-74df-4b8c-a91b-ae156be378bb',
  script: 'https://cloud.umami.is/script.js',
  domains: ['ikonra.github.io'],
}

export type EventData = Record<string, string | number>
type Umami = { track: (name: string, data?: EventData) => void }
declare global { interface Window { umami?: Umami } }

const OFF_KEY = 'umami.disabled'
const queue: [string, EventData | undefined][] = []
const sent = new Set<string>()
let started = false, live = false, debug = false

export function initAnalytics() {
  if (started) return
  started = true
  const url = new URL(location.href)
  const pref = url.searchParams.get('analytics')
  let off = false
  try {
    if (pref === 'off') localStorage.setItem(OFF_KEY, '1')
    if (pref === 'on') localStorage.removeItem(OFF_KEY)
    off = !!localStorage.getItem(OFF_KEY)
  } catch {}
  if (pref === 'off' || pref === 'on') {
    console.info(off ? 'Analítica desactivada en este navegador: tus visitas no se cuentan.' : 'Analítica activada en este navegador.')
    url.searchParams.delete('analytics')
    history.replaceState(history.state, '', url)
  }
  debug = import.meta.env.DEV || url.searchParams.has('debug')
  live = import.meta.env.PROD && !!UMAMI.id && !off && !debug && UMAMI.domains.includes(location.hostname)
  if (!live) return

  const s = document.createElement('script')
  s.src = UMAMI.script
  s.async = true
  s.dataset.websiteId = UMAMI.id
  s.dataset.domains = UMAMI.domains.join(',')
  // los saltos entre secciones cambian el #: sin esto cada uno contaría como otra página vista
  s.dataset.excludeHash = 'true'
  // Core Web Vitals de visitantes reales (LCP, INP, CLS)
  s.dataset.performance = 'true'
  s.onload = () => { for (const [name, data] of queue.splice(0)) window.umami?.track(name, data) }
  document.head.appendChild(s)
}

/** Registra un evento. Si el script todavía no cargó, queda en cola (si lo bloquea un adblocker, se pierde sin errores). */
export function track(name: string, data?: EventData) {
  if (debug) console.info('%c[analytics]', 'color:#7c86ff;font-weight:600', name, data ?? '')
  if (!live) return
  if (window.umami) window.umami.track(name, data)
  else if (queue.length < 40) queue.push([name, data])
}

/** Igual que `track`, pero una sola vez por visita. */
export function trackOnce(name: string, data?: EventData) {
  if (sent.has(name)) return
  sent.add(name)
  track(name, data)
}
