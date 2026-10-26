import { useI18n } from '../i18n/I18nProvider'
import { links } from '../i18n/content'
import BlurText from '../components/BlurText'
import Magnet from '../components/Magnet'
import Reveal from '../components/Reveal'

export default function Contact() {
  const { t } = useI18n()
  return (
    <section id="contact" className="section contact">
      <div className="container narrow center">
        <Reveal><p className="kicker">{t.contact.kicker}</p></Reveal>
        <BlurText as="h2" className="section-title big" text={t.contact.title} />
        <Reveal delay={0.1}><p className="contact-text">{t.contact.text}</p></Reveal>
        <Reveal delay={0.2} className="contact-ctas">
          <Magnet strength={0.4}>
            <a className="btn btn-primary btn-lg" href={links.github} target="_blank" rel="noopener noreferrer">
              {t.contact.button} ↗
            </a>
          </Magnet>
          {links.linkedin && (
            <Magnet><a className="btn btn-ghost btn-lg" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></Magnet>
          )}
          {links.email && (
            <Magnet><a className="btn btn-ghost btn-lg" href={`mailto:${links.email}`}>Email</a></Magnet>
          )}
        </Reveal>
      </div>
      <footer className="footer">
        <span>© {new Date().getFullYear()} Conrado De Napoli</span>
        <span>{t.contact.footer}</span>
      </footer>
    </section>
  )
}
