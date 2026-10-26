import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity, wrap } from 'motion/react'
import { useRef } from 'react'

/** Marquesina cuya velocidad reacciona al scroll, inspirado en React Bits <ScrollVelocity />. */
export default function ScrollVelocity({ text, baseVelocity = 3 }: { text: string; baseVelocity?: number }) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const factor = useTransform(velocity, [0, 1000], [0, 5], { clamp: false })
  const x = useTransform(baseX, v => `${wrap(-25, -50, v)}%`)
  const dir = useRef(1)

  useAnimationFrame((_, delta) => {
    let move = dir.current * baseVelocity * (delta / 1000)
    const f = factor.get()
    if (f < 0) dir.current = -1
    else if (f > 0) dir.current = 1
    move += dir.current * move * f
    baseX.set(baseX.get() + move)
  })

  return (
    <div className="velocity">
      <motion.div className="velocity-track" style={{ x }}>
        {[0, 1, 2, 3].map(i => <span key={i}>{text}&nbsp;</span>)}
      </motion.div>
    </div>
  )
}
