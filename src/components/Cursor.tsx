import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useTicker } from '../lib/ticker'
import { J } from '../universe/state'

const enabled = () => matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches

/** Cursor: una estrella de cuatro puntas con el color de la zona. Se estira con la velocidad, se vuelve un anillo sobre lo
 *  clickeable y muestra una etiqueta si el elemento tiene data-cursor (data-cursor-soft la deja al pie, sin tapar lo de abajo). */
export default function Cursor() {
  const [on] = useState(enabled)
  return on ? <Star /> : null
}

function Star() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 620, damping: 42, mass: 0.35 })
  const sy = useSpring(y, { stiffness: 620, damping: 42, mass: 0.35 })
  const [hover, setHover] = useState(false)
  const [label, setLabel] = useState('')
  const [soft, setSoft] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const star = useRef<HTMLSpanElement>(null)
  const spin = useRef(0)

  useEffect(() => {
    const move = (e: PointerEvent) => {
      x.set(e.clientX); y.set(e.clientY)
      const el = (e.target as Element).closest?.('a, button, [data-cursor]')
      setHover(!!el)
      setLabel(el?.getAttribute('data-cursor') ?? '')
      setSoft(!!el?.hasAttribute('data-cursor-soft'))
    }
    addEventListener('pointermove', move, { passive: true })
    return () => removeEventListener('pointermove', move)
  }, [x, y])

  useTicker((_, dt) => {
    const vx = sx.getVelocity(), vy = sy.getVelocity()
    const v = Math.min(Math.hypot(vx, vy) / 2600, 1)
    spin.current += dt * (26 + v * 620)
    const s = star.current, r = root.current
    if (s) s.style.transform = `rotate(${spin.current.toFixed(1)}deg) scale(${(1 + v * 0.7).toFixed(3)})`
    if (r) r.style.setProperty('--tint', `${J.tint[0]}, ${J.tint[1]}, ${J.tint[2]}`)
  })

  return (
    <motion.div ref={root} className={`cursor ${hover ? 'is-hover' : ''} ${label ? (soft ? 'is-soft' : 'has-label') : ''}`} style={{ x: sx, y: sy }} aria-hidden>
      <span ref={star} className="cursor-star"><svg viewBox="-12 -12 24 24"><path d="M0-11C.8-2.4 2.4-.8 11 0 2.4.8.8 2.4 0 11-.8 2.4-2.4.8-11 0-2.4-.8-.8-2.4 0-11Z" /></svg></span>
      <motion.span
        className="cursor-ring"
        initial={false}
        animate={{ scale: label ? (soft ? 1.35 : 2.3) : hover ? 1.15 : 0.2, opacity: hover || label ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      />
      <AnimatePresence>
        {label && (
          <motion.span
            key={label}
            className="cursor-label"
            style={{ x: '-50%', y: '-50%' }}
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
