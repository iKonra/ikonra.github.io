// Todo el texto del sitio: español e inglés acá, los demás idiomas en locales/. TypeScript avisa si a un idioma le falta una clave.
// Lo que quede en '' (o sin definir) no se muestra.
import { de } from './locales/de'
import { fr } from './locales/fr'
import { it } from './locales/it'
import { pt } from './locales/pt'
import { links } from './links'
import type { Lang } from './langs'

export { links, type Lang }


export type IconName = 'code' | 'server' | 'database' | 'plug' | 'cloud' | 'window' | 'game' | 'tools'
export type StackGroup = { name: string; icon: IconName; items: string[] }

export type Metric = { value: number; prefix?: string; suffix?: string; label: string; note?: string }

export type Project = {
  id: 'tricapi' | 'inti' | 'twobones' | 'web' | 'bots'
  title: string
  kind: string
  period?: string
  description: string
  features?: string[]
  metrics?: Metric[]
  game?: { label: string; name: string; text: string; status: string }
  stack?: string
  url?: string
}

const es = {
  meta: {
    title: 'Conrado De Napoli — Software Engineer · Product Engineer',
    description: 'Co-Founder de Tricapi (SaaS con 70 clientes pagos) y freelance de software a medida en Inti. Estudiante de Ingeniería en Informática (UNL).',
  },
  nav: { about: 'Sobre mí', projects: 'Proyectos', stack: 'Stack', journey: 'Trayectoria', contact: 'Contacto', menu: 'Menú', close: 'Cerrar' },
  hero: {
    name: 'Conrado De Napoli',
    role: 'Software Engineer · Product Engineer',
    lead: 'Co-Founder de Tricapi, un SaaS con 70 clientes pagos. Estudiante de Ingeniería en Informática (UNL).',
    projects: 'Ver proyectos',
    contact: 'Contacto',
    morph: 'Cambiar galaxia',
    scroll: 'Desplazar para iniciar el viaje',
    galaxies: ['Vía Láctea', 'Galaxia Remolino · M51', 'Objeto de Hoag', 'Galaxia del Sombrero · M104', 'Galaxia elíptica · M87'],
  },
  about: {
    title: 'Sobre mí',
    statement: 'Software Engineer con foco en producto. Construyo sistemas y plataformas que resuelven problemas reales de negocio.',
    body: 'Estudio Ingeniería en Informática (UNL) y trabajo como Software Engineer y Product Engineer. Cofundé Tricapi, un SaaS con 70 clientes pagos, y TwoBones Studio, un estudio independiente de videojuegos. Además, desarrollo software a medida como freelance en Inti.',
    facts: [
      ['Estudio', 'Ingeniería en Informática (UNL)'],
      ['Trabajo', 'Software Engineer · Product Engineer'],
      ['Construyo', 'SaaS, software a medida y videojuegos'],
    ],
  },
  projects: {
    title: 'Proyectos',
    lead: 'Trabajos y proyectos seleccionados.',
    visit: 'Visitar',
    soon: 'Sitio web próximamente',
    items: [
      {
        id: 'tricapi',
        title: 'Tricapi',
        kind: 'SaaS · Cofundador',
        period: 'Julio 2026 – presente',
        description: 'Plataforma que vincula cada venta de WhatsApp con el anuncio de Meta que la generó y la envía a la Meta Conversions API.',
        features: ['Failover multi-línea', 'Lectura de comprobantes con OCR + IA', 'Integraciones con Kommo CRM, Mercado Pago y USDT'],
        metrics: [
          { value: 70, label: 'clientes pagos en total', note: 'hasta 30 activos en simultáneo' },
          { value: 130, label: 'líneas de WhatsApp procesadas en simultáneo' },
          { value: 35, prefix: '−', suffix: '%', label: 'costo por lead en 30 días', note: 'resultado de un cliente' },
        ],
        stack: 'Node.js, Express, Supabase (PostgreSQL), Nginx, Cloudflare',
        url: links.tricapi,
      },
      {
        id: 'inti',
        title: 'Freelance',
        kind: 'Software a medida · Inti',
        period: 'Octubre 2026 – presente',
        description: 'Desarrollo de software a medida como freelance en Inti.',
        metrics: [{ value: 5, label: 'clientes en el primer mes' }],
      },
      {
        id: 'web',
        title: 'Desarrollo web',
        kind: 'Para empresas',
        description: 'Sitios, paneles y aplicaciones a medida: rápidos, mantenibles y pensados para resolver problemas reales del negocio.',
        stack: 'React, Next.js, APIs, bases de datos',
      },
      {
        id: 'twobones',
        title: 'TwoBones Studio',
        kind: 'Estudio de videojuegos · Cofundador',
        description: 'Estudio independiente de videojuegos. Diseño y programación de juegos.',
        game: { label: 'Primer juego', name: 'Boneheads Party', text: 'Party game para 4 a 10 jugadores.', status: 'En desarrollo' },
        stack: 'Game design, C#, 3D',
        url: links.twobones,
      },
      {
        id: 'bots',
        title: 'Discord Bots',
        kind: 'Primer proyecto · hasta 75 servidores',
        description: 'Bots de Discord que desarrollo desde 2019: mi primer proyecto de programación.',
        stack: 'Node.js, discord.js',
        url: links.discordBots,
      },
    ] as Project[],
    discord: {
      channel: 'general',
      history: [] as [string, string][],
      user: 'usuario',
      command: '/help',
      bot: 'Discord Bot',
      reply: 'Hola. Estos son los comandos disponibles en este servidor.',
      typing: 'Discord Bot está escribiendo…',
    },
    game: { hint: 'Clic, toque o barra espaciadora para saltar', over: 'Fin del juego. Clic para reintentar', label: 'Mini juego de TwoBones', cursor: 'Saltar' },
  },
  stack: {
    title: 'Stack técnico',
    lead: 'Tecnologías y herramientas con las que trabajo.',
    groups: [
      { name: 'Lenguajes', icon: 'code', items: ['JavaScript', 'Python', 'SQL', 'C#', 'HTML', 'CSS'] },
      { name: 'Backend y testing', icon: 'server', items: ['Node.js', 'Express', 'APIs REST', 'Supertest'] },
      { name: 'Datos', icon: 'database', items: ['PostgreSQL (Supabase)', 'SQLite'] },
      { name: 'Integraciones', icon: 'plug', items: ['Meta Conversions API', 'Google Gemini', 'Kommo CRM', 'Mercado Pago', 'USDT'] },
      { name: 'Infraestructura', icon: 'cloud', items: ['Nginx', 'Cloudflare', 'Netlify', 'PM2', 'Linux'] },
      { name: 'Frontend', icon: 'window', items: ['React', 'Next.js'] },
      { name: 'Videojuegos', icon: 'game', items: ['C#', 'Game design', '3D'] },
      { name: 'Herramientas', icon: 'tools', items: ['Git', 'Claude Code', 'OpenCode', 'AutoCAD'] },
    ] as StackGroup[],
  },
  journey: {
    title: 'Trayectoria',
    // De más reciente a más antiguo. Las entradas sin año son las que faltan completar.
    items: [
      { when: 'Oct 2026 – presente', title: 'Freelance', text: 'Freelance en Inti: desarrollo de software a medida. 5 clientes en el primer mes.' },
      { when: 'Jul 2026 – presente', title: 'Tricapi', text: 'Cofundador del SaaS que conecta cada venta de WhatsApp con su anuncio de Meta. 70 clientes pagos.' },
      { when: 'En curso', title: 'Ingeniería en Informática', text: 'Cursando en la UNL.' },
      { when: 'Videojuegos', title: 'TwoBones Studio', text: 'Estudio independiente de videojuegos. Primer juego: Boneheads Party, en desarrollo.' },
      { when: '2019', title: 'Discord Bots', text: 'Primer proyecto de programación: bots de Discord presentes en hasta 75 servidores.' },
    ],
  },
  contact: {
    title: 'Trabajemos juntos.',
    text: 'Abierto a nuevos proyectos, oportunidades y colaboraciones.',
    email: 'Email',
    linkedin: 'LinkedIn',
    github: 'GitHub',
    cv: 'Descargar CV',
    quick: 'Contacto rápido',
  },
  hud: {
    distance: 'Distancia a la Tierra',
    ly: 'años luz',
    /** Va entre «millones» y «km»: «4500 millones de km». */
    of: 'de',
    route: 'Ruta del viaje',
    loading: 'Cargando el universo',
    pilot: 'Piloto automático',
    pilotStop: 'Detener piloto automático',
    sound: 'Activar sonido',
    soundOff: 'Silenciar',
    explore: 'Modo explorar',
    exit: 'Salir',
    hint: 'Arrastrar para mirar · Desplazar para viajar · Esc para salir',
    places: { galaxy: 'Vía Láctea', nebula: 'Nebulosa', jump: 'Velocidad de la luz', hole: 'Sagitario A*', wormhole: 'Agujero de gusano', belt: 'Cinturón de Kuiper', saturn: 'Saturno', moon: 'La Luna', earth: 'La Tierra' },
    beacon: 'Argentina',
  },
  lang: { label: 'Idioma' },
}

export type Dict = typeof es

const en: Dict = {
  meta: {
    title: 'Conrado De Napoli — Software Engineer · Product Engineer',
    description: 'Co-Founder of Tricapi (a SaaS with 70 paying customers) and freelance custom software developer at Inti. Computer Engineering student (UNL).',
  },
  nav: { about: 'About', projects: 'Projects', stack: 'Stack', journey: 'Journey', contact: 'Contact', menu: 'Menu', close: 'Close' },
  hero: {
    name: 'Conrado De Napoli',
    role: 'Software Engineer · Product Engineer',
    lead: 'Co-Founder of Tricapi, a SaaS with 70 paying customers. Computer Engineering student (UNL).',
    projects: 'View projects',
    contact: 'Contact',
    morph: 'Change galaxy',
    scroll: 'Scroll to begin the journey',
    galaxies: ['Milky Way', 'Whirlpool Galaxy · M51', "Hoag's Object", 'Sombrero Galaxy · M104', 'Elliptical galaxy · M87'],
  },
  about: {
    title: 'About me',
    statement: 'Software Engineer focused on product. I build systems and platforms that solve real business problems.',
    body: 'I study Computer Engineering (UNL) and work as a Software Engineer and Product Engineer. I co-founded Tricapi, a SaaS with 70 paying customers, and TwoBones Studio, an independent game studio. I also build custom software as a freelancer at Inti.',
    facts: [
      ['Studying', 'Computer Engineering (UNL)'],
      ['Working as', 'Software Engineer · Product Engineer'],
      ['Building', 'SaaS, custom software and games'],
    ],
  },
  projects: {
    title: 'Projects',
    lead: 'Selected work and projects.',
    visit: 'Visit',
    soon: 'Website coming soon',
    items: [
      {
        id: 'tricapi',
        title: 'Tricapi',
        kind: 'SaaS · Co-founder',
        period: 'July 2026 – present',
        description: 'Platform that links every WhatsApp sale to the Meta ad that generated it and sends it to the Meta Conversions API.',
        features: ['Multi-line failover', 'Receipt reading with OCR + AI', 'Integrations with Kommo CRM, Mercado Pago and USDT'],
        metrics: [
          { value: 70, label: 'paying customers in total', note: 'up to 30 active at once' },
          { value: 130, label: 'WhatsApp lines processed simultaneously' },
          { value: 35, prefix: '−', suffix: '%', label: 'cost per lead in 30 days', note: "one customer's result" },
        ],
        stack: 'Node.js, Express, Supabase (PostgreSQL), Nginx, Cloudflare',
        url: links.tricapi,
      },
      {
        id: 'inti',
        title: 'Freelance',
        kind: 'Custom software · Inti',
        period: 'October 2026 – present',
        description: 'Custom software development as a freelancer at Inti.',
        metrics: [{ value: 5, label: 'customers in the first month' }],
      },
      {
        id: 'web',
        title: 'Web development',
        kind: 'For companies',
        description: 'Custom sites, dashboards and apps: fast, maintainable and built to solve real business problems.',
        stack: 'React, Next.js, APIs, databases',
      },
      {
        id: 'twobones',
        title: 'TwoBones Studio',
        kind: 'Game studio · Co-founder',
        description: 'Independent game studio. Game design and programming.',
        game: { label: 'First game', name: 'Boneheads Party', text: 'Party game for 4 to 10 players.', status: 'In development' },
        stack: 'Game design, C#, 3D',
        url: links.twobones,
      },
      {
        id: 'bots',
        title: 'Discord Bots',
        kind: 'First project · up to 75 servers',
        description: 'Discord bots I have been building since 2019: my first programming project.',
        stack: 'Node.js, discord.js',
        url: links.discordBots,
      },
    ] as Project[],
    discord: {
      channel: 'general',
      history: [] as [string, string][],
      user: 'user',
      command: '/help',
      bot: 'Discord Bot',
      reply: 'Hi! These are the commands available on this server.',
      typing: 'Discord Bot is typing…',
    },
    game: { hint: 'Click, tap or press space to jump', over: 'Game over. Click to retry', label: 'TwoBones mini game', cursor: 'Jump' },
  },
  stack: {
    title: 'Tech stack',
    lead: 'Technologies and tools I work with.',
    groups: [
      { name: 'Languages', icon: 'code', items: ['JavaScript', 'Python', 'SQL', 'C#', 'HTML', 'CSS'] },
      { name: 'Backend & testing', icon: 'server', items: ['Node.js', 'Express', 'REST APIs', 'Supertest'] },
      { name: 'Data', icon: 'database', items: ['PostgreSQL (Supabase)', 'SQLite'] },
      { name: 'Integrations', icon: 'plug', items: ['Meta Conversions API', 'Google Gemini', 'Kommo CRM', 'Mercado Pago', 'USDT'] },
      { name: 'Infrastructure', icon: 'cloud', items: ['Nginx', 'Cloudflare', 'Netlify', 'PM2', 'Linux'] },
      { name: 'Frontend', icon: 'window', items: ['React', 'Next.js'] },
      { name: 'Games', icon: 'game', items: ['C#', 'Game design', '3D'] },
      { name: 'Tools', icon: 'tools', items: ['Git', 'Claude Code', 'OpenCode', 'AutoCAD'] },
    ] as StackGroup[],
  },
  journey: {
    title: 'Journey',
    items: [
      { when: 'Oct 2026 – present', title: 'Freelance', text: 'Freelancer at Inti, building custom software. 5 customers in the first month.' },
      { when: 'Jul 2026 – present', title: 'Tricapi', text: 'Co-founder of the SaaS that connects every WhatsApp sale to its Meta ad. 70 paying customers.' },
      { when: 'Ongoing', title: 'Computer Engineering', text: 'Studying at UNL.' },
      { when: 'Games', title: 'TwoBones Studio', text: 'Independent game studio. First game: Boneheads Party, in development.' },
      { when: '2019', title: 'Discord Bots', text: 'First programming project: Discord bots present in up to 75 servers.' },
    ],
  },
  contact: {
    title: "Let's work together.",
    text: 'Open to new projects, opportunities and collaborations.',
    email: 'Email',
    linkedin: 'LinkedIn',
    github: 'GitHub',
    cv: 'Download CV',
    quick: 'Quick contact',
  },
  hud: {
    distance: 'Distance to Earth',
    ly: 'light-years',
    of: '',
    route: 'Journey route',
    loading: 'Loading the universe',
    pilot: 'Autopilot',
    pilotStop: 'Stop autopilot',
    sound: 'Turn sound on',
    soundOff: 'Mute',
    explore: 'Explore mode',
    exit: 'Exit',
    hint: 'Drag to look around · Scroll to travel · Esc to exit',
    places: { galaxy: 'Milky Way', nebula: 'Nebula', jump: 'Light speed', hole: 'Sagittarius A*', wormhole: 'Wormhole', belt: 'Kuiper Belt', saturn: 'Saturn', moon: 'The Moon', earth: 'Earth' },
    beacon: 'Argentina',
  },
  lang: { label: 'Language' },
}

export const dictionaries: Record<Lang, Dict> = { es, en, pt, fr, it, de }
