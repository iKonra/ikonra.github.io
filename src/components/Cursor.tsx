import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'

/** Cursor que sigue al mouse, crece sobre lo clickeable y muestra una etiqueta si el elemento tiene data-cursor. */
export default function Cursor() {
  const [enabled] = useState(() => matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 })
  const [hover, setHover] = useState(false)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!enabled) return
    const move = (e: PointerEvent) => {
      x.set(e.clientX); y.set(e.clientY)
      const el = (e.target as Element).closest?.('a, button, [data-cursor]')
      setHover(!!el)
      setLabel(el?.getAttribute('data-cursor') ?? '')
    }
    addEventListener('pointermove', move, { passive: true })
    return () => removeEventListener('pointermove', move)
  }, [enabled, x, y])

  if (!enabled) return null
  return (
    <motion.div className={`cursor ${label ? 'has-label' : ''}`} style={{ x: sx, y: sy }} aria-hidden>
      <motion.span
        className="cursor-dot"
        animate={{ scale: label ? 6.4 : hover ? 4.2 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      />
      <AnimatePresence>
        {label && (
          <motion.span
            key={label}
            className="cursor-label"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
