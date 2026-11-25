// Efectos adaptados de motion-primitives (comunidad de 21st.dev): Magnetic y SlidingNumber.
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, type ReactNode, type PointerEvent } from 'react'

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

/** Inclinación 3D hacia el cursor, con un brillo que lo sigue. Solo con mouse. */
export function Tilt({ children, max = 9 }: { children: ReactNode; max?: number }) {
  const rx = useSpring(useMotionValue(0), { stiffness: 180, damping: 16, mass: 0.5 })
  const ry = useSpring(useMotionValue(0), { stiffness: 180, damping: 16, mass: 0.5 })
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
    ry.set((x - 0.5) * max * 2)
    rx.set((0.5 - y) * max * 2)
    e.currentTarget.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`)
    e.currentTarget.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`)
  }
  return (
    <motion.div className="tilt" style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }} onPointerMove={onMove} onPointerLeave={() => { rx.set(0); ry.set(0) }}>
      {children}
    </motion.div>
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

/** Número cuyos dígitos ruedan al cambiar. `min` fija la cantidad de dígitos (rellena con ceros) para que todos rueden desde 0. */
export function SlidingNumber({ value, min = 1 }: { value: number; min?: number }) {
  const digits = String(Math.abs(Math.floor(value))).padStart(min, '0').split('')
  const ref = useRef<HTMLSpanElement>(null)
  return (
    <span ref={ref} className="sliding-number">
      {digits.map((_, i) => {
        const place = 10 ** (digits.length - i - 1)
        return <Digit key={place} value={value} place={place} />
      })}
    </span>
  )
}
