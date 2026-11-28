// GLSL compartido por el cielo y los objetos del atlas.

/** Equirectangular ↔ dirección, igual que el cielo de la Vía Láctea. */
export const equirect = /* glsl */ `
vec2 eqUv(vec3 d){ return vec2(.5 - atan(-d.z, d.x) / 6.2831853, .5 + asin(clamp(d.y, -1., 1.)) / 3.14159265); }
vec3 eqDir(vec2 uv){ float lon = (.5 - uv.x) * 6.2831853, lat = (uv.y - .5) * 3.14159265; return vec3(cos(lat) * cos(lon), sin(lat), -cos(lat) * sin(lon)); }
`

/** El cielo del atlas en una dirección: nebulosa horneada + detalle fino + estrellas. Necesita `hash` y `noise3`.
 *  Lo usan la cúpula y todos los objetos que curvan la luz: así lo que se ve desviado es exactamente el mismo cielo. */
export const atlasSky = /* glsl */ `
uniform sampler2D uAtlasSky; uniform float uSkyDetail; uniform vec3 uPortal;
${equirect}
float pCap(vec2 p, vec2 a, vec2 b, float wa, float wb){
  vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
  return length(pa - ba * h) - mix(wa, wb, h);
}
float pMin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
/** Los pilares de la portada, en el plano de la imagen: tres columnas que salen de un banco de polvo,
 *  con cabezas grumosas (varios bultos) para que no parezcan tubos. */
float pillarShape(vec2 p){
  float d = pCap(p, vec2(-.72, -.6), vec2(-.47, -.08), .17, .065);
  d = pMin(d, pCap(p, vec2(-.47, -.1), vec2(-.43, .0), .07, .05), .04);
  d = pMin(d, length(p - vec2(-.405, .02)) - .045, .03);
  d = pMin(d, length(p - vec2(-.47, .035)) - .035, .025);
  d = pMin(d, length(p - vec2(-.385, -.06)) - .03, .03);
  d = pMin(d, pCap(p, vec2(.31, -.6), vec2(.44, -.2), .11, .045), .025);
  d = pMin(d, length(p - vec2(.455, -.17)) - .04, .025);
  d = pMin(d, length(p - vec2(.41, -.19)) - .03, .02);
  d = pMin(d, pCap(p, vec2(.8, -.6), vec2(.71, -.32), .085, .03), .02);
  d = pMin(d, length(p - vec2(.705, -.3)) - .03, .018);
  return pMin(d, p.y + .5, .12);
}
/** Polvo a contraluz contra el gas: cuerpo oscuro, borde encendido arriba (del lado de las estrellas jóvenes) y flecos.
 *  Se calcula en vivo (no se hornea) para que los bordes queden nítidos. */
vec3 pillarsOver(vec3 d, vec3 col){
  float z = dot(d, uPortal);
  if(z < .7) return col;
  vec3 ex = normalize(cross(uPortal, vec3(0., 1., 0.))), ey = cross(ex, uPortal);
  vec2 p = vec2(dot(d, ex), dot(d, ey)) / z;
  // bordes ondulados: se deforma el plano antes de medir la forma
  vec2 pw = p + vec2(fbm(vec3(p * 3.4, 1.1), 3), fbm(vec3(p * 3.4, 7.3), 3)) * .075;
  float big = fbm(vec3(p * 6., 3.7), 4);
  float fine = vnoise(vec3(p * 36., 1.3)) * .62 + vnoise(vec3(p * 92., 7.7)) * .38;
  float s0 = pillarShape(pw), e = .004;
  vec2 n = normalize(vec2(pillarShape(pw + vec2(e, 0.)) - s0, pillarShape(pw + vec2(0., e)) - s0) + 1e-6);
  float lit = clamp(dot(n, normalize(vec2(.25, 1.))), 0., 1.);
  float s = s0 + big * .05 + fine * .016 * (.6 + lit);
  float body = smoothstep(.003, -.012, s);
  float fringe = smoothstep(.03, 0., s) * (1. - body) * smoothstep(.25, .85, fine);
  float depth = clamp(-s * 6., 0., 1.);
  vec3 inner = mix(vec3(.3, .13, .055), vec3(.025, .012, .006), depth);
  inner *= .5 + 1. * smoothstep(-.4, .6, big + fine * .4);
  inner += vec3(.7, .3, .1) * pow(lit, 3.) * (1. - depth) * smoothstep(-.03, 0., s);
  vec3 c = mix(col, inner, body);
  c = mix(c, col * .4 + vec3(.2, .085, .035), fringe * .75);
  // el borde de arriba, encendido, y un velo de gas que se evapora
  c += vec3(1., .6, .32) * exp(-pow(s / .006, 2.)) * pow(lit, 4.) * 1.7;
  c += vec3(.45, .55, .9) * exp(-max(s, 0.) / .022) * (1. - body) * pow(lit, 4.) * .16;
  // estrellas que nacen en las puntas
  vec2 tp[3]; tp[0] = vec2(-.42, .07); tp[1] = vec2(.455, -.125); tp[2] = vec2(.705, -.268);
  float proto = 0.;
  for(int k = 0; k < 3; k++){ vec2 q = p - tp[k]; proto += exp(-dot(q, q) / .00005); }
  c += vec3(1., .22, .08) * proto * 1.4;
  return mix(col, c, smoothstep(.7, .8, z));
}
vec3 starField(vec3 d, float scale, float density, float gain, float soft){
  vec3 g = d * scale, id = floor(g), h = hash33(id);
  // las derivadas antes de cualquier rama
  float aa = max(length(fwidth(g)), 1e-4);
  vec3 c = normalize(id + .5 + (h - .5) * .8) * scale;
  float r = length(g - c) + step(h.x, 1. - density) * 1e3;
  float s = smoothstep(aa * (1.1 + soft), 0., r) + exp(-r * r / (aa * aa * (2. + soft * 6.))) * .35 * soft;
  vec3 col = mix(vec3(.62, .74, 1.), vec3(1., .86, .66), h.y);
  col = mix(col, vec3(1., .55, .4), step(.93, h.y));
  return col * s * gain * (.25 + h.z * h.z * 2.2);
}
vec3 atlasSkyAt(vec3 d){
  vec4 b = texture2D(uAtlasSky, eqUv(d));
  vec3 col = b.rgb;
  if(uSkyDetail > .5){
    // detalle fino: el horneado alcanza para las formas, no para los filamentos
    float n = vnoise(d * 150.) * .62 + vnoise(d * 330. + 7.) * .38;
    float edge = b.a * (1. - b.a) * 4.;
    col *= max(1. + n * (.38 + edge * 1.1), 0.);
  }
  col += starField(d, 380., .05, .55, 0.) + starField(d, 140., .045, 1.1, .6);
  return pillarsOver(d, col);
}
`

/** Vértice de una esfera que hace de lienzo: el fragmento traza su propio rayo desde la cámara. */
export const shellVertex = /* glsl */ `
varying vec3 vW, vC;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vC = modelMatrix[3].xyz; gl_Position = projectionMatrix * viewMatrix * w; }`

/** Lente de una masa puntual (campo débil, con techo): dirección desviada del rayo y parámetro de impacto. */
export const lens = /* glsl */ `
vec3 bend(vec3 o, vec3 rd, float rs, float reach, out float b){
  float s = max(-dot(o, rd), 0.);
  vec3 c = o + rd * s;
  b = length(c);
  float a = min(2. * rs / max(b, 1e-4), 1.35) * smoothstep(reach, reach * .45, b) * step(1e-4, s);
  return rd - c / max(b, 1e-4) * a;
}`
