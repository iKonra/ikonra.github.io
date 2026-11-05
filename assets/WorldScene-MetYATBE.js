import{r as c,j as d,s as g,a as W}from"./index-BW8ZHVTT.js";import{C as et,u as ot,l as at,m as S,V as C,n as nt,o as Z,p as b,e as rt,k as st,q as $,r as it}from"./react-three-fiber.esm-BTPKCIbN.js";const z=Math.PI*2,f=(n=1)=>(Math.random()-.5)*n,ct=n=>{const r=new Float32Array(n*3),t=Math.PI*(3-Math.sqrt(5));for(let e=0;e<n;e++){const o=1-e/(n-1)*2,s=Math.sqrt(1-o*o),i=t*e,a=1.3+f(.06);r.set([Math.cos(i)*s*a,o*a,Math.sin(i)*s*a],e*3)}return r},ut=n=>{const r=new Float32Array(n*3);for(let t=0;t<n;t++){const e=Math.random()*z,o=2,s=3,i=.55*(2+Math.cos(s*e)),a=i*Math.cos(o*e),m=i*Math.sin(o*e),h=-.55*Math.sin(s*e),M=Math.random()*z,x=.16*Math.sqrt(Math.random());r.set([a+Math.cos(M)*x,m+Math.sin(M)*x,h+f(x*2)],t*3)}return r},lt=n=>{const r=new Float32Array(n*3),t=3;for(let e=0;e<n;e++){const o=Math.pow(Math.random(),.7)*1.9,s=e%t/t*z,i=o*2.6,a=Math.pow(Math.random(),3)*.45*(Math.random()<.5?1:-1),m=s+i+a;r.set([Math.cos(m)*o,f(.12)*(1.9-o)*.6,Math.sin(m)*o],e*3)}return r},mt=n=>{const r=new Float32Array(n*3);for(let t=0;t<n;t++){const e=(Math.random()-.5)*3,o=e*2.4;if(t%6===0){const s=Math.random()*2-1,i=Math.round(e*4)/4,a=i*2.4;r.set([Math.cos(a)*.7*s,i,Math.sin(a)*.7*s],t*3)}else{const s=t%2?0:Math.PI;r.set([Math.cos(o+s)*.7+f(.08),e,Math.sin(o+s)*.7+f(.08)],t*3)}}return r},ht=n=>{const r=new Float32Array(n*3),t=Math.ceil(Math.sqrt(n));for(let e=0;e<n;e++){const o=(e%t/t-.5)*3,s=(Math.floor(e/t)/t-.5)*3,i=Math.sin(o*2.2)*Math.cos(s*2.2)*.35;r.set([o,i,s],e*3)}return r},pt=n=>{const r=new Float32Array(n*3),t=[0,Math.PI/3,-Math.PI/3];for(let e=0;e<n;e++){if(e%5===0){const h=[f(),f(),f()],M=Math.hypot(...h)||1,x=Math.cbrt(Math.random())*.32;r.set(h.map(F=>F/M*x),e*3);continue}const o=t[e%3],s=Math.random()*z,i=1.35+f(.05),a=Math.cos(s)*i,m=Math.sin(s)*i;r.set([a*Math.cos(o),a*Math.sin(o),m],e*3)}return r},dt=[ct,ut,lt,mt,ht,pt],O=46,Y=4.6,L={top:{wide:{x:.24,y:0,s:1},narrow:{x:.06,y:-.3,s:.62},shape:-1},about:{wide:{x:.4,y:-.04,s:1.1},narrow:{x:.2,y:.3,s:.6},shape:2},journey:{wide:{x:.4,y:.12,s:.6},narrow:{x:.34,y:.36,s:.4},shape:3},contact:{wide:{x:.28,y:.02,s:1.05},narrow:{x:.3,y:.36,s:.42},shape:1}},H=Object.keys(L);function vt(n){return H.map(r=>{const t=document.getElementById(r);if(!t)return 0;const e=t.getBoundingClientRect();return Math.max(0,Math.min(e.bottom,n)-Math.max(e.top,0))/n})}const ft=`
uniform float uFrom;
uniform float uTo;
uniform float uT;
uniform float uTime;
uniform float uKick;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uMouse;
uniform vec3 uColorA;
uniform vec3 uColorB;
attribute vec3 p1;
attribute vec3 p2;
attribute vec3 p3;
attribute vec3 p4;
attribute vec3 p5;
attribute vec4 aRand;
varying vec3 vColor;
varying float vAlpha;

vec3 shapeAt(float i) {
  if (i < 0.5) return position;
  if (i < 1.5) return p1;
  if (i < 2.5) return p2;
  if (i < 3.5) return p3;
  if (i < 4.5) return p4;
  return p5;
}

void main() {
  // Cada partícula arranca su viaje con un pequeño retraso propio
  float t = clamp(uT * 1.5 - aRand.x * 0.5, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(shapeAt(uFrom), shapeAt(uTo), t);

  // A mitad de camino se arremolinan
  float mid = sin(t * 3.14159);
  p += vec3(sin(aRand.y * 31.0 + uTime * 1.3), cos(aRand.z * 23.0 + uTime), sin(aRand.w * 17.0 - uTime * 1.1)) * 0.45 * mid;
  // Respiración suave
  p += normalize(p + 1e-4) * sin(uTime * 1.6 + aRand.w * 6.2831) * 0.025;
  // Explosión del botón "Me aburrí"
  p += normalize(p + 1e-4) * uKick * (0.4 + aRand.y * 1.4);

  // El cursor las aparta
  vec3 d = p - uMouse;
  float dist = length(d);
  float push = smoothstep(0.85, 0.0, dist);
  p += normalize(d + 1e-4) * push * 0.6;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.45 + aRand.z * 1.1) * uPixelRatio / -mv.z;

  vColor = mix(uColorA, uColorB, aRand.x * aRand.x) + push * 0.6;
  vAlpha = 0.55 + aRand.y * 0.45;
}`,Mt=`
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor, a * a * vAlpha);
}`;function xt({count:n,poseRef:r}){const t=c.useMemo(()=>{const o=new Z,s=dt.map(a=>a(n));o.setAttribute("position",new b(s[0],3)),s.slice(1).forEach((a,m)=>o.setAttribute(`p${m+1}`,new b(a,3)));const i=new Float32Array(n*4);for(let a=0;a<i.length;a++)i[a]=Math.random();return o.setAttribute("aRand",new b(i,4)),o.boundingSphere=new it(new C,4),o},[n]),e=c.useMemo(()=>({uFrom:{value:0},uTo:{value:0},uT:{value:1},uTime:{value:0},uKick:{value:0},uSize:{value:30},uPixelRatio:{value:Math.min(devicePixelRatio,2)},uMouse:{value:new C(99,99,99)},uColorA:{value:new S(W[0][0])},uColorB:{value:new S(W[0][1])}}),[]);return d.jsx("points",{ref:r,geometry:t,children:d.jsx("shaderMaterial",{vertexShader:ft,fragmentShader:Mt,uniforms:e,transparent:!0,depthWrite:!1,blending:$})})}function wt({particles:n,stars:r}){const{camera:t,size:e,raycaster:o}=ot(),s=c.useRef(null),i=c.useRef(new at),a=c.useRef({x:0,y:0,s:0}),m=c.useRef({to:0}),h=c.useMemo(()=>({plane:new nt,hit:new C,n:new C,a:new S,b:new S}),[]),M=e.width>860,x=c.useMemo(()=>matchMedia("(hover: hover) and (pointer: fine)").matches,[]),F=c.useMemo(()=>{const w=new Float32Array(r*3),R=new Float32Array(r);for(let v=0;v<r;v++)w[v*3]=(Math.random()-.5)*18,w[v*3+1]=(Math.random()-.5)*12,w[v*3+2]=6-Math.random()*(O+12),R[v]=Math.random();const u=new Z;return u.setAttribute("position",new b(w,3)),u.setAttribute("aScale",new b(R,1)),u},[r]),K=c.useMemo(()=>({uTime:{value:0},uPixelRatio:{value:Math.min(devicePixelRatio,2)}}),[]);return rt((w,R)=>{const u=Math.min(R,.05),v=innerHeight,J=Math.max(1,document.documentElement.scrollHeight-v),Q=scrollY/J;i.current.lerp(w.pointer,1-Math.pow(.001,u));const X=5-Q*O;t.position.z+=(X-t.position.z)*(1-Math.pow(5e-4,u)),t.position.x=i.current.x*.25,t.position.y=i.current.y*.18,t.lookAt(t.position.x*.5,t.position.y*.5,t.position.z-10),K.uTime.value+=u;const k=vt(v),A=k.reduce((y,P)=>y+P,0);let j=0,E=0,T=0,B=0;k.forEach((y,P)=>{const q=L[H[P]][M?"wide":"narrow"];j+=q.x*y,E+=q.y*y,T+=q.s*y,y>k[B]&&(B=P)}),A>.001&&(j/=A,E/=A),T=A>.001?T/Math.max(A,1):0;const I=1-Math.pow(.004,u);a.current.x+=(j-a.current.x)*I,a.current.y+=(E-a.current.y)*I,a.current.s+=(T-a.current.s)*I;const p=s.current;if(!p)return;const l=p.material.uniforms,U=L[H[B]].shape,_=U<0?g.shape:U;_!==m.current.to&&(l.uFrom.value=l.uT.value>.5?m.current.to:l.uFrom.value,l.uTo.value=_,l.uT.value=0,m.current.to=_),l.uT.value=Math.min(1,l.uT.value+u/1.8),g.kick=Math.max(0,g.kick-u*1.2),l.uKick.value=g.kick*g.kick,l.uTime.value+=u;const D=W[g.palette],G=1-Math.pow(.02,u);l.uColorA.value.lerp(h.a.set(D[0]),G),l.uColorB.value.lerp(h.b.set(D[1]),G);const V=2*Y*Math.tan(st.degToRad(45/2)),N=V*(e.width/e.height),tt=Math.min(1.1,N/3.2,V/3);p.visible=a.current.s>.01,p.position.set(t.position.x*.5+a.current.x*N,t.position.y*.5+a.current.y*V,t.position.z-Y),p.scale.setScalar(tt*a.current.s),p.rotation.y+=u*.18,p.rotation.x=.35+i.current.y*.3,p.rotation.z=i.current.x*.15,l.uSize.value=(M?34:26)*Math.max(.6,a.current.s),p.updateMatrixWorld(),o.setFromCamera(w.pointer,t),h.plane.setFromNormalAndCoplanarPoint(h.n.set(0,0,1),p.position),x&&o.ray.intersectPlane(h.plane,h.hit)&&l.uMouse.value.copy(p.worldToLocal(h.hit))}),d.jsxs(d.Fragment,{children:[d.jsx(xt,{count:n,poseRef:s}),d.jsx("points",{geometry:F,children:d.jsx("shaderMaterial",{vertexShader:yt,fragmentShader:gt,uniforms:K,transparent:!0,depthWrite:!1,blending:$})})]})}const yt=`
uniform float uTime;
uniform float uPixelRatio;
attribute float aScale;
varying float vAlpha;
void main(){
  vec3 p = position;
  p.y += sin(uTime * 0.3 + position.x) * 0.06;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (2.0 + aScale * 26.0) * uPixelRatio / -mv.z;
  // Se apagan al acercarse demasiado a la cámara
  vAlpha = (0.25 + aScale * 0.6) * smoothstep(0.4, 2.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}`,gt=`
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(1.0, 0.93, 0.86, smoothstep(0.5, 0.0, d) * vAlpha);
}`;function Rt(){const[n,r]=c.useState(!0),t=c.useMemo(()=>matchMedia("(max-width: 860px), (pointer: coarse)").matches,[]),e=c.useMemo(()=>matchMedia("(prefers-reduced-motion: reduce)").matches,[]);return c.useEffect(()=>{const o=()=>{const s=document.getElementById("projects")?.getBoundingClientRect(),i=!!s&&s.top<=0&&s.bottom>=innerHeight;r(!document.hidden&&!i)};return o(),addEventListener("scroll",o,{passive:!0}),document.addEventListener("visibilitychange",o),()=>{removeEventListener("scroll",o),document.removeEventListener("visibilitychange",o)}},[]),d.jsx("div",{className:"world","aria-hidden":!0,children:d.jsx(et,{frameloop:n?e?"demand":"always":"never",dpr:t?[1,1.5]:[1,2],camera:{position:[0,0,5],fov:45,near:.1,far:80},gl:{antialias:!1,alpha:!0,powerPreference:"high-performance"},eventSource:document.body,eventPrefix:"client",children:d.jsx(wt,{particles:t?7e3:16e3,stars:t?700:1800})})})}export{Rt as default};
