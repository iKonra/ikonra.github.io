import { useI18n } from '../i18n/I18nProvider'
import { links } from '../i18n/content'
import { Rise } from '../components/motion'
import { Magnetic } from '../components/effects'
import VariableProximity from '../components/VariableProximity'
import { linkProps, useContactItems } from '../components/ContactLinks'

export default function Contact() {
  const { t, lang } = useI18n()
  const items = useContactItems(20)
  return (
    <section id="contact" className="contact">
      <h2 className="contact-title"><VariableProximity key={lang} text={t.contact.title} from={300} radius={320} /></h2>
      <div className="contact-side">
        <Rise as="p" className="contact-text">{t.contact.text}</Rise>
        <Rise delay={0.08} className="contact-actions">
          {items.map(i => {
            const primary = i.id === 'email'
            const button = (
              <a className={`btn btn-lg ${primary ? 'btn-accent' : 'btn-outline'}`} {...linkProps(i)} data-cursor={i.label}>
                {i.icon}
                {i.label}
              </a>
            )
            return primary ? <Magnetic key={i.id}>{button}</Magnetic> : <span key={i.id}>{button}</span>
          })}
        </Rise>
        {links.email && (
          <Rise delay={0.14} as="p" className="contact-mail">
            <a className="link-arrow" href={`mailto:${links.email}`}>{links.email}</a>
          </Rise>
        )}
      </div>
    </section>
  )
}
