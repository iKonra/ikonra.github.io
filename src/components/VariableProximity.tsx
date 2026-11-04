import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { ease } from './motion'

type Props = {
  text: string
  radius?: number
  from?: number
  to?: number
  /** Letras que suben desde una máscara al montarse. */
  rise?: boolean
  delay?: number
}

/**
 * Inspirado en React Bits <VariableProximity />: el peso de cada letra crece cuanto más cerca está el cursor.
 * En pantallas táctiles el peso ondula solo. Escribe estilos directo al DOM, sin re-renders.
 */
export default function VariableProximity({ text, radius = 260, from = 380, to = 800, rise = false, delay = 0 }: Props) {
  const root = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const letters = [...el.querySelectorAll<HTMLSpanElement>('[data-letter]')]
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
  }, [text, radius, from, to])

  let i = 0
  return (
    <span ref={root} className="vp">
      <span className="sr-only">{text}</span>
      {text.split(' ').map((word, wi) => (
        <span key={wi} className="vp-word" aria-hidden>
          {[...word].map(ch => {
            const idx = i++
            return rise ? (
              <span key={idx} className="vp-mask">
                <motion.span
                  data-letter
                  className="vp-letter"
                  style={{ fontVariationSettings: `'wght' ${from}` }}
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ delay: delay + idx * 0.035, duration: 1, ease: ease.out }}
                >
                  {ch}
                </motion.span>
              </span>
            ) : (
              <span key={idx} data-letter className="vp-letter" style={{ fontVariationSettings: `'wght' ${from}` }}>{ch}</span>
            )
          })}
        </span>
      ))}
    </span>
  )
}
