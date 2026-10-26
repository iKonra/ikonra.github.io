import { motion } from 'motion/react'

type Props = { text: string; className?: string; delay?: number; stagger?: number }

/** Letra por letra, inspirado en React Bits <SplitText />. */
export default function SplitText({ text, className, delay = 0, stagger = 0.035 }: Props) {
  const words = text.split(' ')
  let i = 0
  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="split-word" aria-hidden>
          {[...word].map(ch => {
            const idx = i++
            return (
              <motion.span
                key={idx}
                className="split-char"
                initial={{ y: '110%', opacity: 0, rotate: 8 }}
                animate={{ y: '0%', opacity: 1, rotate: 0 }}
                transition={{ delay: delay + idx * stagger, type: 'spring', stiffness: 260, damping: 22 }}
              >
                {ch}
              </motion.span>
            )
          })}
          {wi < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  )
}
