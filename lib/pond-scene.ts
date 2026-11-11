// The 3D world of 연못 마을: a pond, the grass around it with trees, rocks and flowers, and a camera that can look all the way round.
// Kept light on purpose. The far hills are one panorama picture wrapped around the village. The frogs are the app's own 3D frog,
// drawn once from eight directions and shown as the picture that matches where each frog faces and where the camera stands: the
// real model is about 35,000 triangles with layered materials, and a dozen of those would stall a phone.
// Where things are is decided by lib/village-map.ts (village units); this file only draws.
import * as THREE from 'three';
import {POND,LAND,hash01,type Point} from './village-map';

/** Village units per 3D unit. */
const S=24;
const toWorld=(p:Point)=>({x:(p.x-POND.cx)/S,z:(p.y-POND.cy)/S});
/** How many directions each frog is drawn from. */
export const FACES=8;
export type Picked={kind:'frog';id:string}|{kind:'pad';id:string}|{kind:'ground';point:Point}|null;
export type PondScene={
 /** Adds a frog. `boat` draws a small leaf boat instead, for a member who has no frog yet. */
 addFrog:(id:string,boat?:boolean)=>void;
 /** Gives a frog its picture from one direction (0 = facing the viewer, then every 45 degrees). */
 setFace:(id:string,face:number,picture:string)=>void;
 removeFrog:(id:string)=>void;
 place:(id:string,p:Point,moving:boolean,water:boolean)=>void;
 setPads:(pads:{id:string;x:number;y:number;faded:boolean}[])=>void;
 /** Lifts and brightens one pad ('pad:id') or nothing. */
 highlight:(key:string)=>void;
 follow:(p:Point)=>void;
 /** Turns the view around the player, in radians. */
 turn:(delta:number)=>void;
 yaw:()=>number;
 /** Where on the canvas (CSS pixels) the label of a frog is, or null when it is out of view. */
 labelAt:(id:string)=>{x:number;y:number;scale:number}|null;
 pick:(clientX:number,clientY:number)=>Picked;
 render:(seconds:number)=>void;
 resize:()=>void;
 dispose:()=>void;
};
type FrogNode={group:THREE.Group;body:THREE.Sprite|THREE.Mesh;rings:THREE.Mesh[];shade:THREE.Mesh;moving:boolean;water:boolean;phase:number;heading:number;faces:(THREE.Texture|null)[];face:number;last?:{x:number;z:number}};
type PadNode={group:THREE.Group;top:THREE.Mesh;phase:number;size:number};

const WATER_VERT=`varying vec2 vPos;void main(){vec4 w=modelMatrix*vec4(position,1.);vPos=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const WATER_FRAG=`uniform float t;varying vec2 vPos;
void main(){
 float edge=length(vPos/vec2(12.5,15.));
 vec3 c=mix(vec3(.30,.74,.80),vec3(.52,.85,.87),smoothstep(.2,1.,edge));
 float swell=sin(vPos.x*.42+t*.35)*sin(vPos.y*.5-t*.28);c+=swell*.022;
 float glint=sin(vPos.x*.9+sin(vPos.y*.45+t*.4)*1.6)*sin(vPos.y*1.7-t*.5);
 c+=smoothstep(.93,1.,glint)*.12;
 gl_FragColor=vec4(c,1.);
}`;
function softDisc(inner:string,outer:string){
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d')!;const grad=g.createRadialGradient(32,32,4,32,32,32);grad.addColorStop(0,inner);grad.addColorStop(1,outer);g.fillStyle=grad;g.fillRect(0,0,64,64);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function ellipse(rx:number,rz:number){const s=new THREE.Path();s.absellipse(0,0,rx,rz,0,Math.PI*2,false,0);return s;}

export function createPondScene(canvas:HTMLCanvasElement,opts:{panorama:string;reducedMotion:boolean}):PondScene{
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 const scene=new THREE.Scene();scene.background=new THREE.Color('#b4c6f0');
 const camera=new THREE.PerspectiveCamera(56,1,.1,200);
 const owned:{dispose:()=>void}[]=[];const keep=<T extends {dispose:()=>void}>(x:T)=>{owned.push(x);return x;};
 scene.add(new THREE.HemisphereLight('#ffffff','#cfe8b0',2.1));const sun=new THREE.DirectionalLight('#fff4dc',1.3);sun.position.set(6,12,4);scene.add(sun);

 // Far scenery: the panorama, mirrored side to side so it joins itself all the way round. Its top tenth is haze and is left out.
 const R=44,COPIES=4,H=R*(Math.PI*2/COPIES)/3*.9;
 const wall=new THREE.Mesh(keep(new THREE.CylinderGeometry(R,R,H,64,1,true,Math.PI*.75)),keep(new THREE.MeshBasicMaterial({color:'#b4c6f0',side:THREE.BackSide,fog:false})));
 wall.position.y=H*.5-H*.461;scene.add(wall);
 new THREE.TextureLoader().load(opts.panorama,t=>{t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.MirroredRepeatWrapping;t.repeat.set(COPIES,.9);t.anisotropy=4;keep(t);const m=wall.material as THREE.MeshBasicMaterial;m.map=t;m.color.set('#ffffff');m.needsUpdate=true;},undefined,()=>{});

 // The pond, a sandy rim, and the grass out to the far scenery.
 const PX=POND.rx/S,PZ=POND.ry/S,GROUND=.22;
 const waterMat=keep(new THREE.ShaderMaterial({uniforms:{t:{value:0}},vertexShader:WATER_VERT,fragmentShader:WATER_FRAG}));
 const water=new THREE.Mesh(keep(new THREE.CircleGeometry(1,64).rotateX(-Math.PI/2)),waterMat);water.scale.set(PX+.6,1,PZ+.6);scene.add(water);
 const flat=(shape:THREE.Shape,y:number,color:string)=>{const m=new THREE.Mesh(keep(new THREE.ShapeGeometry(shape,64).rotateX(Math.PI/2)),keep(new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide})));m.position.y=y;scene.add(m);return m;};
 const rim=new THREE.Shape();rim.absellipse(0,0,PX+1.1,PZ+1.1,0,Math.PI*2,false,0);rim.holes.push(ellipse(PX,PZ));flat(rim,GROUND-.08,'#ead9ae');
 const grass=new THREE.Shape();grass.absarc(0,0,R+2,0,Math.PI*2,false);grass.holes.push(ellipse(PX+.8,PZ+.8));flat(grass,GROUND,'#b5dc8f');
 const patchGeo=keep(new THREE.CircleGeometry(1,20).rotateX(-Math.PI/2));const patchMat=keep(new THREE.MeshLambertMaterial({color:'#c6e6a2'}));
 for(let i=0;i<14;i++){const a=hash01('patch'+i)*6.283,r=17+hash01('pr'+i)*20;const m=new THREE.Mesh(patchGeo,patchMat);m.position.set(Math.cos(a)*r,GROUND+.01,Math.sin(a)*r);m.scale.set(2+hash01('ps'+i)*3,1,1.4+hash01('pt'+i)*2);scene.add(m);}

 // Trees, bushes, rocks and flowers. The tall things stand outside where frogs can go, so nobody walks through a trunk.
 const ballGeo=keep(new THREE.SphereGeometry(1,14,10));const trunkGeo=keep(new THREE.CylinderGeometry(.22,.34,1,8));const rockGeo=keep(new THREE.DodecahedronGeometry(1,1));
 const mat=(c:string)=>keep(new THREE.MeshLambertMaterial({color:c}));
 const leaf=[mat('#a6dc82'),mat('#93d070'),mat('#b7e694')],blossom=[mat('#f7b7cd'),mat('#fbd0de')],bark=mat('#a57b55'),stone=[mat('#cfd3d6'),mat('#b9bec3')],bushM=mat('#86c766');
 const blob=softDisc('rgba(40,80,30,.30)','rgba(40,80,30,0)');keep(blob);const blobMat=keep(new THREE.MeshBasicMaterial({map:blob,transparent:true,depthWrite:false}));
 const shadowAt=(x:number,z:number,r:number)=>{const m=new THREE.Mesh(patchGeo,blobMat);m.position.set(x,GROUND+.02,z);m.scale.set(r,1,r*.8);m.renderOrder=1;scene.add(m);};
 const LX=LAND.rx/S,LZ=LAND.ry/S;const ring=(a:number,k:number)=>({x:Math.cos(a)*LX*k,z:Math.sin(a)*LZ*k});
 for(let i=0;i<16;i++){const a=i/16*6.283+hash01('ta'+i)*.25,{x,z}=ring(a,1.12+hash01('tk'+i)*.45),h=1.6+hash01('th'+i)*1.2,pink=i%5===2;
  const trunk=new THREE.Mesh(trunkGeo,bark);trunk.scale.y=h;trunk.position.set(x,GROUND+h/2,z);scene.add(trunk);shadowAt(x,z,2.4);
  for(let j=0;j<4;j++){const m=new THREE.Mesh(ballGeo,(pink?blossom:leaf)[j%(pink?2:3)]);const s=1.15+hash01(`ts${i}${j}`)*.6;m.scale.set(s,s*.86,s);m.position.set(x+(hash01(`tx${i}${j}`)-.5)*1.7,GROUND+h+.5+hash01(`ty${i}${j}`)*.9,z+(hash01(`tz${i}${j}`)-.5)*1.7);scene.add(m);}}
 for(let i=0;i<12;i++){const a=hash01('ra'+i)*6.283,{x,z}=ring(a,1.05+hash01('rk'+i)*.3),s=.5+hash01('rs'+i)*.7;const m=new THREE.Mesh(rockGeo,stone[i%2]);m.scale.set(s*1.3,s*.8,s);m.position.set(x,GROUND+s*.45,z);m.rotation.y=a;scene.add(m);shadowAt(x,z,s*1.8);}
 for(let i=0;i<10;i++){const a=hash01('ba'+i)*6.283,{x,z}=ring(a,1.08+hash01('bk'+i)*.5),s=.7+hash01('bs'+i)*.5;for(let j=0;j<3;j++){const m=new THREE.Mesh(ballGeo,bushM);m.scale.set(s,s*.7,s);m.position.set(x+(j-1)*s*.8,GROUND+s*.45,z+(hash01(`bz${i}${j}`)-.5)*.6);scene.add(m);}}
 const petalGeo=keep(new THREE.SphereGeometry(.11,10,8));
 const petalMat=keep(new THREE.MeshBasicMaterial({color:'#ffffff'}));const petalPink=keep(new THREE.MeshBasicMaterial({color:'#ffd3e0'}));const heartMat=keep(new THREE.MeshBasicMaterial({color:'#f6c94c'}));
 function flower(parent:THREE.Object3D,x:number,y:number,z:number,pink:boolean,size=1){for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const petal=new THREE.Mesh(petalGeo,pink?petalPink:petalMat);petal.position.set(x+Math.cos(a)*.14*size,y,z+Math.sin(a)*.14*size);petal.scale.set(size,.6*size,size);parent.add(petal);}
  const heart=new THREE.Mesh(petalGeo,heartMat);heart.position.set(x,y+.03,z);heart.scale.setScalar(.9*size);parent.add(heart);}
 // Flowers grow on the grass where frogs walk too; they are small enough to hop over.
 for(let i=0;i<46;i++){const a=hash01('fa'+i)*6.283,k=hash01('fk'+i),x=Math.cos(a)*(PX+1.6+k*(LX*1.4-PX)),z=Math.sin(a)*(PZ+1.6+k*(LZ*1.4-PZ));flower(scene,x,GROUND+.1,z,i%3===0,1.2);}

 // Shared pieces for every frog and pad.
 const ringGeo=keep(new THREE.RingGeometry(.86,1,40).rotateX(-Math.PI/2));
 const discGeo=keep(new THREE.CircleGeometry(1,24).rotateX(-Math.PI/2));
 const shadeTex=keep(softDisc('rgba(24,74,84,.42)','rgba(24,74,84,0)'));
 const shadeMat=keep(new THREE.MeshBasicMaterial({map:shadeTex,transparent:true,depthWrite:false}));
 const leafGeo=keep(new THREE.CircleGeometry(1,28,.3,Math.PI*2-.6).rotateX(-Math.PI/2));
 const rimMat=keep(new THREE.MeshBasicMaterial({color:'#6fae58'}));
 const veinMat=keep(new THREE.MeshBasicMaterial({color:'#7dbb5f'}));const veinGeo=keep(new THREE.PlaneGeometry(.035,.82).rotateX(-Math.PI/2));

 const frogs=new Map<string,FrogNode>();const pads=new Map<string,PadNode>();let lit='';
 const frogSize=3;
 function dropFrog(node:FrogNode){scene.remove(node.group);for(const t of node.faces)t?.dispose();for(const r of node.rings)(r.material as THREE.Material).dispose();(node.body.material as THREE.Material).dispose();}

 const ray=new THREE.Raycaster();const ndc=new THREE.Vector2();const v=new THREE.Vector3();const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 const focus=new THREE.Vector3(0,0,4);const eye=new THREE.Vector3();let first=true;let yaw=0;
 function resize(){const w=canvas.clientWidth||1,h=canvas.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;
  // A narrow (portrait) screen gets a wider lens so a few neighbours always fit across.
  camera.fov=w/h<.8?62:w/h<1.3?54:44;camera.updateProjectionMatrix();}
 resize();

 return {
  addFrog(id,boat){
   if(frogs.has(id))return;const group=new THREE.Group();
   const shade=new THREE.Mesh(discGeo,shadeMat);shade.scale.set(1.05,1,.7);shade.position.y=.012;shade.renderOrder=1;group.add(shade);
   const rings=[0,1].map(()=>{const m=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0,depthWrite:false}));m.position.y=.02;m.renderOrder=2;group.add(m);return m;});
   let body:THREE.Sprite|THREE.Mesh;
   if(boat){body=new THREE.Mesh(leafGeo,new THREE.MeshBasicMaterial({color:'#a9d67f'}));body.scale.setScalar(.62);body.position.y=.05;body.renderOrder=3;}
   else{body=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,alphaTest:.04,depthWrite:false,opacity:0}));body.scale.set(frogSize,frogSize,1);body.renderOrder=4;}
   body.userData.pick={kind:'frog',id};group.add(body);scene.add(group);
   frogs.set(id,{group,body,rings,shade,moving:false,water:true,phase:hash01(id)*6.28,heading:hash01(id+':face')*6.28,faces:Array(FACES).fill(null),face:-1});
  },
  setFace(id,face,picture){const node=frogs.get(id);if(!node||!(node.body instanceof THREE.Sprite))return;
   new THREE.TextureLoader().load(picture,t=>{if(frogs.get(id)!==node){t.dispose();return;}t.colorSpace=THREE.SRGBColorSpace;node.faces[face]?.dispose();node.faces[face]=t;node.face=-1;},undefined,()=>{});},
  removeFrog(id){const node=frogs.get(id);if(node){dropFrog(node);frogs.delete(id);}},
  place(id,p,moving,inWater){const node=frogs.get(id);if(!node)return;const w=toWorld(p);
   // A frog faces the way it is going, and keeps facing that way when it stops.
   if(node.last){const dx=w.x-node.last.x,dz=w.z-node.last.z;if(dx*dx+dz*dz>1e-5)node.heading=Math.atan2(dx,dz);}
   node.last=w;node.group.position.set(w.x,0,w.z);node.moving=moving;node.water=inWater;},
  setPads(list){
   const want=new Set(list.map(p=>p.id));for(const [id,node] of pads)if(!want.has(id)){scene.remove(node.group);(node.top.material as THREE.Material).dispose();pads.delete(id);}
   for(const p of list){let node=pads.get(p.id);
    if(!node){const group=new THREE.Group();const size=.95+hash01(p.id+':size')*.4;
     const edge=new THREE.Mesh(leafGeo,rimMat);edge.scale.setScalar(1.06);edge.position.y=.03;edge.renderOrder=2;group.add(edge);
     const top=new THREE.Mesh(leafGeo,new THREE.MeshBasicMaterial({color:'#9fd27a',transparent:true}));top.position.y=.045;top.renderOrder=3;top.userData.pick={kind:'pad',id:p.id};group.add(top);
     for(let i=0;i<5;i++){const vein=new THREE.Mesh(veinGeo,veinMat);vein.position.y=.05;vein.rotation.y=.9+i*1.05;vein.translateZ(-.45);vein.renderOrder=3;group.add(vein);}
     // A small flower marks the pad as a note someone left.
     flower(group,.42,.12,.18,hash01(p.id+':flower')<.5);
     group.rotation.y=hash01(p.id+':turn')*Math.PI*2;group.scale.setScalar(size);scene.add(group);node={group,top,phase:hash01(p.id)*6.28,size};pads.set(p.id,node);}
    const w=toWorld(p);node.group.position.set(w.x,0,w.z);(node.top.material as THREE.MeshBasicMaterial).opacity=p.faded?.5:1;}
  },
  highlight(key){lit=key;},
  follow(p){const w=toWorld(p);focus.set(w.x,0,w.z);if(first){first=false;eye.copy(focus);}},
  turn(delta){yaw=(yaw+delta)%(Math.PI*2);},
  yaw:()=>yaw,
  labelAt(id){
   const node=frogs.get(id);if(!node)return null;
   v.copy(node.group.position);v.y=node.water?frogSize*.56:GROUND+frogSize*.74;const dist=camera.position.distanceTo(v);v.project(camera);
   if(v.z>1||v.x<-1.15||v.x>1.15||v.y<-1.2||v.y>1.2)return null;
   return {x:(v.x+1)/2*canvas.clientWidth,y:(1-v.y)/2*canvas.clientHeight,scale:Math.max(.62,Math.min(1.05,13/dist))};
  },
  pick(clientX,clientY){
   const r=canvas.getBoundingClientRect();ndc.set((clientX-r.left)/r.width*2-1,-((clientY-r.top)/r.height*2-1));ray.setFromCamera(ndc,camera);
   const targets:THREE.Object3D[]=[];for(const f of frogs.values())targets.push(f.body);for(const p of pads.values())targets.push(p.top);
   const hit=ray.intersectObjects(targets,false).find(h=>h.object.userData.pick);if(hit)return hit.object.userData.pick as Picked;
   if(ray.ray.direction.y<-.02&&ray.ray.intersectPlane(plane,v))return {kind:'ground',point:{x:v.x*S+POND.cx,y:v.z*S+POND.cy}};
   return null;
  },
  render(seconds){
   waterMat.uniforms.t.value=opts.reducedMotion?0:seconds;
   // The camera glides after the player and circles them when the view is turned.
   const ease=opts.reducedMotion?1:.1;eye.lerp(focus,ease);const sx=Math.sin(yaw),cz=Math.cos(yaw);
   camera.position.set(eye.x+sx*10.5,7.4,eye.z+cz*10.5);camera.lookAt(eye.x-sx*3.5,1.5,eye.z-cz*3.5);
   for(const node of frogs.values()){
    const still=opts.reducedMotion;const bob=still?0:Math.sin(seconds*(node.moving?5:1.6)+node.phase)*(node.moving?.07:.04);
    const hop=still||!node.moving?0:Math.abs(Math.sin(seconds*7+node.phase))*.38;
    if(node.body instanceof THREE.Sprite){
     // In the water only the face shows; on the grass the whole frog stands and hops.
     const want=node.water?frogSize*.015+bob:GROUND+frogSize*.29+hop;node.body.position.y+=(want-node.body.position.y)*.25;
     // Which of the eight pictures: the way the frog faces, seen from where the camera is.
     const face=((Math.round((node.heading-yaw)/(Math.PI*2/FACES))%FACES)+FACES)%FACES;
     if(face!==node.face){const t=node.faces[face]??node.faces[0]??node.faces.find(Boolean);if(t){const m=node.body.material as THREE.SpriteMaterial;m.map=t;m.opacity=1;m.needsUpdate=true;if(node.faces[face])node.face=face;}}
    }else node.body.position.y=(node.water?.05:GROUND+.04)+bob*.5;
    node.shade.position.y=node.water?.012:GROUND+.03;node.shade.scale.set(node.water?1.05:.8-hop*.4,1,node.water?.7:.5-hop*.25);
    node.rings.forEach((ring,i)=>{const speed=node.moving?1.15:.38,k=still?.5:((seconds*speed+node.phase+i*.5)%1);
     const s=.75+k*(node.moving?1.5:.95);ring.scale.set(s,1,s*.72);(ring.material as THREE.MeshBasicMaterial).opacity=node.water?(1-k)*(node.moving?.7:.38):0;});
   }
   for(const [id,node] of pads){const on=lit==='pad:'+id;const bob=opts.reducedMotion?0:Math.sin(seconds*1.1+node.phase)*.025;
    node.group.position.y+=(((on?.16:0)+bob)-node.group.position.y)*.2;const s=node.size*(on?1.12:1);node.group.scale.x+=(s-node.group.scale.x)*.2;node.group.scale.z=node.group.scale.y=node.group.scale.x;
    (node.top.material as THREE.MeshBasicMaterial).color.set(on?'#bfe79b':'#9fd27a');}
   renderer.render(scene,camera);
  },
  resize,
  dispose(){for(const node of frogs.values())dropFrog(node);frogs.clear();for(const node of pads.values())(node.top.material as THREE.Material).dispose();pads.clear();for(const o of owned)o.dispose();renderer.dispose();renderer.forceContextLoss();},
 };
}
