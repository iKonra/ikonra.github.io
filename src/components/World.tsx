import { lazy, Suspense, useEffect, useState } from 'react'

const WorldScene = lazy(() => import('../three/WorldScene'))

function supportsWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}

/** Monta el mundo 3D cuando el navegador queda libre, así el texto aparece primero. */
export default function World() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!supportsWebGL()) return
    const ric = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200))
    const id = ric(() => setShow(true), { timeout: 1200 })
    return () => (window.cancelIdleCallback ?? clearTimeout)(id)
  }, [])
  return show ? <Suspense fallback={null}><WorldScene /></Suspense> : null
}
