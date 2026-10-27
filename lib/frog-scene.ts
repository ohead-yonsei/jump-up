// Three.js clay frog. Loaded on demand by components/frog-3d.tsx so the first paint stays light.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {frogColors,type FrogColor,type CharacterGame} from './character';

export type FrogLook={color:FrogColor;equipped:CharacterGame['equipped']};
export type Reaction='jump'|'pat'|'hug'|'spin'|'cheer';
export type Framing='full'|'portrait'|'face'|'stage';
type V3=[number,number,number];
type Sdf=(x:number,y:number,z:number)=>number;
type Palette=typeof frogColors[number];
/** Where each hand should rest, in body space. Arms aim at these points. */
type Pose={l:V3;r:V3};
type Parts={head?:THREE.Object3D;body?:THREE.Object3D;pose?:Pose;sleeves?:THREE.Material};

/* ---------- clay shapes as signed distance fields ---------- */
const hyp=(x:number,y:number,z:number)=>Math.sqrt(x*x+y*y+z*z);
function ell(x:number,y:number,z:number,[cx,cy,cz]:V3,[rx,ry,rz]:V3){const px=x-cx,py=y-cy,pz=z-cz;const k0=hyp(px/rx,py/ry,pz/rz),k1=hyp(px/(rx*rx),py/(ry*ry),pz/(rz*rz));return k1===0?-Math.min(rx,ry,rz):k0*(k0-1)/k1;}
function smin(a:number,b:number,k:number){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;}
const ss=(a:number,b:number,x:number)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const EYE_BUMP:V3=[.41,.45,-.03];
const headSdf:Sdf=(x,y,z)=>{let d=ell(x,y,z,[0,.02,0],[.92,.55,.72]);d=smin(d,ell(x,y,z,[0,-.13,.1],[.84,.44,.66]),.22);d=smin(d,ell(x,y,z,[-EYE_BUMP[0],EYE_BUMP[1],EYE_BUMP[2]],[.34,.32,.32]),.13);return smin(d,ell(x,y,z,EYE_BUMP,[.34,.32,.32]),.13);};
const bodySdf:Sdf=(x,y,z)=>{let d=ell(x,y,z,[0,0,0],[.56,.5,.47]);d=smin(d,ell(x,y,z,[-.5,-.22,.08],[.33,.27,.36]),.1);return smin(d,ell(x,y,z,[.5,-.22,.08],[.33,.27,.36]),.1);};
const hoodSdf:Sdf=(x,y,z)=>smin(headSdf(x,y,z)-.1,ell(x,y,z,[0,-.42,-.16],[.66,.3,.52]),.22);
const shirtSdf:Sdf=(x,y,z)=>ell(x,y,z,[0,.53,0],[.61,.52,.52]);
function grad(f:Sdf,x:number,y:number,z:number){const e=.002;return new THREE.Vector3(f(x+e,y,z)-f(x-e,y,z),f(x,y+e,z)-f(x,y-e,z),f(x,y,z+e)-f(x,y,z-e)).normalize();}
/** Walks from a point inside the shape to its surface. */
function march(f:Sdf,o:THREE.Vector3,d:THREE.Vector3,max=2.5){let lo=0,hi=.04;while(f(o.x+d.x*hi,o.y+d.y*hi,o.z+d.z*hi)<0&&hi<max){lo=hi;hi+=.04;}for(let i=0;i<18;i++){const m=(lo+hi)/2;if(f(o.x+d.x*m,o.y+d.y*m,o.z+d.z*m)<0)lo=m;else hi=m;}return o.clone().addScaledVector(d,(lo+hi)/2);}
function surface(f:Sdf,from:V3,dir:V3){const p=march(f,new THREE.Vector3(...from),new THREE.Vector3(...dir).normalize());return {p,n:grad(f,p.x,p.y,p.z)};}
const onHead=(x:number,y:number)=>surface(headSdf,[x,y,0],[0,0,1]);
/** Shrink-wraps a sphere onto an SDF, which gives clay-like blends between the blobs. */
function blob(f:Sdf,origin:V3,w=112,h=84){
 const g=new THREE.SphereGeometry(1,w,h);const pos=g.attributes.position,nor=g.attributes.normal;const o=new THREE.Vector3(...origin),d=new THREE.Vector3();
 for(let i=0;i<pos.count;i++){d.fromBufferAttribute(pos,i).normalize();const p=march(f,o,d);pos.setXYZ(i,p.x,p.y,p.z);const n=grad(f,p.x,p.y,p.z);nor.setXYZ(i,n.x,n.y,n.z);}
 g.computeBoundingSphere();return g;
}
function cut(g:THREE.BufferGeometry,keep:(p:THREE.Vector3)=>boolean){
 const pos=g.attributes.position,idx=g.index!;const v=new THREE.Vector3();const ok=Array.from({length:pos.count},(_,i)=>keep(v.fromBufferAttribute(pos,i)));const next:number[]=[];
 for(let i=0;i<idx.count;i+=3){const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2);if(ok[a]&&ok[b]&&ok[c])next.push(a,b,c);}
 g.setIndex(next);return g;
}

/* ---------- shared geometry and textures (built once, reused by every stage) ---------- */
const shared=new WeakSet<object>();
const keep=<T extends object>(o:T)=>{shared.add(o);return o;};
const memo=new Map<string,unknown>();
function cached<T extends object>(key:string,make:()=>T):T{if(!memo.has(key))memo.set(key,keep(make()));return memo.get(key) as T;}
const headShape=()=>cached('head',()=>blob(headSdf,[0,0,0],128,96));
const bodyShape=()=>cached('body',()=>blob(bodySdf,[0,0,0],80,60));
function paint(base:THREE.BufferGeometry,key:string,color:(p:THREE.Vector3,c:THREE.Color)=>void){
 return cached(key,()=>{const g=base.clone();const pos=g.attributes.position;const arr=new Float32Array(pos.count*3);const p=new THREE.Vector3(),c=new THREE.Color();for(let i=0;i<pos.count;i++){color(p.fromBufferAttribute(pos,i),c);arr.set([c.r,c.g,c.b],i*3);}g.setAttribute('color',new THREE.BufferAttribute(arr,3));return g;});
}
function headGeometry(pal:Palette){
 const main=new THREE.Color(pal.main),light=new THREE.Color(pal.light),face=new THREE.Color(pal.face),blush=new THREE.Color('#f59a98');
 return paint(headShape(),'head-'+pal.id,(p,c)=>{
  c.copy(main).lerp(light,ss(.2,.75,p.y)*.35);
  const u=p.x/.84,v=(p.y+.16)/.48;c.lerp(face,(1-ss(.48,1.02,Math.sqrt(u*u+v*v)))*ss(-.1,.42,p.z));
  for(const s of [-1,1])c.lerp(blush,(1-ss(.1,.165,Math.hypot(p.x-s*.49,(p.y+.1)*1.1)))*ss(.15,.35,p.z)*.85);
  c.multiplyScalar(1-.2*ss(-.3,-.58,p.y));
 });
}
function bodyGeometry(pal:Palette){
 const main=new THREE.Color(pal.main),face=new THREE.Color(pal.face);
 return paint(bodyShape(),'body-'+pal.id,(p,c)=>{const u=p.x/.32,v=(p.y+.02)/.44;c.copy(main).lerp(face,(1-ss(.55,1,Math.sqrt(u*u+v*v)))*ss(.05,.35,p.z));c.multiplyScalar(1-.22*ss(.22,.48,p.y));});
}
function noiseNormal(size:number,strength:number,seed:number){
 let s=seed;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
 const h=new Float32Array(size*size).map(()=>rnd());
 for(let pass=0;pass<2;pass++)for(let i=0;i<h.length;i++){const x=i%size,y=(i/size)|0;h[i]=(h[i]*2+h[y*size+(x+1)%size]+h[((y+1)%size)*size+x])/4;}
 const data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x;const dx=(h[y*size+(x+1)%size]-h[y*size+(x-1+size)%size])*strength,dy=(h[((y+1)%size)*size+x]-h[((y-1+size)%size)*size+x])*strength;const n=new THREE.Vector3(-dx,-dy,1).normalize();data.set([(n.x*.5+.5)*255,(n.y*.5+.5)*255,(n.z*.5+.5)*255,255],i*4);}
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.needsUpdate=true;return t;
}
const fuzz=()=>cached('fuzz',()=>{const t=noiseNormal(128,3,7);t.repeat.set(5,5);return t;});
const fleece=()=>cached('fleece',()=>{const t=noiseNormal(128,7,11);t.repeat.set(9,9);return t;});
function canvasTexture(key:string,size:number,draw:(c:CanvasRenderingContext2D,s:number)=>void,repeat:[number,number]=[1,1]){
 return cached(key,()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=size;draw(canvas.getContext('2d')!,size);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);return t;});
}
const plaid=()=>canvasTexture('plaid',128,(c,s)=>{c.fillStyle='#eef1e4';c.fillRect(0,0,s,s);c.fillStyle='#9dba8a99';c.fillRect(0,s*.1,s,s*.3);c.fillRect(s*.1,0,s*.3,s);c.fillStyle='#7d9e6c66';c.fillRect(0,s*.65,s,s*.08);c.fillRect(s*.65,0,s*.08,s);},[4,3]);
const stripes=()=>canvasTexture('stripes',64,(c,s)=>{c.fillStyle='#ee9f96';c.fillRect(0,0,s,s);c.fillStyle='#f8dccf';c.fillRect(0,s*.42,s,s*.16);},[1,6]);
const cucumberFace=()=>canvasTexture('cucumber',128,(c,s)=>{const g=c.createRadialGradient(s/2,s/2,4,s/2,s/2,s/2);g.addColorStop(0,'#eef7cf');g.addColorStop(.72,'#cfe7a0');g.addColorStop(.82,'#9cc66b');g.addColorStop(1,'#4f8a37');c.fillStyle=g;c.fillRect(0,0,s,s);c.fillStyle='#b9d98c';for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.beginPath();c.ellipse(s/2+Math.cos(a)*s*.2,s/2+Math.sin(a)*s*.2,s*.035,s*.06,a,0,Math.PI*2);c.fill();}});
const shadowTexture=()=>canvasTexture('shadow',128,(c,s)=>{const g=c.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(58,78,36,.42)');g.addColorStop(.55,'rgba(58,78,36,.16)');g.addColorStop(1,'rgba(58,78,36,0)');c.fillStyle=g;c.fillRect(0,0,s,s);});

/* ---------- small construction helpers ---------- */
/** Smooth satin clay, like a soft vinyl figure. Fabric items opt into a fuzzy surface with `fluffy`. */
function clay(color:THREE.ColorRepresentation,o:THREE.MeshPhysicalMaterialParameters={}){return new THREE.MeshPhysicalMaterial({color,roughness:.56,sheen:.28,sheenRoughness:.6,sheenColor:new THREE.Color('#fffbef'),clearcoat:.14,clearcoatRoughness:.45,...o});}
const fluffy=(color:THREE.ColorRepresentation,o:THREE.MeshPhysicalMaterialParameters={})=>clay(color,{roughness:1,sheen:1,sheenRoughness:.8,clearcoat:0,normalMap:fleece(),normalScale:new THREE.Vector2(.55,.55),...o});
const glossy=(color:THREE.ColorRepresentation,o:THREE.MeshPhysicalMaterialParameters={})=>new THREE.MeshPhysicalMaterial({color,roughness:.28,clearcoat:.6,clearcoatRoughness:.3,...o});
const Z=new THREE.Vector3(0,0,1),Y=new THREE.Vector3(0,1,0);
function part(g:THREE.BufferGeometry,m:THREE.Material|THREE.Material[],p:V3|THREE.Vector3=[0,0,0],s:V3|number=1,r:V3=[0,0,0]){const o=new THREE.Mesh(g,m);if(Array.isArray(p))o.position.set(...p);else o.position.copy(p);if(typeof s==='number')o.scale.setScalar(s);else o.scale.set(...s);o.rotation.set(...r);return o;}
function at(o:THREE.Object3D,p:THREE.Vector3,n:THREE.Vector3,lift=0,axis=Z){o.position.copy(p).addScaledVector(n,lift);o.quaternion.setFromUnitVectors(axis,n);return o;}
function group(...children:THREE.Object3D[]){const g=new THREE.Group();if(children.length)g.add(...children);return g;}
const ball=(r=1,w=24,h=16)=>new THREE.SphereGeometry(r,w,h);
function surfaceTube(f:Sdf,pts:[number,number][],radius:number,m:THREE.Material,lift=.008){
 const path=pts.map(([x,y])=>{const {p,n}=surface(f,[x,y,0],[0,0,1]);return p.addScaledVector(n,lift);});
 const g=group(part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),28,radius,8,false),m));
 for(const e of [path[0],path[path.length-1]])g.add(part(ball(radius,10,8),m,e));
 return g;
}
function taperTube(points:V3[],radius:number,end:number,m:THREE.Material){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const seg=40,rad=16;const g=new THREE.TubeGeometry(curve,seg,radius,rad,false);const pos=g.attributes.position;const v=new THREE.Vector3();
 for(let i=0;i<=seg;i++){const c=curve.getPointAt(i/seg);const k=1+(end-1)*(i/seg);for(let j=0;j<=rad;j++){const n=i*(rad+1)+j;v.fromBufferAttribute(pos,n).sub(c).multiplyScalar(k).add(c);pos.setXYZ(n,v.x,v.y,v.z);}}
 g.computeVertexNormals();return part(g,m);
}
const arc=(cx:number,cy:number,w:number,h:number):[number,number][]=>Array.from({length:9},(_,i)=>{const a=i/8*Math.PI;return [cx-w*Math.cos(a),cy+h*Math.sin(a)];});

/* ---------- wardrobe ---------- */
const EYE_X=.25,EYE_Y=.04;
function hood(color:THREE.ColorRepresentation,fur:boolean,openW:number,openH:number){
 const shell=cached(`hood-${openW}`,()=>cut(blob(hoodSdf,[0,-.05,0],112,84),p=>!(p.z>.05&&(p.x/openW)**2+((p.y+.09)/openH)**2<1)&&p.y>-.66));
 const m=(fur?fluffy:clay)(color,{side:THREE.DoubleSide});
 const rim=Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2;return [Math.cos(a)*openW*.97,-.09+Math.sin(a)*openH*.97] as [number,number];});
 return group(part(shell,m),surfaceTube(hoodSdf,rim,fur?.075:.05,m,-.02));
}
function shirt(color:THREE.ColorRepresentation){return part(cached('shirt',()=>cut(blob(shirtSdf,[0,.53,0],80,60),p=>p.y>.17)),clay(color));}
function hairband(){const g=new THREE.Group();g.position.set(0,.33,0);g.rotation.x=.16;g.add(part(new THREE.TorusGeometry(1,.1,14,72),fluffy('#f5efe4'),[0,0,0],[.84,.68,1.1],[Math.PI/2,0,0]));return g;}
const builders:Record<string,(pal:Palette)=>Parts>={
 sprout:()=>{const {p}=surface(headSdf,[0,0,.02],[0,1,0]);const green=clay('#8ccb43',{roughness:.42,clearcoat:.3,clearcoatRoughness:.35});
  const g=group(taperTube([[0,-.04,0],[0,.08,.01],[-.008,.17,.005],[.005,.24,0]],.034,.6,green),part(ball(.021,14,10),green,[.005,.24,0]));
  for(const s of [-1,1]){const leaf=part(cached('sprout-leaf',()=>ball(1,32,20)),green,[s*.12,.31,0],[.15,.062,.07],[0,s*.12,s*.62]);g.add(leaf);}
  g.scale.setScalar(1.25);g.position.copy(p).y-=.04;g.rotation.z=.05;return {head:g};},
 daisy:()=>{const {p,n}=surface(headSdf,EYE_BUMP,[.4,.55,.75]);const petal=clay('#fffaf0'),g=new THREE.Group();for(let i=0;i<7;i++){const a=i/7*Math.PI*2;g.add(part(ball(),petal,[Math.cos(a)*.075,Math.sin(a)*.075,0],[.036,.072,.018],[0,0,a-Math.PI/2]));}g.add(part(ball(),clay('#f2c04c'),[0,0,.015],[.045,.045,.03]));return {head:at(g,p,n,.02)};},
 ribbon:()=>{const bow=new THREE.Group();const m=fluffy('#f7f1e6');bow.add(part(ball(),m,[-.14,0,0],[.16,.11,.06],[0,0,.45]),part(ball(),m,[.14,0,0],[.16,.11,.06],[0,0,-.45]),part(ball(),m,[0,0,.03],[.07,.065,.055]));bow.position.set(-.42,.55,.5);bow.rotation.set(-.3,-.25,.3);return {head:group(hairband(),bow)};},
 headphones:()=>{const cream=clay('#f1e9dc'),cup=clay('#e6dccb'),ring=clay('#cdbfa8');const g=group(part(new THREE.TorusGeometry(.95,.065,14,56,Math.PI),cream,[0,-.06,-.04],1,[-.12,0,0]));for(const s of [-1,1])g.add(part(new THREE.CylinderGeometry(.25,.25,.17,32),cup,[s*.97,.02,-.05],1,[0,0,Math.PI/2]),part(new THREE.TorusGeometry(.2,.05,12,32),ring,[s*1.06,.02,-.05],1,[0,Math.PI/2,0]));return {head:g};},
 bucket:()=>{const pts=[[0,.8],[.42,.78],[.68,.7],[.79,.52],[.83,.28],[.85,.2],[1.04,.13],[1.12,.08],[1.06,.05],[.86,.12],[.8,.16]].map(([x,y])=>new THREE.Vector2(x,y));const g=group(part(new THREE.LatheGeometry(pts,48),clay('#ecdcb4',{side:THREE.DoubleSide})),part(new THREE.TorusGeometry(.835,.045,10,48),clay('#b9a06a'),[0,.27,0],1,[Math.PI/2,0,0]));g.scale.set(1,1,.84);g.rotation.z=-.08;g.position.y=.06;return {head:g};},
 nightcap:()=>{const m=fluffy('#ffffff',{map:plaid(),normalScale:new THREE.Vector2(.25,.25)});const pts=[[.97,.1],[.96,.34],[.84,.62],[.58,.84],[.26,.95],[0,.97]].map(([x,y])=>new THREE.Vector2(x,y));const g=group(part(new THREE.LatheGeometry(pts,48),m),part(new THREE.TorusGeometry(.97,.085,12,48),fluffy('#f6f1e6'),[0,.12,0],1,[Math.PI/2,0,0]));const tail=taperTube([[0,.9,0],[.42,1.1,-.04],[.85,1,-.08],[1.08,.7,-.1]],.25,.3,m);tail.scale.set(1,1,1/.82);g.add(tail,part(ball(.13,20,14),fluffy('#fbf8f1'),[1.08,.66,-.12/.82]));g.scale.set(1,1,.82);g.position.y=.02;return {head:g};},
 fleece:()=>({head:hood('#f4eee2',true,.66,.5)}),
 dino:()=>{const green='#79a35a',spike=clay('#f3ecd6');const g=hood(green,false,.6,.47);
  for(let i=0;i<6;i++){const t=i/5;const a=.65+t*1.95;const {p,n}=surface(hoodSdf,[0,0,0],[0,Math.sin(a),Math.cos(a)]);g.add(at(part(new THREE.ConeGeometry(.08+.04*Math.sin(t*Math.PI),.19+.08*Math.sin(t*Math.PI),14),spike),p,n,.05,Y));}
  for(const s of [-1,1]){const {p,n}=surface(hoodSdf,[s*.3,.2,.1],[s*.15,.7,.7]);g.add(at(part(ball(.05,16,12),glossy('#1f2420')),p,n,.01));}
  const tail=new THREE.Group();tail.add(at(part(new THREE.ConeGeometry(.2,.62,22),clay(green)),new THREE.Vector3(-.3,.2,-.62),new THREE.Vector3(-.55,-.15,-.82).normalize(),0,Y));
  for(let i=0;i<3;i++)tail.add(part(new THREE.ConeGeometry(.05,.11,10),spike,[-.33-i*.11,.36-i*.05,-.62-i*.12],1,[-.5,0,.4]));
  return {head:g,body:tail};},
 crown:()=>{const geo=new THREE.CylinderGeometry(.27,.29,.24,60,4,true);const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const y=pos.getY(i);if(y>.1){const a=Math.atan2(pos.getZ(i),pos.getX(i));pos.setY(i,y+.1*Math.pow(Math.abs(Math.cos(a*2.5)),3));}}geo.computeVertexNormals();
  const gold=new THREE.MeshPhysicalMaterial({color:'#f3c85c',metalness:.55,roughness:.32,side:THREE.DoubleSide,clearcoat:.4});const g=group(part(geo,gold));
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2+Math.PI/10;g.add(part(ball(.034,14,10),gold,[Math.cos(a)*.27,.23,Math.sin(a)*.27]));}
  g.add(part(ball(.045,16,12),glossy('#9fcf86'),[0,.0,.29],[1,1,.6]));const {p}=surface(headSdf,[0,0,.05],[0,1,0]);g.position.copy(p).y+=.06;g.rotation.z=.1;return {head:g};},
 round:()=>{const frame=glossy('#8a5a33',{metalness:.3}),lens=new THREE.MeshPhysicalMaterial({color:'#eaf6ff',transparent:true,opacity:.18,roughness:.05});const g=new THREE.Group();const centers:THREE.Vector3[]=[];
  for(const s of [-1,1]){const {p,n}=onHead(s*EYE_X,EYE_Y);const c=p.clone().addScaledVector(n,.07);centers.push(c);g.add(at(part(new THREE.TorusGeometry(.145,.018,10,40),frame),c,n),at(part(new THREE.CircleGeometry(.14,32),lens),c,n,-.004),part(new THREE.CylinderGeometry(.014,.014,.2,8),frame,[c.x+s*.14,c.y+.01,c.z-.1],1,[Math.PI/2,0,-s*.25]));}
  g.add(part(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(centers[0].clone().setX(centers[0].x+.14),new THREE.Vector3(0,centers[0].y+.05,centers[0].z+.02),centers[1].clone().setX(centers[1].x-.14)),12,.016,8),frame));return {head:g};},
 sunglasses:()=>{const frame=glossy('#3c4642'),lens=new THREE.MeshPhysicalMaterial({color:'#2e3a37',roughness:.12,clearcoat:1,transparent:true,opacity:.93});const g=new THREE.Group();
  for(const s of [-1,1]){const {p,n}=onHead(s*EYE_X,EYE_Y);const c=p.clone().addScaledVector(n,.07);g.add(at(part(new THREE.CircleGeometry(.16,36),lens,[0,0,0],[1.12,.92,1]),c,n),at(part(new THREE.TorusGeometry(.16,.02,10,40),frame,[0,0,0],[1.12,.92,1]),c,n));}
  const {p}=onHead(0,EYE_Y+.03);g.add(part(new THREE.CylinderGeometry(.018,.018,.16,8),frame,[0,p.y,p.z+.08],1,[0,0,Math.PI/2]));return {head:g};},
 cucumber:()=>{const face=new THREE.MeshStandardMaterial({map:cucumberFace(),roughness:.55}),rind=clay('#5d8d3c');const g=new THREE.Group();for(const s of [-1,1]){const {p,n}=onHead(s*.49,-.1);g.add(at(part(new THREE.CylinderGeometry(.115,.115,.035,32),[rind,face,face]),p,n,.02,Y));}return {head:g};},
 scarf:()=>{const m=clay('#ffffff',{map:stripes()}),tail=clay('#ffffff',{map:stripes()});const g=group(part(new THREE.TorusGeometry(.5,.13,16,56),m,[0,.82,.02],[1,.86,1],[Math.PI/2,0,0]),part(new THREE.CapsuleGeometry(.1,.32,6,16),tail,[.24,.6,.44],[1.3,1,.55],[-.22,0,.14]));for(let i=0;i<4;i++)g.add(part(new THREE.CylinderGeometry(.012,.012,.07,6),clay('#f3c4b8'),[.18+i*.04,.37,.5],1,[-.2,0,.14]));return {body:g};},
 hoodie:()=>{const mint='#8fc8b5',m=clay(mint);const g=group(shirt(mint),part(ball(),m,[0,.92,-.36],[.44,.2,.24]),part(new THREE.CapsuleGeometry(.07,.36,6,14),clay('#a6d6c5'),[0,.38,.5],[2.2,1,.45],[0,0,Math.PI/2]));for(const s of [-1,1])g.add(part(new THREE.CapsuleGeometry(.016,.16,4,8),clay('#f7f2e3'),[s*.09,.66,.5]));return {body:g,sleeves:m};},
 raincoat:()=>{const y='#f3cf55',m=clay(y);const g=group(shirt(y));for(const s of [-1,1])g.add(part(ball(),clay('#f7dc7c'),[s*.13,.8,.42],[.19,.1,.05],[.4,s*.3,s*-.5]));for(const by of [.64,.5,.36])g.add(part(ball(.03,12,10),glossy('#c19a33'),[0,by,.53-(.64-by)*.05]));return {body:g,sleeves:m};},
 blanket:()=>{const outer=[[.46,1],[.68,.88],[.86,.66],[.98,.42],[1.03,.2],[1.01,.05],[.95,0]],inner=[[.85,.03],[.88,.2],[.82,.42],[.67,.66],[.5,.86],[.42,.95]];const pts=[...outer,...inner,[.46,1]].map(([x,y])=>new THREE.Vector2(x,y));const gap=.42;
  const geo=new THREE.LatheGeometry(pts,90,gap,Math.PI*2-gap*2);const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const a=Math.atan2(pos.getX(i),pos.getZ(i)),y=pos.getY(i);const k=1+.06*Math.sin(a*7)*ss(.95,.15,y);pos.setXYZ(i,pos.getX(i)*k,y,pos.getZ(i)*k);}geo.computeVertexNormals();
  const m=fluffy('#f6efe3',{side:THREE.DoubleSide,normalMap:fuzz(),normalScale:new THREE.Vector2(.35,.35)});const g=group(part(geo,m),part(new THREE.TorusGeometry(.56,.16,16,48),m,[0,.84,-.04],[1,.9,1],[Math.PI/2,0,0]));
  const mid=[[.44,.97],[.62,.85],[.78,.66],[.9,.42],[.95,.2],[.93,.05]];
  for(const phi of [gap,Math.PI*2-gap])g.add(part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mid.map(([x,y])=>new THREE.Vector3(Math.sin(phi)*x,y,Math.cos(phi)*x))),24,.11,12),m));g.scale.set(1,1,.86);return {body:g};},
 mug:()=>{const cup=clay('#f3ecdf');return {body:group(part(new THREE.CylinderGeometry(.14,.13,.25,28),cup,[0,.5,.66]),part(new THREE.CircleGeometry(.125,28),clay('#8b5a3b'),[0,.615,.66],1,[-Math.PI/2,0,0]),part(new THREE.TorusGeometry(.07,.024,10,24),cup,[.165,.5,.66])),pose:{l:[-.2,.47,.66],r:[.2,.47,.66]}};},
 cookie:()=>{const g=group(part(new THREE.CylinderGeometry(.17,.17,.05,32),clay('#d59c5d',{roughness:.95}),[0,0,0],1,[Math.PI/2,0,0]));[[-.07,.05],[.06,.08],[.02,-.03],[-.08,-.07],[.09,-.06],[-.01,.11]].forEach(([x,y])=>g.add(part(ball(.022,10,8),clay('#4b2e22'),[x,y,.026],[1,1,.6])));g.position.set(0,.62,.76);return {body:g,pose:{l:[-.19,.5,.68],r:[.19,.5,.68]}};},
 coffee:()=>{const white=clay('#f7f3ec');const g=group(part(new THREE.CylinderGeometry(.12,.09,.34,24),white,[0,.17,0]),part(new THREE.CylinderGeometry(.118,.103,.12,24),clay('#9b6a43'),[0,.16,0]),part(new THREE.CylinderGeometry(.13,.125,.04,24),white,[0,.36,0]),part(new THREE.CylinderGeometry(.012,.012,.3,8),clay('#3f7d4f'),[.03,.48,0],1,[0,0,-.12]));g.position.set(.74,0,.5);return {body:g};},
 phone:()=>{const g=group(part(new RoundedBoxGeometry(.21,.38,.035,3,.03),clay('#9fc9b8')),part(ball(.025,12,8),glossy('#2b302e'),[-.05,.13,.02],[1,1,.4]));g.position.set(0,.68,.7);g.rotation.set(-.45,0,-.08);return {body:g,pose:{l:[-.12,.52,.68],r:[.12,.52,.68]}};},
 book:()=>{const cover=clay('#6f93c4'),paper=clay('#fbf7ec');const g=new THREE.Group();for(const s of [-1,1]){const half=group(part(new THREE.BoxGeometry(.27,.37,.02),cover,[s*.135,0,0]),part(new THREE.BoxGeometry(.25,.34,.03),paper,[s*.13,0,-.025]));half.rotation.y=-s*.32;g.add(half);}g.position.set(0,.56,.72);g.rotation.x=-.35;return {body:g,pose:{l:[-.28,.42,.62],r:[.28,.42,.62]}};},
 tablet:()=>{const g=group(part(new RoundedBoxGeometry(.5,.35,.03,3,.03),glossy('#3e4347')),part(ball(.02,10,8),glossy('#7d8487'),[0,.13,.017],[1,1,.4]));g.position.set(0,.56,.72);g.rotation.x=-.55;return {body:g,pose:{l:[-.28,.45,.64],r:[.28,.45,.64]}};},
 laptop:()=>{const metal=clay('#c3c6cd',{roughness:.45,sheen:.2}),wood=clay('#d9bc90'),cream=clay('#f7f4ea');
  const lid=group(part(new RoundedBoxGeometry(.7,.42,.03,3,.014),metal,[0,.21,0]),part(ball(),cream,[0,.22,.018],[.09,.058,.01]));for(const s of [-1,1])lid.add(part(ball(.032,12,8),cream,[s*.055,.275,.018],[1,1,.3]));lid.position.set(0,.345,1);lid.rotation.x=.2;
  const table=group(part(new RoundedBoxGeometry(.98,.05,.56,3,.02),wood,[0,.29,.82]));for(const x of [-.4,.4])for(const z of [.6,1.04])table.add(part(new THREE.CylinderGeometry(.03,.035,.27,10),wood,[x,.135,z]));
  return {body:group(table,part(new RoundedBoxGeometry(.7,.03,.46,3,.012),metal,[0,.33,.8]),part(new THREE.BoxGeometry(.58,.008,.22),clay('#8d9097'),[0,.348,.74]),lid),pose:{l:[-.16,.39,.7],r:[.16,.39,.7]}};},
 teddy:()=>{const fur=fluffy('#c99b6c',{normalScale:new THREE.Vector2(.35,.35)}),pale=clay('#f1dfc2'),ink=glossy('#2b2420');const g=group(part(ball(.19,24,16),fur,[0,-.12,0]),part(ball(.15,24,16),fur,[0,.12,0]),part(ball(.065,16,12),pale,[0,.09,.12],[1,.85,.7]),part(ball(.022,10,8),ink,[0,.11,.17]));for(const s of [-1,1])g.add(part(ball(.055,14,10),fur,[s*.1,.24,-.01]),part(ball(.016,10,8),ink,[s*.055,.16,.13]),part(ball(.06,14,10),fur,[s*.13,-.25,.08]));g.position.set(0,.55,.66);return {body:g,pose:{l:[-.23,.5,.6],r:[.23,.5,.6]}};},
};

/* ---------- the character rig ---------- */
const REST:Pose={l:[-.3,.29,.46],r:[.3,.29,.46]};
const ARMS_UP:Pose={l:[-.72,1.1,.4],r:[.72,1.1,.4]},ARMS_OPEN:Pose={l:[-.86,.7,.36],r:[.86,.7,.36]};
const REACH=.6;
class Frog{
 root=new THREE.Group();squash=new THREE.Group();neck=new THREE.Group();head=new THREE.Group();
 arms:THREE.Group[]=[];sleeves:THREE.Mesh[]=[];hands:THREE.Mesh[]=[];skin:THREE.MeshPhysicalMaterial;tinted:THREE.MeshPhysicalMaterial;
 headMesh:THREE.Mesh;bodyMesh:THREE.Mesh;itemGroups:THREE.Object3D[]=[];
 eyes:THREE.Object3D[]=[];happyEyes:THREE.Object3D;sleepyEyes:THREE.Object3D;winkEye:THREE.Object3D;smile:THREE.Object3D;openMouth:THREE.Object3D;oMouth:THREE.Object3D;
 pose:Pose=REST;expression='smile';
 constructor(look:FrogLook){
  const pal=palette(look.color);this.skin=clay('#ffffff',{vertexColors:true});this.tinted=clay(pal.main);
  this.bodyMesh=part(bodyGeometry(pal),this.skin,[0,.5,0]);this.headMesh=part(headGeometry(pal),this.skin);
  this.root.add(this.squash);this.squash.add(this.bodyMesh,this.neck);this.neck.position.set(0,.88,0);this.neck.add(this.head);this.head.position.set(0,.42,.03);this.head.add(this.headMesh);
  for(const s of [-1,1]){const arm=new THREE.Group();arm.position.set(s*.27,.86,.27);const sleeve=part(cached('arm',()=>new THREE.CapsuleGeometry(.1,.3,6,16)),this.tinted,[0,-.3,0]);const hand=part(cached('hand',()=>ball(.145,28,20)),this.tinted,[0,-.6,0],[1,.92,1.05]);arm.add(sleeve,hand);this.sleeves.push(sleeve);this.hands.push(hand);this.arms.push(arm);this.squash.add(arm);}
  const ink=glossy('#1f211c',{roughness:.12,clearcoat:1,clearcoatRoughness:.05}),line=new THREE.MeshStandardMaterial({color:'#2f2a22',roughness:.6}),sparkle=new THREE.MeshBasicMaterial({color:'#ffffff'});
  for(const s of [-1,1]){const {p,n}=onHead(s*EYE_X,EYE_Y);const eye=at(group(part(cached('eye',()=>ball(.062,24,16)),ink,[0,0,0],[1,1.1,.55]),part(cached('glint',()=>ball(.017,10,8)),sparkle,[.022,.026,.03])),p,n,.006);this.eyes.push(eye);this.head.add(eye);
   const {p:np,n:nn}=onHead(s*.042,-.035);this.head.add(at(part(cached('nostril',()=>ball(.014,10,8)),line,[0,0,0],[1,1,.5]),np,nn,.002));}
  this.happyEyes=group(surfaceTube(headSdf,arc(-EYE_X,EYE_Y-.015,.06,.045),.016,line),surfaceTube(headSdf,arc(EYE_X,EYE_Y-.015,.06,.045),.016,line));
  this.sleepyEyes=group(surfaceTube(headSdf,arc(-EYE_X,EYE_Y+.01,.06,-.035),.015,line),surfaceTube(headSdf,arc(EYE_X,EYE_Y+.01,.06,-.035),.015,line));
  this.winkEye=surfaceTube(headSdf,arc(-EYE_X,EYE_Y-.015,.06,.045),.016,line);
  this.smile=surfaceTube(headSdf,arc(0,-.085,.085,-.042),.016,line);
  const {p:mp,n:mn}=onHead(0,-.095);this.openMouth=at(group(part(new THREE.SphereGeometry(1,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2),clay('#6d3a33',{normalMap:null,sheen:0}),[0,0,0],[.085,.07,.04]),part(ball(),clay('#f08f8a',{normalMap:null}),[0,-.04,.012],[.045,.022,.02])),mp,mn,-.004);
  const {p:op,n:on}=onHead(0,-.11);this.oMouth=at(part(new THREE.TorusGeometry(.03,.013,8,20),line),op,on,.004);
  this.head.add(this.happyEyes,this.sleepyEyes,this.winkEye,this.smile,this.openMouth,this.oMouth);
  this.setLook(look);
 }
 setLook(look:FrogLook){
  const pal=palette(look.color);this.bodyMesh.geometry=bodyGeometry(pal);this.headMesh.geometry=headGeometry(pal);this.tinted.color.set(pal.main);
  for(const g of this.itemGroups){g.parent?.remove(g);release(g);}this.itemGroups=[];this.pose=REST;let sleeve:THREE.Material=this.tinted;
  for(const id of Object.values(look.equipped)){const build=id&&builders[id];if(!build)continue;const parts=build(pal);
   if(parts.head){this.head.add(parts.head);this.itemGroups.push(parts.head);}if(parts.body){this.squash.add(parts.body);this.itemGroups.push(parts.body);}if(parts.pose)this.pose=parts.pose;if(parts.sleeves)sleeve=parts.sleeves;}
  for(const s of this.sleeves)s.material=sleeve;
  this.expression=look.equipped.face??'smile';this.express(this.expression);
 }
 express(kind:string,blink=false){
  const open=['smile','surprise'].includes(kind)||kind==='wink';
  this.eyes.forEach((e,i)=>{e.visible=open&&!(kind==='wink'&&i===0);e.scale.set(kind==='surprise'?1.3:1,blink?.12:kind==='surprise'?1.3:1,1);});
  this.happyEyes.visible=kind==='happy'||kind==='joy';this.sleepyEyes.visible=kind==='sleepy';this.winkEye.visible=kind==='wink';
  this.smile.visible=['smile','wink','sleepy','happy'].includes(kind);this.openMouth.visible=kind==='joy';this.oMouth.visible=kind==='surprise';
 }
 /** Points an arm at a hand target and stretches it a little so the hand lands there. */
 reach(i:number,t:THREE.Vector3){const arm=this.arms[i];const d=t.clone().sub(arm.position);const r=Math.min(.8,Math.max(.5,d.length()));d.normalize();
  arm.rotation.set(Math.atan2(-d.z,-d.y),0,Math.asin(Math.max(-1,Math.min(1,d.x))));const sleeve=this.sleeves[i];sleeve.scale.y=(r-.1)/(REACH-.1);sleeve.position.y=-r/2;this.hands[i].position.y=-r;}
 dispose(){this.root.traverse(o=>release(o,false));}
}
function release(o:THREE.Object3D,deep=true){
 const free=(x:THREE.Object3D)=>{const m=x as THREE.Mesh;if(!m.isMesh)return;if(!shared.has(m.geometry))m.geometry.dispose();for(const mat of ([] as THREE.Material[]).concat(m.material))if(!shared.has(mat))mat.dispose();};
 if(deep)o.traverse(free);else free(o);
}
const palette=(color:FrogColor)=>frogColors.find(c=>c.id===color)??frogColors[0];

/* ---------- stage: renderer, lights, camera, animation and touch ---------- */
const FRAMES:Record<Framing,{target:V3;dist:number}>={full:{target:[0,1.02,0],dist:6.4},stage:{target:[0,1.36,0],dist:8.5},portrait:{target:[0,1.1,0],dist:5.2},face:{target:[0,1.36,0],dist:4.1}};
function makeScene(renderer:THREE.WebGLRenderer){
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=.92;renderer.setClearColor(0x000000,0);
 const scene=new THREE.Scene();const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.4;pmrem.dispose();
 scene.add(new THREE.HemisphereLight('#fffaf0','#b9c98e',.75));const key=new THREE.DirectionalLight('#fff4e2',1.45);key.position.set(-2.5,4,5);const rim=new THREE.DirectionalLight('#ffffff',1.1);rim.position.set(3,2.5,-4);const fill=new THREE.DirectionalLight('#f3fbff',.45);fill.position.set(3,1,3);scene.add(key,rim,fill);
 const shadow=part(new THREE.PlaneGeometry(2.6,1.5),new THREE.MeshBasicMaterial({map:shadowTexture(),transparent:true,depthWrite:false}),[0,.003,.12],1,[-Math.PI/2,0,0]);scene.add(shadow);
 return {scene,shadow};
}
function frame(camera:THREE.PerspectiveCamera,framing:Framing,aspect:number){const f=FRAMES[framing];camera.aspect=aspect;camera.fov=30;const fit=aspect<.9?.9/aspect:1;camera.position.set(f.target[0],f.target[1]+.18,f.dist*fit);camera.lookAt(...f.target);camera.updateProjectionMatrix();}
const ease=(t:number)=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const spring=(t:number)=>1-Math.exp(-6*t)*Math.cos(12*t);

export type StageOptions={look:FrogLook;framing?:Framing;interactive?:boolean;reducedMotion?:boolean;onReact?:(kind:Reaction,x:number,y:number)=>void};
export type FrogStage={setLook:(look:FrogLook)=>void;react:(kind:Reaction)=>void;turn:(delta:number)=>void;setFraming:(f:Framing)=>void;dispose:()=>void};
export function createFrogStage(canvas:HTMLCanvasElement,opts:StageOptions):FrogStage{
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
 const {scene,shadow}=makeScene(renderer);const camera=new THREE.PerspectiveCamera(30,1,.1,40);let framing=opts.framing??'full';
 let frog=new Frog(opts.look);scene.add(frog.root);
 const motion=opts.reducedMotion?.25:1;const clock=new THREE.Clock();let raf=0,visible=true,running=false;
 const st={turn:0,vel:0,dragging:false,idleAt:0,action:null as null|{kind:Reaction;t:number},blinkAt:2,look:new THREE.Vector2(),aim:new THREE.Vector2(),handL:new THREE.Vector3(...REST.l),handR:new THREE.Vector3(...REST.r)};
 function resize(){const w=canvas.clientWidth||1,h=canvas.clientHeight||1;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(w,h,false);frame(camera,framing,w/h);}
 function react(kind:Reaction){st.action={kind,t:0};if(kind==='spin')st.turn=st.turn%(Math.PI*2);}
 function tick(){
  raf=requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  let jumpY=0,sy=1+Math.sin(t*2.3)*.012*motion,sxz=1-Math.sin(t*2.3)*.006*motion,headZ=Math.sin(t*.9)*.03*motion,headX=0,expr=frog.expression;
  let poseL=frog.pose.l,poseR=frog.pose.r,spin=0;const free=frog.pose===REST;
  const a=st.action;
  if(a){a.t+=dt;const T=a.t;
   if(a.kind==='jump'||a.kind==='cheer'){const hops=a.kind==='cheer'?2:1,len=.82,k=T%len,n=Math.floor(T/len);if(n>=hops)st.action=null;else{expr='joy';
     if(k<.14){const q=k/.14;sy=1-.18*q;sxz=1+.1*q;}else if(k<.52){const q=(k-.14)/.38;jumpY=Math.sin(q*Math.PI)*.5*motion;sy=1+.12*(1-q);sxz=1-.05*(1-q);if(free){poseL=ARMS_UP.l;poseR=ARMS_UP.r;}}else{const q=(k-.52)/.3;const s=spring(q);sy=1-.14*(1-s);sxz=1+.08*(1-s);}}}
   else if(a.kind==='pat'){if(T>1)st.action=null;else{expr='happy';headZ+=Math.sin(T*18)*.1*(1-T)*motion;sy=1-.06*Math.sin(Math.min(1,T*4)*Math.PI);}}
   else if(a.kind==='hug'){if(T>1.7)st.action=null;else{expr='happy';const q=(T<.3?ease(T/.3):T>1.35?1-ease((T-1.35)/.35):1)*(free?1:0);const mix=(a:V3,b:V3):V3=>[a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q,a[2]+(b[2]-a[2])*q];poseL=mix(poseL,ARMS_OPEN.l);poseR=mix(poseR,ARMS_OPEN.r);headZ+=Math.sin(T*6)*.06*q;}}
   else if(a.kind==='spin'){if(T>1.1)st.action=null;else{expr='joy';spin=ease(Math.min(1,T/1))*Math.PI*2;jumpY=Math.sin(Math.min(1,T)*Math.PI)*.18*motion;}}
  }
  if(!a&&t>st.blinkAt){st.blinkAt=t+2.4+Math.random()*3;}
  const blink=!a&&t>st.blinkAt-.13&&['smile','wink','surprise'].includes(expr);
  frog.express(expr,blink);
  const sway=free?.018*motion:.006*motion;st.handL.lerp(new THREE.Vector3(poseL[0],poseL[1]+Math.sin(t*1.3)*sway,poseL[2]),.22);st.handR.lerp(new THREE.Vector3(poseR[0],poseR[1]+Math.sin(t*1.3+1)*sway,poseR[2]),.22);
  frog.reach(0,st.handL);frog.reach(1,st.handR);
  if(!st.dragging){st.turn+=st.vel;st.vel*=.92;if(performance.now()-st.idleAt>2200){const home=Math.round(st.turn/(Math.PI*2))*Math.PI*2;st.turn+=(home-st.turn)*.06;}}
  st.look.lerp(st.aim,.08);
  frog.root.rotation.y=st.turn+spin;frog.root.position.y=jumpY;frog.squash.scale.set(sxz,sy,sxz);
  frog.neck.rotation.set(-st.look.y*.18+headX,st.look.x*.4,headZ);
  shadow.scale.setScalar(1-jumpY*.6);(shadow.material as THREE.MeshBasicMaterial).opacity=1-jumpY;
  renderer.render(scene,camera);
 }
 function start(){if(running||!visible||document.hidden)return;running=true;clock.getDelta();raf=requestAnimationFrame(tick);}
 function stop(){running=false;cancelAnimationFrame(raf);}
 const ro=new ResizeObserver(()=>{resize();if(!running)renderer.render(scene,camera);});ro.observe(canvas);
 const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)start();else stop();});io.observe(canvas);
 const onVisibility=()=>document.hidden?stop():start();document.addEventListener('visibilitychange',onVisibility);
 // touch: drag to turn, tap to jump, tap the head to pat, long press to hug
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let down:null|{x:number;y:number;last:number;id:number;moved:boolean;long:boolean;timer:number}=null;
 const local=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();return new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);};
 function pointerDown(e:PointerEvent){if(down)return;down={x:e.clientX,y:e.clientY,last:e.clientX,id:e.pointerId,moved:false,long:false,timer:window.setTimeout(()=>{if(down&&!down.moved){down.long=true;react('hug');opts.onReact?.('hug',e.clientX,e.clientY);}},520)};st.vel=0;}
 function pointerMove(e:PointerEvent){const l=local(e);st.aim.set(Math.max(-1,Math.min(1,l.x)),Math.max(-1,Math.min(1,l.y-.2)));if(!down||e.pointerId!==down.id)return;const dx=e.clientX-down.x;
  if(!down.moved&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(e.clientY-down.y)){down.moved=true;st.dragging=true;canvas.setPointerCapture(e.pointerId);clearTimeout(down.timer);}
  if(down.moved){const step=(e.clientX-down.last)*.012;st.turn+=step;st.vel=step;st.idleAt=performance.now();}down.last=e.clientX;}
 function pointerUp(e:PointerEvent){if(!down||e.pointerId!==down.id)return;clearTimeout(down.timer);
  if(!down.moved&&!down.long&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<10){ndc.copy(local(e));ray.setFromCamera(ndc,camera);const kind:Reaction=ray.intersectObject(frog.headMesh,false).length?'pat':'jump';react(kind);opts.onReact?.(kind,e.clientX,e.clientY);}
  st.dragging=false;st.idleAt=performance.now();down=null;}
 const leave=()=>st.aim.set(0,0);
 if(opts.interactive!==false){canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('pointerleave',leave);}
 resize();start();
 return {
  setLook(look){frog.setLook(look);},react,
  turn(delta){st.turn+=delta;st.idleAt=performance.now();},
  setFraming(f){framing=f;resize();},
  dispose(){stop();ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',onVisibility);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('pointerleave',leave);
   frog.dispose();scene.environment?.dispose();renderer.dispose();renderer.forceContextLoss();frog=null!;},
 };
}

/* ---------- still renders for thumbnails, shared by every list on the page ---------- */
type StillOptions={framing?:Framing;size?:number;angle?:number};
let still:null|{renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.PerspectiveCamera;frog:Frog}=null;
const stills=new Map<string,string>();
const stillKey=(look:FrogLook,{framing='full',size=256,angle=-.32}:StillOptions)=>JSON.stringify([look.color,look.equipped,framing,size,angle]);
export function renderStill(look:FrogLook,opts:StillOptions={}){
 const {framing='full',size=256,angle=-.32}=opts;const key=stillKey(look,opts);const hit=stills.get(key);if(hit)return hit;
 if(!still){const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,canvas:document.createElement('canvas')});const {scene}=makeScene(renderer);const frog=new Frog(look);scene.add(frog.root);still={renderer,scene,camera:new THREE.PerspectiveCamera(30,1,.1,40),frog};}
 const {renderer,scene,camera,frog}=still;renderer.setPixelRatio(1);renderer.setSize(size,size,false);frame(camera,framing,1);
 frog.setLook(look);frog.root.rotation.y=angle;frog.reach(0,new THREE.Vector3(...frog.pose.l));frog.reach(1,new THREE.Vector3(...frog.pose.r));
 renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');stills.set(key,url);return url;
}
/** Renders thumbnails one at a time between frames so a long list never blocks touch input. */
const queue:{look:FrogLook;opts:StillOptions;done:(url:string)=>void;fail:()=>void}[]=[];let draining=false;
export function requestStill(look:FrogLook,opts:StillOptions={}):Promise<string>{
 const hit=stills.get(stillKey(look,opts));if(hit)return Promise.resolve(hit);
 return new Promise((done,fail)=>{queue.push({look,opts,done,fail:()=>fail(new Error('still'))});if(!draining){draining=true;setTimeout(drain,0);}});
}
function drain(){const job=queue.shift();if(!job){draining=false;return;}try{job.done(renderStill(job.look,job.opts));}catch{job.fail();}setTimeout(drain,16);}
