import{j as l,r as m,s as A,a as O}from"./index-DUF8opjD.js";import{u as C,l as z,m as S,n as P,a as me,T as de,V as y,D as ve,e as E,k as oe,o as re,p as X,q as w,r as ne,f as he,C as pe,s as fe}from"./react-three-fiber.esm-BM8KBJPn.js";const F=Math.PI*2,x=(e=1)=>(Math.random()-.5)*e,ge=e=>{const n=new Float32Array(e*3),a=Math.PI*(3-Math.sqrt(5));for(let r=0;r<e;r++){const o=1-r/(e-1)*2,i=Math.sqrt(1-o*o),t=a*r,s=1.3+x(.06);n.set([Math.cos(t)*i*s,o*s,Math.sin(t)*i*s],r*3)}return n},Me=e=>{const n=new Float32Array(e*3);for(let a=0;a<e;a++){const r=Math.random()*F,o=2,i=3,t=.55*(2+Math.cos(i*r)),s=t*Math.cos(o*r),u=t*Math.sin(o*r),c=-.55*Math.sin(i*r),d=Math.random()*F,v=.16*Math.sqrt(Math.random());n.set([s+Math.cos(d)*v,u+Math.sin(d)*v,c+x(v*2)],a*3)}return n},xe=e=>{const n=new Float32Array(e*3),a=3;for(let r=0;r<e;r++){const o=Math.pow(Math.random(),.7)*1.9,i=r%a/a*F,t=o*2.6,s=Math.pow(Math.random(),3)*.45*(Math.random()<.5?1:-1),u=i+t+s;n.set([Math.cos(u)*o,x(.12)*(1.9-o)*.6,Math.sin(u)*o],r*3)}return n},we=e=>{const n=new Float32Array(e*3);for(let a=0;a<e;a++){const r=(Math.random()-.5)*3,o=r*2.4;if(a%6===0){const i=Math.random()*2-1,t=Math.round(r*4)/4,s=t*2.4;n.set([Math.cos(s)*.7*i,t,Math.sin(s)*.7*i],a*3)}else{const i=a%2?0:Math.PI;n.set([Math.cos(o+i)*.7+x(.08),r,Math.sin(o+i)*.7+x(.08)],a*3)}}return n},ye=e=>{const n=new Float32Array(e*3),a=Math.PI*(3-Math.sqrt(5)),r=Math.floor(e*.55);for(let o=0;o<e;o++)if(o<r){const i=1-o/(r-1)*2,t=Math.sqrt(1-i*i),s=a*o,u=.8;n.set([Math.cos(s)*t*u,i*u,Math.sin(s)*t*u],o*3)}else{let i=1.1+Math.random()*.75;i>1.45&&i<1.52&&(i+=.08);const t=Math.random()*F;n.set([Math.cos(t)*i,x(.03),Math.sin(t)*i],o*3)}return n},be=e=>{const n=new Float32Array(e*3);for(let a=0;a<e;a++)if(a%4===0){const r=Math.random()*F,o=.62+x(.04);n.set([Math.cos(r)*o,Math.sin(r)*o,x(.03)],a*3)}else{const r=.72+Math.pow(Math.random(),2.2)*1.3,o=Math.random()*F;n.set([Math.cos(o)*r,x(.04)*r,Math.sin(o)*r],a*3)}return n},Ae=[ge,Me,xe,we,ye,be],V=new y(-.6,.45,.65).normalize(),H=`
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}`,Se=`
uniform sampler2D uMap;
uniform vec3 uLight;
uniform vec3 uAtmo;
uniform float uAtmoStrength;
uniform float uFade;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vec3 tex = texture2D(uMap, vUv).rgb;
  float ndl = dot(normalize(vNormal), uLight);
  float day = smoothstep(-0.12, 0.45, ndl);
  float fres = pow(1.0 - max(dot(normalize(vNormal), vView), 0.0), 2.5);
  vec3 col = tex * (0.025 + day * 1.15);
  // Atmósfera: borde iluminado del lado del sol
  col += uAtmo * fres * uAtmoStrength * smoothstep(-0.3, 0.6, ndl);
  gl_FragColor = vec4(col, uFade);
}`,Fe=`
uniform sampler2D uMap;
uniform vec3 uLight;
uniform float uFade;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  float a = texture2D(uMap, vUv).r;
  float day = smoothstep(-0.1, 0.5, dot(normalize(vNormal), uLight));
  gl_FragColor = vec4(vec3(1.0) * (0.03 + day), a * 0.85 * uFade);
}`,Re=`
uniform vec3 uAtmo;
uniform vec3 uLight;
uniform float uFade;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  // Halo exterior: se dibuja la cara de atrás de una esfera un poco más grande;
  // brilla pegado al borde del planeta y se apaga hacia afuera
  float rim = pow(clamp(-dot(normalize(vNormal), vView), 0.0, 1.0), 2.0) * 2.2;
  float lit = smoothstep(-0.4, 0.7, dot(normalize(vNormal), uLight));
  gl_FragColor = vec4(uAtmo, rim * lit * uFade);
}`,je=`
varying vec3 vWorld;
varying vec2 vXY;
void main(){
  vXY = position.xy;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,ze=`
uniform sampler2D uMap;
uniform float uInner;
uniform float uOuter;
uniform vec3 uLight;
uniform vec3 uCenter;
uniform float uRadius;
uniform float uFade;
varying vec3 vWorld;
varying vec2 vXY;
void main(){
  float r = (length(vXY) - uInner) / (uOuter - uInner);
  vec4 t = texture2D(uMap, vec2(r, 0.5));
  // Sombra del planeta sobre los anillos: ¿el rayo hacia el sol choca con la esfera?
  vec3 oc = vWorld - uCenter;
  float b = dot(oc, uLight);
  float c = dot(oc, oc) - uRadius * uRadius;
  float shadow = (b < 0.0 && b * b - c > 0.0) ? 0.12 : 1.0;
  gl_FragColor = vec4(t.rgb * (0.25 + 0.95 * shadow), t.a * uFade);
}`,Ce=[{pos:[6.8,-3.6,-16],r:2.8,map:"/textures/gas-giant.webp",atmo:"#ffc9a0",atmoStrength:.5,tilt:.12,spin:.025},{pos:[-6.2,2.6,-40],r:1.7,map:"/textures/ringed.webp",atmo:"#ffe7b8",atmoStrength:.35,tilt:.45,spin:.04,ring:{inner:2.2,outer:4,map:"/textures/rings.png",tilt:[1.2,.2,.35]}},{pos:[5.6,-3.4,-48],r:1.5,map:"/textures/earth.webp",atmo:"#5aa8ff",atmoStrength:1.1,tilt:.41,spin:.05,clouds:"/textures/earth-clouds.webp"},{pos:[3.4,2.7,-56],r:.7,map:"/textures/moon.webp",atmo:"#ffffff",atmoStrength:.08,tilt:.1,spin:.03}],ie=new de;function ee(e){const n=ie.load(e);return n.colorSpace=he,n.anisotropy=4,n}function Pe({spec:e,xScale:n}){const a=m.useRef(null),r=m.useRef(null),o=m.useRef(null),{camera:i}=C(),t=m.useMemo(()=>{const s=new z(e.atmo),u=new S({vertexShader:H,fragmentShader:Se,transparent:!0,uniforms:{uMap:{value:ee(e.map)},uLight:{value:V},uAtmo:{value:s},uAtmoStrength:{value:e.atmoStrength},uFade:{value:0}}}),c=new S({vertexShader:H,fragmentShader:Re,transparent:!0,side:me,depthWrite:!1,blending:P,uniforms:{uAtmo:{value:s},uLight:{value:V},uFade:{value:0}}}),d=e.clouds?new S({vertexShader:H,fragmentShader:Fe,transparent:!0,depthWrite:!1,uniforms:{uMap:{value:ie.load(e.clouds)},uLight:{value:V},uFade:{value:0}}}):null,v=e.ring?new S({vertexShader:je,fragmentShader:ze,transparent:!0,side:ve,depthWrite:!1,uniforms:{uMap:{value:ee(e.ring.map)},uInner:{value:e.ring.inner},uOuter:{value:e.ring.outer},uLight:{value:V},uCenter:{value:new y},uRadius:{value:e.r},uFade:{value:0}}}):null;return{planet:u,glow:c,clouds:d,ring:v}},[e]);return E((s,u)=>{const c=i.position.z-e.pos[2],d=oe.smoothstep(22-c,0,6),v=d>.001&&c>-2;a.current&&(a.current.visible=v),v&&(t.planet.uniforms.uFade.value=d,t.glow.uniforms.uFade.value=d,t.clouds&&(t.clouds.uniforms.uFade.value=d),t.ring&&(t.ring.uniforms.uFade.value=d,a.current.getWorldPosition(t.ring.uniforms.uCenter.value)),r.current&&(r.current.rotation.y+=u*e.spin),o.current&&(o.current.rotation.y+=u*e.spin*1.4))}),l.jsxs("group",{ref:a,position:[e.pos[0]*n,e.pos[1],e.pos[2]],children:[l.jsxs("group",{rotation:[0,0,e.tilt],children:[l.jsx("mesh",{ref:r,material:t.planet,children:l.jsx("sphereGeometry",{args:[e.r,96,64]})}),t.clouds&&l.jsx("mesh",{ref:o,material:t.clouds,children:l.jsx("sphereGeometry",{args:[e.r*1.012,96,64]})})]}),l.jsx("mesh",{material:t.glow,children:l.jsx("sphereGeometry",{args:[e.r*1.16,64,48]})}),e.ring&&t.ring&&l.jsx("mesh",{rotation:e.ring.tilt,material:t.ring,children:l.jsx("ringGeometry",{args:[e.ring.inner,e.ring.outer,192,1]})})]})}const Te=`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,Le=`
uniform float uAlpha;
varying vec2 vUv;
void main(){
  float head = pow(vUv.x, 3.0);
  float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
  gl_FragColor = vec4(1.0, 0.92, 0.82, head * core * uAlpha);
}`;function ke(){const{camera:e}=C(),n=m.useRef([]),a=m.useMemo(()=>[0,1].map(o=>({t:-1-o*3.5,x:0,y:0,dir:new re})),[]),r=m.useMemo(()=>a.map(()=>new S({vertexShader:Te,fragmentShader:Le,uniforms:{uAlpha:{value:0}},transparent:!0,depthWrite:!1,blending:P})),[a]);return E((o,i)=>{a.forEach((t,s)=>{const u=n.current[s];if(!u)return;if(t.t+=i,t.t>1){t.t=-(2+Math.random()*5),t.x=(Math.random()-.2)*5,t.y=1+Math.random()*1.6;const d=Math.PI+.25+Math.random()*.35;t.dir.set(Math.cos(d),Math.sin(d))}const c=Math.max(0,t.t);r[s].uniforms.uAlpha.value=t.t<0?0:Math.sin(c*Math.PI)*.9,u.position.set(e.position.x+t.x+t.dir.x*c*5,e.position.y+t.y+t.dir.y*c*5,e.position.z-7),u.rotation.z=Math.atan2(t.dir.y,t.dir.x)+Math.PI})}),l.jsx(l.Fragment,{children:r.map((o,i)=>l.jsx("mesh",{ref:t=>{n.current[i]=t},material:o,children:l.jsx("planeGeometry",{args:[1.8,.025]})},i))})}const _e=`
uniform float uOff;
uniform float uLen;
attribute float aEnd;
void main(){
  vec3 p = position;
  // Las líneas viven en un tubo de 30 unidades delante de la cámara y se reciclan solas
  p.z = -mod(position.z - uOff * 1.6, 30.0) - 1.0 + aEnd * uLen;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`,Ve=`
uniform float uAlpha;
void main(){ gl_FragColor = vec4(0.95, 0.9, 1.0, uAlpha); }`;function Ee({count:e}){const{camera:n}=C(),a=m.useRef(null),r=m.useRef({y:0,v:0}),o=m.useMemo(()=>{const t=new Float32Array(e*6),s=new Float32Array(e*2);for(let c=0;c<e;c++){const d=Math.random()*Math.PI*2,v=1.6+Math.random()*5,T=Math.cos(d)*v*1.4,R=Math.sin(d)*v,g=Math.random()*30;t.set([T,R,g,T,R,g],c*6),s.set([0,1],c*2)}const u=new X;return u.setAttribute("position",new w(t,3)),u.setAttribute("aEnd",new w(s,1)),u.boundingSphere=new ne(new y,50),u},[e]),i=m.useMemo(()=>new S({vertexShader:_e,fragmentShader:Ve,uniforms:{uOff:{value:0},uLen:{value:0},uAlpha:{value:0}},transparent:!0,depthWrite:!1,blending:P}),[]);return E((t,s)=>{const u=Math.max(s,.001),c=Math.abs(scrollY-r.current.y)/u/innerHeight;r.current.y=scrollY,r.current.v+=(Math.min(c,6)-r.current.v)*(1-Math.pow(.02,u));const d=r.current.v;i.uniforms.uOff.value=n.position.z,i.uniforms.uLen.value=Math.min(d*1.6,5),i.uniforms.uAlpha.value=Math.min(Math.max(d-.4,0)*.35,.55),a.current?.position.set(n.position.x,n.position.y,n.position.z)}),l.jsx("lineSegments",{ref:a,geometry:o,material:i})}function We({mobile:e}){const{size:n}=C(),a=Math.min(1,Math.max(.45,n.width/n.height/1.6));return l.jsxs(l.Fragment,{children:[Ce.map((r,o)=>l.jsx(Pe,{spec:r,xScale:a},o)),l.jsx(ke,{}),l.jsx(Ee,{count:e?140:320})]})}const te=46,ae=4.6,Y={top:{wide:{x:.24,y:0,s:1},narrow:{x:.06,y:-.3,s:.62},shape:-1},about:{wide:{x:.4,y:-.04,s:1.1},narrow:{x:.2,y:.3,s:.6},shape:2},journey:{wide:{x:.4,y:.12,s:.6},narrow:{x:.34,y:.36,s:.4},shape:0},contact:{wide:{x:.28,y:.02,s:1.05},narrow:{x:.3,y:.36,s:.42},shape:5}},K=Object.keys(Y);function Ie(e){return K.map(n=>{const a=document.getElementById(n);if(!a)return 0;const r=a.getBoundingClientRect();return Math.max(0,Math.min(r.bottom,e)-Math.max(r.top,0))/e})}const Ue=`
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
}`,Be=`
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor, a * a * vAlpha);
}`;function Ne({count:e,poseRef:n}){const a=m.useMemo(()=>{const o=new X,i=Ae.map(s=>s(e));o.setAttribute("position",new w(i[0],3)),i.slice(1).forEach((s,u)=>o.setAttribute(`p${u+1}`,new w(s,3)));const t=new Float32Array(e*4);for(let s=0;s<t.length;s++)t[s]=Math.random();return o.setAttribute("aRand",new w(t,4)),o.boundingSphere=new ne(new y,4),o},[e]),r=m.useMemo(()=>({uFrom:{value:0},uTo:{value:0},uT:{value:1},uTime:{value:0},uKick:{value:0},uSize:{value:30},uPixelRatio:{value:Math.min(devicePixelRatio,2)},uMouse:{value:new y(99,99,99)},uColorA:{value:new z(O[0][0])},uColorB:{value:new z(O[0][1])}}),[]);return l.jsx("points",{ref:n,geometry:a,children:l.jsx("shaderMaterial",{vertexShader:Ue,fragmentShader:Be,uniforms:r,transparent:!0,depthWrite:!1,blending:P})})}function De({particles:e,stars:n}){const{camera:a,size:r,raycaster:o}=C(),i=m.useRef(null),t=m.useRef(new re),s=m.useRef({x:0,y:0,s:0}),u=m.useRef({to:0}),c=m.useMemo(()=>({plane:new fe,hit:new y,n:new y,a:new z,b:new z}),[]),d=r.width>860,v=m.useMemo(()=>matchMedia("(hover: hover) and (pointer: fine)").matches,[]),T=m.useMemo(()=>{const g=new Float32Array(n*3),L=new Float32Array(n);for(let M=0;M<n;M++)g[M*3]=(Math.random()-.5)*18,g[M*3+1]=(Math.random()-.5)*12,g[M*3+2]=6-Math.random()*(te+12),L[M]=Math.random();const h=new X;return h.setAttribute("position",new w(g,3)),h.setAttribute("aScale",new w(L,1)),h},[n]),R=m.useMemo(()=>({uTime:{value:0},uPixelRatio:{value:Math.min(devicePixelRatio,2)}}),[]);return E((g,L)=>{const h=Math.min(L,.05),M=innerHeight,se=Math.max(1,document.documentElement.scrollHeight-M),ue=scrollY/se;t.current.lerp(g.pointer,1-Math.pow(.001,h));const le=5-ue*te;a.position.z+=(le-a.position.z)*(1-Math.pow(5e-4,h)),a.position.x=t.current.x*.25,a.position.y=t.current.y*.18,a.lookAt(a.position.x*.5,a.position.y*.5,a.position.z-10),R.uTime.value+=h;const W=Ie(M),j=W.reduce((b,_)=>b+_,0);let I=0,U=0,k=0,B=0;W.forEach((b,_)=>{const q=Y[K[_]][d?"wide":"narrow"];I+=q.x*b,U+=q.y*b,k+=q.s*b,b>W[B]&&(B=_)}),j>.001&&(I/=j,U/=j),k=j>.001?k/Math.max(j,1):0;const N=1-Math.pow(.004,h);s.current.x+=(I-s.current.x)*N,s.current.y+=(U-s.current.y)*N,s.current.s+=(k-s.current.s)*N;const f=i.current;if(!f)return;const p=f.material.uniforms,Z=Y[K[B]].shape,D=Z<0?A.shape:Z;D!==u.current.to&&(p.uFrom.value=p.uT.value>.5?u.current.to:p.uFrom.value,p.uTo.value=D,p.uT.value=0,u.current.to=D),p.uT.value=Math.min(1,p.uT.value+h/1.8),A.kick=Math.max(0,A.kick-h*1.2),p.uKick.value=A.kick*A.kick,p.uTime.value+=h;const $=O[A.palette],J=1-Math.pow(.02,h);p.uColorA.value.lerp(c.a.set($[0]),J),p.uColorB.value.lerp(c.b.set($[1]),J);const G=2*ae*Math.tan(oe.degToRad(45/2)),Q=G*(r.width/r.height),ce=Math.min(1.1,Q/3.2,G/3);f.visible=s.current.s>.01,f.position.set(a.position.x*.5+s.current.x*Q,a.position.y*.5+s.current.y*G,a.position.z-ae),f.scale.setScalar(ce*s.current.s),f.rotation.y+=h*.18,f.rotation.x=.35+t.current.y*.3,f.rotation.z=t.current.x*.15,p.uSize.value=(d?34:26)*Math.max(.6,s.current.s),f.updateMatrixWorld(),o.setFromCamera(g.pointer,a),c.plane.setFromNormalAndCoplanarPoint(c.n.set(0,0,1),f.position),v&&o.ray.intersectPlane(c.plane,c.hit)&&p.uMouse.value.copy(f.worldToLocal(c.hit))}),l.jsxs(l.Fragment,{children:[l.jsx(We,{mobile:e<1e4}),l.jsx(Ne,{count:e,poseRef:i}),l.jsx("points",{geometry:T,children:l.jsx("shaderMaterial",{vertexShader:Ge,fragmentShader:qe,uniforms:R,transparent:!0,depthWrite:!1,blending:P})})]})}const Ge=`
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
}`,qe=`
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(1.0, 0.93, 0.86, smoothstep(0.5, 0.0, d) * vAlpha);
}`;function Ye(){const[e,n]=m.useState(!0),a=m.useMemo(()=>matchMedia("(max-width: 860px), (pointer: coarse)").matches,[]),r=m.useMemo(()=>matchMedia("(prefers-reduced-motion: reduce)").matches,[]);return m.useEffect(()=>{const o=()=>{const i=document.getElementById("projects")?.getBoundingClientRect(),t=!!i&&i.top<=0&&i.bottom>=innerHeight;n(!document.hidden&&!t)};return o(),addEventListener("scroll",o,{passive:!0}),document.addEventListener("visibilitychange",o),()=>{removeEventListener("scroll",o),document.removeEventListener("visibilitychange",o)}},[]),l.jsx("div",{className:"world","aria-hidden":!0,children:l.jsx(pe,{frameloop:e?r?"demand":"always":"never",dpr:a?[1,1.5]:[1,2],camera:{position:[0,0,5],fov:45,near:.1,far:80},gl:{antialias:!1,alpha:!0,powerPreference:"high-performance"},eventSource:document.body,eventPrefix:"client",children:l.jsx(De,{particles:a?7e3:16e3,stars:a?700:1800})})})}export{Ye as default};
