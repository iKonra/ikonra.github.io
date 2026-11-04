// Shaders del blob (ruido simplex + iridiscencia)
const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`

export const blobVertex = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform vec2 uPointer;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
${noise}
float field(vec3 p){
  return snoise(p * 0.9 + vec3(uTime * 0.18, uPointer * 0.5)) * uIntensity
       + snoise(p * 2.2 - uTime * 0.12) * uIntensity * 0.18;
}
vec3 displace(vec3 p){ return p + normalize(p) * field(p); }
void main(){
  vec3 p = position;
  vec3 n = normalize(p);
  // Normales recalculadas sobre la superficie deformada (diferencias finitas)
  vec3 t = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 b = cross(n, t);
  float e = 0.01;
  vec3 d0 = displace(p);
  vec3 d1 = displace(p + t * e);
  vec3 d2 = displace(p + b * e);
  vec3 dn = normalize(cross(d1 - d0, d2 - d0));
  vNoise = field(p);
  vec4 world = modelMatrix * vec4(d0, 1.0);
  vView = normalize(cameraPosition - world.xyz);
  vNormal = normalize(mat3(modelMatrix) * dn);
  gl_Position = projectionMatrix * viewMatrix * world;
}`

export const blobFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);
  // Iridiscencia: el color cambia con el ángulo de la normal
  float hue = dot(N, vec3(0.6, 0.7, 0.3)) * 0.5 + 0.5 + vNoise * 0.8 + uTime * 0.03;
  vec3 iri = 0.5 + 0.5 * cos(6.2831 * (hue + vec3(0.0, 0.18, 0.36)));
  vec3 base = mix(uColorA, uColorB, smoothstep(-0.3, 0.9, N.y * 0.5 + vNoise * 2.0));
  vec3 L1 = normalize(vec3(0.6, 0.8, 0.7));
  vec3 L2 = normalize(vec3(-0.8, -0.3, 0.4));
  float diff = max(dot(N, L1), 0.0) * 0.6 + max(dot(N, L2), 0.0) * 0.25;
  float spec = pow(max(dot(reflect(-L1, N), V), 0.0), 48.0);
  vec3 col = base * (0.35 + diff);
  col = mix(col, iri * uColorC, fres * 0.85);
  col += spec * 0.9 + fres * 0.15;
  gl_FragColor = vec4(col, 1.0);
}`

