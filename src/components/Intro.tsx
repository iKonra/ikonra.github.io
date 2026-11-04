import { motion } from 'motion/react'
import { ease } from './motion'

/** Telón de entrada: una cortina que sube y deja ver la página (menos de un segundo). */
export default function Intro() {
  return (
    <motion.div
      className="intro"
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      animate={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ delay: 0.15, duration: 0.9, ease: ease.inOut }}
      aria-hidden
    >
      <motion.span
        className="intro-mark"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        CD
      </motion.span>
    </motion.div>
  )
}
