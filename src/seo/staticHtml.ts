// Genera, a partir de content.ts, todo lo que tiene que estar en el HTML inicial: texto visible, meta tags,
// Open Graph, Twitter Card y datos estructurados. Lo usa el plugin de vite.config.ts (corre en Node, sin DOM).
import { dictionaries, links, type Lang } from '../i18n/content'

export const SITE = 'https://ikonra.github.io/'
export const OG_IMAGE = `${SITE}og.png`

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function renderHead() {
  const es = dictionaries.es.meta
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: dictionaries.es.hero.name,
    jobTitle: dictionaries.es.hero.role,
    description: es.description,
    url: SITE,
    email: `mailto:${links.email}`,
    sameAs: [links.github, links.linkedin].filter(Boolean),
  }
  return `<title>${esc(es.title)}</title>
    <meta name="description" content="${esc(es.description)}" />
    <meta name="theme-color" content="#100f0d" />
    <link rel="canonical" href="${SITE}" />
    <link rel="alternate" hreflang="es" href="${SITE}?lang=es" />
    <link rel="alternate" hreflang="en" href="${SITE}?lang=en" />
    <link rel="alternate" hreflang="x-default" href="${SITE}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(dictionaries.es.hero.name)}" />
    <meta property="og:title" content="${esc(es.title)}" />
    <meta property="og:description" content="${esc(es.description)}" />
    <meta property="og:url" content="${SITE}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(es.title)}" />
    <meta property="og:locale" content="es_AR" />
    <meta property="og:locale:alternate" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(es.title)}" />
    <meta name="twitter:description" content="${esc(es.description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <meta name="twitter:image:alt" content="${esc(es.title)}" />
    <script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`
}

/** Corre antes del primer render: fija el idioma y las clases html.lite / html.reduce-motion.
 *  Tiene que coincidir con initialLang() en I18nProvider.tsx y detectLite() en lib/perf.ts. */
export const bootScript = `(function(){try{
var d=document.documentElement,p=new URLSearchParams(location.search),q=p.get('lang'),s=null;
try{s=localStorage.getItem('lang')}catch(e){}
var n=(navigator.language||'es').toLowerCase();
d.lang=q==='en'||q==='es'?q:s==='en'||s==='es'?s:n.indexOf('es')===0?'es':'en';
var r=matchMedia('(prefers-reduced-motion: reduce)').matches,l=p.get('lite');
if(r)d.classList.add('reduce-motion');
if(l==='1'||(l!=='0'&&(r||(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4||(navigator.connection&&navigator.connection.saveData))))d.classList.add('lite');
}catch(e){}})();`

function contactItems(lang: Lang) {
  const t = dictionaries[lang].contact
  return [
    links.email && { href: `mailto:${links.email}`, label: t.email, ext: false },
    links.linkedin && { href: links.linkedin, label: t.linkedin, ext: true },
    links.github && { href: links.github, label: t.github, ext: true },
    links.cv && { href: links.cv, label: t.cv, ext: false },
  ].filter(Boolean) as { href: string; label: string; ext: boolean }[]
}

function block(lang: Lang) {
  const t = dictionaries[lang]
  const sfx = lang === 'es' ? '' : '-en' // los ids no se pueden repetir entre los dos idiomas
  const sections = ['about', 'projects', 'journey', 'contact'] as const

  const projects = t.projects.items
    .map(p => {
      const metrics = p.metrics?.length
        ? `<ul class="inline">${p.metrics.map(m => `<li><strong>${esc(`${m.prefix ?? ''}${m.value}${m.suffix ?? ''}`)}</strong> ${esc(m.label)}${m.note ? ` — ${esc(m.note)}` : ''}</li>`).join('')}</ul>`
        : ''
      const features = p.features?.length ? `<ul>${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''
      const featured = p.featured ? `<p><strong>${esc(p.featured.label)}: ${esc(p.featured.name)}.</strong> ${esc(p.featured.text)}${p.featured.result ? ` ${esc(p.featured.result)}` : ''}</p>` : ''
      const game = p.game ? `<p><strong>${esc(p.game.label)}: ${esc(p.game.name)}.</strong> ${esc(p.game.text)} ${esc(p.game.status)}.</p>` : ''
      const stack = p.stack ? `<p class="muted">${esc(p.stack)}</p>` : ''
      const visit = p.url ? `<p><a class="link-arrow" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(t.projects.visit)} ${esc(p.title)}</a></p>` : ''
      return `<article>
          <h3>${esc(p.title)}</h3>
          <p class="muted">${esc(p.kind)}${p.period ? ` · ${esc(p.period)}` : ''}</p>
          <p>${esc(p.description)}</p>${features}${metrics}${featured}${game}${stack}${visit}
        </article>`
    })
    .join('\n        ')

  const heroMetrics = t.projects.items.find(p => p.id === 'tricapi')?.metrics ?? []
  const proof = heroMetrics.length
    ? `<ul class="hero-proof">${heroMetrics.map(m => `<li><strong>${esc(`${m.prefix ?? ''}${m.value}${m.suffix ?? ''}`)}</strong><span>${esc(m.short ?? m.label)}</span></li>`).join('')}</ul>`
    : ''

  const contact = contactItems(lang)
    .map((c, i) => `<li><a class="btn ${i === 0 ? 'btn-accent' : 'btn-outline'}" href="${esc(c.href)}"${c.ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(c.label)}</a></li>`)
    .join('')

  return `<div class="static static-${lang}" lang="${lang}">
    <header class="bar">
      <a class="wordmark" href="#top${sfx}">${esc(t.hero.name)}</a>
      <nav class="bar-links" aria-label="Main">${sections.map(id => `<a href="#${id}${sfx}">${esc(t.nav[id])}</a>`).join('')}</nav>
    </header>
    <main>
      <section id="top${sfx}" class="hero">
        <div class="hero-text">
          <h1 class="hero-name">${esc(t.hero.name)}</h1>
          <p class="hero-role">${esc(t.hero.role)}</p>
          <p class="hero-lead">${esc(t.hero.lead)}</p>
          <div class="hero-actions">
            <a class="btn btn-accent" href="#projects${sfx}">${esc(t.hero.projects)}</a>
            <a class="btn btn-outline" href="#contact${sfx}">${esc(t.hero.contact)}</a>
          </div>
          ${proof}
        </div>
      </section>
      <section id="about${sfx}" class="static-block">
        <h2>${esc(t.about.title)}</h2>
        <p>${esc(t.about.statement)}</p>
        <p class="muted">${esc(t.about.body)}</p>
        <dl>${t.about.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      </section>
      <section id="projects${sfx}" class="static-block">
        <h2>${esc(t.projects.title)}</h2>
        <p class="muted">${esc(t.projects.lead)}</p>
        ${projects}
      </section>
      <section id="journey${sfx}" class="static-block">
        <h2>${esc(t.journey.title)}</h2>
        <ol>${t.journey.items.map(i => `<li><strong>${esc(i.title)}</strong> <span class="muted">${esc(i.when)}</span><p>${esc(i.text)}</p></li>`).join('')}</ol>
      </section>
      <section id="contact${sfx}" class="static-block">
        <h2>${esc(t.contact.title)}</h2>
        <p>${esc(t.contact.text)}</p>
        <ul class="inline">${contact}</ul>
      </section>
    </main>
  </div>`
}

export function renderBody() {
  return `${block('es')}\n  ${block('en')}`
}
