import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { tracked } from './load'
import { queueTexture } from './warm'

// Carga de texturas y modelos con progreso compartido (lo muestra el HUD). Cada recurso se pide una sola vez.

const base = '/universe/'
/** createImageBitmap decodifica en otro hilo. Mismos límites de versión que usa GLTFLoader de three. */
const bitmaps = (() => {
  if (typeof createImageBitmap === 'undefined') return false
  const ua = navigator.userAgent
  const safari = /^((?!chrome|android).)*safari/i.test(ua) ? Number(ua.match(/Version\/(\d+)/)?.[1] ?? 0) : 99
  return safari >= 17 && Number(ua.match(/Firefox\/(\d+)/)?.[1] ?? 99) >= 98
})()
async function picture(url: string, flipY: boolean): Promise<{ img: ImageBitmap | HTMLImageElement; flipped: boolean }> {
  if (bitmaps) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(String(r.status))
      const img = await createImageBitmap(await r.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none', ...(flipY ? { imageOrientation: 'flipY' as const } : {}) })
      return { img, flipped: true }
    } catch { /* sigue con una imagen común */ }
  }
  const i = new Image()
  i.src = url
  await i.decode()
  return { img: i, flipped: false }
}
const cache = new Map<string, THREE.Texture>()
type Opts = { srgb?: boolean; repeat?: boolean; mip?: boolean; aniso?: number; /** Las texturas de un GLB van sin dar vuelta. */ flipY?: boolean; onLoad?: (t: THREE.Texture) => void }

/** Textura que se completa sola cuando termina de bajar. */
export function tex(file: string, { srgb = true, repeat = false, mip = true, aniso = 4, flipY = true, onLoad }: Opts = {}) {
  const hit = cache.get(file)
  if (hit) return hit
  let ok!: () => void
  tracked(new Promise<void>(r => { ok = r }))
  const url = file.startsWith('/') ? file : base + file
  const t = new THREE.Texture()
  picture(url, flipY).then(({ img, flipped }) => {
    t.image = img
    if (flipped) t.flipY = false
    t.needsUpdate = true
    onLoad?.(t)
    queueTexture(t)
  }).catch(() => {}).then(ok)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = aniso
  t.flipY = flipY
  if (!mip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter }
  cache.set(file, t)
  return t
}

const glb = new GLTFLoader()
glb.setMeshoptDecoder(MeshoptDecoder)
const models = new Map<string, Promise<GLTF>>()
export function model(file: string) {
  let p = models.get(file)
  if (!p) { p = tracked(glb.loadAsync(base + file)); models.set(file, p) }
  return p
}

const bins = new Map<string, Promise<ArrayBuffer>>()
export function bin(file: string) {
  let p = bins.get(file)
  if (!p) { p = tracked(fetch(base + file).then(r => r.arrayBuffer())); bins.set(file, p) }
  return p
}

export function image(file: string) {
  return tracked(new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = base + file
  }))
}
