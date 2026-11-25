// Fragmentos GLSL compartidos por los shaders del universo.

export const hash = /* glsl */ `
float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
vec3 hash33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
`

/** Ruido de gradiente 3D, fbm y fbm con crestas. Necesita `hash`. */
export const noise3 = /* glsl */ `
float g3(vec3 i, vec3 f, vec3 o){ return dot(hash33(i + o) * 2. - 1., f - o); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x), u = f * f * f * (f * (f * 6. - 15.) + 10.);
  return mix(mix(mix(g3(i, f, vec3(0., 0., 0.)), g3(i, f, vec3(1., 0., 0.)), u.x), mix(g3(i, f, vec3(0., 1., 0.)), g3(i, f, vec3(1., 1., 0.)), u.x), u.y),
             mix(mix(g3(i, f, vec3(0., 0., 1.)), g3(i, f, vec3(1., 0., 1.)), u.x), mix(g3(i, f, vec3(0., 1., 1.)), g3(i, f, vec3(1., 1., 1.)), u.x), u.y), u.z);
}
float fbm(vec3 p, int oct){
  float a = .5, s = 0.;
  for(int i = 0; i < 8; i++){ if(i >= oct) break; s += a * vnoise(p); p = p * 2.03 + 17.17; a *= .5; }
  return s;
}
float ridged(vec3 p, int oct){
  float a = .5, s = 0.;
  for(int i = 0; i < 8; i++){ if(i >= oct) break; float n = 1. - abs(vnoise(p)) * 2.; s += a * n * n; p = p * 2.05 + 11.3; a *= .5; }
  return s;
}
`

/** Color aproximado de una estrella según su índice B−V. */
export const starColor = /* glsl */ `
vec3 bvColor(float bv){
  float t = clamp((bv + .4) / 2.4, 0., 1.);
  vec3 c = mix(vec3(.50, .66, 1.), vec3(.80, .88, 1.), smoothstep(0., .18, t));
  c = mix(c, vec3(1., .97, .92), smoothstep(.16, .38, t));
  c = mix(c, vec3(1., .80, .56), smoothstep(.36, .62, t));
  return mix(c, vec3(1., .55, .30), smoothstep(.6, 1., t));
}
`

/** Triángulo que cubre la pantalla. */
export const fsVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`

/** Vértice de planeta: normal y posición de mundo. */
export const planetVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
varying vec3 vL;
void main(){
  vUv = uv;
  vL = position;
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`
