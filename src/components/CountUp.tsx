import { animate, useInView } from 'motion/react'
import { useEffect, useRef } from 'react'

/** Contador animado al entrar en pantalla, inspirado en React Bits <CountUp />. */
export default function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView || !ref.current) return
    const el = ref.current
    const c = animate(0, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: v => { el.textContent = Math.round(v) + suffix } })
    return () => c.stop()
  }, [inView, to, suffix])
  return <span ref={ref}>0{suffix}</span>
}
