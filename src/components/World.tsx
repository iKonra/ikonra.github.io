import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { trackOnce } from '../lib/analytics'

const Universe = lazy(() => import('../universe/Universe'))

function supportsWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}

/** Monta el universo 3D cuando el navegador queda libre, así el texto aparece primero. */
export default function World() {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!supportsWebGL()) { document.documentElement.classList.add('no-3d'); trackOnce('3D · Sin WebGL 2'); return }
    const ric = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200))
    const id = ric(() => setShow(true), { timeout: 1200 })
    return () => (window.cancelIdleCallback ?? clearTimeout)(id)
  }, [])
  const screen = useMemo(() => ({ name: t.hero.name, role: t.hero.role, lead: t.hero.lead, projects: t.hero.projects, contact: t.hero.contact, nav: [t.nav.about, t.nav.projects, t.nav.stack, t.nav.journey, t.nav.contact] }), [t])
  return show ? <Suspense fallback={null}><Universe title={t.projects.title} screen={screen} /></Suspense> : null
}
