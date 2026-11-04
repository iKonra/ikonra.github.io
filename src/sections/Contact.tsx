import { useI18n } from '../i18n/I18nProvider'
import { links } from '../i18n/content'
import { Rise } from '../components/motion'
import { Arrow } from './Hero'
import { Magnetic } from '../components/effects'
import VariableProximity from '../components/VariableProximity'

export default function Contact() {
  const { t, lang } = useI18n()
  return (
    <section id="contact" className="contact">
      <h2 className="contact-title"><VariableProximity key={lang} text={t.contact.title} from={300} radius={320} /></h2>
      <div className="contact-side">
        <Rise as="p" className="contact-text">{t.contact.text}</Rise>
        <Rise delay={0.08} className="contact-actions">
          <Magnetic><a className="btn btn-accent btn-lg" href={links.github} target="_blank" rel="noopener noreferrer" data-cursor="GitHub">{t.contact.button} <Arrow /></a></Magnetic>
          {links.linkedin && <a className="link-arrow" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <Arrow /></a>}
          {links.email && <a className="link-arrow" href={`mailto:${links.email}`}>Email <Arrow /></a>}
        </Rise>
      </div>
    </section>
  )
}
