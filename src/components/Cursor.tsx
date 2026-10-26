import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'

/** Cursor que sigue al mouse y crece sobre lo clickeable. Solo en equipos con mouse. */
export default function Cursor() {
  const [enabled] = useState(() => matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 })
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const move = (e: PointerEvent) => {
      x.set(e.clientX); y.set(e.clientY)
      setHover(!!(e.target as Element).closest?.('a, button'))
    }
    addEventListener('pointermove', move, { passive: true })
    return () => removeEventListener('pointermove', move)
  }, [enabled, x, y])

  if (!enabled) return null
  return (
    <motion.div
      className="cursor"
      style={{ x: sx, y: sy }}
      animate={{ scale: hover ? 4.2 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      aria-hidden
    />
  )
}
