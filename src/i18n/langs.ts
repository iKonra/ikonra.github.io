// Idiomas disponibles. Para sumar uno: agregarlo acá, crear locales/xx.ts y registrarlo en content.ts.
export const langs = {
  es: { name: 'Español', og: 'es_AR' },
  en: { name: 'English', og: 'en_US' },
  pt: { name: 'Português', og: 'pt_BR' },
  fr: { name: 'Français', og: 'fr_FR' },
  it: { name: 'Italiano', og: 'it_IT' },
  de: { name: 'Deutsch', og: 'de_DE' },
} as const

export type Lang = keyof typeof langs
export const langCodes = Object.keys(langs) as Lang[]
export const isLang = (v: unknown): v is Lang => typeof v === 'string' && v in langs
