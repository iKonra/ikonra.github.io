import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dictionaries, type Dict } from './content'
import { isLang, type Lang } from './langs'

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void }
const I18nContext = createContext<Ctx | null>(null)

// Orden: ?lang= de la URL (los links hreflang) > preferencia guardada > idiomas del navegador > inglés.
// Si cambia esta lógica, también hay que cambiar el script del <head> en seo/staticHtml.ts.
function initialLang(): Lang {
  const param = new URLSearchParams(location.search).get('lang')
  if (isLang(param)) return param
  try {
    const saved = localStorage.getItem('lang')
    if (isLang(saved)) return saved
  } catch {}
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l?.slice(0, 2).toLowerCase()
    if (isLang(code)) return code
  }
  return navigator.language ? 'en' : 'es'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang)

  useEffect(() => {
    const { meta } = dictionaries[lang]
    document.documentElement.lang = lang
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    try { localStorage.setItem('lang', lang) } catch {}
    // un ?lang= en la URL no puede contradecir la elección hecha en el sitio
    const url = new URL(location.href)
    if (url.searchParams.has('lang') && url.searchParams.get('lang') !== lang) {
      url.searchParams.set('lang', lang)
      history.replaceState(null, '', url)
    }
  }, [lang])

  const value = useMemo(() => ({ lang, t: dictionaries[lang], setLang }), [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
