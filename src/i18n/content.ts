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
  id: 'tricapi' | 'twobones' | 'web' | 'bots'
  title: string
  kind: string
  description: string
  stack: string
  url?: string
}

const es = {
  nav: { about: 'Sobre mí', projects: 'Proyectos', journey: 'Trayectoria', contact: 'Contacto', menu: 'Menú', close: 'Cerrar' },
  hero: {
    name: 'Conrado De Napoli',
    lead: 'Software Engineer de 20 años. Construyo soluciones para empresas, y cuando me aburro construyo videojuegos, bots y lo que se me ocurra.',
    bored: 'Me aburrí',
    boredAgain: 'Otra vez',
    then: 'Entonces:',
    ideas: [
      'armo un bot de Discord a las 3 AM.',
      'prototipo un videojuego en un fin de semana.',
      'lanzo un producto, porque sí.',
      'rehago este portfolio. Otra vez.',
      'aprendo un framework que salió ayer.',
      'automatizo algo que hice dos veces.',
    ],
    projects: 'Ver proyectos',
  },
  about: {
    title: 'Sobre mí',
    statement: 'Soy curioso y me apasiona la tecnología. Me aburro seguido, y eso me lleva a hacer un montón de cosas.',
    body: 'Estudio Ingeniería en Informática y trabajo como Software Engineer, diseñando y desarrollando soluciones a medida para empresas. Fuera de eso tengo un estudio de videojuegos con un amigo, un producto propio y una lista de ideas que no para de crecer.',
    facts: [
      ['Edad', '20 años'],
      ['Estudio', 'Ingeniería en Informática'],
      ['Trabajo', 'Software Engineer'],
      ['Construyo', 'Software para empresas, juegos y bots'],
    ],
  },
  projects: {
    title: 'Proyectos',
    lead: 'Cosas que construí, casi todas porque me aburría.',
    parallaxAlt: 'Saturno y sus anillos sobre un cielo estrellado',
    visit: 'Visitar',
    soon: 'Web en camino',
    items: [
      {
        id: 'tricapi',
        title: 'Tricapi',
        kind: 'Producto propio',
        description: 'Mi producto, publicado en tricapi.com. Lo pensé, lo diseñé y lo desarrollé de punta a punta.',
        stack: 'TypeScript, React, Node.js',
        url: links.tricapi,
      },
      {
        id: 'twobones',
        title: 'TwoBones Studio',
        kind: 'Estudio de videojuegos',
        description: 'El estudio indie que armé con un amigo. Diseñamos, programamos y le damos vida a mundos jugables.',
        stack: 'Game design, C#, 3D',
        url: links.twobones,
      },
      {
        id: 'web',
        title: 'Desarrollo web',
        kind: 'Para empresas',
        description: 'Sitios, paneles y aplicaciones a medida: rápidos, mantenibles y pensados para resolver problemas reales del negocio.',
        stack: 'React, Next.js, APIs, bases de datos',
      },
      {
        id: 'bots',
        title: 'Bots de Discord',
        kind: 'Comunidades',
        description: 'Bots para comunidades y servidores: moderación, comandos, integraciones con otras plataformas y automatizaciones.',
        stack: 'Node.js, discord.js, Python',
      },
    ] as Project[],
    discord: {
      channel: 'general',
      history: [
        ['lucas', '¿alguien tiene un bot para recordatorios?'],
        ['conra', 'dame un segundo'],
      ],
      user: 'conra',
      command: '/recordar 3am construir algo nuevo',
      bot: 'Bonebot',
      reply: 'Anotado. Te aviso a las 3:00 AM.',
      typing: 'Bonebot está escribiendo…',
    },
    game: { start: 'Presioná start' },
  },
  stack: 'TypeScript · React · Node.js · Next.js · Three.js · Python · C# · discord.js · SQL · Docker ·',
  journey: {
    title: 'Trayectoria',
    items: [
      { when: 'Hoy', title: 'Software Engineer', text: 'Diseño y desarrollo soluciones de software para empresas.' },
      { when: 'En curso', title: 'Ingeniería en Informática', text: 'La base teórica de todo lo que construyo.' },
      { when: 'Producto', title: 'Tricapi', text: 'Mi propio producto, de la idea a producción.' },
      { when: 'Cofundador', title: 'TwoBones Studio', text: 'Estudio de videojuegos indie con un amigo.' },
      { when: 'El comienzo', title: 'Bots de Discord y webs', text: 'Donde empezó todo: automatizar y construir para internet.' },
    ],
  },
  contact: {
    title: '¿Tenés una idea? Construyámosla.',
    text: 'Estoy abierto a proyectos nuevos, colaboraciones o simplemente a charlar de tecnología.',
    button: 'Escribime en GitHub',
    footer: 'Hecho con React, Motion y Three.js.',
  },
  lang: { other: 'EN', label: 'Switch to English' },
}

export type Dict = typeof es

const en: Dict = {
  nav: { about: 'About', projects: 'Projects', journey: 'Journey', contact: 'Contact', menu: 'Menu', close: 'Close' },
  hero: {
    name: 'Conrado De Napoli',
    lead: "20-year-old Software Engineer. I build solutions for companies, and when I get bored I build games, bots and whatever comes to mind.",
    bored: "I'm bored",
    boredAgain: 'Again',
    then: 'So:',
    ideas: [
      'I build a Discord bot at 3 AM.',
      'I prototype a game over a weekend.',
      'I ship a product, just because.',
      'I rebuild this portfolio. Again.',
      'I learn a framework released yesterday.',
      'I automate something I did twice.',
    ],
    projects: 'See projects',
  },
  about: {
    title: 'About me',
    statement: "I'm curious and passionate about technology. I get bored often, and that leads me to build a lot of things.",
    body: "I study Computer Engineering and work as a Software Engineer, designing and building custom solutions for companies. Beyond that I run a game studio with a friend, have my own product and keep a list of ideas that never stops growing.",
    facts: [
      ['Age', '20'],
      ['Studying', 'Computer Engineering'],
      ['Working as', 'Software Engineer'],
      ['Building', 'Software for companies, games and bots'],
    ],
  },
  projects: {
    title: 'Projects',
    lead: 'Things I built, most of them because I was bored.',
    parallaxAlt: 'Saturn and its rings against a starry sky',
    visit: 'Visit',
    soon: 'Site coming soon',
    items: [
      {
        id: 'tricapi',
        title: 'Tricapi',
        kind: 'My own product',
        description: 'My product, live at tricapi.com. I conceived, designed and built it end to end.',
        stack: 'TypeScript, React, Node.js',
        url: links.tricapi,
      },
      {
        id: 'twobones',
        title: 'TwoBones Studio',
        kind: 'Game studio',
        description: 'The indie studio I started with a friend. We design, code and bring playable worlds to life.',
        stack: 'Game design, C#, 3D',
        url: links.twobones,
      },
      {
        id: 'web',
        title: 'Web development',
        kind: 'For companies',
        description: 'Custom sites, dashboards and apps: fast, maintainable and built to solve real business problems.',
        stack: 'React, Next.js, APIs, databases',
      },
      {
        id: 'bots',
        title: 'Discord bots',
        kind: 'Communities',
        description: 'Bots for communities and servers: moderation, commands, integrations with other platforms and automations.',
        stack: 'Node.js, discord.js, Python',
      },
    ],
    discord: {
      channel: 'general',
      history: [
        ['lucas', 'anyone got a reminder bot?'],
        ['conra', 'give me a sec'],
      ],
      user: 'conra',
      command: '/remind 3am build something new',
      bot: 'Bonebot',
      reply: "Got it. I'll ping you at 3:00 AM.",
      typing: 'Bonebot is typing…',
    },
    game: { start: 'Press start' },
  },
  stack: es.stack,
  journey: {
    title: 'Journey',
    items: [
      { when: 'Now', title: 'Software Engineer', text: 'Designing and building software solutions for companies.' },
      { when: 'Ongoing', title: 'Computer Engineering', text: 'The theory behind everything I build.' },
      { when: 'Product', title: 'Tricapi', text: 'My own product, from idea to production.' },
      { when: 'Co-founder', title: 'TwoBones Studio', text: 'Indie game studio with a friend.' },
      { when: 'The start', title: 'Discord bots & websites', text: 'Where it all began: automating and building for the internet.' },
    ],
  },
  contact: {
    title: "Got an idea? Let's build it.",
    text: "I'm open to new projects, collaborations or just talking tech.",
    button: 'Reach me on GitHub',
    footer: 'Built with React, Motion and Three.js.',
  },
  lang: { other: 'ES', label: 'Cambiar a español' },
}

export const dictionaries: Record<Lang, Dict> = { es, en }
