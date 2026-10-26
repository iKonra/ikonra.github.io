import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

/** Rota entre palabras, inspirado en React Bits <RotatingText />. */
export default function RotatingText({ items, interval = 2400 }: { items: string[]; interval?: number }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % items.length), interval)
    return () => clearInterval(id)
  }, [items.length, interval])
  const word = items[index % items.length]

  return (
    <span className="rotating" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={word}
          className="rotating-inner"
          initial={{ y: '100%', opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-100%', opacity: 0, filter: 'blur(6px)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
