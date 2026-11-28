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
    stars: 'Cada estrella dorada es una contribución mía en GitHub: {n} en el último año',
    contrib: ['contribución', 'contribuciones'],
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
    game: { hint: 'Clic, toque o barra espaciadora para saltar', over: 'Fin del juego. Clic para reintentar', label: 'Mini juego de TwoBones' },
  },
  atlas: {
    title: 'Atlas de lo imposible',
    lead: 'Ocho objetos que la física permite pero que nadie observó todavía. Algunos podrían existir hoy; otros recién aparecerían en un futuro muy lejano. Cada imagen es una interpretación artística basada en su teoría.',
    place: 'Física teórica',
    status: 'Estado',
    origin: 'Origen de la idea',
    hint: 'Desplazar para recorrer el atlas',
    items: [
      {
        id: 'pbh',
        title: 'Agujeros negros primordiales',
        tag: 'Agujeros negros',
        status: 'En búsqueda',
        text: 'Se habrían formado en la primera fracción de segundo del universo, cuando algunas regiones eran tan densas que colapsaron sin necesidad de una estrella. Podrían pesar desde lo que un asteroide hasta miles de soles, y son candidatos a explicar parte de la materia oscura. Los más pequeños se evaporan por radiación de Hawking: cuanta menos masa, más calientes, hasta terminar en un destello de rayos gamma.',
        fact: { value: '5 × 10¹¹ kg', label: 'Masa inicial de los que estarían terminando de evaporarse hoy' },
        origin: 'Zel’dovich y Novikov, 1966 · Hawking, 1971',
      },
      {
        id: 'boson',
        title: 'Estrella de bosones',
        tag: 'Materia oscura',
        status: 'Hipotética',
        text: 'Una estrella sin átomos: una nube de partículas bosónicas tan fría que todas se comportan como una sola onda cuántica, sostenida contra su propia gravedad por el principio de incertidumbre. No tendría superficie, sería transparente y no emitiría luz propia. Si existen, podrían estar formadas por axiones u otras partículas de materia oscura, y su fusión dejaría ondas gravitacionales distintas a las de dos agujeros negros.',
        fact: { value: '1 onda', label: 'Todas sus partículas comparten un mismo estado cuántico' },
        origin: 'Kaup, 1968 · Ruffini y Bonazzola, 1969',
      },
      {
        id: 'quasi',
        title: 'Cuasiestrella',
        tag: 'Universo temprano',
        status: 'Hipotética',
        text: 'En el universo joven, una nube de gas gigantesca pudo formar un agujero negro en su centro sin dispersarse. Lo que caía hacia el agujero liberaba tanta energía que la envoltura se infló hasta miles de veces el tamaño del Sol: una estrella alimentada por un agujero negro, no por fusión nuclear. Explicaría cómo ya existían agujeros negros enormes poco después del Big Bang, y algunos objetos muy rojos que observa el telescopio James Webb podrían ser algo parecido.',
        fact: { value: '7 millones', label: 'De años de vida según los modelos; después queda un agujero negro de miles de soles' },
        origin: 'Begelman, Rossi y Armitage, 2008',
      },
      {
        id: 'quark',
        title: 'Estrella de quarks',
        tag: 'Materia exótica',
        status: 'Hipotética',
        text: 'Dentro de una estrella de neutrones la presión podría ser tan extrema que los neutrones se disuelven en quarks libres. Si la materia extraña (quarks arriba, abajo y extraño) es la forma más estable de la materia, el resultado sería una sola gota gigante: un núcleo atómico del tamaño de una ciudad. Nacería en una supernova como la que dejó la Nebulosa del Cangrejo y, desde afuera, se vería como un púlsar algo más compacto de lo normal.',
        fact: { value: '~20 km', label: 'De diámetro, con más masa que el Sol' },
        origin: 'Itoh, 1970 · Witten, 1984',
      },
      {
        id: 'gravastar',
        title: 'Gravastar',
        tag: 'Alternativa al agujero negro',
        status: 'Alternativa teórica',
        text: 'Una alternativa al agujero negro que evita la singularidad. En lugar de horizonte de sucesos tendría una cáscara finísima de materia ultradensa y, adentro, un vacío con energía oscura que empuja hacia afuera y frena el colapso. Desde lejos curvaría la luz igual que un agujero negro; la diferencia podría aparecer como «ecos» en las ondas gravitacionales de una fusión.',
        fact: { value: 'Sin singularidad', label: 'Ni horizonte de sucesos: adentro, solo vacío' },
        origin: 'Mazur y Mottola, 2001',
      },
      {
        id: 'white',
        title: 'Agujero blanco',
        tag: 'Relatividad general',
        status: 'Solución matemática',
        text: 'Las ecuaciones de Einstein admiten un agujero negro con el tiempo invertido: nada puede entrar en él y todo lo que contiene sale despedido. Nunca se observó uno y se lo considera inestable, pero el debate sigue abierto: hay propuestas de que los agujeros negros, al evaporarse, terminarían convertidos en agujeros blancos, e incluso de que el Big Bang fue uno.',
        fact: { value: 'Nada entra', label: 'Es un agujero negro con el tiempo invertido' },
        origin: 'Novikov, 1964 · Ne’eman, 1965',
      },
      {
        id: 'dyson',
        title: 'Esfera de Dyson',
        tag: 'Megaestructura',
        status: 'Especulativa',
        text: 'Una civilización que necesitara toda la energía de su estrella podría rodearla de colectores en órbita. No sería una cáscara sólida, imposible de sostener, sino un enjambre de millones de espejos y paneles. Toda esa energía terminaría irradiada como calor, así que se la buscaría como una estrella con exceso de infrarrojo: en 2024 un estudio encontró siete candidatas en datos de Gaia y WISE, ninguna confirmada.',
        fact: { value: '3,8 × 10²⁶ W', label: 'La potencia total del Sol que podría captar' },
        origin: 'Freeman Dyson, 1960',
      },
      {
        id: 'dwarf',
        title: 'Enana negra',
        tag: 'Futuro lejano',
        status: 'Aún no existe',
        text: 'Es el final de una estrella como el Sol: una enana blanca que se enfrió hasta dejar de brillar. Su interior de carbono y oxígeno se cristaliza a medida que pierde calor, algo que el satélite Gaia ya detectó en enanas blancas reales. Ninguna enana negra existe todavía: el proceso tarda muchísimo más que la edad actual del universo.',
        fact: { value: '~10¹⁵ años', label: 'Para apagarse del todo; el universo tiene 13.800 millones' },
        origin: 'Enfriamiento de enanas blancas · Mestel, 1952',
      },
    ],
  },
  stack: {
    title: 'Stack técnico',
    lead: 'Tecnologías y herramientas con las que trabajo.',
    github: { label: 'Mini juego con mis contribuciones de GitHub', start: 'Clic para jugar', hint: 'Cada cuadro es un día real de mi GitHub. Mover para apuntar; los bugs restan vidas.', score: 'Contribuciones', bugs: 'Bugs corregidos', over: 'Fin del juego. Clic para reintentar', win: 'Año completo. Clic para jugar otra vez', total: 'contribuciones en el último año', streak: 'días seguidos, mejor racha', record: 'en un solo día', repos: 'repositorios públicos' },
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
  /** Frases de la caída, después de Contacto. */
  descent: ['Una de todas estas luces.', 'Una ventana encendida.', 'Aquí empezó este universo.', 'Y en un píxel, todo vuelve a empezar.'],
  hud: {
    distance: 'Distancia a la Tierra',
    altitude: 'Altitud',
    toScreen: 'Distancia a la pantalla',
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
    places: { galaxy: 'Vía Láctea', nebula: 'Nebulosa', jump: 'Velocidad de la luz', hole: 'Sagitario A*', wormhole: 'Agujero de gusano', belt: 'Cinturón de Kuiper', saturn: 'Saturno', moon: 'La Luna', earth: 'La Tierra', clouds: 'Las nubes', city: 'La ciudad', window: 'Una ventana', room: 'La habitación', screen: 'El monitor', pixel: 'Un píxel', bang: 'Big Bang' },
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
    stars: 'Each golden star is one of my GitHub contributions: {n} in the past year',
    contrib: ['contribution', 'contributions'],
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
    game: { hint: 'Click, tap or press space to jump', over: 'Game over. Click to retry', label: 'TwoBones mini game' },
  },
  atlas: {
    title: 'Atlas of the impossible',
    lead: 'Eight objects that physics allows but no one has observed yet. Some could exist today; others would only appear in the very distant future. Each image is an artistic interpretation based on its theory.',
    place: 'Theoretical physics',
    status: 'Status',
    origin: 'Origin of the idea',
    hint: 'Scroll to explore the atlas',
    items: [
      {
        id: 'pbh',
        title: 'Primordial black holes',
        tag: 'Black holes',
        status: 'Being searched for',
        text: 'They would have formed in the first fraction of a second of the universe, when some regions were so dense that they collapsed without needing a star. They could weigh anything from an asteroid to thousands of suns, and they are candidates to explain part of dark matter. The smallest ones evaporate through Hawking radiation: the less mass, the hotter they get, until they end in a flash of gamma rays.',
        fact: { value: '5 × 10¹¹ kg', label: 'Initial mass of those that would be finishing their evaporation today' },
        origin: 'Zel’dovich & Novikov, 1966 · Hawking, 1971',
      },
      {
        id: 'boson',
        title: 'Boson star',
        tag: 'Dark matter',
        status: 'Hypothetical',
        text: 'A star without atoms: a cloud of bosonic particles so cold that they all behave as a single quantum wave, held up against its own gravity by the uncertainty principle. It would have no surface, be transparent and emit no light of its own. If they exist, they could be made of axions or other dark matter particles, and their mergers would leave gravitational waves different from those of two black holes.',
        fact: { value: '1 wave', label: 'All of its particles share the same quantum state' },
        origin: 'Kaup, 1968 · Ruffini & Bonazzola, 1969',
      },
      {
        id: 'quasi',
        title: 'Quasi-star',
        tag: 'Early universe',
        status: 'Hypothetical',
        text: 'In the young universe, a gigantic gas cloud could have formed a black hole at its center without being blown apart. Matter falling into the hole released so much energy that the envelope swelled to thousands of times the size of the Sun: a star powered by a black hole rather than by nuclear fusion. It would explain how huge black holes already existed shortly after the Big Bang, and some very red objects seen by the James Webb telescope could be something similar.',
        fact: { value: '7 million', label: 'Years of life according to models; then a black hole of thousands of suns remains' },
        origin: 'Begelman, Rossi & Armitage, 2008',
      },
      {
        id: 'quark',
        title: 'Quark star',
        tag: 'Exotic matter',
        status: 'Hypothetical',
        text: 'Inside a neutron star the pressure could be so extreme that neutrons dissolve into free quarks. If strange matter (up, down and strange quarks) is the most stable form of matter, the result would be a single giant drop: an atomic nucleus the size of a city. It would be born in a supernova like the one that left the Crab Nebula and, from outside, would look like a pulsar slightly more compact than usual.',
        fact: { value: '~20 km', label: 'Across, with more mass than the Sun' },
        origin: 'Itoh, 1970 · Witten, 1984',
      },
      {
        id: 'gravastar',
        title: 'Gravastar',
        tag: 'Black hole alternative',
        status: 'Theoretical alternative',
        text: 'An alternative to the black hole that avoids the singularity. Instead of an event horizon it would have an extremely thin shell of ultra-dense matter and, inside, a vacuum filled with dark energy that pushes outward and halts the collapse. From afar it would bend light just like a black hole; the difference could show up as “echoes” in the gravitational waves of a merger.',
        fact: { value: 'No singularity', label: 'And no event horizon: inside, only vacuum' },
        origin: 'Mazur & Mottola, 2001',
      },
      {
        id: 'white',
        title: 'White hole',
        tag: 'General relativity',
        status: 'Mathematical solution',
        text: 'Einstein’s equations allow a black hole running backwards in time: nothing can enter it, and everything it contains is ejected. None has ever been observed and it is considered unstable, but the debate remains open: some propose that evaporating black holes end up as white holes, and even that the Big Bang was one.',
        fact: { value: 'Nothing enters', label: 'It is a black hole with time reversed' },
        origin: 'Novikov, 1964 · Ne’eman, 1965',
      },
      {
        id: 'dyson',
        title: 'Dyson sphere',
        tag: 'Megastructure',
        status: 'Speculative',
        text: 'A civilization that needed all of its star’s energy could surround it with orbiting collectors. Not a solid shell, which could not hold together, but a swarm of millions of mirrors and panels. All that energy would end up radiated as heat, so one would look for a star with excess infrared: in 2024 a study found seven candidates in Gaia and WISE data, none of them confirmed.',
        fact: { value: '3.8 × 10²⁶ W', label: 'The total power of the Sun it could capture' },
        origin: 'Freeman Dyson, 1960',
      },
      {
        id: 'dwarf',
        title: 'Black dwarf',
        tag: 'Distant future',
        status: 'Does not exist yet',
        text: 'It is the end of a star like the Sun: a white dwarf that has cooled until it no longer shines. Its carbon and oxygen interior crystallizes as it loses heat, something the Gaia satellite has already detected in real white dwarfs. No black dwarf exists yet: the process takes far longer than the current age of the universe.',
        fact: { value: '~10¹⁵ years', label: 'To fade out completely; the universe is 13.8 billion years old' },
        origin: 'White dwarf cooling · Mestel, 1952',
      },
    ],
  },
  stack: {
    title: 'Tech stack',
    lead: 'Technologies and tools I work with.',
    github: { label: 'Mini game built from my GitHub contributions', start: 'Click to play', hint: 'Every square is a real day on my GitHub. Move to aim; bugs cost lives.', score: 'Contributions', bugs: 'Bugs fixed', over: 'Game over. Click to retry', win: 'Year complete. Click to play again', total: 'contributions in the last year', streak: 'days in a row, best streak', record: 'in a single day', repos: 'public repositories' },
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
  /** Frases de la caída, después de Contacto. */
  descent: ['One of all these lights.', 'A single lit window.', 'This universe began here.', 'And in one pixel, it all begins again.'],
  hud: {
    distance: 'Distance to Earth',
    altitude: 'Altitude',
    toScreen: 'Distance to the screen',
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
    places: { galaxy: 'Milky Way', nebula: 'Nebula', jump: 'Light speed', hole: 'Sagittarius A*', wormhole: 'Wormhole', belt: 'Kuiper Belt', saturn: 'Saturn', moon: 'The Moon', earth: 'Earth', clouds: 'The clouds', city: 'The city', window: 'A window', room: 'The room', screen: 'The monitor', pixel: 'A pixel', bang: 'Big Bang' },
    beacon: 'Argentina',
  },
  lang: { label: 'Language' },
}

export const dictionaries: Record<Lang, Dict> = { es, en, pt, fr, it, de }
