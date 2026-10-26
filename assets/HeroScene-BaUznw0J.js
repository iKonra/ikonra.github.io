import{r as i,j as n,p,s as f}from"./index-DOzmRovs.js";import{C as b,V as w,a as x,u as g,b as z,A as M}from"./react-three-fiber.esm-DxxgCKeR.js";const C=`
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
}`,j=`
uniform float uTime;
uniform float uIntensity;
uniform vec2 uPointer;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
${C}
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
}`,N=`
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
}`;function P({detail:v}){const t=i.useRef(null),s=i.useRef(new w),o=i.useMemo(()=>({uTime:{value:0},uIntensity:{value:.22},uPointer:{value:new w},uColorA:{value:new x(p[0][0])},uColorB:{value:new x(p[0][1])},uColorC:{value:new x(p[0][2])}}),[]),{viewport:m}=g(),u=Math.min(1.15,m.width/3,m.height/2.9),e=i.useMemo(()=>[new x,new x,new x],[]);return z((a,c)=>{const r=Math.min(c,.05);o.uTime.value+=r,s.current.lerp(a.pointer,1-Math.pow(.001,r)),o.uPointer.value.copy(s.current);const d=Math.min(window.scrollY/window.innerHeight,1.5);f.kick=Math.max(0,f.kick-r*1.4);const l=f.kick,y=p[f.palette],h=1-Math.pow(.02,r);e[0].set(y[0]),e[1].set(y[1]),e[2].set(y[2]),o.uColorA.value.lerp(e[0],h),o.uColorB.value.lerp(e[1],h),o.uColorC.value.lerp(e[2],h),o.uIntensity.value=.2+Math.abs(s.current.x)*.08+d*.2+l*l*.35,o.uTime.value+=l*r*3,t.current&&(t.current.rotation.y+=r*(.12+l*2.2),t.current.rotation.x=s.current.y*.35+d*.6,t.current.rotation.z=s.current.x*.2,t.current.scale.setScalar(u*(1-l*(1-l)*.5)))}),n.jsxs("mesh",{ref:t,scale:u,children:[n.jsx("icosahedronGeometry",{args:[1.25,v]}),n.jsx("shaderMaterial",{vertexShader:j,fragmentShader:N,uniforms:o})]})}const S=`
uniform float uTime;
uniform float uPixelRatio;
attribute float aScale;
varying float vAlpha;
void main(){
  vec3 p = position;
  p.y += sin(uTime * 0.3 + position.x * 2.0) * 0.08;
  p.x += cos(uTime * 0.2 + position.z * 2.0) * 0.08;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aScale * 22.0 * uPixelRatio / -mv.z;
  vAlpha = 0.35 + aScale * 0.5;
  gl_Position = projectionMatrix * mv;
}`,A=`
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  gl_FragColor = vec4(1.0, 0.93, 0.86, a * 0.8);
}`;function T({count:v}){const t=i.useRef(null),{gl:s}=g(),[o,m]=i.useMemo(()=>{const e=new Float32Array(v*3),a=new Float32Array(v);for(let c=0;c<v;c++){const r=1.9+Math.random()*2.6,d=Math.random()*Math.PI*2,l=Math.acos(2*Math.random()-1);e[c*3]=r*Math.sin(l)*Math.cos(d),e[c*3+1]=r*Math.sin(l)*Math.sin(d),e[c*3+2]=r*Math.cos(l),a[c]=Math.random()}return[e,a]},[v]),u=i.useMemo(()=>({uTime:{value:0},uPixelRatio:{value:s.getPixelRatio()}}),[s]);return z((e,a)=>{u.uTime.value+=Math.min(a,.05),t.current&&(t.current.rotation.y+=a*.03,t.current.rotation.x=e.pointer.y*.1)}),n.jsxs("points",{ref:t,children:[n.jsxs("bufferGeometry",{children:[n.jsx("bufferAttribute",{attach:"attributes-position",args:[o,3]}),n.jsx("bufferAttribute",{attach:"attributes-aScale",args:[m,1]})]}),n.jsx("shaderMaterial",{vertexShader:S,fragmentShader:A,uniforms:u,transparent:!0,depthWrite:!1,blending:M})]})}function I(){const v=i.useRef(null),[t,s]=i.useState(!0),o=i.useMemo(()=>matchMedia("(max-width: 768px), (pointer: coarse)").matches,[]),m=i.useMemo(()=>matchMedia("(prefers-reduced-motion: reduce)").matches,[]);return i.useEffect(()=>{const u=v.current;if(!u)return;let e=!0;const a=()=>s(e&&!document.hidden),c=new IntersectionObserver(([r])=>{e=r.isIntersecting,a()});return c.observe(u),document.addEventListener("visibilitychange",a),()=>{c.disconnect(),document.removeEventListener("visibilitychange",a)}},[]),n.jsx("div",{ref:v,className:"hero-canvas","aria-hidden":!0,children:n.jsxs(b,{frameloop:m?"demand":t?"always":"never",dpr:o?[1,1.5]:[1,2],camera:{position:[0,0,4.6],fov:45},gl:{antialias:!0,alpha:!0,powerPreference:"high-performance"},eventSource:document.body,eventPrefix:"client",children:[n.jsx(P,{detail:o?24:48}),n.jsx(T,{count:o?260:600})]})})}export{I as default};
