import { useEffect, useRef, type CSSProperties } from 'react'
import { isLite, prefersReducedMotion } from '../lib/perf'

type Props = {
  text: string
  radius?: number
  from?: number
  to?: number
  /** Gravedad cero: las letras flotan apenas, y se abren cuando el contenedor define --fly. */
  drift?: boolean
}

/** Desvío de cada letra: fijo por posición (nada al azar en el render). */
function driftVars(i: number) {
  const a = i * 2.399963
  return {
    '--fr': `${(Math.sin(a * 1.7) * 50).toFixed(0)}deg`,
    '--dx': `${(Math.cos(a * 1.3) * 0.022).toFixed(4)}em`, '--dy': `${(0.02 + Math.abs(Math.sin(a)) * 0.026).toFixed(4)}em`, '--dr': `${(Math.sin(a * 0.9) * 1.5).toFixed(2)}deg`,
    '--dt': `${(6 + ((i * 5) % 7) * 0.7).toFixed(1)}s`, '--dd': `${(-i * 0.83).toFixed(2)}s`,
  } as CSSProperties
}

/**
 * Inspirado en React Bits <VariableProximity />: el peso de cada letra crece cuanto más cerca está el cursor.
 * En pantallas táctiles el peso ondula solo. Escribe estilos directo al DOM, sin re-renders.
 * Con "reducir movimiento" o en equipos lentos el texto queda quieto.
 */
export default function VariableProximity({ text, radius = 260, from = 380, to = 800, drift = false }: Props) {
  const root = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion() || isLite()) return
    const letters = [...el.querySelectorAll<HTMLSpanElement>('[data-letter]')]
    // Con `drift`, cada letra sale despedida desde el centro del texto: el orden se conserva
    const spread = () => {
      const box = el.parentElement!
      const cx = box.offsetWidth * 0.45, cy = box.offsetHeight / 2
      letters.forEach(l => {
        l.style.setProperty('--fx', `${(((l.offsetLeft - box.offsetLeft + l.offsetWidth / 2 - cx) / cx) * 62).toFixed(1)}vw`)
        l.style.setProperty('--fy', `${(((l.offsetTop - box.offsetTop + l.offsetHeight / 2 - cy) / cy) * 46).toFixed(1)}vh`)
      })
    }
    if (drift) { spread(); document.fonts?.ready.then(spread) }
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
    let px = -9999, py = -9999, raf = 0, inView = true
    const current = letters.map(() => from)

    const frame = (time: number) => {
      raf = 0
      let pending = false
      letters.forEach((l, i) => {
        let target: number
        if (fine) {
          const r = l.getBoundingClientRect()
          const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2))
          const f = Math.max(0, 1 - d / radius)
          target = from + (to - from) * f * f * (3 - 2 * f)
        } else {
          target = from + (to - from) * (0.5 + 0.5 * Math.sin(time / 700 - i * 0.45))
        }
        current[i] += (target - current[i]) * 0.18
        if (Math.abs(target - current[i]) > 0.5) pending = true
        l.style.fontVariationSettings = `'wght' ${current[i].toFixed(0)}`
      })
      // Sigue animando mientras queden letras en camino, o siempre en modo ondulación
      if (inView && (pending || !fine)) raf = requestAnimationFrame(frame)
    }
    const kick = () => { if (!raf && inView) raf = requestAnimationFrame(frame) }
    const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; kick() }
    const onScroll = () => kick()
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; kick() })
    io.observe(el)
    if (fine) { addEventListener('pointermove', onMove, { passive: true }); addEventListener('scroll', onScroll, { passive: true }) }
    kick()
    return () => { io.disconnect(); removeEventListener('pointermove', onMove); removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [text, radius, from, to, drift])

  let i = 0
  return (
    <span ref={root} className={drift ? 'vp vp-drift' : 'vp'}>
      <span className="sr-only">{text}</span>
      {text.split(' ').map((word, wi) => (
        <span key={wi} className="vp-word" aria-hidden>
          {[...word].map(ch => {
            const k = i++
            return <span key={k} data-letter className="vp-letter" style={{ fontVariationSettings: `'wght' ${from}`, ...(drift ? driftVars(k) : {}) }}>{ch}</span>
          })}
        </span>
      ))}
    </span>
  )
}
