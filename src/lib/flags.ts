import { useSyncExternalStore } from 'react'

/** Interruptor compartido entre componentes lejanos (consola, menú del celular, escena). */
function flag() {
  let value = false
  const subs = new Set<() => void>()
  const get = () => value
  const subscribe = (cb: () => void) => { subs.add(cb); return () => { subs.delete(cb) } }
  return {
    get,
    subscribe,
    set(v: boolean) { if (v !== value) { value = v; subs.forEach(f => f()) } },
    use: () => useSyncExternalStore(subscribe, get, () => false),
  }
}

export const pilotFlag = flag()
export const soundFlag = flag()
export const exploreFlag = flag()
