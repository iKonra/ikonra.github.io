// Todo el texto del sitio vive acá. Editá libremente: cada clave tiene versión ES y EN.
// Lo que dejes en '' (o sin definir) no se muestra.

export type Lang = 'es' | 'en'

export const links = {
  github: 'https://github.com/iKonra',
  linkedin: 'https://www.linkedin.com/in/conrado-de-napoli-8627442a0/',
  email: 'denapoliconra@gmail.com',
  // El PDF va en public/cv.pdf
  cv: '/cv.pdf',
  tricapi: 'https://tricapi.com',
  skoly: 'https://top.gg/bot/771034535219429389',
  twobones: '',
}

export type Metric = { value: number; prefix?: string; suffix?: string; label: string; short?: string; note?: string }

export type Project = {
  id: 'tricapi' | 'inti' | 'twobones' | 'web' | 'bots'
  title: string
  kind: string
  period?: string
  description: string
  features?: string[]
  metrics?: Metric[]
  /** Proyecto destacado dentro de otro (ej. La Beduina en Inti). Borrá el bloque `featured` para que no aparezca. `result` solo se muestra si lo completás. */
  featured?: { label: string; name: string; text: string; result?: string }
  game?: { label: string; name: string; text: string; status: string }
  stack?: string
  url?: string
}

const es = {
  meta: {
    title: 'Conrado De Napoli — Software Engineer · Product Engineer',
    description: 'Co-Founder de Tricapi (SaaS con 70 clientes pagos) e Inti (software a medida). Estudiante de Ingeniería en Informática (UNL).',
  },
  nav: { about: 'Sobre mí', projects: 'Proyectos', journey: 'Trayectoria', contact: 'Contacto', menu: 'Menú', close: 'Cerrar' },
  hero: {
    name: 'Conrado De Napoli',
    role: 'Software Engineer · Product Engineer',
    lead: 'Co-Founder de Tricapi, un SaaS con 70 clientes pagos. Estudiante de Ingeniería en Informática (UNL).',
    projects: 'Ver proyectos',
    contact: 'Contacto',
    morph: 'Cambiar forma',
  },
  about: {
    title: 'Sobre mí',
    statement: 'Software Engineer con foco en producto. Construyo sistemas y plataformas que resuelven problemas reales de negocio.',
    body: 'Estudio Ingeniería en Informática (UNL) y trabajo como Software Engineer y Product Engineer. Cofundé Tricapi, un SaaS con 70 clientes pagos, e Inti, una empresa de software a medida. Además, cofundé TwoBones Studio, un estudio independiente de videojuegos.',
    facts: [
      ['Estudio', 'Ingeniería en Informática (UNL)'],
      ['Trabajo', 'Software Engineer · Product Engineer'],
      ['Cofundador', 'Tricapi e Inti'],
      ['Construyo', 'SaaS, software a medida y videojuegos'],
    ],
  },
  projects: {
    title: 'Proyectos',
    lead: 'Trabajos y proyectos seleccionados.',
    parallaxAlt: 'Saturno y sus anillos sobre un cielo estrellado',
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
          { value: 70, short: 'clientes pagos', label: 'clientes pagos en total', note: 'hasta 30 activos en simultáneo' },
          { value: 130, short: 'líneas de WhatsApp en simultáneo', label: 'líneas de WhatsApp procesadas en simultáneo' },
          { value: 35, prefix: '−', suffix: '%', short: 'costo por lead de un cliente en 30 días', label: 'costo por lead en 30 días', note: 'resultado de un cliente' },
        ],
        stack: 'Node.js, Express, Supabase (PostgreSQL), Baileys, Jest, Nginx, Cloudflare',
        url: links.tricapi,
      },
      {
        id: 'inti',
        title: 'Inti',
        kind: 'Software a medida · Cofundador',
        period: 'Octubre 2026 – presente',
        description: 'Empresa de software a medida que cofundé en octubre de 2026.',
        metrics: [{ value: 5, label: 'clientes en el primer mes' }],
        featured: { label: 'Proyecto destacado', name: 'La Beduina', text: 'Sistema de gestión interna a medida.' },
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
        title: 'Skoly',
        kind: 'Bot de Discord · hasta 75 servidores',
        description: 'Mi primer proyecto de programación: un bot de Discord, desde 2019.',
        stack: 'Node.js, discord.js',
        url: links.skoly,
      },
    ] as Project[],
    discord: {
      channel: 'general',
      history: [] as [string, string][],
      user: 'usuario',
      command: '/help',
      bot: 'Skoly',
      reply: 'Hola, soy Skoly. Estos son los comandos disponibles en este servidor.',
      typing: 'Skoly está escribiendo…',
    },
    game: { hint: 'Clic, toque o barra espaciadora para saltar', over: 'Fin del juego. Clic para reintentar', label: 'Mini juego de TwoBones', cursor: 'Saltar' },
  },
  journey: {
    title: 'Trayectoria',
    // De más reciente a más antiguo. Las entradas sin año son las que faltan completar.
    items: [
      { when: 'Oct 2026 – presente', title: 'Inti', text: 'Cofundador de una empresa de software a medida. 5 clientes en el primer mes.' },
      { when: 'Jul 2026 – presente', title: 'Tricapi', text: 'Cofundador del SaaS que conecta cada venta de WhatsApp con su anuncio de Meta. 70 clientes pagos.' },
      { when: 'En curso', title: 'Ingeniería en Informática', text: 'Cursando en la UNL.' },
      { when: 'Videojuegos', title: 'TwoBones Studio', text: 'Estudio independiente de videojuegos. Primer juego: Boneheads Party, en desarrollo.' },
      { when: '2019', title: 'Skoly', text: 'Primer proyecto de programación: un bot de Discord presente en hasta 75 servidores.' },
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
  lang: { other: 'EN', label: 'Switch to English' },
}

export type Dict = typeof es

const en: Dict = {
  meta: {
    title: 'Conrado De Napoli — Software Engineer · Product Engineer',
    description: 'Co-Founder of Tricapi (a SaaS with 70 paying customers) and Inti (custom software). Computer Engineering student (UNL).',
  },
  nav: { about: 'About', projects: 'Projects', journey: 'Journey', contact: 'Contact', menu: 'Menu', close: 'Close' },
  hero: {
    name: 'Conrado De Napoli',
    role: 'Software Engineer · Product Engineer',
    lead: 'Co-Founder of Tricapi, a SaaS with 70 paying customers. Computer Engineering student (UNL).',
    projects: 'View projects',
    contact: 'Contact',
    morph: 'Morph',
  },
  about: {
    title: 'About me',
    statement: 'Software Engineer focused on product. I build systems and platforms that solve real business problems.',
    body: 'I study Computer Engineering (UNL) and work as a Software Engineer and Product Engineer. I co-founded Tricapi, a SaaS with 70 paying customers, and Inti, a custom software company. I also co-founded TwoBones Studio, an independent game studio.',
    facts: [
      ['Studying', 'Computer Engineering (UNL)'],
      ['Working as', 'Software Engineer · Product Engineer'],
      ['Co-founder', 'Tricapi and Inti'],
      ['Building', 'SaaS, custom software and games'],
    ],
  },
  projects: {
    title: 'Projects',
    lead: 'Selected work and projects.',
    parallaxAlt: 'Saturn and its rings against a starry sky',
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
          { value: 70, short: 'paying customers', label: 'paying customers in total', note: 'up to 30 active at once' },
          { value: 130, short: 'WhatsApp lines at once', label: 'WhatsApp lines processed simultaneously' },
          { value: 35, prefix: '−', suffix: '%', short: 'cost per lead for one customer in 30 days', label: 'cost per lead in 30 days', note: "one customer's result" },
        ],
        stack: 'Node.js, Express, Supabase (PostgreSQL), Baileys, Jest, Nginx, Cloudflare',
        url: links.tricapi,
      },
      {
        id: 'inti',
        title: 'Inti',
        kind: 'Custom software · Co-founder',
        period: 'October 2026 – present',
        description: 'Custom software company I co-founded in October 2026.',
        metrics: [{ value: 5, label: 'customers in the first month' }],
        featured: { label: 'Featured project', name: 'La Beduina', text: 'Custom internal management system.' },
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
        title: 'Skoly',
        kind: 'Discord bot · up to 75 servers',
        description: 'My first programming project: a Discord bot, since 2019.',
        stack: 'Node.js, discord.js',
        url: links.skoly,
      },
    ] as Project[],
    discord: {
      channel: 'general',
      history: [] as [string, string][],
      user: 'user',
      command: '/help',
      bot: 'Skoly',
      reply: 'Hi, I\'m Skoly. These are the commands available on this server.',
      typing: 'Skoly is typing…',
    },
    game: { hint: 'Click, tap or press space to jump', over: 'Game over. Click to retry', label: 'TwoBones mini game', cursor: 'Jump' },
  },
  journey: {
    title: 'Journey',
    items: [
      { when: 'Oct 2026 – present', title: 'Inti', text: 'Co-founder of a custom software company. 5 customers in the first month.' },
      { when: 'Jul 2026 – present', title: 'Tricapi', text: 'Co-founder of the SaaS that connects every WhatsApp sale to its Meta ad. 70 paying customers.' },
      { when: 'Ongoing', title: 'Computer Engineering', text: 'Studying at UNL.' },
      { when: 'Games', title: 'TwoBones Studio', text: 'Independent game studio. First game: Boneheads Party, in development.' },
      { when: '2019', title: 'Skoly', text: 'First programming project: a Discord bot present in up to 75 servers.' },
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
  lang: { other: 'ES', label: 'Cambiar a español' },
}

export const dictionaries: Record<Lang, Dict> = { es, en }
