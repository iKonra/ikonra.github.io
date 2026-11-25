import { useEffect, useRef } from 'react'
import { J, damp, scrollToT } from '../universe/state'
import { prefersReducedMotion } from './perf'

// Un solo requestAnimationFrame para toda la interfaz que acompaña el viaje. Lleva su propio t suavizado
// (igual al de la cámara), así funciona aunque el 3D no exista.

type Tick = (t: number, dt: number) => void
const subs = new Set<Tick>()
let raf = 0, last = 0, t = -1
const still = prefersReducedMotion()

function frame(time: number) {
  const dt = Math.min((time - (last || time)) / 1000, 0.05)
  last = time
  const target = J.force ?? scrollToT(scrollY)
  t = t < 0 || still ? target : damp(t, target, 6, dt)
  subs.forEach(f => f(t, dt))
  raf = subs.size ? requestAnimationFrame(frame) : 0
}

export function useTicker(cb: Tick) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    const f: Tick = (a, b) => ref.current(a, b)
    subs.add(f)
    if (!raf) { last = 0; raf = requestAnimationFrame(frame) }
    return () => { subs.delete(f) }
  }, [])
}
