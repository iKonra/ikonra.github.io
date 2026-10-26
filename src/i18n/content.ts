// Todo el texto del sitio vive acá. Editá libremente: cada clave tiene versión ES y EN.

export type Lang = 'es' | 'en'

export const links = {
  github: 'https://github.com/ikonra',
  tricapi: 'https://tricapi.com',
  // Completá con tus links reales (dejá '' para ocultar el botón)
  linkedin: '',
  email: '',
  twobones: '',
}

export type Project = {
  id: string
  title: string
  tag: string
  description: string
  stack: string[]
  url?: string
  accent: string
}

const es = {
  nav: { about: 'Sobre mí', projects: 'Proyectos', journey: 'Trayectoria', contact: 'Contacto' },
  hero: {
    hello: 'Hola, soy',
    name: 'Conrado De Napoli',
    roles: ['Software Engineer', 'Game Developer', 'Creador de bots', 'Estudiante de Ingeniería'],
    tagline: 'Construyo soluciones de software para empresas. Me aburro rápido, así que siempre estoy creando algo nuevo.',
    cta: 'Ver proyectos',
    cta2: 'Hablemos',
    scroll: 'Scroll',
  },
  about: {
    kicker: 'Sobre mí',
    title: 'Curioso por naturaleza, ingeniero por elección.',
    body: [
      'Tengo 20 años, estudio Ingeniería en Informática y trabajo como Software Engineer desarrollando soluciones a medida para empresas.',
      'Soy una persona curiosa y apasionada por la tecnología. Me aburro con frecuencia, y eso es justamente lo que me empuja a hacer un montón de cosas: productos SaaS, videojuegos, bots, webs… si me da curiosidad, lo construyo.',
    ],
    stats: [
      { value: 20, suffix: '', label: 'años' },
      { value: 4, suffix: '+', label: 'áreas en las que construyo' },
      { value: 100, suffix: '%', label: 'curiosidad' },
    ],
    boredTitle: '¿Me aburro? Hago algo nuevo.',
    boredButton: 'Aburrirme',
    boredIdeas: [
      'Armar un bot de Discord a las 3 AM',
      'Prototipar un videojuego en un fin de semana',
      'Lanzar un SaaS porque sí',
      'Reescribir mi portfolio (otra vez)',
      'Aprender un framework nuevo',
      'Automatizar algo que hago dos veces',
    ],
  },
  projects: {
    kicker: 'Proyectos',
    title: 'Cosas que construí (porque me aburría).',
    visit: 'Visitar',
    soon: 'Próximamente',
    items: [
      {
        id: 'tricapi',
        title: 'Tricapi',
        tag: 'Producto · SaaS',
        description: 'Plataforma propia publicada en tricapi.com: producto pensado, diseñado y desarrollado de punta a punta.',
        stack: ['TypeScript', 'React', 'Node.js', 'Cloud'],
        url: links.tricapi,
        accent: '#7c5cff',
      },
      {
        id: 'twobones',
        title: 'TwoBones Studio',
        tag: 'Estudio de videojuegos',
        description: 'Mi estudio de videojuegos indie junto a un amigo. Diseñamos, programamos y le damos vida a mundos jugables.',
        stack: ['Game Design', 'C#', 'Unity', '3D'],
        url: links.twobones,
        accent: '#ff5c8a',
      },
      {
        id: 'web',
        title: 'Desarrollo Web',
        tag: 'Soluciones para empresas',
        description: 'Sitios, paneles y aplicaciones web a medida para empresas: rápidos, mantenibles y enfocados en resolver problemas reales.',
        stack: ['React', 'Next.js', 'APIs', 'Bases de datos'],
        accent: '#22d3ee',
      },
      {
        id: 'bots',
        title: 'Bots de Discord',
        tag: 'Automatización · Comunidades',
        description: 'Bots de Discord para comunidades y servidores: moderación, comandos, integraciones y automatizaciones.',
        stack: ['Node.js', 'discord.js', 'Python', 'APIs'],
        accent: '#5865f2',
      },
    ] as Project[],
  },
  journey: {
    kicker: 'Trayectoria',
    title: 'Un camino hecho de curiosidad.',
    items: [
      { when: 'Hoy', title: 'Software Engineer', text: 'Diseño y desarrollo soluciones de software para empresas.' },
      { when: 'En curso', title: 'Ingeniería en Informática', text: 'Estudiando la base teórica de todo lo que construyo.' },
      { when: 'Proyecto', title: 'Tricapi', text: 'Mi propio producto, desde la idea hasta producción.' },
      { when: 'Co-fundador', title: 'TwoBones Studio', text: 'Estudio de videojuegos indie con un amigo.' },
      { when: 'Los inicios', title: 'Bots de Discord y webs', text: 'Donde empezó todo: automatizar y construir para internet.' },
    ],
  },
  skills: { kicker: 'Stack', row1: 'TypeScript · React · Node.js · Next.js · Three.js · Python ·', row2: 'Unity · C# · discord.js · SQL · Docker · Git ·' },
  contact: {
    kicker: 'Contacto',
    title: '¿Tenés una idea? Construyámosla.',
    text: 'Siempre estoy abierto a proyectos nuevos, colaboraciones o simplemente charlar de tecnología.',
    button: 'Escribime en GitHub',
    footer: 'Hecho con React, Motion y Three.js por Conrado De Napoli.',
  },
  lang: { switch: 'EN', label: 'Switch to English' },
}

export type Dict = typeof es

const en: Dict = {
  nav: { about: 'About', projects: 'Projects', journey: 'Journey', contact: 'Contact' },
  hero: {
    hello: "Hi, I'm",
    name: 'Conrado De Napoli',
    roles: ['Software Engineer', 'Game Developer', 'Bot builder', 'Engineering student'],
    tagline: 'I build software solutions for companies. I get bored easily, so I am always creating something new.',
    cta: 'See projects',
    cta2: "Let's talk",
    scroll: 'Scroll',
  },
  about: {
    kicker: 'About me',
    title: 'Curious by nature, engineer by choice.',
    body: [
      "I'm 20, studying Computer Engineering and working as a Software Engineer building custom solutions for companies.",
      "I'm a curious person, passionate about technology. I get bored often, and that's exactly what pushes me to do a ton of things: SaaS products, video games, bots, websites… if it sparks my curiosity, I build it.",
    ],
    stats: [
      { value: 20, suffix: '', label: 'years old' },
      { value: 4, suffix: '+', label: 'areas I build in' },
      { value: 100, suffix: '%', label: 'curiosity' },
    ],
    boredTitle: 'Bored? I build something new.',
    boredButton: 'Get bored',
    boredIdeas: [
      'Build a Discord bot at 3 AM',
      'Prototype a game over a weekend',
      'Ship a SaaS just because',
      'Rewrite my portfolio (again)',
      'Learn a brand-new framework',
      'Automate anything I do twice',
    ],
  },
  projects: {
    kicker: 'Projects',
    title: 'Things I built (because I was bored).',
    visit: 'Visit',
    soon: 'Coming soon',
    items: [
      {
        id: 'tricapi',
        title: 'Tricapi',
        tag: 'Product · SaaS',
        description: 'My own platform, live at tricapi.com: a product conceived, designed and built end to end.',
        stack: ['TypeScript', 'React', 'Node.js', 'Cloud'],
        url: links.tricapi,
        accent: '#7c5cff',
      },
      {
        id: 'twobones',
        title: 'TwoBones Studio',
        tag: 'Game studio',
        description: 'My indie game studio with a friend. We design, code and bring playable worlds to life.',
        stack: ['Game Design', 'C#', 'Unity', '3D'],
        url: links.twobones,
        accent: '#ff5c8a',
      },
      {
        id: 'web',
        title: 'Web Development',
        tag: 'Solutions for companies',
        description: 'Custom websites, dashboards and web apps for companies: fast, maintainable and focused on solving real problems.',
        stack: ['React', 'Next.js', 'APIs', 'Databases'],
        accent: '#22d3ee',
      },
      {
        id: 'bots',
        title: 'Discord Bots',
        tag: 'Automation · Communities',
        description: 'Discord bots for communities and servers: moderation, commands, integrations and automations.',
        stack: ['Node.js', 'discord.js', 'Python', 'APIs'],
        accent: '#5865f2',
      },
    ],
  },
  journey: {
    kicker: 'Journey',
    title: 'A path made of curiosity.',
    items: [
      { when: 'Now', title: 'Software Engineer', text: 'Designing and building software solutions for companies.' },
      { when: 'Ongoing', title: 'Computer Engineering', text: 'Studying the theory behind everything I build.' },
      { when: 'Project', title: 'Tricapi', text: 'My own product, from idea to production.' },
      { when: 'Co-founder', title: 'TwoBones Studio', text: 'Indie game studio with a friend.' },
      { when: 'The beginning', title: 'Discord bots & websites', text: 'Where it all started: automating and building for the internet.' },
    ],
  },
  skills: es.skills,
  contact: {
    kicker: 'Contact',
    title: "Got an idea? Let's build it.",
    text: "I'm always open to new projects, collaborations or just talking tech.",
    button: 'Reach me on GitHub',
    footer: 'Built with React, Motion and Three.js by Conrado De Napoli.',
  },
  lang: { switch: 'ES', label: 'Cambiar a español' },
}

export const dictionaries: Record<Lang, Dict> = { es, en }
