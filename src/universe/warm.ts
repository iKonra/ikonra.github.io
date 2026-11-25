import * as THREE from 'three'

// La primera vez que se usa un shader complejo, el navegador puede trabar la página varios segundos para compilarlo.
// Acá se compilan en paralelo (KHR_parallel_shader_compile) y se suben las texturas de a una, en los ratos libres,
// antes de que hagan falta. Primero lo que se ve al entrar; el resto, mientras se mira el inicio.

type Ctx = { gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera }
let ctx: Ctx | null = null
// mismo tipo de destino que la escena: si no, sería otra variante del programa
const tiny = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType })
let open!: () => void, go!: () => void
const hasContext = new Promise<void>(r => { open = r })
/** Se cumple cuando ya se puede dibujar el inicio. */
export const started = new Promise<void>(r => { go = r })

/** Si un driver no avisa que terminó, no se espera para siempre. */
const limit = (p: Promise<unknown>) => Promise.race([p, new Promise(r => setTimeout(r, 15000))]).then(() => {})

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
  return Promise.all([...passes, ...first.map(compileObject)]).then(() => { go(); sweep() })
}

function sweep() {
  const idle = (cb: () => void) => { if ('requestIdleCallback' in window) requestIdleCallback(cb, { timeout: 80 }); else setTimeout(cb, 40) }
  // un mismo material compila distinto si se dibuja suelto o en instancias
  const seen = new Set<string>()
  const key = (o: THREE.Object3D, m: THREE.Material) => `${m.uuid}${(o as THREE.InstancedMesh).isInstancedMesh ? ((o as THREE.InstancedMesh).instanceColor ? 'c' : 'i') : ''}`
  let quiet = 0
  const work = () => {
    const { gl, scene } = ctx!
    const t = textures.shift()
    if (t) { gl.initTexture(t); return true }
    let next: THREE.Object3D | undefined
    scene.traverse(o => {
      const m = (o as THREE.Mesh).material
      if (next || !m) return
      const keys = (Array.isArray(m) ? m : [m]).map(x => key(o, x))
      if (keys.every(k => seen.has(k))) return
      keys.forEach(k => seen.add(k))
      next = o
    })
    const o = next
    if (o) void compileObject(o).then(() => idle(() => drawOnce(o)))
    return !!o
  }
  const step = () => {
    // sigue atento un rato: los modelos y las imágenes llegan después
    quiet = work() ? 0 : quiet + 1
    if (quiet < 90) setTimeout(() => idle(step), quiet ? 600 : 30)
  }
  idle(step)
}
