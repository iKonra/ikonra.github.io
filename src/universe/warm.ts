import * as THREE from 'three'

// La primera vez que se usa un shader complejo, el navegador puede trabar la página varios segundos para compilarlo.
// Acá se compilan en paralelo (KHR_parallel_shader_compile) y se suben las texturas de a una, en los ratos libres,
// antes de que hagan falta. Primero lo que se ve al entrar; el resto, mientras se mira el inicio.
//
// Ojo con Windows (ANGLE sobre D3D11): aunque el programa ya esté enlazado, el primer dibujo en un destino distinto
// puede recompilar el shader en el hilo de la GPU y congelar todo (el mapa del agujero negro tardaba ~1 s).
// Por eso lo que se ve al entrar se dibuja una vez antes de mostrarlo, y el barrido espera a que la GPU termine
// cada dibujo antes de pedirle otro: si no, la página se queda esperando y se traba.

type Ctx = { gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera }
let ctx: Ctx | null = null
// mismo tipo de destino que la escena: si no, sería otra variante del programa
const tiny = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType })
let open!: () => void, go!: () => void
const hasContext = new Promise<void>(r => { open = r })
/** Se cumple cuando ya se puede dibujar el inicio. */
export const started = new Promise<void>(r => { go = r })

/** Si un driver no avisa que terminó, no se espera para siempre. */
const limit = (p: Promise<unknown>, ms = 15000) => Promise.race([p, new Promise(r => setTimeout(r, ms))]).then(() => {})

/** Se cumple cuando la GPU terminó todo lo pedido hasta ahora. No bloquea: consulta un fence entre tareas. */
export function gpuDone(gl: THREE.WebGLRenderer) {
  const c = gl.getContext()
  if (!('fenceSync' in c)) return Promise.resolve()
  const s = c.fenceSync(c.SYNC_GPU_COMMANDS_COMPLETE, 0)
  if (!s) return Promise.resolve()
  c.flush()
  return limit(new Promise<void>(res => {
    const poll = () => {
      if (c.isContextLost() || c.getSyncParameter(s, c.SYNC_STATUS) === c.SIGNALED) { c.deleteSync(s); res() } else setTimeout(poll, 8)
    }
    setTimeout(poll, 0)
  }), 5000)
}

function compile(gl: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget | null, run: () => Promise<unknown>) {
  const keep = gl.getRenderTarget()
  gl.setRenderTarget(target)
  const p = run()
  gl.setRenderTarget(keep)
  return limit(p)
}

/** Un pase de pantalla completa, con su propia escena y destino. */
export const compilePass = (gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, target: THREE.WebGLRenderTarget | null) =>
  compile(gl, target, () => gl.compileAsync(scene, camera))

/** Un objeto que se dibuja en la escena principal (esté o no agregado todavía). */
export async function compileObject(o: THREE.Object3D) {
  await hasContext
  const { gl, scene, camera } = ctx!
  return compile(gl, tiny, () => gl.compileAsync(o, camera, scene))
}

const early: Promise<void>[] = []
/** Trabajo que tiene que estar hecho antes de mostrar el inicio (por ejemplo, el primer dibujo de un pase con destino propio).
 *  Registrarlo en un useLayoutEffect: así queda anotado antes del primer frame, que es cuando arranca warmStart. */
export const beforeStart = (p: Promise<unknown>) => { early.push(limit(p)) }

const LAYER = 31
/** Dibuja un objeto una vez en un destino de 4×4: ahí es cuando el driver termina de preparar el shader. */
function drawOnce(o: THREE.Object3D) {
  const { gl, scene, camera } = ctx!
  const hidden: THREE.Object3D[] = []
  let n: THREE.Object3D | null = o
  while (n && n !== scene) { if (!n.visible) { n.visible = true; hidden.push(n) } n = n.parent }
  if (n) {
    const keep = gl.getRenderTarget(), mask = camera.layers.mask, culled = o.frustumCulled
    o.frustumCulled = false
    o.layers.enable(LAYER)
    camera.layers.set(LAYER)
    scene.traverse(l => { if ((l as THREE.Light).isLight) l.layers.enable(LAYER) })
    gl.setRenderTarget(tiny)
    gl.render(scene, camera)
    gl.setRenderTarget(keep)
    camera.layers.mask = mask
    o.layers.disable(LAYER)
    o.frustumCulled = culled
  }
  hidden.forEach(h => { h.visible = false })
}

const textures: THREE.Texture[] = []
/** La textura ya bajó: se sube a la GPU apenas haya un rato libre. */
export const queueTexture = (t: THREE.Texture) => { textures.push(t) }

export function warmStart(c: Ctx, first: THREE.Object3D[], passes: Promise<unknown>[]) {
  ctx = c
  open()
  return Promise.all([...passes, ...first.map(compileObject), ...early])
    .then(() => { first.forEach(drawOnce); return gpuDone(c.gl) })
    .then(() => { go(); sweep() })
}

const idle = (cb: () => void, timeout = 60) => { if ('requestIdleCallback' in window) requestIdleCallback(cb, { timeout }); else setTimeout(cb, 16) }

function sweep() {
  // un mismo material compila distinto si se dibuja suelto o en instancias
  const seen = new Set<string>()
  const key = (o: THREE.Object3D, m: THREE.Material) => `${m.uuid}${(o as THREE.InstancedMesh).isInstancedMesh ? ((o as THREE.InstancedMesh).instanceColor ? 'c' : 'i') : ''}`
  /** El próximo objeto con algún material sin preparar, en el orden de la escena (que es el orden del viaje). */
  const pick = () => {
    let next: THREE.Object3D | undefined
    ctx!.scene.traverse(o => {
      const m = (o as THREE.Mesh).material
      if (next || !m) return
      const keys = (Array.isArray(m) ? m : [m]).map(x => key(o, x))
      if (keys.every(k => seen.has(k))) return
      keys.forEach(k => seen.add(k))
      next = o
    })
    return next
  }

  // Compilar no traba (va en otros hilos): hasta 4 a la vez. Dibujar y subir texturas sí ocupa la GPU:
  // de a uno, y el siguiente recién cuando la GPU terminó el anterior.
  const MAX = 4
  let inflight = 0, busy = false, quiet = 0
  const lane: (() => void)[] = []
  const drain = () => {
    if (busy) return
    const job = lane.shift()
    if (!job) return
    busy = true
    idle(() => { job(); void gpuDone(ctx!.gl).then(() => { busy = false; drain() }) })
  }
  const step = () => {
    let did = false
    for (let t = textures.shift(); t; t = textures.shift()) { const tx = t; lane.push(() => ctx!.gl.initTexture(tx)); did = true }
    while (inflight < MAX) {
      const o = pick()
      if (!o) break
      inflight++
      did = true
      void compileObject(o).then(() => { inflight--; lane.push(() => drawOnce(o)); drain() })
    }
    drain()
    // sigue atento un rato: los modelos y las imágenes llegan después
    quiet = did || inflight > 0 || busy ? 0 : quiet + 1
    if (quiet < 90) setTimeout(() => idle(step), quiet ? 600 : 40)
  }
  idle(step)
}
