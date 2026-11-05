import{j as c,r as l,s as A,a as Y}from"./index-eSj68A5N.js";import{u as C,l as _,m as x,D as ue,e as E,k as ee,n as te,o as V,p as D,q as w,r as oe,V as R,C as ce,s as le}from"./react-three-fiber.esm-Dgj1-pqQ.js";const F=Math.PI*2,g=(e=1)=>(Math.random()-.5)*e,me=e=>{const s=new Float32Array(e*3),t=Math.PI*(3-Math.sqrt(5));for(let a=0;a<e;a++){const o=1-a/(e-1)*2,r=Math.sqrt(1-o*o),n=t*a,i=1.3+g(.06);s.set([Math.cos(n)*r*i,o*i,Math.sin(n)*r*i],a*3)}return s},he=e=>{const s=new Float32Array(e*3);for(let t=0;t<e;t++){const a=Math.random()*F,o=2,r=3,n=.55*(2+Math.cos(r*a)),i=n*Math.cos(o*a),u=n*Math.sin(o*a),m=-.55*Math.sin(r*a),h=Math.random()*F,y=.16*Math.sqrt(Math.random());s.set([i+Math.cos(h)*y,u+Math.sin(h)*y,m+g(y*2)],t*3)}return s},de=e=>{const s=new Float32Array(e*3),t=3;for(let a=0;a<e;a++){const o=Math.pow(Math.random(),.7)*1.9,r=a%t/t*F,n=o*2.6,i=Math.pow(Math.random(),3)*.45*(Math.random()<.5?1:-1),u=r+n+i;s.set([Math.cos(u)*o,g(.12)*(1.9-o)*.6,Math.sin(u)*o],a*3)}return s},ve=e=>{const s=new Float32Array(e*3);for(let t=0;t<e;t++){const a=(Math.random()-.5)*3,o=a*2.4;if(t%6===0){const r=Math.random()*2-1,n=Math.round(a*4)/4,i=n*2.4;s.set([Math.cos(i)*.7*r,n,Math.sin(i)*.7*r],t*3)}else{const r=t%2?0:Math.PI;s.set([Math.cos(o+r)*.7+g(.08),a,Math.sin(o+r)*.7+g(.08)],t*3)}}return s},fe=e=>{const s=new Float32Array(e*3),t=Math.PI*(3-Math.sqrt(5)),a=Math.floor(e*.55);for(let o=0;o<e;o++)if(o<a){const r=1-o/(a-1)*2,n=Math.sqrt(1-r*r),i=t*o,u=.8;s.set([Math.cos(i)*n*u,r*u,Math.sin(i)*n*u],o*3)}else{let r=1.1+Math.random()*.75;r>1.45&&r<1.52&&(r+=.08);const n=Math.random()*F;s.set([Math.cos(n)*r,g(.03),Math.sin(n)*r],o*3)}return s},pe=e=>{const s=new Float32Array(e*3);for(let t=0;t<e;t++)if(t%4===0){const a=Math.random()*F,o=.62+g(.04);s.set([Math.cos(a)*o,Math.sin(a)*o,g(.03)],t*3)}else{const a=.72+Math.pow(Math.random(),2.2)*1.3,o=Math.random()*F;s.set([Math.cos(o)*a,g(.04)*a,Math.sin(o)*a],t*3)}return s},Me=[me,he,de,ve,fe,pe],ae=`
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }
`,xe=`
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vView;
void main(){
  vPos = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}`,ge=`
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uAtmo;
uniform float uBands;
uniform float uCraters;
uniform float uTime;
uniform float uFade;
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vView;
${ae}
void main(){
  vec3 n = normalize(vPos);
  float turb = fbm(n * 3.0 + vec3(uTime * 0.02, 0.0, 0.0));
  // Bandas de gigante gaseoso o superficie con cráteres
  float bands = sin(n.y * uBands + turb * 4.0) * 0.5 + 0.5;
  vec3 col = mix(uA, uB, bands);
  col = mix(col, uC, smoothstep(0.55, 0.8, fbm(n * 6.0)) * 0.6);
  float crater = smoothstep(0.62, 0.7, fbm(n * 9.0)) * uCraters;
  col *= 1.0 - crater * 0.45;
  // Luz de una estrella lejana, con terminador suave
  vec3 L = normalize(vec3(-0.6, 0.45, 0.65));
  float lit = smoothstep(-0.15, 0.6, dot(vNormal, L));
  float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.0);
  col = col * (0.06 + lit * 1.05) + uAtmo * fres * (0.25 + lit * 0.9);
  gl_FragColor = vec4(col, uFade);
}`,ye=`
varying vec2 vXY;
void main(){ vXY = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,we=`
uniform float uInner;
uniform float uOuter;
uniform vec3 uColor;
uniform float uFade;
varying vec2 vXY;
${ae}
void main(){
  float r = (length(vXY) - uInner) / (uOuter - uInner);
  float bands = vnoise(vec3(r * 40.0, 0.0, 0.0)) * 0.6 + vnoise(vec3(r * 140.0, 3.0, 0.0)) * 0.4;
  float gap = smoothstep(0.52, 0.55, r) * (1.0 - smoothstep(0.58, 0.61, r));
  float a = smoothstep(0.0, 0.08, r) * (1.0 - smoothstep(0.9, 1.0, r)) * (0.35 + bands * 0.65) * (1.0 - gap * 0.9);
  gl_FragColor = vec4(uColor * (0.6 + bands * 0.6), a * 0.8 * uFade);
}`,be=[{pos:[6.8,-3.6,-16],r:2.8,colors:["#8a3a17","#f0b27a","#ff5a1f","#ffb27a"],bands:22,craters:0,spin:.03},{pos:[-6.2,2.6,-40],r:1.7,colors:["#1e3d7a","#9fc4ff","#e9f2ff","#7fb0ff"],bands:12,craters:0,spin:.05,ring:{inner:2.3,outer:3.8,color:"#cfe0ff",tilt:[1.25,.25,.3]}},{pos:[3.4,2.6,-55],r:.85,colors:["#4a4744","#a6a19a","#d8d2c8","#f3efe7"],bands:2,craters:1,spin:.08}];function Ae({spec:e,xScale:s}){const t=l.useRef(null),a=l.useMemo(()=>new _({vertexShader:xe,fragmentShader:ge,uniforms:{uA:{value:new x(e.colors[0])},uB:{value:new x(e.colors[1])},uC:{value:new x(e.colors[2])},uAtmo:{value:new x(e.colors[3])},uBands:{value:e.bands},uCraters:{value:e.craters},uTime:{value:0},uFade:{value:0}},transparent:!0}),[e]),o=l.useMemo(()=>e.ring&&new _({vertexShader:ye,fragmentShader:we,uniforms:{uInner:{value:e.ring.inner},uOuter:{value:e.ring.outer},uColor:{value:new x(e.ring.color)},uFade:{value:0}},transparent:!0,side:ue,depthWrite:!1}),[e]),r=l.useRef(null),{camera:n}=C();return E((i,u)=>{const m=n.position.z-e.pos[2],h=ee.smoothstep(22-m,0,6);a.uniforms.uFade.value=h,o&&(o.uniforms.uFade.value=h),r.current&&(r.current.visible=h>.001&&m>-2),a.uniforms.uTime.value+=u,t.current&&(t.current.rotation.y+=u*e.spin)}),c.jsxs("group",{ref:r,position:[e.pos[0]*s,e.pos[1],e.pos[2]],children:[c.jsx("group",{ref:t,children:c.jsx("mesh",{material:a,children:c.jsx("sphereGeometry",{args:[e.r,64,48]})})}),e.ring&&o&&c.jsx("mesh",{rotation:e.ring.tilt,material:o,children:c.jsx("ringGeometry",{args:[e.ring.inner,e.ring.outer,160,1]})})]})}const Fe=`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,Se=`
uniform float uAlpha;
varying vec2 vUv;
void main(){
  float head = pow(vUv.x, 3.0);
  float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
  gl_FragColor = vec4(1.0, 0.92, 0.82, head * core * uAlpha);
}`;function ze(){const{camera:e}=C(),s=l.useRef([]),t=l.useMemo(()=>[0,1].map(o=>({t:-1-o*3.5,x:0,y:0,dir:new te})),[]),a=l.useMemo(()=>t.map(()=>new _({vertexShader:Fe,fragmentShader:Se,uniforms:{uAlpha:{value:0}},transparent:!0,depthWrite:!1,blending:V})),[t]);return E((o,r)=>{t.forEach((n,i)=>{const u=s.current[i];if(!u)return;if(n.t+=r,n.t>1){n.t=-(2+Math.random()*5),n.x=(Math.random()-.2)*5,n.y=1+Math.random()*1.6;const h=Math.PI+.25+Math.random()*.35;n.dir.set(Math.cos(h),Math.sin(h))}const m=Math.max(0,n.t);a[i].uniforms.uAlpha.value=n.t<0?0:Math.sin(m*Math.PI)*.9,u.position.set(e.position.x+n.x+n.dir.x*m*5,e.position.y+n.y+n.dir.y*m*5,e.position.z-7),u.rotation.z=Math.atan2(n.dir.y,n.dir.x)+Math.PI})}),c.jsx(c.Fragment,{children:a.map((o,r)=>c.jsx("mesh",{ref:n=>{s.current[r]=n},material:o,children:c.jsx("planeGeometry",{args:[1.8,.025]})},r))})}const Re=`
uniform float uOff;
uniform float uLen;
attribute float aEnd;
void main(){
  vec3 p = position;
  // Las líneas viven en un tubo de 30 unidades delante de la cámara y se reciclan solas
  p.z = -mod(position.z - uOff * 1.6, 30.0) - 1.0 + aEnd * uLen;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`,Ce=`
uniform float uAlpha;
void main(){ gl_FragColor = vec4(0.95, 0.9, 1.0, uAlpha); }`;function Pe({count:e}){const{camera:s}=C(),t=l.useRef(null),a=l.useRef({y:0,v:0}),o=l.useMemo(()=>{const n=new Float32Array(e*6),i=new Float32Array(e*2);for(let m=0;m<e;m++){const h=Math.random()*Math.PI*2,y=1.6+Math.random()*5,P=Math.cos(h)*y*1.4,S=Math.sin(h)*y,p=Math.random()*30;n.set([P,S,p,P,S,p],m*6),i.set([0,1],m*2)}const u=new D;return u.setAttribute("position",new w(n,3)),u.setAttribute("aEnd",new w(i,1)),u.boundingSphere=new oe(new R,50),u},[e]),r=l.useMemo(()=>new _({vertexShader:Re,fragmentShader:Ce,uniforms:{uOff:{value:0},uLen:{value:0},uAlpha:{value:0}},transparent:!0,depthWrite:!1,blending:V}),[]);return E((n,i)=>{const u=Math.max(i,.001),m=Math.abs(scrollY-a.current.y)/u/innerHeight;a.current.y=scrollY,a.current.v+=(Math.min(m,6)-a.current.v)*(1-Math.pow(.02,u));const h=a.current.v;r.uniforms.uOff.value=s.position.z,r.uniforms.uLen.value=Math.min(h*1.6,5),r.uniforms.uAlpha.value=Math.min(Math.max(h-.4,0)*.35,.55),t.current?.position.set(s.position.x,s.position.y,s.position.z)}),c.jsx("lineSegments",{ref:t,geometry:o,material:r})}function je({mobile:e}){const{size:s}=C(),t=Math.min(1,Math.max(.45,s.width/s.height/1.6));return c.jsxs(c.Fragment,{children:[be.map((a,o)=>c.jsx(Ae,{spec:a,xScale:t},o)),c.jsx(ze,{}),c.jsx(Pe,{count:e?140:320})]})}const J=46,Q=4.6,G={top:{wide:{x:.24,y:0,s:1},narrow:{x:.06,y:-.3,s:.62},shape:-1},about:{wide:{x:.4,y:-.04,s:1.1},narrow:{x:.2,y:.3,s:.6},shape:2},journey:{wide:{x:.4,y:.12,s:.6},narrow:{x:.34,y:.36,s:.4},shape:0},contact:{wide:{x:.28,y:.02,s:1.05},narrow:{x:.3,y:.36,s:.42},shape:5}},H=Object.keys(G);function Te(e){return H.map(s=>{const t=document.getElementById(s);if(!t)return 0;const a=t.getBoundingClientRect();return Math.max(0,Math.min(a.bottom,e)-Math.max(a.top,0))/e})}const ke=`
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
}`,_e=`
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor, a * a * vAlpha);
}`;function Ee({count:e,poseRef:s}){const t=l.useMemo(()=>{const o=new D,r=Me.map(i=>i(e));o.setAttribute("position",new w(r[0],3)),r.slice(1).forEach((i,u)=>o.setAttribute(`p${u+1}`,new w(i,3)));const n=new Float32Array(e*4);for(let i=0;i<n.length;i++)n[i]=Math.random();return o.setAttribute("aRand",new w(n,4)),o.boundingSphere=new oe(new R,4),o},[e]),a=l.useMemo(()=>({uFrom:{value:0},uTo:{value:0},uT:{value:1},uTime:{value:0},uKick:{value:0},uSize:{value:30},uPixelRatio:{value:Math.min(devicePixelRatio,2)},uMouse:{value:new R(99,99,99)},uColorA:{value:new x(Y[0][0])},uColorB:{value:new x(Y[0][1])}}),[]);return c.jsx("points",{ref:s,geometry:t,children:c.jsx("shaderMaterial",{vertexShader:ke,fragmentShader:_e,uniforms:a,transparent:!0,depthWrite:!1,blending:V})})}function Ve({particles:e,stars:s}){const{camera:t,size:a,raycaster:o}=C(),r=l.useRef(null),n=l.useRef(new te),i=l.useRef({x:0,y:0,s:0}),u=l.useRef({to:0}),m=l.useMemo(()=>({plane:new le,hit:new R,n:new R,a:new x,b:new x}),[]),h=a.width>860,y=l.useMemo(()=>matchMedia("(hover: hover) and (pointer: fine)").matches,[]),P=l.useMemo(()=>{const p=new Float32Array(s*3),j=new Float32Array(s);for(let M=0;M<s;M++)p[M*3]=(Math.random()-.5)*18,p[M*3+1]=(Math.random()-.5)*12,p[M*3+2]=6-Math.random()*(J+12),j[M]=Math.random();const d=new D;return d.setAttribute("position",new w(p,3)),d.setAttribute("aScale",new w(j,1)),d},[s]),S=l.useMemo(()=>({uTime:{value:0},uPixelRatio:{value:Math.min(devicePixelRatio,2)}}),[]);return E((p,j)=>{const d=Math.min(j,.05),M=innerHeight,ne=Math.max(1,document.documentElement.scrollHeight-M),re=scrollY/ne;n.current.lerp(p.pointer,1-Math.pow(.001,d));const se=5-re*J;t.position.z+=(se-t.position.z)*(1-Math.pow(5e-4,d)),t.position.x=n.current.x*.25,t.position.y=n.current.y*.18,t.lookAt(t.position.x*.5,t.position.y*.5,t.position.z-10),S.uTime.value+=d;const B=Te(M),z=B.reduce((b,k)=>b+k,0);let I=0,L=0,T=0,W=0;B.forEach((b,k)=>{const N=G[H[k]][h?"wide":"narrow"];I+=N.x*b,L+=N.y*b,T+=N.s*b,b>B[W]&&(W=k)}),z>.001&&(I/=z,L/=z),T=z>.001?T/Math.max(z,1):0;const q=1-Math.pow(.004,d);i.current.x+=(I-i.current.x)*q,i.current.y+=(L-i.current.y)*q,i.current.s+=(T-i.current.s)*q;const f=r.current;if(!f)return;const v=f.material.uniforms,K=G[H[W]].shape,O=K<0?A.shape:K;O!==u.current.to&&(v.uFrom.value=v.uT.value>.5?u.current.to:v.uFrom.value,v.uTo.value=O,v.uT.value=0,u.current.to=O),v.uT.value=Math.min(1,v.uT.value+d/1.8),A.kick=Math.max(0,A.kick-d*1.2),v.uKick.value=A.kick*A.kick,v.uTime.value+=d;const X=Y[A.palette],$=1-Math.pow(.02,d);v.uColorA.value.lerp(m.a.set(X[0]),$),v.uColorB.value.lerp(m.b.set(X[1]),$);const U=2*Q*Math.tan(ee.degToRad(45/2)),Z=U*(a.width/a.height),ie=Math.min(1.1,Z/3.2,U/3);f.visible=i.current.s>.01,f.position.set(t.position.x*.5+i.current.x*Z,t.position.y*.5+i.current.y*U,t.position.z-Q),f.scale.setScalar(ie*i.current.s),f.rotation.y+=d*.18,f.rotation.x=.35+n.current.y*.3,f.rotation.z=n.current.x*.15,v.uSize.value=(h?34:26)*Math.max(.6,i.current.s),f.updateMatrixWorld(),o.setFromCamera(p.pointer,t),m.plane.setFromNormalAndCoplanarPoint(m.n.set(0,0,1),f.position),y&&o.ray.intersectPlane(m.plane,m.hit)&&v.uMouse.value.copy(f.worldToLocal(m.hit))}),c.jsxs(c.Fragment,{children:[c.jsx(je,{mobile:e<1e4}),c.jsx(Ee,{count:e,poseRef:r}),c.jsx("points",{geometry:P,children:c.jsx("shaderMaterial",{vertexShader:Be,fragmentShader:Ie,uniforms:S,transparent:!0,depthWrite:!1,blending:V})})]})}const Be=`
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
}`,Ie=`
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(1.0, 0.93, 0.86, smoothstep(0.5, 0.0, d) * vAlpha);
}`;function qe(){const[e,s]=l.useState(!0),t=l.useMemo(()=>matchMedia("(max-width: 860px), (pointer: coarse)").matches,[]),a=l.useMemo(()=>matchMedia("(prefers-reduced-motion: reduce)").matches,[]);return l.useEffect(()=>{const o=()=>{const r=document.getElementById("projects")?.getBoundingClientRect(),n=!!r&&r.top<=0&&r.bottom>=innerHeight;s(!document.hidden&&!n)};return o(),addEventListener("scroll",o,{passive:!0}),document.addEventListener("visibilitychange",o),()=>{removeEventListener("scroll",o),document.removeEventListener("visibilitychange",o)}},[]),c.jsx("div",{className:"world","aria-hidden":!0,children:c.jsx(ce,{frameloop:e?a?"demand":"always":"never",dpr:t?[1,1.5]:[1,2],camera:{position:[0,0,5],fov:45,near:.1,far:80},gl:{antialias:!1,alpha:!0,powerPreference:"high-performance"},eventSource:document.body,eventPrefix:"client",children:c.jsx(Ve,{particles:t?7e3:16e3,stars:t?700:1800})})})}export{qe as default};
