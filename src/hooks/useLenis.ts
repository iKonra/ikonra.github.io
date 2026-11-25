import { useEffect } from 'react'
import Lenis from 'lenis'
import { isLite, prefersReducedMotion } from '../lib/perf'
import { setLenis } from '../lib/scroll'

/** Scroll suave global. Se monta una sola vez en App. En equipos lentos o con "reducir movimiento" se usa el scroll nativo. */
export function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion() || isLite()) return
    const lenis = new Lenis()
    let raf = requestAnimationFrame(function tick(time) {
      lenis.raf(time)
      raf = requestAnimationFrame(tick)
    })
    setLenis(lenis)
    document.documentElement.classList.add('lenis')

    let stopped = false
    const stop = () => {
      if (stopped) return
      stopped = true
      cancelAnimationFrame(raf)
      setLenis(null)
      lenis.destroy()
      document.documentElement.classList.remove('lenis')
    }
    // Si el sitio baja a modo liviano en pleno uso (fps bajos), se devuelve el scroll al navegador
    addEventListener('perf:lite', stop)
    return () => { removeEventListener('perf:lite', stop); stop() }
  }, [])
}
