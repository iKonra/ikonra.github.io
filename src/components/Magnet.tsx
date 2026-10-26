import { motion, useMotionValue, useSpring } from 'motion/react'
import type { ReactNode, PointerEvent } from 'react'

/** Elemento magnético que sigue al cursor, inspirado en React Bits <Magnet />. */
export default function Magnet({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 15, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 15, mass: 0.4 })
  const onMove = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  return (
    <motion.span
      className="magnet"
      style={{ x, y }}
      onPointerMove={onMove}
      onPointerLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.span>
  )
}
