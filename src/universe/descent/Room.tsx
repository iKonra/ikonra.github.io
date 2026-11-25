import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { model, tex } from '../assets'
import { hash } from '../glsl'
import { J, PIXEL, SCREEN, smooth, win } from '../journey'
import type { Quality } from '../quality'
import { U } from '../shared'
import { compileObject } from '../warm'
import { drawCode, drawScreen, type ScreenText } from './screen'

// La habitación donde empieza todo: modelada en Blender con la luz ya calculada (Cycles) y guardada en tres texturas.
// En el monitor está este mismo portafolio. De cerca aparecen los píxeles, y uno de ellos es la singularidad del inicio.

const bakedVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
const bakedFragment = /* glsl */ `
varying vec2 vUv; uniform sampler2D uMap; uniform float uTime, uK, uSoft;
void main(){
  // cuatro muestras vecinas: suaviza los escalones de 8 bits en las paredes oscuras
  vec2 e = uSoft / vec2(textureSize(uMap, 0));
  vec3 c = vec3(0.);
  for(int i = 0; i < 4; i++) c += pow(texture2D(uMap, vUv + e * vec2(float(i & 1) * 2. - 1., float(i >> 1) * 2. - 1.)).rgb, vec3(2.6));
  c *= 1.15 * .25;
  gl_FragColor = vec4(min(c * 1.5, vec3(1.7)) * uK, 1.);
}`

const screenVertex = /* glsl */ `
varying vec2 vUv; varying vec2 vP; uniform vec2 uGrid, uTarget;
void main(){ vUv = uv; vP = (uv - uTarget) * uGrid; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
const screenFragment = /* glsl */ `
varying vec2 vUv; varying vec2 vP; // vP: píxeles respecto del centro del elegido
uniform sampler2D uMap; uniform vec2 uGrid, uTarget; uniform float uTime, uOne, uOn, uFade;
${hash}
float bar(float x, float c, float h, float w){ return smoothstep(h + w, h - w, abs(x - c)); }
void main(){
  vec2 q = vP + .5, cell = floor(q), f = q - cell;
  float w = max(length(dFdx(vP)), length(dFdy(vP)));
  vec2 cuv = uTarget + cell / uGrid;
  float grid = smoothstep(.42, .12, w);
  vec3 c = mix(texture2D(uMap, vUv).rgb, textureLod(uMap, cuv, 0.).rgb, grid);
  // la galaxia de la pantalla titila apenas
  c *= 1. + .10 * sin(uTime * 2. + hash21(cell) * 40.) * smoothstep(.2, .6, dot(c, vec3(.33)));
  bool me = cell.x == 0. && cell.y == 0.;
  if(me) c = mix(c, vec3(1.), grid);
  float e = clamp(w, .004, .2);
  vec3 sub = vec3(bar(f.x, .19, .115, e), bar(f.x, .5, .115, e), bar(f.x, .81, .115, e)) * bar(f.y, .5, .42, e);
  // cada subpíxel tiene un leve brillo propio en el centro
  sub *= .75 + .5 * exp(-pow(abs((f.y - .5) * 3.), 2.));
  vec3 lcd = c * sub * 1.9 + c * .03;
  vec3 col = mix(c, lcd, grid);
  // el resto se apaga y los tres colores se juntan en un punto de luz
  float d = length(vP);
  vec3 tri = vec3(bar(vP.x, mix(-.31, 0., uOne), .115, e), bar(vP.x, 0., .115, e), bar(vP.x, mix(.31, 0., uOne), .115, e)) * bar(vP.y, 0., mix(.42, .115, uOne), e) * 3.1;
  float star = exp(-d * d * 190.) * 5. + exp(-d * 15.) * 1.2 + exp(-abs(vP.x) * 90.) * exp(-abs(vP.y) * 7.) * .7 + exp(-abs(vP.y) * 90.) * exp(-abs(vP.x) * 7.) * .7;
  vec3 one = mix(tri, vec3(1., .93, .82) * star, smoothstep(.25, .95, uOne));
  col = mix(col * (me ? 1. : 1. - uFade), one, me || uOne > .2 ? uFade : 0.);
  gl_FragColor = vec4(col * uOn * mix(1.25, .85, grid * (1. - uFade)), 1.);
}`

export default function Room({ q, text }: { q: Quality; text: ScreenText }) {
  const root = useRef<THREE.Group>(null)
  const [scene, setScene] = useState<THREE.Group | null>(null)
  const asked = useRef(false)
  const alive = useRef(true)
  const [want, setWant] = useState(false)

  const m = useMemo(() => {
    const s = q.bigTex ? '' : '-sm'
    const baked = (soft: number) => new THREE.ShaderMaterial({ vertexShader: bakedVertex, fragmentShader: bakedFragment, side: THREE.DoubleSide, uniforms: { uMap: { value: null as THREE.Texture | null }, uTime: U.time, uK: { value: 1 }, uSoft: { value: soft } } })
    const map = new THREE.CanvasTexture(document.createElement('canvas'))
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
    const pu = PIXEL[0] / SCREEN.w + 0.5, pv = PIXEL[1] / SCREEN.h + 0.5
    const screen = new THREE.ShaderMaterial({
      vertexShader: screenVertex, fragmentShader: screenFragment,
      uniforms: { uMap: { value: map }, uGrid: { value: new THREE.Vector2(SCREEN.px, SCREEN.py) }, uTarget: { value: new THREE.Vector2(pu, pv) }, uTime: U.time, uOne: { value: 0 }, uFade: { value: 0 }, uOn: { value: 1 } },
    })
    // el segundo monitor, girado hacia la silla: el código de este sitio
    const code = new THREE.CanvasTexture(document.createElement('canvas'))
    code.colorSpace = THREE.SRGBColorSpace
    code.anisotropy = 8
    const second = new THREE.MeshBasicMaterial({ map: code, toneMapped: false })
    return { s, shell: baked(1.4), desk: baked(0.3), art: baked(0.2), screen, map, code, second }
  }, [q.bigTex])

  // nada de esto se descarga hasta que el viaje va por la mitad
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => {
    if (!want) return
    const opt = { srgb: false, flipY: false, aniso: 8 }
    m.shell.uniforms.uMap.value = tex(`room-shell${m.s}.webp`, opt)
    m.desk.uniforms.uMap.value = tex(`room-desk${m.s}.webp`, opt)
    m.art.uniforms.uMap.value = tex(`room-art${m.s}.webp`, opt)
    model('room.glb').then(g => {
      const s = g.scene.clone(true)
      s.traverse(o => {
        const me = o as THREE.Mesh
        if (!me.isMesh) return
        let name = '', p: THREE.Object3D | null = me
        while (p && !name) { if (/shell|desk|art/.test(p.name)) name = p.name; p = p.parent }
        me.material = name.includes('shell') ? m.shell : name.includes('art') ? m.art : m.desk
        me.frustumCulled = false
      })
      return compileObject(s).then(() => { if (alive.current) setScene(s) })
    }).catch(() => {})
  }, [want, m])

  useEffect(() => {
    if (!want) return
    let live = true
    Promise.all([drawScreen(m.map.image as HTMLCanvasElement, text, q.bigTex ? 2048 : 1280), drawCode(m.code.image as HTMLCanvasElement, q.bigTex ? 1536 : 1024)]).then(() => { if (live) { m.map.dispose(); m.map.needsUpdate = true; m.code.dispose(); m.code.needsUpdate = true } }).catch(() => {})
    return () => { live = false }
  }, [want, m, text, q.bigTex])

  useFrame(() => {
    const t = J.raw
    if (!asked.current && t > 8.5) { asked.current = true; setWant(true) }
    const g = root.current
    if (!g) return
    g.visible = t > 15.8 && t < 19
    if (!g.visible) return
    const u = m.screen.uniforms
    u.uFade.value = smooth(18.8, 18.93, t)
    u.uOne.value = smooth(18.84, 18.97, t)
    // desde afuera la ventana tiene que brillar; adentro, el ojo se acostumbra
    const k = 1 + 2.2 * (1 - smooth(16.7, 17.5, t))
    m.shell.uniforms.uK.value = k
    m.desk.uniforms.uK.value = k
    m.art.uniforms.uK.value = k
    m.second.color.setScalar(0.9 * (1 - 0.3 * smooth(17.6, 18.3, t)))
    u.uOn.value = 1 - 0.25 * win(t, 16.9, 17.5, 18.3, 18.5)
  })

  return (
    <group ref={root} visible={false}>
      {scene && <primitive object={scene} />}
      <mesh material={m.screen} position={[0, 0, 0]}><planeGeometry args={[SCREEN.w, SCREEN.h]} /></mesh>
      <mesh material={m.second} position={[0.598, 0, 0.106]} rotation-y={-Math.PI / 7.5}><planeGeometry args={[SCREEN.w, SCREEN.h]} /></mesh>
    </group>
  )
}
