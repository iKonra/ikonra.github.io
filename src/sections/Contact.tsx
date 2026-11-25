import { useI18n } from '../i18n/I18nProvider'
import { links } from '../i18n/content'
import { Rise } from '../components/motion'
import { Magnetic } from '../components/effects'
import VariableProximity from '../components/VariableProximity'
import { linkProps, useContactItems } from '../components/ContactLinks'

const credits: [string, string][] = [
  ['NASA SVS', 'https://svs.gsfc.nasa.gov/4851'],
  ['NASA/JPL-Caltech/ESO/R. Hurt (CC BY 4.0)', 'https://www.eso.org/public/images/eso1339g/'],
  ['Solar System Scope (CC BY 4.0)', 'https://www.solarsystemscope.com/textures/'],
  ['Yale Bright Star Catalog', 'http://tdc-www.harvard.edu/catalogs/bsc5.html'],
  ['d3-celestial', 'https://github.com/ofrohn/d3-celestial'],
]

export default function Contact() {
  const { t, lang } = useI18n()
  const items = useContactItems(20)
  return (
    <section id="contact" className="contact">
      <div className="contact-main">
        <h2 className="contact-title"><VariableProximity key={lang} text={t.contact.title} from={300} radius={320} drift /></h2>
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
      </div>
      <footer className="credits">
        <span>{t.footer.credits}</span>
        <ul>
          {credits.map(([name, href]) => <li key={name}><a href={href} target="_blank" rel="noopener noreferrer">{name}</a></li>)}
        </ul>
      </footer>
    </section>
  )
}
