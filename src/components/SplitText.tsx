import { motion } from 'motion/react'
import { ease } from './motion'

type Props = { text: string; delay?: number; stagger?: number }

/** Letras que suben desde una máscara, inspirado en React Bits <SplitText />. */
export default function SplitText({ text, delay = 0, stagger = 0.03 }: Props) {
  let i = 0
  return (
    <>
      <span className="sr-only">{text}</span>
      {text.split(' ').map((word, wi) => (
        <span key={wi} className="split-word" aria-hidden>
          {[...word].map(ch => {
            const idx = i++
            return (
              <motion.span
                key={idx}
                className="split-char"
                initial={{ y: '105%' }}
                animate={{ y: '0%' }}
                transition={{ delay: delay + idx * stagger, duration: 0.9, ease: ease.out }}
              >
                {ch}
              </motion.span>
            )
          })}
        </span>
      ))}
    </>
  )
}
