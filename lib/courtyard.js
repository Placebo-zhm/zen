import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

// Seeded, entirely procedural garden: no image or model downloads at runtime.
export function createCourtyard(container) {
  let seed=72841;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const rand=(a,b)=>a+(b-a)*random(),pick=a=>a[Math.floor(random()*a.length)];
  const scene=new THREE.Scene();scene.background=new THREE.Color('#e8e4da');
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','可旋转、缩放的桃花庭院');container.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(34,1,.1,120);camera.position.set(19,17,23);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.6,0);
  controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=12;controls.maxDistance=48;
  controls.maxPolarAngle=Math.PI*.475;controls.minPolarAngle=.12;controls.panSpeed=.65;controls.rotateSpeed=.6;controls.zoomSpeed=.7;
  const sun=new THREE.DirectionalLight('#fff0d6',3);sun.position.set(-9,18,11);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:48});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;sun.shadow.radius=3;
  scene.add(sun,new THREE.HemisphereLight('#fff8ec','#828d78',2.1));
  const fill=new THREE.DirectionalLight('#d7e8ed',.8);fill.position.set(8,6,-8);scene.add(fill);
  const gradient=new THREE.DataTexture(new Uint8Array([108,171,218,255]),4,1,THREE.RedFormat);
  gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;
  const materials=new Map(),geometries=new Map();
  function mat(c){if(!materials.has(c))materials.set(c,new THREE.MeshToonMaterial({color:c,gradientMap:gradient}));return materials.get(c);}
  const C={plaster:'#eee9d9',wood:'#593f32',woodLight:'#82624b',roof:'#343e40',stone:'#89958b',darkStone:'#64776c'};
  const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.IcosahedronGeometry(1,1);
  function mesh(geo,color,parent=scene){const o=new THREE.Mesh(geo,typeof color==='string'?mat(color):color);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function box(x,y,z,w,h,d,c,parent=scene){const o=mesh(boxGeo,c,parent);o.position.set(x,y,z);o.scale.set(w,h,d);return o;}
  function ellipsoid(x,y,z,sx,sy,sz,c,parent=scene){const o=mesh(sphereGeo,c,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
  function cylinder(x,y,z,rt,rb,h,c,parent=scene,n=12){const key=`${rt},${rb},${h},${n}`;if(!geometries.has(key))geometries.set(key,new THREE.CylinderGeometry(rt,rb,h,n));const o=mesh(geometries.get(key),c,parent);o.position.set(x,y,z);return o;}
  function beam(a,b,r,c,parent=scene,r2=r){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=cylinder(0,0,0,r2,r,delta.length(),c,parent,8);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
  function curve(points,r,c,parent=scene){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,r,6,false),c,parent);}
  const edgeMat=new THREE.LineBasicMaterial({color:'#39453b',transparent:true,opacity:.25});
  function outline(o,threshold=35){o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,threshold),edgeMat));}

  // Single square plinth, with masonry courses and a soft receiving ground.
  box(0,-.66,0,14,.7,14,'#768476');box(0,-.28,0,14.12,.14,14.12,'#adb19a');
  box(0,-.79,0,14.16,.14,14.16,'#566558');box(0,-.14,0,13.94,.16,13.94,'#a4b184');
  const floor=mesh(new THREE.PlaneGeometry(200,200),'#e8e4da');floor.rotation.x=-Math.PI/2;floor.position.y=-.9;floor.castShadow=false;
  for(let i=0;i<28;i++){const k=-6.75+i*.5;box(k,-.51,7.005,.012,.32,.008,'#596e5f');box(7.005,-.51,k,.008,.32,.012,'#596e5f');}

  function pondRadius(a){return 1+.12*Math.sin(a*3+.7)+.055*Math.cos(a*5);}
  function pondPoint(a,s=1){const r=pondRadius(a)*s;return [2.75+Math.cos(a)*2.55*r,2.35+Math.sin(a)*2.05*r];}
  function inPond(x,z,pad=0){const dx=(x-2.75)/2.55,dz=(z-2.35)/2.05;return Math.hypot(dx,dz)<pondRadius(Math.atan2(dz,dx))+pad;}
  const pondShape=new THREE.Shape();for(let i=0;i<=96;i++){const [x,z]=pondPoint(i/96*Math.PI*2);if(i===0)pondShape.moveTo(x,-z);else pondShape.lineTo(x,-z);}
  const bed=mesh(new THREE.ShapeGeometry(pondShape),'#527e71');bed.rotation.x=-Math.PI/2;bed.position.y=.012;
  const waterUniforms={time:{value:0},color:{value:new THREE.Color('#86b9a5')}};
  const waterMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:waterUniforms,
    vertexShader:'varying vec3 vPos; void main(){vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float time; uniform vec3 color; varying vec3 vPos; void main(){vec2 p=vPos.xy;float w=sin(p.x*8.+p.y*3.+time*.55)*sin(p.y*11.-time*.38);float glint=pow(max(0.,sin(p.x*9.+p.y*6.+w*.5+time*.3)),28.);float soft=sin(p.x*1.3+p.y*1.4+time*.15)*.04;gl_FragColor=vec4(color+soft+glint*.075,.62);}'});
  const water=mesh(new THREE.ShapeGeometry(pondShape),waterMat);water.rotation.x=-Math.PI/2;water.position.y=.11;water.castShadow=false;water.receiveShadow=false;
  const reflectionShader={...Reflector.ReflectorShader,fragmentShader:Reflector.ReflectorShader.fragmentShader.replace('blendOverlay( base.rgb, color ), 1.0','blendOverlay( base.rgb, color ), 0.22')};
  const reflection=new Reflector(new THREE.ShapeGeometry(pondShape),{color:0x86a58e,textureWidth:512,textureHeight:512,clipBias:.003,multisample:0,shader:reflectionShader});
  reflection.rotation.x=-Math.PI/2;reflection.position.y=.12;reflection.material.transparent=true;reflection.material.depthWrite=false;reflection.renderOrder=2;scene.add(reflection);water.renderOrder=1;
  for(let i=0;i<52;i++){const a=i/52*Math.PI*2,[x,z]=pondPoint(a,1.035);const rock=ellipsoid(x,.1,z,rand(.21,.38),rand(.12,.23),rand(.2,.34),pick(['#879584','#9eab94','#758675']));rock.rotation.y=a;if(i%3===0)ellipsoid(x+.08,.24,z,.19,.035,.15,'#839958');}

  const route=new THREE.CatmullRomCurve3([[-2.7,.07,6.55],[-3.35,.07,4],[-1.7,.07,1.65],[-.6,.07,-.45],[-2,.07,-3],[-2.55,.07,-6.2]].map(p=>new THREE.Vector3(...p)));
  function paving(path,count,width=.62){for(let i=0;i<count;i++){const t=i/(count-1),p=path.getPointAt(t),tangent=path.getTangentAt(t),angle=Math.atan2(tangent.x,tangent.z);for(let j=-1;j<=1;j++){const o=box(p.x+j*Math.cos(angle)*width,p.y,p.z-j*Math.sin(angle)*width,width-.045,.12,rand(.46,.54),pick(['#b8bbae','#a8b1a4','#c4c5b6','#9eaa9e']));o.rotation.y=angle+rand(-.045,.045);outline(o);}}}
  paving(route,27,.54);paving(new THREE.CatmullRomCurve3([[-.65,.075,-.7],[1,.075,-1.45],[2.85,.075,-2.1]].map(p=>new THREE.Vector3(...p))),9,.46);

  // Curved hip roofs, tile rolls, seams, ridge caps, and rising eave corners.
  function roof(parent,width,depth,y,height){
    const eave=(u,v)=>y+height*Math.pow(1-v,.9)+.21*Math.pow(v,7)+.28*Math.pow(Math.abs(u),7)*Math.pow(v,5);
    const sides=[[[0,0],[-width/2,-depth/2],[width/2,-depth/2]],[[0,0],[width/2,-depth/2],[width/2,depth/2]],[[0,0],[width/2,depth/2],[-width/2,depth/2]],[[0,0],[-width/2,depth/2],[-width/2,-depth/2]]];
    sides.forEach(([top,left,right])=>{
      const point=(u,v)=>{const f=(u+1)/2;return [top[0]*(1-v)+(left[0]*(1-f)+right[0]*f)*v,eave(u,v),top[1]*(1-v)+(left[1]*(1-f)+right[1]*f)*v];};
      const vertices=[],indices=[];for(let j=0;j<=12;j++)for(let i=0;i<=24;i++)vertices.push(...point(i/12-1,j/12));
      for(let j=0;j<12;j++)for(let i=0;i<24;i++){const a=j*25+i;indices.push(a,a+25,a+1,a+1,a+25,a+26);}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
      const roofMat=mat(C.roof).clone();roofMat.side=THREE.DoubleSide;mesh(geo,roofMat,parent);
      for(let i=0;i<=24;i++){const u=i/12-1,points=[];for(let j=2;j<=12;j++){const p=point(u,j/12);p[1]+=.025;points.push(p);}curve(points,.027,i%3===0?'#718078':'#505d5a',parent);}
      for(let j=4;j<=12;j+=2){const points=[];for(let i=0;i<=24;i++){const p=point(i/12-1,j/12);p[1]+=.009;points.push(p);}curve(points,.013,'#78847a',parent);}
      curve(Array.from({length:13},(_,j)=>point(-1,j/12)),.074,'#7b8475',parent);
      curve(Array.from({length:25},(_,i)=>point(i/12-1,1)),.064,'#404c47',parent);
      const c=point(-1,1);curve([c,[c[0]*1.06,c[1]+.12,c[2]*1.06],[c[0]*1.09,c[1]+.29,c[2]*1.09]],.062,'#5b695e',parent);
    });
    cylinder(0,y+height+.12,0,.07,.16,.23,'#6a796a',parent);ellipsoid(0,y+height+.28,0,.11,.14,.11,'#748171',parent);
  }
  function wall(x,z,length,rotation=0,moon=false){
    const group=new THREE.Group();scene.add(group);group.position.set(x,0,z);group.rotation.y=rotation;const h=2.8;
    if(moon){
      const shape=new THREE.Shape();shape.moveTo(-length/2,0);shape.lineTo(length/2,0);shape.lineTo(length/2,h);shape.lineTo(-length/2,h);shape.closePath();
      const hole=new THREE.Path();hole.absarc(0,1.19,1.17,0,Math.PI*2,true);shape.holes.push(hole);
      const w=mesh(new THREE.ExtrudeGeometry(shape,{depth:.25,bevelEnabled:false,curveSegments:64}),C.plaster,group);w.position.z=-.125;
      const ring=mesh(new THREE.TorusGeometry(1.205,.08,8,72),C.darkStone,group);ring.position.set(0,1.19,.145);
      box(0,.04,0,2.15,.08,.65,'#a1a99a',group);
      for(const sign of [-1,1])box(sign*(length/4+.6),.19,0,length/2-1.2,.34,.3,'#9aa391',group);
    }else{box(0,h/2,0,length,h,.25,C.plaster,group);box(0,.19,0,length,.34,.30,'#9aa391',group);}
    box(0,h,0,length+.18,.13,.47,'#44534d',group);
    for(let i=0;i<Math.floor(length/.16);i++){const tx=-length/2+i*.16+.08;beam([tx,h+.055,-.32],[tx,h+.18,0],.058,'#626f63',group);beam([tx,h+.18,0],[tx,h+.055,.32],.058,'#55645b',group);}
    return group;
  }
  wall(-2.65,-6.23,7.9,0,true);wall(3.8,-6.23,4.7);wall(-6.45,-3.35,5.8,Math.PI/2);
  const windowGroup=new THREE.Group();windowGroup.position.set(-6.29,1.65,-3.5);windowGroup.rotation.y=Math.PI/2;scene.add(windowGroup);
  mesh(new THREE.CircleGeometry(.72,48),'#667b6e',windowGroup).position.z=.01;
  mesh(new THREE.TorusGeometry(.73,.06,8,48),C.darkStone,windowGroup);
  for(let k=-2;k<=2;k++){const x=k*.23,len=Math.sqrt(.7*.7-x*x)*2;box(x,0,.03,.035,len,.055,C.woodLight,windowGroup);box(0,x,.04,len,.035,.055,C.woodLight,windowGroup);}

  const pavilion=new THREE.Group();pavilion.position.set(3.6,0,-3.1);scene.add(pavilion);
  box(0,.13,0,3.95,.26,3.5,'#8b9686',pavilion);box(0,.3,0,3.75,.16,3.35,'#b8b9a6',pavilion);
  for(let i=0;i<14;i++)box(-1.73+i*.266,.408,0,.25,.075,3.12,'#8b7456',pavilion);
  for(let i=0;i<3;i++)box(0,.09+i*.1,2-i*.22,1.5,.16,.38,'#acb2a0',pavilion);
  for(const x of [-1.5,1.5])for(const z of [-1.22,1.22]){
    cylinder(x,.53,z,.19,.22,.27,'#8f9b8b',pavilion);cylinder(x,1.85,z,.102,.13,2.65,C.wood,pavilion);box(x,2.94,z,.35,.13,.3,C.woodLight,pavilion);
    for(const dx of [-1,1])beam([x,2.45,z],[x+dx*.48,2.93,z],.065,C.wood,pavilion);
    for(const dz of [-1,1])beam([x,2.45,z],[x,2.93,z+dz*.38],.065,C.wood,pavilion);
  }
  box(0,2.98,-1.22,3.4,.19,.18,C.wood,pavilion);box(0,2.98,1.22,3.4,.19,.18,C.wood,pavilion);
  box(-1.5,2.98,0,.18,.19,2.7,C.wood,pavilion);box(1.5,2.98,0,.18,.19,2.7,C.wood,pavilion);roof(pavilion,4.65,4.05,3.06,1.23);
  function rail(a,b,parent=scene){beam([a[0],.95,a[1]],[b[0],.95,b[1]],.055,C.woodLight,parent);beam([a[0],.57,a[1]],[b[0],.57,b[1]],.038,C.wood,parent);const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.32);for(let i=0;i<=n;i++){const t=i/n;box(a[0]+(b[0]-a[0])*t,.74,a[1]+(b[1]-a[1])*t,.048,.43,.048,C.wood,parent);}}
  rail([-1.5,-1.22],[1.5,-1.22],pavilion);rail([1.5,-1.22],[1.5,1.22],pavilion);rail([-1.5,-1.22],[-1.5,1.22],pavilion);box(0,.79,-1.08,2.75,.13,.38,C.woodLight,pavilion);
  const gallery=new THREE.Group();gallery.position.set(-4.88,0,-3);scene.add(gallery);box(0,.14,0,1.85,.28,4,'#a1aa96',gallery);
  for(const x of [-.65,.65])for(const z of [-1.6,0,1.6])cylinder(x,1.32,z,.065,.085,2.4,C.wood,gallery);
  for(const x of [-.65,.65])box(x,2.48,0,.13,.14,3.8,C.wood,gallery);roof(gallery,2.25,4.45,2.47,.6);rail([-.65,-1.6],[-.65,1.6],gallery);
  const lanterns=[];
  function lantern(x,y,z,parent){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);lanterns.push(g);beam([0,0,0],[0,-.25,0],.013,C.wood,g);ellipsoid(0,-.48,0,.2,.27,.2,'#dfaa77',g);cylinder(0,-.24,0,.14,.14,.045,C.wood,g);cylinder(0,-.72,0,.12,.12,.045,C.wood,g);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;curve([[Math.cos(a)*.12,-.25,Math.sin(a)*.12],[Math.cos(a)*.205,-.48,Math.sin(a)*.205],[Math.cos(a)*.12,-.71,Math.sin(a)*.12]],.009,'#a27652',g);}beam([0,-.75,0],[0,-.96,0],.016,'#ac6454',g);}
  lantern(-1.15,3,1.16,pavilion);lantern(1.15,3,1.16,pavilion);lantern(.55,2.42,.1,gallery);

  // Tapered twisting branches carry a layered, airy peach canopy.
  const tree=new THREE.Group();tree.position.set(-3.1,0,.65);scene.add(tree);const branchTips=[];
  function branch(points,r0,r1){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const g=new THREE.TubeGeometry(path,16,1,7,false),pos=g.attributes.position;for(let i=0;i<=16;i++){const center=path.getPointAt(i/16),r=r0+(r1-r0)*i/16;for(let j=0;j<=7;j++){const k=i*8+j,p=new THREE.Vector3().fromBufferAttribute(pos,k);p.sub(center).multiplyScalar(r).add(center);pos.setXYZ(k,p.x,p.y,p.z);}}g.computeVertexNormals();mesh(g,C.wood,tree);}
  branch([[0,0,0],[-.26,.8,.03],[-.12,1.65,.08],[.21,2.45,-.02],[.05,3.2,-.08]],.29,.095);
  for(let i=0;i<7;i++){const a=i*2.399,h=2.05+i*.17,reach=rand(1.3,2.15),dx=Math.cos(a)*reach,dz=Math.sin(a)*reach;branch([[.03,h*.68,0],[dx*.35,h,.15+dz*.3],[dx*.75,h+.45,dz*.7],[dx,h+.62,dz]],.13,.035);for(let j=0;j<5;j++){const aj=a+rand(-.95,.95),len=rand(.45,1),end=[dx+Math.cos(aj)*len,h+rand(.85,1.55),dz+Math.sin(aj)*len];branch([[dx*.68,h+.37,dz*.68],[dx,h+.65,dz],end],.043,.009);branchTips.push(end);}}
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;branch([[0,.28,0],[Math.cos(a)*.45,.09,Math.sin(a)*.45],[Math.cos(a)*.78,.015,Math.sin(a)*.78]],.1,.012);}
  const flowerParts=[];for(let i=0;i<5;i++){const a=i/5*Math.PI*2,g=new THREE.SphereGeometry(.033,5,3);g.scale(.85,.43,1.2);g.translate(Math.cos(a)*.035,0,Math.sin(a)*.035);flowerParts.push(g);}
  const flowerGeo=mergeGeometries(flowerParts);flowerParts.forEach(g=>g.dispose());
  const flowerMat=new THREE.MeshToonMaterial({color:'#ffffff',gradientMap:gradient,side:THREE.DoubleSide});
  const flowerCount=3500,flowers=new THREE.InstancedMesh(flowerGeo,flowerMat,flowerCount);flowers.castShadow=true;tree.add(flowers);
  const dummy=new THREE.Object3D(),blossomColors=['#f5bac8','#f9d9d9','#ffe5df','#e9a4b7','#f5c7d1'];
  for(let i=0;i<flowerCount;i++){const p=pick(branchTips),a=rand(0,Math.PI*2),r=Math.pow(random(),.5)*.69;dummy.position.set(p[0]+Math.cos(a)*r,p[1]+rand(-.36,.4),p[2]+Math.sin(a)*r);dummy.rotation.set(rand(-1.2,1.2),rand(0,6.28),rand(-1.2,1.2));dummy.scale.setScalar(rand(.9,1.75));dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);flowers.setColorAt(i,new THREE.Color(pick(blossomColors)));}
  for(const p of branchTips)for(let i=0;i<4;i++)ellipsoid(p[0]+rand(-.4,.4),p[1]+rand(-.2,.2),p[2]+rand(-.4,.4),rand(.22,.34),rand(.12,.19),rand(.22,.35),pick(blossomColors),tree);

  for(const [x,z,h,w]of [[5.25,.4,1.45,.6],[5.55,1.05,2.15,.52],[4.6,.15,1.05,.7],[5.9,1.9,.95,.5],[4.8,.65,.6,.65]]){const rock=ellipsoid(x,h*.45,z,w,h*.55,w*.65,pick(['#8a9687','#9ba392','#718675']));rock.rotation.set(rand(-.2,.2),rand(0,3),rand(-.22,.22));outline(rock,24);ellipsoid(x-.12,.14,z+.12,w*.83,.08,w*.6,'#769353');if(h>1.4){ellipsoid(x+.12,h*.65,z-.05,w*.72,.22,w*.85,'#97a28c');ellipsoid(x-.12,h*.86,z,.29,.18,.26,'#b0b5a0');}}
  const leafShape=new THREE.Shape();leafShape.moveTo(0,0);leafShape.quadraticCurveTo(.14,.22,0,.62);leafShape.quadraticCurveTo(-.11,.22,0,0);
  const leafGeo=new THREE.ShapeGeometry(leafShape),leafMat=mat('#5e8757').clone();leafMat.side=THREE.DoubleSide;const bamboos=[];
  for(const [cx,cz,n]of [[-5.6,-5.5,9],[5.75,-5.65,11],[-5.65,3,7]])for(let i=0;i<n;i++){const g=new THREE.Group();g.position.set(cx+rand(-.5,.5),0,cz+rand(-.45,.45));g.rotation.z=rand(-.09,.09);scene.add(g);bamboos.push(g);const h=rand(2.1,3.8);cylinder(0,h/2,0,.027,.048,h,pick(['#6c9258','#799c60','#4f7951']),g,7);for(let y=.3;y<h;y+=.36)cylinder(0,y,0,.049,.049,.025,'#a8b783',g,7);for(let j=0;j<5;j++){const a=rand(0,6.28),y=h-j*.32,tip=[Math.cos(a)*.65,y+.12,Math.sin(a)*.65];beam([0,y-.25,0],tip,.013,'#6b8f55',g);for(let k=0;k<6;k++){const leaf=mesh(leafGeo,leafMat,g),f=.22+k*.13;leaf.position.set(tip[0]*f,y-.18+f*.27,tip[2]*f);leaf.rotation.set(rand(-1.1,1.1),a+rand(-.4,.4),(k%2?1:-1)*rand(.65,1.6));leaf.scale.setScalar(rand(.6,.95));leaf.castShadow=false;}}}
  for(const [x,z,s]of [[-5.5,5.25,.7],[-4.8,4.4,.6],[-5.5,-.3,.5],[-.3,-5.6,.65],[.9,-5.7,.65],[6,-3,.4],[5.9,4.6,.65],[-4.9,1.8,.5]])for(let i=0;i<7;i++)ellipsoid(x+rand(-s,s),.19+rand(0,.23),z+rand(-s,s),rand(.22,.45),rand(.2,.4),rand(.22,.45),pick(['#69885a','#8fa164','#77975e']));
  const grassGeo=new THREE.ConeGeometry(.035,.26,3),grasses=new THREE.InstancedMesh(grassGeo,mat('#839763'),700);scene.add(grasses);const routePoints=route.getPoints(60);
  for(let i=0;i<700;i++){let x,z;do{x=rand(-6.5,6.5);z=rand(-6.3,6.5);}while(inPond(x,z,.12)||routePoints.some(p=>Math.hypot(x-p.x,z-p.z)<.92));dummy.position.set(x,.1,z);dummy.rotation.set(rand(-.3,.3),rand(0,6),rand(-.3,.3));dummy.scale.set(rand(.7,1.2),rand(.35,1.1),1);dummy.updateMatrix();grasses.setMatrixAt(i,dummy.matrix);}
  for(let i=0;i<55;i++){const x=rand(-6.4,6.3),z=rand(-5.8,6.3);if(!inPond(x,z,.13))ellipsoid(x,.016,z,rand(.07,.19),.025,rand(.06,.13),pick(['#bec3a5','#93a577','#afba8b']));}
  function stoneLantern(x,z){box(x,.09,z,.68,.18,.62,'#929e89');cylinder(x,.39,z,.12,.18,.55,'#a9b29b');box(x,.72,z,.5,.12,.5,'#a6ae98');box(x,.93,z,.36,.36,.36,'#657566');box(x,.94,z+.185,.18,.2,.008,'#e6c78f');box(x+.185,.94,z,.008,.2,.18,'#e6c78f');const cap=mesh(new THREE.ConeGeometry(.48,.26,4),'#8b9882');cap.position.set(x,1.24,z);cap.rotation.y=Math.PI/4;ellipsoid(x,1.44,z,.08,.105,.08,'#abb29b');}
  stoneLantern(-1.15,3.75);stoneLantern(5.65,3.4);
  cylinder(-3.85,.48,3.05,.22,.28,.8,'#9aa48d');cylinder(-3.85,.9,3.05,.67,.62,.15,'#bac1ab',scene,32);
  for(const a of [.1,2.3,4.3]){const x=-3.85+Math.cos(a)*1.05,z=3.05+Math.sin(a)*1.05;cylinder(x,.25,z,.24,.19,.45,'#a1ae94');cylinder(x,.5,z,.29,.26,.09,'#bdc3ad');}
  cylinder(-3.85,1.02,3.05,.1,.13,.14,'#698a7b');for(const a of [0,2,4])cylinder(-3.85+Math.cos(a)*.28,1.01,3.05+Math.sin(a)*.28,.05,.043,.065,'#e0dbc3');
  const bonsai=new THREE.Group();bonsai.position.set(1.15,.02,-3.5);scene.add(bonsai);box(0,.37,0,.48,.7,.48,'#9aa28d',bonsai);box(0,.75,0,.74,.1,.61,'#b2b6a1',bonsai);cylinder(0,.92,0,.36,.26,.25,'#74654d',bonsai);curve([[0,1,0],[.12,1.33,0],[-.1,1.6,.04],[.15,1.87,.01]],.046,C.wood,bonsai);for(const [x,y,z]of [[-.2,1.44,0],[.23,1.65,.05],[.08,1.88,0]])ellipsoid(x,y,z,.32,.14,.28,'#5e8455',bonsai);
  for(const [x,z,r]of [[3.7,3.35,.34],[4.15,3.05,.27],[1.15,2.05,.23],[3.6,3.9,.21],[1.7,3.6,.31]]){const pad=mesh(new THREE.CircleGeometry(r,32,.14,Math.PI*2-.3),'#6e9867');pad.rotation.x=-Math.PI/2;pad.position.set(x,.135,z);pad.castShadow=false;for(let j=0;j<6;j++){const a=j/6*Math.PI*2;beam([x,.143,z],[x+Math.cos(a)*r*.85,.143,z+Math.sin(a)*r*.85],.005,'#a0b67b');}}
  const fish=[];for(let i=0;i<5;i++){const g=new THREE.Group();scene.add(g);fish.push(g);ellipsoid(0,0,0,.095,.048,.28,i%2?'#e4c999':'#e78b56',g);ellipsoid(.012,.037,-.06,.067,.012,.092,'#f5e7c8',g);ellipsoid(-.006,.035,.105,.06,.013,.07,i%2?'#cf7447':'#e6d8b6',g);const tail=mesh(new THREE.ConeGeometry(.12,.19,3),'#d99e72',g);tail.rotation.x=Math.PI/2;tail.position.z=.31;tail.scale.z=.25;for(const sign of [-1,1]){const fin=ellipsoid(sign*.1,0,.03,.087,.012,.08,'#c6ae7d',g);fin.rotation.y=sign*.6;}g.userData={phase:i*1.256,radius:.58+i*.065,speed:.11+i*.008,tail};g.traverse(o=>{o.castShadow=false;});}
  const ripples=[];for(let i=0;i<7;i++){const ring=mesh(new THREE.RingGeometry(.96,1,64),new THREE.MeshBasicMaterial({color:'#d0e1c4',transparent:true,opacity:.15,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(2.75+rand(-1.3,1.4),.155,2.3+rand(-1.1,1.1));ring.castShadow=false;ring.userData.phase=i/7;ripples.push(ring);}

  // Sparse falling petals drift independently and linger after landing.
  const petalGeo=new THREE.SphereGeometry(1,5,3);petalGeo.scale(.047,.011,.027);
  const petalMat=new THREE.MeshToonMaterial({color:'#f3bfcc',gradientMap:gradient,side:THREE.DoubleSide});
  const petalCount=75,petals=new THREE.InstancedMesh(petalGeo,petalMat,petalCount);scene.add(petals);const falling=[];
  function resetPetal(p,initial=false){const tip=pick(branchTips);p.x=tip[0]-3.1+rand(-.6,.6);p.z=tip[2]+.65+rand(-.5,.5);p.y=initial?rand(.2,4.9):tip[1]+rand(-.1,.5);p.speed=rand(.14,.29);p.drift=rand(.035,.15);p.phase=rand(0,6.28);p.spin=rand(-.9,.9);p.age=0;p.landed=false;}
  for(let i=0;i<petalCount;i++){const p={};resetPetal(p,true);falling.push(p);}
  const settled=new THREE.InstancedMesh(petalGeo,petalMat,200);scene.add(settled);
  for(let i=0;i<200;i++){let x,z,y;if(i<135){const p=route.getPoint(rand(.08,.72));x=p.x+rand(-.8,.8);z=p.z+rand(-.28,.28);y=.142;}else if(i<177){const a=rand(0,6.28),[px,pz]=pondPoint(a,rand(.2,.85));x=px;z=pz;y=.157;}else{x=rand(2.2,4.9);z=rand(-4.1,-2);y=.451;}dummy.position.set(x,y,z);dummy.rotation.set(0,rand(0,6.28),0);dummy.scale.setScalar(rand(.6,1.1));dummy.updateMatrix();settled.setMatrixAt(i,dummy.matrix);}
  // Merge immobile parts by material, retaining independently animated groups.
  const animatedRoots=new Set([tree,...bamboos,...lanterns,...fish,...ripples,water,reflection]);
  scene.updateMatrixWorld(true);
  const batches=new Map();
  const discardedGeometry=new Set();
  for(const root of [tree,...bamboos,...lanterns]){
    const groups=new Map(),inverse=new THREE.Matrix4().copy(root.matrixWorld).invert();
    root.traverse(o=>{
      if(!o.isMesh||o.isInstancedMesh)return;
      const key=o.material.uuid+':'+o.castShadow;
      if(!groups.has(key))groups.set(key,{material:o.material,cast:o.castShadow,parts:[],objects:[]});
      const batch=groups.get(key),g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      g.deleteAttribute('uv');g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));batch.parts.push(g);batch.objects.push(o);
    });
    for(const batch of groups.values()){
      const g=mergeGeometries(batch.parts);batch.parts.forEach(p=>p.dispose());
      if(g){const o=new THREE.Mesh(g,batch.material);o.castShadow=batch.cast;o.receiveShadow=true;root.add(o);for(const old of batch.objects){discardedGeometry.add(old.geometry);old.removeFromParent();}}
    }
  }
  scene.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;
    let p=o;while(p){if(animatedRoots.has(p))return;p=p.parent;}
    const key=o.material.uuid+':'+o.castShadow+':'+o.receiveShadow;
    if(!batches.has(key))batches.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,parts:[],objects:[]});
    const batch=batches.get(key),g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
    g.deleteAttribute('uv');g.applyMatrix4(o.matrixWorld);batch.parts.push(g);batch.objects.push(o);
  });
  for(const batch of batches.values()){
    const g=mergeGeometries(batch.parts);batch.parts.forEach(p=>p.dispose());
    if(g){const o=new THREE.Mesh(g,batch.material);o.castShadow=batch.cast;o.receiveShadow=batch.receive;scene.add(o);for(const old of batch.objects){for(const child of [...old.children])scene.attach(child);old.removeFromParent();}}
  }
  let lastTime=performance.now();let frame=0,elapsed=0;
  function animate(){
    frame=requestAnimationFrame(animate);const now=performance.now(),dt=Math.min((now-lastTime)/1000,.05);lastTime=now;elapsed+=dt;const t=elapsed;
    controls.target.x=THREE.MathUtils.clamp(controls.target.x,-7,7);controls.target.z=THREE.MathUtils.clamp(controls.target.z,-7,7);controls.target.y=THREE.MathUtils.clamp(controls.target.y,-.1,5);controls.update();waterUniforms.time.value=t;
    tree.rotation.z=Math.sin(t*.46)*.007;tree.rotation.x=Math.sin(t*.31)*.005;
    bamboos.forEach((g,i)=>{g.rotation.z=Math.sin(t*.55+i*.8)*.025;g.rotation.x=Math.sin(t*.43+i)*.018;});
    lanterns.forEach((g,i)=>{g.rotation.z=Math.sin(t*.8+i)*.055;g.rotation.x=Math.sin(t*.56+i)*.026;});
    fish.forEach((g,i)=>{const p=g.userData,a=t*p.speed+p.phase;g.position.set(2.75+Math.cos(a)*1.85*p.radius,.069,2.35+Math.sin(a)*1.48*p.radius);g.rotation.y=Math.atan2(1.85*Math.sin(a),-1.48*Math.cos(a));p.tail.rotation.z=Math.sin(t*2.7+i)*.23;});
    ripples.forEach(r=>{const p=(t*.095+r.userData.phase)%1;r.scale.setScalar(.06+p*.55);r.material.opacity=Math.sin(p*Math.PI)*.17;});
    falling.forEach((p,i)=>{p.age+=dt;if(!p.landed){p.y-=p.speed*dt;p.x+=(p.drift+Math.sin(t*.8+p.phase)*.12)*dt;p.z+=Math.cos(t*.6+p.phase)*.11*dt;let ground=inPond(p.x,p.z)?.16:.145;if(p.x>1.75&&p.x<5.5&&p.z>-4.8&&p.z<-1.4)ground=.46;if(p.y<ground){p.y=ground;p.landed=true;p.age=0;}}else{if(inPond(p.x,p.z)){p.x+=dt*.02;p.z+=Math.sin(t*.5+p.phase)*dt*.015;}if(p.age>7)resetPetal(p);}dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.landed?0:t*p.spin,p.phase+t*.25,p.landed?0:Math.sin(t+p.phase));dummy.scale.setScalar(p.landed?Math.min(1,(7-p.age)*.5):1);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);});petals.instanceMatrix.needsUpdate=true;
    renderer.render(scene,camera);
  }
  function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(34)/2)*Math.max(1,1.2/camera.aspect)));camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function keydown(e){const offset=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')s.theta-=.12;else if(e.key==='ArrowRight')s.theta+=.12;else if(e.key==='ArrowUp')s.phi=Math.max(.12,s.phi-.1);else if(e.key==='ArrowDown')s.phi=Math.min(Math.PI*.475,s.phi+.1);else if(e.key==='+'||e.key==='=')s.radius=Math.max(12,s.radius*.92);else if(e.key==='-')s.radius=Math.min(48,s.radius*1.08);else return;e.preventDefault();camera.position.copy(new THREE.Vector3().setFromSpherical(s).add(controls.target));controls.update();}
  renderer.domElement.addEventListener('keydown',keydown);animate();
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();reflection.dispose();renderer.domElement.removeEventListener('keydown',keydown);const gs=new Set([boxGeo,sphereGeo,...geometries.values(),...discardedGeometry]),ms=new Set([...materials.values()]);for(const batch of batches.values())for(const o of batch.objects)gs.add(o.geometry);scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>ms.add(m));else ms.add(o.material);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());gradient.dispose();renderer.dispose();renderer.domElement.remove();};
}
