import { useI18n } from '../i18n/I18nProvider'
import { Heading, Rise } from '../components/motion'
import { ParallaxComponent } from '@/components/ui/parallax-scrolling'
import { BrowserFragment, CodeFragment, DiscordFragment, GameFragment } from '../components/Fragments'
import { Arrow } from './Hero'
import type { Project } from '../i18n/content'

function Fragment({ id }: { id: Project['id'] }) {
  if (id === 'tricapi') return <BrowserFragment domain="tricapi.com" word="tricapi" />
  if (id === 'twobones') return <GameFragment />
  if (id === 'web') return <CodeFragment />
  return <DiscordFragment />
}

export default function Projects() {
  const { t } = useI18n()
  return (
    <section id="projects" className="projects">
      <ParallaxComponent
        title={t.projects.title}
        image="/images/saturn-2000.webp"
        imageSrcSet="/images/saturn-1000.webp 1000w, /images/saturn-2000.webp 2000w"
        imageAlt={t.projects.parallaxAlt}
      />
      <div className="section projects-body">
      <Rise as="p" className="section-lead projects-lead">{t.projects.lead}</Rise>
      <ol className="project-list">
        {t.projects.items.map((p, i) => (
          <li key={p.id} className={`project ${i % 2 ? 'is-flipped' : ''}`}>
            <Rise className="project-media">
              {p.url ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`${t.projects.visit} ${p.title}`} tabIndex={-1}>
                  <Fragment id={p.id} />
                </a>
              ) : <Fragment id={p.id} />}
            </Rise>
            <div className="project-text">
              <Rise as="p" className="project-kind">{p.kind}</Rise>
              <Heading as="h3" text={p.title} className="project-title" />
              <Rise as="p" delay={0.08}>{p.description}</Rise>
              <Rise as="p" delay={0.14} className="project-stack">{p.stack}</Rise>
              <Rise delay={0.2}>
                {p.url ? (
                  <a className="link-arrow" href={p.url} target="_blank" rel="noopener noreferrer">
                    {t.projects.visit} {p.title} <Arrow />
                  </a>
                ) : p.id === 'twobones' ? <span className="project-soon">{t.projects.soon}</span> : null}
              </Rise>
            </div>
          </li>
        ))}
      </ol>
      </div>
    </section>
  )
}
