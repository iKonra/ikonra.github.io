import { motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { TextScramble } from '../components/effects'
import { useI18n } from '../i18n/I18nProvider'
import { Heading, ease } from '../components/motion'

function Step({ when, title, text }: { when: string; title: string; text: string }) {
  const ref = useRef<HTMLLIElement>(null)
  // Se ilumina el paso que está cerca del centro de la pantalla
  const active = useInView(ref, { margin: '-38% 0px -38% 0px' })
  const [seen, setSeen] = useState(false)
  useEffect(() => { if (active) setSeen(true) }, [active])
  return (
    <motion.li
      ref={ref}
      className="step"
      initial={{ opacity: 0.28 }}
      animate={{ opacity: active ? 1 : 0.28 }}
      transition={{ duration: 0.4, ease: ease.out }}
    >
      <span className="step-when"><TextScramble text={when} trigger={seen} /></span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </motion.li>
  )
}

export default function Journey() {
  const { t } = useI18n()
  return (
    <section id="journey" className="section journey">
      <Heading text={t.journey.title} className="section-title" />
      <ol className="steps">
        {t.journey.items.map(it => <Step key={it.title} {...it} />)}
      </ol>
    </section>
  )
}
