import { useI18n } from '../i18n/I18nProvider'
import { links } from '../i18n/content'
import { Heading, Rise } from '../components/motion'
import { Arrow } from './Hero'
import { Magnetic } from '../components/effects'

export default function Contact() {
  const { t } = useI18n()
  return (
    <section id="contact" className="contact">
      <div className="contact-inner">
        <Heading text={t.contact.title} className="contact-title" />
        <div className="contact-side">
          <Rise as="p" className="contact-text">{t.contact.text}</Rise>
          <Rise delay={0.08} className="contact-actions">
            <Magnetic><a className="btn btn-ink" href={links.github} target="_blank" rel="noopener noreferrer">{t.contact.button} <Arrow /></a></Magnetic>
            {links.linkedin && <a className="link-arrow" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <Arrow /></a>}
            {links.email && <a className="link-arrow" href={`mailto:${links.email}`}>Email <Arrow /></a>}
          </Rise>
        </div>
      </div>
    </section>
  )
}
