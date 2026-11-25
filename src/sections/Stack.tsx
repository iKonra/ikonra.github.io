import type { CSSProperties } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { Heading, Parallax, Rise } from '../components/motion'
import { Tilt } from '../components/effects'
import { PixelIcon } from '../components/pixelArt'
import PixelScene from '../components/PixelScene'
import { stackColors } from '../lib/palette'

/** Stack técnico en pixel art: una escena con la mascota de TwoBones y una tarjeta por grupo de tecnologías. */
export default function Stack() {
  const { t } = useI18n()
  return (
    <section id="stack" className="section tech">
      <Parallax speed={-0.05} wide>
        <Heading text={t.stack.title} className="section-title" />
        <Rise as="p" className="section-lead">{t.stack.lead}</Rise>
      </Parallax>
      <Rise delay={0.05}><PixelScene /></Rise>
      <ul className="tech-grid">
        {t.stack.groups.map((g, i) => {
          const color = stackColors[i % stackColors.length]
          return (
            <Rise as="li" key={g.name} delay={(i % 4) * 0.05}>
              <Parallax speed={[0.05, -0.02, 0.08, 0][i % 4]} className="tech-float" wide>
                <Tilt>
                  <article className="tech-card" style={{ '--c': color } as CSSProperties}>
                    <header>
                      <PixelIcon name={g.icon} color={color} />
                      <h3>{g.name}</h3>
                    </header>
                    <ul className="tech-chips">
                      {g.items.map(item => <li key={item}>{item}</li>)}
                    </ul>
                  </article>
                </Tilt>
              </Parallax>
            </Rise>
          )
        })}
      </ul>
    </section>
  )
}
