import { motion, useScroll, useTransform } from 'motion/react'

/** Nebulosa de fondo (imagen generada, 10 KB) que se desliza y se acerca despacio con el scroll. */
export default function Nebula() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1.3])
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 8])
  return <motion.div className="nebula" style={{ y, scale, rotate }} aria-hidden />
}
