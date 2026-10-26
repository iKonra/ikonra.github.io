import { motion } from 'motion/react'
import type { ElementType } from 'react'

type Props = { text: string; as?: ElementType; className?: string; delay?: number }

/** Palabras que aparecen desenfocadas al entrar en pantalla, inspirado en React Bits <BlurText />. */
export default function BlurText({ text, as: Tag = 'p', className, delay = 0 }: Props) {
  return (
    <Tag className={className}>
      {text.split(' ').map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          style={{ display: 'inline-block', willChange: 'transform, filter, opacity' }}
          initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.55, delay: delay + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </Tag>
  )
}
