// Efectos adaptados de motion-primitives (comunidad de 21st.dev): TextScramble, Magnetic y SlidingNumber.
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'

const lower = 'abcdefghijklmnopqrstuvwxyz'

/** Texto que se "decodifica" letra por letra cada vez que cambia. */
export function TextScramble({ text, duration = 0.6, speed = 0.03, trigger = true }: { text: string; duration?: number; speed?: number; trigger?: boolean }) {
  const [shown, setShown] = useState(trigger ? '' : text)

  useEffect(() => {
    if (!trigger) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(text); return }
    const steps = duration / speed
    let step = 0
    const id = setInterval(() => {
      const progress = step / steps
      let out = ''
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        out += ch === ' ' || progress * text.length > i ? ch : lower[Math.floor(Math.random() * lower.length)]
      }
      setShown(out)
      if (++step > steps) { clearInterval(id); setShown(text) }
    }, speed * 1000)
    return () => clearInterval(id)
  }, [text, trigger, duration, speed])

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{shown || ' '}</span>
    </>
  )
}

/** El hijo se acerca al cursor dentro de su área. Solo con mouse. */
export function Magnetic({ children, intensity = 0.3 }: { children: ReactNode; intensity?: number }) {
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 })
  const onMove = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * intensity)
    y.set((e.clientY - (r.top + r.height / 2)) * intensity)
  }
  const reset = () => { x.set(0); y.set(0) }
  return (
    <motion.span className="magnetic" style={{ x, y }} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </motion.span>
  )
}

const digitSpring = { stiffness: 280, damping: 24, mass: 0.3 }

function Num({ mv, n }: { mv: MotionValue<number>; n: number }) {
  const y = useTransform(mv, latest => {
    const offset = (10 + n - (latest % 10)) % 10
    return `${offset > 5 ? offset - 10 : offset}em`
  })
  return <motion.span className="digit-num" style={{ y }}>{n}</motion.span>
}

function Digit({ value, place }: { value: number; place: number }) {
  const target = Math.floor(value / place) % 10
  const mv = useSpring(target, digitSpring)
  useEffect(() => { mv.set(target) }, [mv, target])
  return (
    <span className="digit">
      <span style={{ visibility: 'hidden' }}>0</span>
      {Array.from({ length: 10 }, (_, i) => <Num key={i} mv={mv} n={i} />)}
    </span>
  )
}

/** Número cuyos dígitos ruedan al cambiar. */
export function SlidingNumber({ value }: { value: number }) {
  const digits = String(Math.abs(Math.floor(value))).split('')
  const ref = useRef<HTMLSpanElement>(null)
  return (
    <span ref={ref} className="sliding-number" aria-label={String(value)}>
      {digits.map((_, i) => {
        const place = 10 ** (digits.length - i - 1)
        return <Digit key={place} value={value} place={place} />
      })}
    </span>
  )
}
