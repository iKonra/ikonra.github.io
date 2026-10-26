import { motion } from 'motion/react'
import type { ReactNode } from 'react'

// Curvas de Emil Kowalski: ease-out fuerte para entradas, ease-in-out para movimiento en pantalla
export const ease = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
}

/** Entrada al hacer scroll: sube 24px y aparece, una sola vez. */
export function Rise({ children, delay = 0, className, as = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'p' }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.7, delay, ease: ease.out }}
    >
      {children}
    </Tag>
  )
}

/** Título de sección: cada palabra sube desde una máscara. El observer va en el título, no en las palabras ocultas. */
export function Heading({ text, as = 'h2', className }: { text: string; as?: 'h2' | 'h3'; className?: string }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ staggerChildren: 0.06 }}
    >
      <span className="sr-only">{text}</span>
      {text.split(' ').map((w, i) => (
        <span key={`${w}-${i}`} className="mask-word" aria-hidden>
          <motion.span
            variants={{ hidden: { y: '110%' }, shown: { y: '0%' } }}
            transition={{ duration: 0.8, ease: ease.out }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
