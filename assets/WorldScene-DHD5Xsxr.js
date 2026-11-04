import{r as n,j as a,a as z,s as b}from"./index-c_yTkTiA.js";import{C as U,u as Y,k as I,l as y,m as Z,n as V,e as $,j as J,o as K}from"./react-three-fiber.esm-BT18h7Dj.js";const Q=`
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
}`,X=`
uniform float uTime;
uniform float uIntensity;
uniform vec2 uPointer;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
${Q}
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
}`,ee=`
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
}`,R=46,L=4.6,F={top:{wide:{x:.24,y:0,s:1},narrow:{x:.08,y:-.32,s:.62}},about:{wide:{x:.42,y:.32,s:.42},narrow:{x:.36,y:.38,s:.32}},journey:{wide:{x:.42,y:.3,s:0},narrow:{x:.36,y:.38,s:0}},contact:{wide:{x:.28,y:.02,s:1.05},narrow:{x:.3,y:.36,s:.42}}},D=Object.keys(F);function oe(u){return D.map(c=>{const e=document.getElementById(c);if(!e)return 0;const s=e.getBoundingClientRect();return Math.max(0,Math.min(s.bottom,u)-Math.max(s.top,0))/u})}function te({detail:u,stars:c}){const{camera:e,size:s}=Y(),l=n.useRef(null),r=n.useRef(new I),t=n.useRef({x:0,y:0,s:0}),H=s.width>860,v=n.useMemo(()=>({uTime:{value:0},uIntensity:{value:.22},uPointer:{value:new I},uColorA:{value:new y(z[0][0])},uColorB:{value:new y(z[0][1])},uColorC:{value:new y(z[0][2])}}),[]),d=n.useMemo(()=>[new y,new y,new y],[]),G=n.useMemo(()=>{const x=new Float32Array(c*3),w=new Float32Array(c);for(let i=0;i<c;i++)x[i*3]=(Math.random()-.5)*18,x[i*3+1]=(Math.random()-.5)*12,x[i*3+2]=6-Math.random()*(R+12),w[i]=Math.random();const o=new Z;return o.setAttribute("position",new V(x,3)),o.setAttribute("aScale",new V(w,1)),o},[c]),k=n.useMemo(()=>({uTime:{value:0},uPixelRatio:{value:Math.min(devicePixelRatio,2)}}),[]);return $((x,w)=>{const o=Math.min(w,.05),i=innerHeight,W=Math.max(1,document.documentElement.scrollHeight-i),M=scrollY/W;r.current.lerp(x.pointer,1-Math.pow(.001,o));const q=5-M*R;e.position.z+=(q-e.position.z)*(1-Math.pow(5e-4,o)),e.position.x=r.current.x*.25,e.position.y=r.current.y*.18,e.lookAt(e.position.x*.5,e.position.y*.5,e.position.z-10),k.uTime.value+=o;const B=oe(i),f=B.reduce((h,T)=>h+T,0);let C=0,j=0,g=0;B.forEach((h,T)=>{const _=F[D[T]][H?"wide":"narrow"];C+=_.x*h,j+=_.y*h,g+=_.s*h}),f>.001&&(C/=f,j/=f),g=f>.001?g/Math.max(f,1):0;const N=1-Math.pow(.004,o);t.current.x+=(C-t.current.x)*N,t.current.y+=(j-t.current.y)*N,t.current.s+=(g-t.current.s)*N;const S=2*L*Math.tan(J.degToRad(45/2)),E=S*(s.width/s.height),O=Math.min(1.15,E/3,S/2.9);b.kick=Math.max(0,b.kick-o*1.4);const p=b.kick,P=z[b.palette],A=1-Math.pow(.02,o);d[0].set(P[0]),d[1].set(P[1]),d[2].set(P[2]),v.uColorA.value.lerp(d[0],A),v.uColorB.value.lerp(d[1],A),v.uColorC.value.lerp(d[2],A),v.uTime.value+=o+p*o*3,v.uPointer.value.copy(r.current),v.uIntensity.value=.2+Math.abs(r.current.x)*.08+p*p*.35+M*.15;const m=l.current;m&&(m.visible=t.current.s>.01,m.position.set(e.position.x*.5+t.current.x*E,e.position.y*.5+t.current.y*S,e.position.z-L),m.scale.setScalar(O*t.current.s*(1-p*(1-p)*.5)),m.rotation.y+=o*(.12+p*2.2),m.rotation.x=r.current.y*.35+M*6,m.rotation.z=r.current.x*.2)}),a.jsxs(a.Fragment,{children:[a.jsxs("mesh",{ref:l,children:[a.jsx("icosahedronGeometry",{args:[1.25,u]}),a.jsx("shaderMaterial",{vertexShader:X,fragmentShader:ee,uniforms:v})]}),a.jsx("points",{geometry:G,children:a.jsx("shaderMaterial",{vertexShader:re,fragmentShader:ne,uniforms:k,transparent:!0,depthWrite:!1,blending:K})})]})}const re=`
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
}`,ne=`
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(1.0, 0.93, 0.86, smoothstep(0.5, 0.0, d) * vAlpha);
}`;function ce(){const[u,c]=n.useState(!0),e=n.useMemo(()=>matchMedia("(max-width: 860px), (pointer: coarse)").matches,[]),s=n.useMemo(()=>matchMedia("(prefers-reduced-motion: reduce)").matches,[]);return n.useEffect(()=>{const l=()=>{const r=document.getElementById("projects")?.getBoundingClientRect(),t=!!r&&r.top<=0&&r.bottom>=innerHeight;c(!document.hidden&&!t)};return l(),addEventListener("scroll",l,{passive:!0}),document.addEventListener("visibilitychange",l),()=>{removeEventListener("scroll",l),document.removeEventListener("visibilitychange",l)}},[]),a.jsx("div",{className:"world","aria-hidden":!0,children:a.jsx(U,{frameloop:u?s?"demand":"always":"never",dpr:e?[1,1.5]:[1,2],camera:{position:[0,0,5],fov:45,near:.1,far:80},gl:{antialias:!e,alpha:!0,powerPreference:"high-performance"},eventSource:document.body,eventPrefix:"client",children:a.jsx(te,{detail:e?24:48,stars:e?700:1800})})})}export{ce as default};
