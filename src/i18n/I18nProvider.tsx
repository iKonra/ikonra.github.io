import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dictionaries, type Dict, type Lang } from './content'

type Ctx = { lang: Lang; t: Dict; toggle: () => void }
const I18nContext = createContext<Ctx | null>(null)

// Orden: ?lang= de la URL (los links hreflang) > preferencia guardada > idioma del navegador.
// Si cambiás esta lógica, cambiá también el script del <head> en index.html.
function initialLang(): Lang {
  const param = new URLSearchParams(location.search).get('lang')
  if (param === 'en' || param === 'es') return param
  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'es' || saved === 'en') return saved
  } catch {}
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : navigator.language ? 'en' : 'es'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang)

  useEffect(() => {
    const { meta } = dictionaries[lang]
    document.documentElement.lang = lang
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    try { localStorage.setItem('lang', lang) } catch {}
  }, [lang])

  const toggle = useCallback(() => setLang(l => (l === 'es' ? 'en' : 'es')), [])
  const value = useMemo(() => ({ lang, t: dictionaries[lang], toggle }), [lang, toggle])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
