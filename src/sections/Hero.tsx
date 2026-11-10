import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import VariableProximity from '../components/VariableProximity'
import { burst } from '../three/sceneState'
import { Magnetic } from '../components/effects'

// Sin animaciones de entrada que oculten el texto: el contenido principal se ve apenas carga el CSS.
export default function Hero() {
  const { t, lang } = useI18n()
  // Los números de la franja salen de las métricas de Tricapi: una sola fuente en content.ts
  const proof = t.projects.items.find(p => p.id === 'tricapi')?.metrics ?? []

  return (
    <section id="top" className="hero">
      <div className="hero-text">
        <h1 className="hero-name">
          <VariableProximity key={lang} text={t.hero.name} />
        </h1>
        <p className="hero-role">{t.hero.role}</p>
        <p className="hero-lead">{t.hero.lead}</p>
        <div className="hero-actions">
          <Magnetic>
            <a href="#projects" className="btn btn-accent" onClick={burst}>
              {t.hero.projects} <Arrow />
            </a>
          </Magnetic>
          <a href="#contact" className="btn btn-outline" onClick={burst}>{t.hero.contact}</a>
        </div>
        {proof.length > 0 && (
          <ul className="hero-proof">
            {proof.map(m => (
              <li key={m.label}>
                <strong>{m.prefix}{m.value}{m.suffix}</strong>
                <span>{m.short ?? m.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="hero-stage" onClick={burst} data-cursor={t.hero.morph} aria-hidden />
    </section>
  )
}

export function Arrow() {
  return <ArrowUpRight className="arrow" size={16} strokeWidth={2} aria-hidden />
}
