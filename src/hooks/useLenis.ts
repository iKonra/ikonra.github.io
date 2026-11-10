import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isLite, prefersReducedMotion } from '../lib/perf'

gsap.registerPlugin(ScrollTrigger)

/** Scroll suave global (Lenis) sincronizado con GSAP ScrollTrigger. Se monta una sola vez en App. En equipos lentos o con "reducir movimiento" se usa el scroll nativo. */
export function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion() || isLite()) return
    const lenis = new Lenis({ anchors: { offset: -72 } })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    document.documentElement.classList.add('lenis')

    let stopped = false
    const stop = () => {
      if (stopped) return
      stopped = true
      gsap.ticker.remove(tick)
      lenis.destroy()
      document.documentElement.classList.remove('lenis')
    }
    // Si el sitio baja a modo liviano en pleno uso (fps bajos), se devuelve el scroll al navegador
    addEventListener('perf:lite', stop)
    return () => { removeEventListener('perf:lite', stop); stop() }
  }, [])
}
