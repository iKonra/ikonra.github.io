import { useI18n } from '../i18n/I18nProvider'
import { Heading, Rise } from '../components/motion'

export default function About() {
  const { t } = useI18n()
  return (
    <section id="about" className="section about">
      <Heading text={t.about.title} className="section-title" />
      <div className="about-grid">
        <div>
          <Rise as="p" className="statement">{t.about.statement}</Rise>
          <Rise as="p" className="about-body" delay={0.08}>{t.about.body}</Rise>
        </div>
        <dl className="facts">
          {t.about.facts.map(([k, v], i) => (
            <Rise key={k} delay={0.1 + i * 0.07} className="fact">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </Rise>
          ))}
        </dl>
      </div>
    </section>
  )
}
