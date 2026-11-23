import{j as c,r as l,u as he,a as fe,g as re,s as F,b as Q,d as pe}from"./index-CVvKt9_p.js";import{u as z,l as L,m as R,n as E,a as ge,T as Me,V as A,D as xe,e as _,k as ue,o as le,p as $,q as b,r as ce,f as we,C as ye,s as be}from"./react-three-fiber.esm-Cxu3OGAp.js";const j=Math.PI*2,x=(e=1)=>(Math.random()-.5)*e,Ae=e=>{const o=new Float32Array(e*3),a=Math.PI*(3-Math.sqrt(5));for(let r=0;r<e;r++){const t=1-r/(e-1)*2,i=Math.sqrt(1-t*t),n=a*r,s=1.3+x(.06);o.set([Math.cos(n)*i*s,t*s,Math.sin(n)*i*s],r*3)}return o},Se=e=>{const o=new Float32Array(e*3);for(let a=0;a<e;a++){const r=Math.random()*j,t=2,i=3,n=.55*(2+Math.cos(i*r)),s=n*Math.cos(t*r),u=n*Math.sin(t*r),m=-.55*Math.sin(i*r),d=Math.random()*j,v=.16*Math.sqrt(Math.random());o.set([s+Math.cos(d)*v,u+Math.sin(d)*v,m+x(v*2)],a*3)}return o},Fe=e=>{const o=new Float32Array(e*3),a=3;for(let r=0;r<e;r++){const t=Math.pow(Math.random(),.7)*1.9,i=r%a/a*j,n=t*2.6,s=Math.pow(Math.random(),3)*.45*(Math.random()<.5?1:-1),u=i+n+s;o.set([Math.cos(u)*t,x(.12)*(1.9-t)*.6,Math.sin(u)*t],r*3)}return o},Re=e=>{const o=new Float32Array(e*3);for(let a=0;a<e;a++){const r=(Math.random()-.5)*3,t=r*2.4;if(a%6===0){const i=Math.random()*2-1,n=Math.round(r*4)/4,s=n*2.4;o.set([Math.cos(s)*.7*i,n,Math.sin(s)*.7*i],a*3)}else{const i=a%2?0:Math.PI;o.set([Math.cos(t+i)*.7+x(.08),r,Math.sin(t+i)*.7+x(.08)],a*3)}}return o},je=e=>{const o=new Float32Array(e*3),a=Math.PI*(3-Math.sqrt(5)),r=Math.floor(e*.55);for(let t=0;t<e;t++)if(t<r){const i=1-t/(r-1)*2,n=Math.sqrt(1-i*i),s=a*t,u=.8;o.set([Math.cos(s)*n*u,i*u,Math.sin(s)*n*u],t*3)}else{let i=1.1+Math.random()*.75;i>1.45&&i<1.52&&(i+=.08);const n=Math.random()*j;o.set([Math.cos(n)*i,x(.03),Math.sin(n)*i],t*3)}return o},ze=e=>{const o=new Float32Array(e*3);for(let a=0;a<e;a++)if(a%4===0){const r=Math.random()*j,t=.62+x(.04);o.set([Math.cos(r)*t,Math.sin(r)*t,x(.03)],a*3)}else{const r=.72+Math.pow(Math.random(),2.2)*1.3,t=Math.random()*j;o.set([Math.cos(t)*r,x(.04)*r,Math.sin(t)*r],a*3)}return o},Ce=[Ae,Se,Fe,Re,je,ze],Pe=["top","about","journey","contact","projects"],M={vh:1,max:1,rects:{}};function T(){M.vh=innerHeight,M.max=Math.max(1,document.documentElement.scrollHeight-innerHeight);for(const e of Pe){const o=document.getElementById(e);if(!o){delete M.rects[e];continue}const a=o.getBoundingClientRect();M.rects[e]={top:a.top+scrollY,bottom:a.bottom+scrollY}}}function Te(e,o){const a=M.rects[e];return a?Math.max(0,Math.min(a.bottom-o,M.vh)-Math.max(a.top-o,0))/M.vh:0}function Le(e,o){const a=M.rects[e];return!!a&&a.top<=o&&a.bottom>=o+M.vh}function Ee(){T();const e=new ResizeObserver(T);return e.observe(document.documentElement),addEventListener("resize",T),document.fonts?.ready.then(T),()=>{e.disconnect(),removeEventListener("resize",T)}}const U=new A(-.6,.45,.65).normalize(),K=`
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}`,_e=`
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
}`,ke=`
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
}`,Ve=`
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
}`,Ie=`
varying vec3 vWorld;
varying vec2 vXY;
void main(){
  vXY = position.xy;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,We=`
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
}`,Ue=[{pos:[6.8,-3.6,-16],r:2.8,map:"/textures/gas-giant.webp",atmo:"#ffc9a0",atmoStrength:.5,tilt:.12,spin:.025},{pos:[-6.2,2.6,-40],r:1.7,map:"/textures/ringed.webp",atmo:"#ffe7b8",atmoStrength:.35,tilt:.45,spin:.04,ring:{inner:2.2,outer:4,map:"/textures/rings.png",tilt:[1.2,.2,.35]}},{pos:[5.6,-3.4,-48],r:1.5,map:"/textures/earth.webp",atmo:"#5aa8ff",atmoStrength:1.1,tilt:.41,spin:.05,clouds:"/textures/earth-clouds.webp"},{pos:[3.4,2.7,-56],r:.7,map:"/textures/moon.webp",atmo:"#ffffff",atmoStrength:.08,tilt:.1,spin:.03}],me=new Me;function ne(e){const o=me.load(e);return o.colorSpace=we,o.anisotropy=4,o}function De({spec:e,xScale:o}){const a=l.useRef(null),r=l.useRef(null),t=l.useRef(null),{camera:i}=z(),n=l.useMemo(()=>{const s=new L(e.atmo),u=new R({vertexShader:K,fragmentShader:_e,transparent:!0,uniforms:{uMap:{value:ne(e.map)},uLight:{value:U},uAtmo:{value:s},uAtmoStrength:{value:e.atmoStrength},uFade:{value:0}}}),m=new R({vertexShader:K,fragmentShader:Ve,transparent:!0,side:ge,depthWrite:!1,blending:E,uniforms:{uAtmo:{value:s},uLight:{value:U},uFade:{value:0}}}),d=e.clouds?new R({vertexShader:K,fragmentShader:ke,transparent:!0,depthWrite:!1,uniforms:{uMap:{value:me.load(e.clouds)},uLight:{value:U},uFade:{value:0}}}):null,v=e.ring?new R({vertexShader:Ie,fragmentShader:We,transparent:!0,side:xe,depthWrite:!1,uniforms:{uMap:{value:ne(e.ring.map)},uInner:{value:e.ring.inner},uOuter:{value:e.ring.outer},uLight:{value:U},uCenter:{value:new A},uRadius:{value:e.r},uFade:{value:0}}}):null;return{planet:u,glow:m,clouds:d,ring:v}},[e]);return _((s,u)=>{const m=i.position.z-e.pos[2],d=ue.smoothstep(22-m,0,6),v=d>.001&&m>-2;a.current&&(a.current.visible=v),v&&(n.planet.uniforms.uFade.value=d,n.glow.uniforms.uFade.value=d,n.clouds&&(n.clouds.uniforms.uFade.value=d),n.ring&&(n.ring.uniforms.uFade.value=d,a.current.getWorldPosition(n.ring.uniforms.uCenter.value)),r.current&&(r.current.rotation.y+=u*e.spin),t.current&&(t.current.rotation.y+=u*e.spin*1.4))}),c.jsxs("group",{ref:a,position:[e.pos[0]*o,e.pos[1],e.pos[2]],children:[c.jsxs("group",{rotation:[0,0,e.tilt],children:[c.jsx("mesh",{ref:r,material:n.planet,children:c.jsx("sphereGeometry",{args:[e.r,96,64]})}),n.clouds&&c.jsx("mesh",{ref:t,material:n.clouds,children:c.jsx("sphereGeometry",{args:[e.r*1.012,96,64]})})]}),c.jsx("mesh",{material:n.glow,children:c.jsx("sphereGeometry",{args:[e.r*1.16,64,48]})}),e.ring&&n.ring&&c.jsx("mesh",{rotation:e.ring.tilt,material:n.ring,children:c.jsx("ringGeometry",{args:[e.ring.inner,e.ring.outer,192,1]})})]})}const Ne=`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,Be=`
uniform float uAlpha;
varying vec2 vUv;
void main(){
  float head = pow(vUv.x, 3.0);
  float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
  gl_FragColor = vec4(1.0, 0.92, 0.82, head * core * uAlpha);
}`;function Ye(){const{camera:e}=z(),o=l.useRef([]),a=l.useMemo(()=>[0,1].map(t=>({t:-1-t*3.5,x:0,y:0,dir:new le})),[]),r=l.useMemo(()=>a.map(()=>new R({vertexShader:Ne,fragmentShader:Be,uniforms:{uAlpha:{value:0}},transparent:!0,depthWrite:!1,blending:E})),[a]);return _((t,i)=>{a.forEach((n,s)=>{const u=o.current[s];if(!u)return;if(n.t+=i,n.t>1){n.t=-(2+Math.random()*5),n.x=(Math.random()-.2)*5,n.y=1+Math.random()*1.6;const d=Math.PI+.25+Math.random()*.35;n.dir.set(Math.cos(d),Math.sin(d))}const m=Math.max(0,n.t);r[s].uniforms.uAlpha.value=n.t<0?0:Math.sin(m*Math.PI)*.9,u.position.set(e.position.x+n.x+n.dir.x*m*5,e.position.y+n.y+n.dir.y*m*5,e.position.z-7),u.rotation.z=Math.atan2(n.dir.y,n.dir.x)+Math.PI})}),c.jsx(c.Fragment,{children:r.map((t,i)=>c.jsx("mesh",{ref:n=>{o.current[i]=n},material:t,children:c.jsx("planeGeometry",{args:[1.8,.025]})},i))})}const Oe=`
uniform float uOff;
uniform float uLen;
attribute float aEnd;
void main(){
  vec3 p = position;
  // Las líneas viven en un tubo de 30 unidades delante de la cámara y se reciclan solas
  p.z = -mod(position.z - uOff * 1.6, 30.0) - 1.0 + aEnd * uLen;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`,qe=`
uniform float uAlpha;
void main(){ gl_FragColor = vec4(0.95, 0.9, 1.0, uAlpha); }`;function Ge({count:e}){const{camera:o}=z(),a=l.useRef(null),r=l.useRef({y:0,v:0}),t=l.useMemo(()=>{const n=new Float32Array(e*6),s=new Float32Array(e*2);for(let m=0;m<e;m++){const d=Math.random()*Math.PI*2,v=1.6+Math.random()*5,C=Math.cos(d)*v*1.4,k=Math.sin(d)*v,S=Math.random()*30;n.set([C,k,S,C,k,S],m*6),s.set([0,1],m*2)}const u=new $;return u.setAttribute("position",new b(n,3)),u.setAttribute("aEnd",new b(s,1)),u.boundingSphere=new ce(new A,50),u},[e]),i=l.useMemo(()=>new R({vertexShader:Oe,fragmentShader:qe,uniforms:{uOff:{value:0},uLen:{value:0},uAlpha:{value:0}},transparent:!0,depthWrite:!1,blending:E}),[]);return _((n,s)=>{const u=Math.max(s,.001),m=Math.abs(scrollY-r.current.y)/u/innerHeight;r.current.y=scrollY,r.current.v+=(Math.min(m,6)-r.current.v)*(1-Math.pow(.02,u));const d=r.current.v;i.uniforms.uOff.value=o.position.z,i.uniforms.uLen.value=Math.min(d*1.6,5),i.uniforms.uAlpha.value=Math.min(Math.max(d-.4,0)*.35,.55),a.current?.position.set(o.position.x,o.position.y,o.position.z)}),c.jsx("lineSegments",{ref:a,geometry:t,material:i})}function He({mobile:e,warp:o}){const{size:a}=z(),r=Math.min(1,Math.max(.45,a.width/a.height/1.6));return c.jsxs(c.Fragment,{children:[Ue.map((t,i)=>c.jsx(De,{spec:t,xScale:r},i)),c.jsx(Ye,{}),o&&c.jsx(Ge,{count:e?140:320})]})}const ie=46,se=4.6,Ke=.4,Z={top:{wide:{x:.24,y:0,s:1},narrow:{x:.06,y:-.3,s:.62},shape:-1},about:{wide:{x:.4,y:-.04,s:1.1},narrow:{x:.2,y:.3,s:.6},shape:2},journey:{wide:{x:.4,y:.12,s:.6},narrow:{x:.34,y:.36,s:.4},shape:0},contact:{wide:{x:.28,y:.02,s:1.05},narrow:{x:.3,y:.36,s:.42},shape:5}},X=Object.keys(Z),Xe=`
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
  // Explosión al tocar el enjambre
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
}`,Qe=`
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor, a * a * vAlpha);
}`;function Ze({count:e,poseRef:o}){const a=l.useMemo(()=>{const t=new $,i=Ce.map(s=>s(e));t.setAttribute("position",new b(i[0],3)),i.slice(1).forEach((s,u)=>t.setAttribute(`p${u+1}`,new b(s,3)));const n=new Float32Array(e*4);for(let s=0;s<n.length;s++)n[s]=Math.random();return t.setAttribute("aRand",new b(n,4)),t.boundingSphere=new ce(new A,4),t},[e]),r=l.useMemo(()=>({uFrom:{value:0},uTo:{value:0},uT:{value:1},uTime:{value:0},uKick:{value:0},uSize:{value:30},uPixelRatio:{value:Math.min(devicePixelRatio,2)},uMouse:{value:new A(99,99,99)},uColorA:{value:new L(Q[0][0])},uColorB:{value:new L(Q[0][1])}}),[]);return c.jsx("points",{ref:o,geometry:a,children:c.jsx("shaderMaterial",{vertexShader:Xe,fragmentShader:Qe,uniforms:r,transparent:!0,depthWrite:!1,blending:E})})}function $e(e){const o=l.useRef({time:0,frames:0,warm:2,slow:0});_((a,r)=>{if(r>.25){o.current.warm=Math.max(o.current.warm,.6);return}const t=o.current;if(t.warm>0){t.warm-=r;return}if(t.time+=r,t.frames++,t.time<1)return;const i=t.frames/t.time;t.time=0,t.frames=0,t.slow=i<(e===0?40:28)?t.slow+1:0,t.slow>=2&&(t.slow=0,t.warm=1.5,pe())})}function Je(){const e=z(o=>o.invalidate);return l.useEffect(()=>{let o=0;const a=()=>{o||(o=requestAnimationFrame(()=>{o=0,e()}))};return addEventListener("scroll",a,{passive:!0}),a(),()=>{removeEventListener("scroll",a),cancelAnimationFrame(o)}},[e]),null}function et({particles:e,stars:o,tier:a}){const{camera:r,size:t,raycaster:i,setDpr:n}=z(),s=l.useRef(null),u=l.useRef(new le),m=l.useRef({x:0,y:0,s:0}),d=l.useRef({to:0}),v=l.useMemo(()=>({plane:new be,hit:new A,n:new A,a:new L,b:new L}),[]),C=t.width>860,k=l.useMemo(()=>matchMedia("(hover: hover) and (pointer: fine)").matches,[]);$e(a),l.useEffect(()=>Ee(),[]),l.useEffect(()=>{a>=1&&n(1)},[a,n]);const S=l.useMemo(()=>{const g=new Float32Array(o*3),V=new Float32Array(o);for(let w=0;w<o;w++)g[w*3]=(Math.random()-.5)*18,g[w*3+1]=(Math.random()-.5)*12,g[w*3+2]=6-Math.random()*(ie+12),V[w]=Math.random();const h=new $;return h.setAttribute("position",new b(g,3)),h.setAttribute("aScale",new b(V,1)),h},[o]),J=l.useMemo(()=>({uTime:{value:0},uPixelRatio:{value:Math.min(devicePixelRatio,2)}}),[]);return l.useEffect(()=>{const g=a>=1?Ke:1;S.setDrawRange(0,Math.floor(o*Math.max(g,.5))),s.current?.geometry.setDrawRange(0,Math.floor(e*g))},[a,o,e,S]),_((g,V)=>{const h=Math.min(V,.05),w=scrollY/M.max;u.current.lerp(g.pointer,1-Math.pow(.001,h));const de=5-w*ie;r.position.z+=(de-r.position.z)*(1-Math.pow(5e-4,h)),r.position.x=u.current.x*.25,r.position.y=u.current.y*.18,r.lookAt(r.position.x*.5,r.position.y*.5,r.position.z-10),J.uTime.value+=h;const D=X.map(y=>Te(y,scrollY)),P=D.reduce((y,W)=>y+W,0);let N=0,B=0,I=0,Y=0;D.forEach((y,W)=>{const H=Z[X[W]][C?"wide":"narrow"];N+=H.x*y,B+=H.y*y,I+=H.s*y,y>D[Y]&&(Y=W)}),P>.001&&(N/=P,B/=P),I=P>.001?I/Math.max(P,1):0;const O=1-Math.pow(.004,h);m.current.x+=(N-m.current.x)*O,m.current.y+=(B-m.current.y)*O,m.current.s+=(I-m.current.s)*O;const p=s.current;if(!p)return;const f=p.material.uniforms,ee=Z[X[Y]].shape,q=ee<0?F.shape:ee;q!==d.current.to&&(f.uFrom.value=f.uT.value>.5?d.current.to:f.uFrom.value,f.uTo.value=q,f.uT.value=0,d.current.to=q),f.uT.value=Math.min(1,f.uT.value+h/1.8),F.kick=Math.max(0,F.kick-h*1.2),f.uKick.value=F.kick*F.kick,f.uTime.value+=h;const te=Q[F.palette],ae=1-Math.pow(.02,h);f.uColorA.value.lerp(v.a.set(te[0]),ae),f.uColorB.value.lerp(v.b.set(te[1]),ae);const G=2*se*Math.tan(ue.degToRad(45/2)),oe=G*(t.width/t.height),ve=Math.min(1.1,oe/3.2,G/3);p.visible=m.current.s>.01,p.position.set(r.position.x*.5+m.current.x*oe,r.position.y*.5+m.current.y*G,r.position.z-se),p.scale.setScalar(ve*m.current.s),p.rotation.y+=h*.18,p.rotation.x=.35+u.current.y*.3,p.rotation.z=u.current.x*.15,f.uSize.value=(C?34:26)*Math.max(.6,m.current.s),p.updateMatrixWorld(),i.setFromCamera(g.pointer,r),v.plane.setFromNormalAndCoplanarPoint(v.n.set(0,0,1),p.position),k&&i.ray.intersectPlane(v.plane,v.hit)&&f.uMouse.value.copy(p.worldToLocal(v.hit))}),c.jsxs(c.Fragment,{children:[c.jsx(He,{mobile:e<1e4,warp:a===0}),c.jsx(Ze,{count:e,poseRef:s}),c.jsx("points",{geometry:S,children:c.jsx("shaderMaterial",{vertexShader:tt,fragmentShader:at,uniforms:J,transparent:!0,depthWrite:!1,blending:E})})]})}const tt=`
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
}`,at=`
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(1.0, 0.93, 0.86, smoothstep(0.5, 0.0, d) * vAlpha);
}`;function nt(){const[e,o]=l.useState(!0),a=he(),r=l.useMemo(()=>matchMedia("(max-width: 860px), (pointer: coarse)").matches,[]),t=l.useMemo(()=>fe(),[]),[i]=l.useState(()=>r||re()>=1),[n]=l.useState(()=>re()>=1),s=!t&&a===2;return l.useEffect(()=>{const u=()=>o(!document.hidden&&!Le("projects",scrollY));return u(),addEventListener("scroll",u,{passive:!0}),document.addEventListener("visibilitychange",u),()=>{removeEventListener("scroll",u),document.removeEventListener("visibilitychange",u)}},[]),c.jsx("div",{className:"world","aria-hidden":!0,children:c.jsxs(ye,{frameloop:e?t||a===2?"demand":"always":"never",dpr:a>=1||r?[1,1.5]:[1,2],camera:{position:[0,0,5],fov:45,near:.1,far:80},gl:{antialias:!1,alpha:!0,powerPreference:"high-performance"},eventSource:document.body,eventPrefix:"client",children:[c.jsx(et,{particles:i?n?6e3:7e3:16e3,stars:i?700:1800,tier:a}),s&&c.jsx(Je,{})]})})}export{nt as default};
