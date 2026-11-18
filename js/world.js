import { paintMaterial, paintMap } from './paint.js';
import * as THREE from 'three';
import { Reflector } from '../vendor/Reflector.js';
import { createTeaRoom } from './tea-room.js';
import { SETTINGS, SEASONS } from './config.js';
import { random, yieldFrame } from './textures.js';

export async function buildWorld(renderer, onProgress=()=>{}, onPreview=async()=>{}){
  const scene=new THREE.Scene();scene.background=new THREE.Color(SEASONS.autumn.sky);scene.fog=new THREE.Fog(SEASONS.autumn.fog,75,260);
  const root=new THREE.Group();scene.add(root);
  const hemi=new THREE.HemisphereLight(0xf8f3dd,0x7f8d76,2.6);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffedcb,2.1);sun.position.set(-36,64,35);sun.castShadow=true;sun.shadow.mapSize.set(SETTINGS.shadowSize,SETTINGS.shadowSize);Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:150});sun.shadow.bias=-.0007;sun.shadow.normalBias=.04;sun.shadow.radius=5;sun.target.position.set(0,0,-8);scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight(0xb7cccf,.65);fill.position.set(25,20,-35);scene.add(fill);
  const mat=(color,kind='wash')=>paintMaterial(color,kind);
  const m={wood:mat(0xc3996c,'wood'),darkwood:mat(0x816043,'wood'),lightwood:mat(0xd4af79,'wood'),white:mat(0xffefdb,'plaster'),roof:mat(0x93a3a6,'roof'),roofEdge:mat(0x75898d,'roof'),stone:mat(0xbab6ad,'stone'),stoneLight:mat(0xd1c7b2,'stone'),red:mat(0xb58068,'wood'),metal:mat(0x665645),paper:mat(0xeee3bd,'plaster'),tatami:mat(0xc5c191,'tatami'),moss:mat(SEASONS.autumn.grass,'wash'),leaf:mat(SEASONS.autumn.canopy,'foliage'),leaf2:mat(SEASONS.autumn.secondary,'foliage'),pine:mat(0x929b77,'foliage'),bark:mat(0x997850,'wood'),gravel:mat(0xc4c5ae),snow:mat(0xeaf0e6),cloth:mat(0x768473),gold:mat(0xc3a879)};
  const geo={box:new THREE.BoxGeometry(1,1,1),sphere:new THREE.IcosahedronGeometry(1,innerWidth<650?2:3),rock:new THREE.DodecahedronGeometry(1,0),cylinder:new THREE.CylinderGeometry(1,1,1,8)};
  // Lobed crowns use a shared mesh: a softly irregular core and small overlapping
  // volumes on its outline, giving foliage real depth from any orbit angle.
  const foliagePositions=[],foliageNormals=[];
  const addLobe=(x,y,z,r,detail)=>{const g=new THREE.IcosahedronGeometry(r,detail);const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){foliagePositions.push(p.getX(i)+x,p.getY(i)+y,p.getZ(i)+z);foliageNormals.push(n.getX(i),n.getY(i),n.getZ(i));}g.dispose();};
  addLobe(0,0,0,.83,2);
  for(let i=0;i<(innerWidth<650?6:14);i++){const a=i*2.399,y=Math.sin(i*1.7)*.55,r=Math.sqrt(1-y*y);addLobe(Math.cos(a)*r*.76,y*.76,Math.sin(a)*r*.76,.28+(i%3)*.055,innerWidth<650?0:1);}
  geo.foliage=new THREE.BufferGeometry();geo.foliage.setAttribute('position',new THREE.Float32BufferAttribute(foliagePositions,3));geo.foliage.setAttribute('normal',new THREE.Float32BufferAttribute(foliageNormals,3));geo.foliage.computeBoundingSphere();
  for(let variant=0;variant<3;variant++){
    const points=[[-.49,-.36],[-.36,-.49],[.35,-.46],[.49,-.28],[.48,.34],[.32,.49],[-.36,.47],[-.49,.28]];
    const shape=new THREE.Shape();points.forEach(([x,y],i)=>{const px=x+Math.sin(i*3+variant)*.025,py=y+Math.cos(i*2+variant)*.025;i?shape.lineTo(px,py):shape.moveTo(px,py);});shape.closePath();
    const g=new THREE.ExtrudeGeometry(shape,{depth:.93,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.025,bevelThickness:.035});g.translate(0,0,-.465);geo['ashlar'+variant]=g;geo['paving'+variant]=g.clone().rotateX(Math.PI/2);
  }
  geo.ashlar=geo.ashlar0;
  const colliders=[],roofs=[],deciduous=[],snowMeshes=[],waterMeshes=[],reflectionMeshes=[];
  function mesh(g,material,x,y,z,sx=1,sy=1,sz=1,parent=root){const o=new THREE.Mesh(g,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function box(x,y,z,w,h,d,material=m.wood,parent=root,solid=false){const o=mesh(geo.box,material,x,y,z,w,h,d,parent);if(solid)colliders.push({min:[x-w/2,y-h/2,z-d/2],max:[x+w/2,y+h/2,z+d/2]});return o;}
  function beam(a,b,r,material=m.darkwood,parent=root){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dir=bv.clone().sub(av);const o=mesh(geo.cylinder,material,...av.clone().add(bv).multiplyScalar(.5).toArray(),r,dir.length(),r,parent);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return o;}
  function outline(o,threshold=40){const lines=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,threshold),new THREE.LineBasicMaterial({color:0x405044,transparent:true,opacity:.22}));o.add(lines);}
  const batches=new Map();
  function instance(kind,x,y,z,sx,sy,sz,rotation=0){if(!batches.has(kind))batches.set(kind,[]);batches.get(kind).push({x,y,z,sx,sy,sz,rotation});}
  function flush(){const dummy=new THREE.Object3D();for(const[k,items]of batches){if(!items.length)continue;const parts=k.split(':'),g=geo[parts[0]]||geo.box,ma=m[parts[1]]||m.stone;const o=new THREE.InstancedMesh(g,ma,items.length);items.forEach((a,i)=>{dummy.position.set(a.x,a.y,a.z);dummy.scale.set(a.sx,a.sy,a.sz);dummy.rotation.set(0,a.rotation,0);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);if(parts[1]==='stone'||parts[1]==='stoneLight'){const tint=(parts[1]==='stoneLight'?.92:.80)+(.5+.5*Math.sin(a.x*27.1+a.y*13.7+a.z*5.1))*(parts[1]==='stoneLight'?.16:.32);o.setColorAt(i,new THREE.Color().setRGB(tint,tint*(.98+.02*Math.cos(a.x)),tint*.96));}});o.castShadow=true;o.receiveShadow=true;root.add(o);}batches.clear();}
  function floor(x,z,w,d,y=5.2,material=m.wood){box(x,y-.15,z,w,.3,d,material);for(let xx=x-w/2+.6;xx<x+w/2;xx+=1.2){instance('box:darkwood',xx,y+.008,z,.018,.012,d);} }
  function roof(x,z,w,d,y,h=2.2,innerW=0,innerD=0){
    const group=new THREE.Group();root.add(group);roofs.push(group);
    const tileRandom=random(Math.round((x+50)*71+(z+80)*31+w*17));m.roofEdge.vertexColors=true;
    const iw=innerW/2,id=innerD/2,ow=w/2,od=d/2;
    const sides=[[[x-ow,z-od],[x+ow,z-od],[x+iw,z-id],[x-iw,z-id]],[[x+ow,z-od],[x+ow,z+od],[x+iw,z+id],[x+iw,z-id]],[[x+ow,z+od],[x-ow,z+od],[x-iw,z+id],[x+iw,z+id]],[[x-ow,z+od],[x-ow,z-od],[x-iw,z-id],[x-iw,z+id]]];
    sides.forEach((v,side)=>{const pos=[],uv=[],inds=[];const steps=6;for(let j=0;j<=steps;j++){const t=j/steps,yy=y+h*(1-Math.pow(1-t,1.6))+.13*Math.pow(1-t,9);for(let k=0;k<2;k++){const from=v[k],to=v[3-k];pos.push(THREE.MathUtils.lerp(from[0],to[0],t),yy,THREE.MathUtils.lerp(from[1],to[1],t));uv.push(k*(side%2?d:w)/3,t*2);}}for(let j=0;j<steps;j++){let a=j*2;inds.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(inds);g.computeVertexNormals();m.roof.side=THREE.DoubleSide;const o=new THREE.Mesh(g,m.roof);o.castShadow=true;o.receiveShadow=true;group.add(o);
      // Raised eaves and sparse tile seams retain a crisp roof silhouette.
      beam([v[0][0],y+.13,v[0][1]],[v[1][0],y+.13,v[1][1]],.10,m.roofEdge,group);
      const edgeLength=Math.hypot(v[1][0]-v[0][0],v[1][1]-v[0][1]);for(let q=0;q<=edgeLength;q+=.59+tileRandom()*.19){const a=q/edgeLength;const fx=THREE.MathUtils.lerp(v[0][0],v[1][0],a),fz=THREE.MathUtils.lerp(v[0][1],v[1][1],a),tx=THREE.MathUtils.lerp(v[3][0],v[2][0],a),tz=THREE.MathUtils.lerp(v[3][1],v[2][1],a);for(let j=0;j<3;j++){const t0=j/3,t1=(j+1)/3;if(tileRandom()<.055)continue;const seam=beam([THREE.MathUtils.lerp(fx,tx,t0),y+h*(1-(1-t0)**1.6)+.14,THREE.MathUtils.lerp(fz,tz,t0)],[THREE.MathUtils.lerp(fx,tx,t1),y+h*(1-(1-t1)**1.6)+.14,THREE.MathUtils.lerp(fz,tz,t1)],.012+tileRandom()*.014,m.roofEdge,group);const tint=.78+tileRandom()*.38;seam.userData.paintTint=[tint,tint,tint];}}
    });
    if(!innerW){beam([x-w*.22,y+h+.15,z],[x+w*.22,y+h+.15,z],.13,m.roofEdge,group);for(const sign of[-1,1]){beam([x+sign*w*.22,y+h+.15,z],[x+sign*w*.27,y+h+.6,z],.10,m.gold,group);}}
    return group;
  }
  function wall(x,z,w,h,d,y=5.2,material=m.white){return box(x,y+h/2,z,w,h,d,material,root,true);}
  function post(x,z,y=5.2,h=4){box(x,y+h/2,z,.28,h,.28,m.darkwood,root,true);box(x,y+.08,z,.5,.16,.5,m.stoneLight);}
  function screen(x,z,w,h=3,orientation='x',y=5.2){const group=new THREE.Group();group.position.set(x,y+h/2,z);if(orientation==='z')group.rotation.y=Math.PI/2;root.add(group);box(0,0,0,w,h,.07,m.paper,group);for(const side of[-1,1]){for(let xx=-w/2;xx<=w/2+.01;xx+=w/6)box(xx,0,side*.06,.035,h,.04,m.darkwood,group);for(let yy=-h/2;yy<=h/2+.01;yy+=h/4)box(0,yy,side*.06,w,.035,.04,m.darkwood,group);}return group;}
  function lantern(x,y,z,scale=1){const group=new THREE.Group();group.position.set(x,y,z);group.scale.setScalar(scale);root.add(group);box(0,.4,0,.65,.8,.65,m.paper,group);for(const a of[-.34,.34])for(const b of[-.34,.34])box(a,.4,b,.06,.9,.06,m.darkwood,group);box(0,.88,0,.85,.12,.85,m.roofEdge,group);box(0,-.1,0,.5,.2,.5,m.stone,group);return group;}
  function tatami(x,z,rotation=0){const group=new THREE.Group();group.position.set(x,5.24,z);group.rotation.y=rotation;root.add(group);box(0,0,0,1.8,.09,3.6,m.tatami,group);for(const sign of[-1,1])box(sign*.86,.055,0,.08,.015,3.6,m.cloth,group);}
  function table(x,z,w=2,d=1.2){box(x,5.8,z,w,.16,d,m.lightwood,root,true);for(const a of[-1,1])for(const b of[-1,1])box(x+a*(w/2-.15),5.47,z+b*(d/2-.15),.1,.5,.1,m.darkwood);}
  function tree(x,y,z,s=1,type='maple',seed=1){const r=random(seed),group=new THREE.Group();group.position.set(x,y,z);group.scale.setScalar(s);root.add(group);beam([0,0,0],[.3,3.8,0],.22,m.bark,group);const crowns=[];for(let i=0;i<7;i++){const angle=i*2.399,len=1.3+r()*1.5,top=2.8+r()*2.2;const dx=Math.cos(angle)*len,dz=Math.sin(angle)*len;beam([.1,1.4+i*.23,0],[dx,top,dz],.07+i*.005,m.bark,group);if(type==='pine'){const crown=mesh(geo.foliage,m.pine,dx,top+.35+(i%3)*.09,dz,1.52+.17*(.5+.5*Math.sin(i*3)),.50+.18*(.5+.5*Math.cos(i*2)),1.24+.18*(.5+.5*Math.sin(i*5)),group);crowns.push(crown);}else{const crown=mesh(geo.foliage,i%2?m.leaf:m.leaf2,dx,top+.3,dz,1.6+r()*.5,.7+r()*.3,1.3+r()*.5,group);crowns.push(crown);deciduous.push(crown);}}
    for(const crown of crowns){crown.material.vertexColors=true;const tint=.84+r()*.28;crown.userData.paintTint=[tint,tint*(.97+r()*.04),tint*.96];}
    const snow=mesh(geo.sphere,m.snow,0,.03,0,2.3,.07,1.9,group);snow.visible=false;snowMeshes.push(snow);
    return {group,crowns};
  }
  function water(x,y,z,w,d){
    const material=mat(0x99afb0,'water');material.transparent=true;material.opacity=.91;material.depthWrite=false;material.side=THREE.DoubleSide;
    material.uniforms={uTime:{value:0},uColor:{value:material.color}};
    const compile=material.onBeforeCompile;material.onBeforeCompile=shader=>{compile(shader);shader.uniforms.uTime=material.uniforms.uTime;shader.fragmentShader='uniform float uTime;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('vec3 pigment=', 'q.x+=sin(q.z*9.+uTime*.22)*.045; q.z+=sin(q.x*7.-uTime*.17)*.025; vec3 pigment=');};
    material.customProgramCacheKey=()=> 'panorama-water-v1';
    const g=new THREE.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);const o=mesh(g,material,x,y,z);o.castShadow=false;waterMeshes.push(o);return o;
  }
  onProgress('描绘远山与石垣');
  // Plateau and retaining stones.
  box(0,-1,-5,47,10,67,mat(0xb1afa3,'stone'));box(0,4.02,-5,45,.12,65,m.gravel);
  const stoneRandom=random(6801);
  for(let row=0;row<10;row++){
    for(let x=-23;x<23;){const w=Math.min(1.05+stoneRandom()*.7,23-x);instance('ashlar'+(row%3)+':stone',x+w/2,row*.8-3.6,28.6,w-.045, .76+stoneRandom()*.025,1.2,(stoneRandom()-.5)*.015);x+=w;}
    for(const sign of[-1,1])for(let z=-37;z<29;){const d=Math.min(1.0+stoneRandom()*.8,29-z);instance('ashlar'+(row%3)+':stone',sign*23.2,row*.8-3.6,z+d/2,1.2, .76+stoneRandom()*.025,d-.04,(stoneRandom()-.5)*.015);z+=d;}
  }
  box(0,-2.2,80,150,2,80,m.moss);box(-65,-6,-20,80,8,170,m.moss);box(65,-6,-20,80,8,170,m.moss);box(0,-3,-95,170,7,70,m.moss);
  const moat=new Reflector(new THREE.PlaneGeometry(100,13),{color:0xa3b7bb,textureWidth:innerWidth<650?256:512,textureHeight:innerWidth<650?256:512,clipBias:.003});
  moat.rotation.x=-Math.PI/2;moat.position.set(0,.895,35.7);root.add(moat);reflectionMeshes.push(moat);
  moat.material.uniforms.uTime={value:0};
  moat.material.fragmentShader='uniform float uTime;\n'+moat.material.fragmentShader;
  moat.material.fragmentShader=moat.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );', 'vec4 ripple=vUv; ripple.xy+=vec2(sin(vUv.y/vUv.w*53.+uTime*.2),cos(vUv.x/vUv.w*47.))*vUv.w*.004; vec4 base=texture2DProj(tDiffuse,ripple)*.5+texture2DProj(tDiffuse,ripple+vec4(.003*vUv.w,0.,0.,0.))*.25+texture2DProj(tDiffuse,ripple-vec4(.003*vUv.w,0.,0.,0.))*.25;');
  const moatWater=water(0,.91,35.7,100,13);moatWater.material.opacity=.58;

  for(let z=-34;z<27;z+=1.85)for(let x=-21.5;x<22;x+=2.35){const offset=Math.sin(x*2+z)*.12;instance('paving'+(Math.abs(Math.round(x+z))%3)+':stoneLight',x+offset+(Math.round(z/1.85)%2)*1.1,4.085,z,2.28,.045,1.79,offset*.22);}
  // Actual sloped approach; the camera follows this ridge at eye height.
  const ridge=[[38,22,68],[25,15,59],[10,7,48],[0,4,43]];
  ridge.forEach((p,i)=>{if(i===ridge.length-1)return;const q=ridge[i+1],dx=q[0]-p[0],dy=q[1]-p[1],dz=q[2]-p[2],dist=Math.hypot(dx,dz);const o=box((p[0]+q[0])/2,(p[1]+q[1])/2-.25,(p[2]+q[2])/2,5,.5,Math.hypot(dist,dy)+.3,m.gravel);o.rotation.order='YXZ';o.rotation.y=Math.atan2(dx,dz);o.rotation.x=-Math.atan2(dy,dist);
    // Terrain slopes away from the path; decorative rocks never intrude into it.
    const nx=dz/dist,nz=-dx/dist;for(const side of[-1,1]){const vertices=[p[0]+nx*2.5*side,p[1]-.35,p[2]+nz*2.5*side,q[0]+nx*2.5*side,q[1]-.35,q[2]+nz*2.5*side,p[0]+nx*15*side,-3,p[2]+nz*15*side,q[0]+nx*15*side,-3,q[2]+nz*15*side];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(side===1?[0,2,1,1,2,3]:[0,1,2,1,3,2]);g.computeVertexNormals();const ground=new THREE.Mesh(g,m.moss);ground.receiveShadow=true;root.add(ground);}
  });
  const mountainColors=[0xa4b6b4,0xb5c4be,0xc5cdba,0xd3d7c9];
  for(let row=0;row<4;row++){const material=mat(mountainColors[row],'mountain'),r=random(45+row*43);const shape=new THREE.Shape();shape.moveTo(-230,-30);for(let x=-230;x<=230;x+=1.5){const h=12+Math.sin(x*.027+row)*14+Math.sin(x*.062+row*2)*9+Math.sin(x*.13+row)*3;shape.lineTo(x,h+row*4+Math.sin(x*1.1)*.22+Math.sin(x*.43)*.27);}shape.lineTo(230,-30);shape.closePath();const mountain=mesh(new THREE.ShapeGeometry(shape),material,0,-3,-85-row*30);mountain.castShadow=false;}
  // Southern ridgelines also frame the final view out of the lookout.
  for(let row=0;row<3;row++){const shape=new THREE.Shape();shape.moveTo(-190,-30);for(let x=-190;x<=190;x+=4)shape.lineTo(x,9+row*8+Math.sin(x*.033+row)*13+Math.sin(x*.071)*5);shape.lineTo(190,-30);shape.closePath();const ma=mat(mountainColors[row+1],'mountain');ma.side=THREE.DoubleSide;const o=mesh(new THREE.ShapeGeometry(shape),ma,0,0,100+row*30);o.castShadow=false;}
  // Transparent patches contain only an isolated sky wash from the reference.
  // They live beyond the mountain layers, with no architecture baked into them.
  const cloudMat=new THREE.MeshBasicMaterial({map:paintMap('cloud'),transparent:true,opacity:.65,depthWrite:false,fog:false});
  for(const [x,y,z,w,h,angle]of[[-92,57,-205,105,26,-.07],[42,68,-220,140,28,.07],[130,55,-215,110,26,-.03]]){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),cloudMat);o.position.set(x,y,z);o.rotation.z=angle;root.add(o);}
  flush();await yieldFrame();
  onProgress('架起木桥与城门');
  // Bridge, railing and gateway, all with a clear central aisle.
  floor(0,36,4,16,4,m.darkwood);for(let z=28;z<=44;z+=.55)instance('box:lightwood',0,4.04,z,4,.08,.47);
  for(const sign of[-1,1]){for(let z=28;z<=44;z+=2)post(sign*2.1,z,4,1.05);box(sign*2.1,5.05,36,.14,.14,16,m.red);box(sign*2.1,4.55,36,.09,.1,16,m.red);}
  for(const x of[-3,3]){box(x,6,28,.65,4,.65,m.red,root,true);box(x*1.47,5.8,28,2.3,3.6,.4,m.red,root,true);for(const y of[4.4,6.8])box(x*1.47,y,28.25,2.4,.17,.14,m.metal);for(const y of[4.5,5.4,6.4])for(const xx of[-.65,.65])mesh(geo.sphere,m.metal,x*1.47+xx,y,28.25,.07,.07,.06);}
  box(0,8.2,28,12,.5,1.1,m.darkwood);roof(0,28,13,6,8.5,2.3);
  for(const sign of[-1,1]){wall(sign*15,28,16,2.4,.7,4);roof(sign*15,28,16.7,2.1,6.4,.8);}
  floor(-10,24,9,7,4);wall(-14.5,24,.35,3.2,7,4);wall(-10,20.5,9,3.2,.3,4);wall(-10,27.5,9,3.2,.3,4);roof(-10,24,10,8.2,7.3,1.5);for(let z=21;z<=27;z+=3)post(-5.6,z,4,3.3);lantern(-12,4.2,24,1);box(-11,4.5,22,2,.6,.8,m.wood);
  for(let z=13.5;z<25;z+=1.8){const o=mesh(geo.rock,m.stoneLight,.2*Math.sin(z),4.16,z,1.2,.14,.75);o.rotation.y=z;}
  tree(12,4,18,1.7,'maple',17);tree(-17,4,13,1.3,'pine',7);lantern(-4,4.2,17,1.1);lantern(4,4.2,17,1.1);
  for(let i=0;i<6;i++)box(0,4+(i+1)*.2-.1,12.8-i*.4,4.4,.2,.45,m.stoneLight);
  flush();await yieldFrame();
  onProgress('连接主殿、庭院与回廊');
  // U-shaped main hall. The courtyard is genuinely open to the sky.
  floor(0,7,30,8);floor(-10,-3,10,14);floor(10,-5,10,18);floor(0,-10.1,30,2.2);floor(10,-15,10,4);floor(-4.3,-4.4,1.4,11);floor(4.3,-4.4,1.4,11);
  wall(-8.5,11,13,3.7,.25);wall(8.5,11,13,3.7,.25);box(0,9.1,11,30,.55,.35,m.darkwood);
  wall(-15,-1.5,.25,3.7,25);wall(15,-3,.25,3.7,28);wall(-10,-10,10,3.7,.25);
  for(let x=-15;x<=15;x+=3){if(x!==0)post(x,11);if(x!==-9&&x!==0)post(x,3);}for(let z=-9;z<=3;z+=3){if(z!==0)post(-5,z);post(5,z);}
  for(const x of[-15,-5,5,15])box(x,9.15,-3,.3,.3,16,m.darkwood);
  box(0,9.2,3,30,.35,.35,m.darkwood);box(0,9.2,11,30,.35,.35,m.darkwood);
  roof(0,7,33,10,9.3,2.1,16,.1);roof(-6.1,-3,4.2,17,9.3,1.1,.1,10);roof(10,-4,12,20,9.3,2.2,.1,13);
  // Replace only the tea room's interior; the shared U-shaped hall stays connected.
  const tea=createTeaRoom(root,renderer,colliders);
  root.children.forEach(o=>{if(o.isMesh&&o.material===m.darkwood&&o.position.x<=-5&&o.position.x>=-15&&o.position.z>=-10&&o.position.z<=3){o.material=tea.materials.wood;o.castShadow=false;}});
  screen(-5,-7,3.5,3,'z');screen(-5,2.4,1.1,3,'z');
  // Study door at z=-7.5 and long view through to the same garden.
  screen(5,.2,3,3,'z');screen(5,-6,1.4,3,'z');screen(14.8,-4,3.5,3,'z');table(12,-3,2.6,1.5);box(12,5.42,-4.6,1,.15,.8,m.cloth);
  for(let y=5.6;y<8.8;y+=.8){box(13.8,y,-7,1.8,.1,.6,m.darkwood);for(let j=0;j<7;j++)box(13.1+j*.23,y+.25,-7,.16,.45,.4,j%3?m.paper:m.cloth);}
  for(let j=0;j<4;j++){const b=box(12+j*.04,5.96+j*.07,-3,.6,.06,.8,j%2?m.paper:m.cloth);b.rotation.y=j*.07;}
  // Armory opens from the study and into the rear passage.
  wall(7,-9,4,3.5,.2);wall(13.5,-9,3,3.5,.2);box(12.8,6.7,-12.8,.25,3,2.5,m.darkwood);for(let i=0;i<4;i++){beam([12.4,5.5,-13.6+i*.55],[12.4,8.2,-13.6+i*.55],.055,m.lightwood);mesh(new THREE.ConeGeometry(.12,.5,4),m.metal,12.4,8.4,-13.6+i*.55);}
  box(7.5,5.6,-12.5,1.5,.8,1.1,m.darkwood);mesh(geo.sphere,m.metal,7.5,6.3,-12.5,.65,.75,.4);mesh(geo.sphere,m.metal,7.5,7.2,-12.5,.4,.3,.35);lantern(13,5.3,-16,1);
  // Quiet inner garden, walkable raised perimeter and pond.
  box(0,4.98,-4.1,7.1,.4,10.3,m.moss);box(.4,5.13,-4,4.6,.1,5.5,m.stone);
  const pond=new Reflector(new THREE.PlaneGeometry(4.2,5.1),{color:0x6e978c,textureWidth:innerWidth<650?256:512,textureHeight:innerWidth<650?256:512,clipBias:.003});pond.rotation.x=-Math.PI/2;pond.position.set(.4,5.205,-4);root.add(pond);pond.material.uniforms.uTime={value:0};pond.material.fragmentShader=pond.material.fragmentShader.replace('void main() {','uniform float uTime;\nvoid main() {').replace('texture2DProj( tDiffuse, vUv )','texture2DProj( tDiffuse, vUv + vec4(sin(vUv.y * 19. + uTime * .3) * .0008, cos(vUv.x * 23. + uTime * .2) * .0007, 0., 0.) )');
  const pondWash=water(.4,5.215,-4,4.2,5.1);pondWash.material.opacity=.28;pondWash.material.color.setHex(0x9aafa9);
  const gardenTree=tree(1.6,5.2,-7,1.05,'maple',8);tree(-1.7,5.2,1.4,.6,'pine',88);
  // Clipped reflection proxy renders beneath the water, with subdued opacity.
  // The reflector uses the actual courtyard geometry, including seasonal foliage.
  for(let i=0;i<12;i++){const a=i*.63;mesh(geo.rock,m.stoneLight,.4+Math.cos(a)*2.6,5.2,-4+Math.sin(a)*3, .35+(i%3)*.1,.25,.4);}
  for(let i=0;i<3;i++){const fish=mesh(geo.sphere,mat(i===1?0xd0ba8f:0x9e5f3a),-.5+i*.8,5.23,-3-i*.5,.1,.025,.3);fish.castShadow=false;}
  lantern(-2.9,5.4,-7.4,.8);
  flush();await yieldFrame();
  onProgress('沿木阶向望楼延伸');
  // Tower floors: the east and west stair lanes are left open at every level.
  floor(0,-21,16,18);floor(8,-16,4,2);
  for(const [y,w,d]of[[5.2,16,18],[10.4,14,16],[15.6,12,14]]){
    const centerZ=-21;
    if(y>5.2){floor(0,centerZ,7.4,d,y);floor(0,-25.5,w,3.4,y);floor(0,-16.2,w,2.2,y);}
    for(const x of[-w/2,w/2])for(const z of[centerZ-d/2,centerZ,centerZ+d/2])post(x,z,y,4.5);
    // Low sill, upper lintels and open windows leave the view legible.
    for(const sign of[-1,1]){if(y>5.2){wall(0,centerZ+sign*d/2,w,.6,.24,y,m.white);box(0,y+4.2,centerZ+sign*d/2,w,.6,.28,m.white);}else{if(sign<0)wall(0,centerZ+sign*d/2,w,4,.25,y);else{wall(-5.5,-12,5,4,.25,y);wall(5.5,-12,5,4,.25,y);}}box(0,y+.7,centerZ+sign*d/2,w,.12,.32,m.darkwood);}
    for(const sign of[-1,1]){if(y===5.2&&sign===1){wall(w/2,-23,.25,4,10,y);}else wall(sign*w/2,centerZ,.25,.65,d,y);box(sign*w/2,y+4.2,centerZ,.3,.6,d,m.white);box(sign*w/2,y+.7,centerZ,.28,.12,d,m.darkwood);}
    if(y===5.2)roof(0,centerZ,20,22,9.8,1.8,14,16);
    if(y===10.4)roof(0,centerZ,18,20,15,1.8,12,14);
    if(y===15.6)roof(0,centerZ,16,18,20.2,3.2,4,.1);
    // Repeated windows and timber frame.
    for(let x=-w/2+2;x<w/2;x+=2){if(y>5.2){post(x,centerZ-d/2,y+.7,3.3);if(x!==0)post(x,centerZ+d/2,y+.7,3.3);}}
    if(y>5.2){for(const sign of[-1,1]){wall(sign*(w/2-1),centerZ+d/2,1.7,3.6,.22,y);wall(sign*w/2,centerZ-3,.22,3.6,2,y);wall(sign*w/2,centerZ+2,.22,3.6,1.6,y);}}
  }
  function stairs(x,zStart,zEnd,y0,y1){const n=28;for(let i=0;i<n;i++){const t=(i+.5)/n;const z=THREE.MathUtils.lerp(zStart,zEnd,t),top=THREE.MathUtils.lerp(y0,y1,(i+1)/n);box(x,top-.10,z,1.9,.20,Math.abs(zEnd-zStart)/n+.02,m.lightwood);}for(const sign of[-1,1]){beam([x+sign*1.07,y0+1,zStart],[x+sign*1.07,y1+1,zEnd],.055,m.darkwood);for(let i=0;i<=7;i++){const t=i/7,z=THREE.MathUtils.lerp(zStart,zEnd,t),y=THREE.MathUtils.lerp(y0,y1,t);box(x+sign*1.07,y+.5,z,.06,1,.06,m.darkwood);}}}
  stairs(4.8,-17,-24,5.2,10.4);stairs(-4.8,-24,-17,10.4,15.6);
  // Support beams avoid the stair openings.
  for(const y of[9.8,15]){box(0,y,-21,7.3,.25,.3,m.darkwood);box(0,y,-26,12,.25,.3,m.darkwood);}
  function gable(x,y,z,w,h){const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,h);shape.lineTo(w/2,0);shape.closePath();const o=mesh(new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false}),m.white,x,y,z);beam([x-w/2-.3,y-.05,z+.3],[x,y+h+.25,z+.3],.14,m.roofEdge);beam([x,y+h+.25,z+.3],[x+w/2+.3,y-.05,z+.3],.14,m.roofEdge);box(x,y+.12,z+.3,w,.18,.18,m.darkwood);box(x,y+h*.42,z+.3,.15,h*.8,.15,m.darkwood);for(const sign of[-1,1])box(x+sign*w*.2,y+h*.25,z+.3,.12,h*.45,.12,m.darkwood);}
  gable(0,20.4,-12.8,6,2.1);gable(0,10.1,-10.4,6,1.8);
  lantern(0,5.4,-27,1);lantern(0,10.6,-27,1);box(0,15.73,-20,3,.12,3,m.tatami);box(2.2,15.95,-21,1.1,.55,.7,m.darkwood);
  flush();await yieldFrame();await onPreview(scene);
  onProgress('植下山林，等一阵秋风');
  const r=random(543);for(let i=0;i<80;i++){const angle=r()*Math.PI*2,rad=33+r()*40,x=Math.cos(angle)*rad,z=-5+Math.sin(angle)*rad;if(z>25&&Math.abs(x)<30)continue;tree(x,-1,z,.7+r()*1.6,i%3===0?'maple':'pine',i*41);if(i%18===0)await yieldFrame();}
  for(let i=0;i<35;i++){const x=(r()-.5)*42,z=-34+r()*59;if(Math.abs(x)<16)continue;mesh(geo.rock,m.moss,x,4.15,z,.6+r(),.2+r()*.4,.5+r());}
  // A neighbouring turret supplies architectural depth without blocking the route.
  box(-19,6.5,-25,5,5,7,m.white);roof(-19,-25,8,10,9.1,2);for(const x of[-21,-17])post(x,-22,4,5);tree(-24,4,-10,1.2,'pine',52);tree(19,4,-20,1.1,'maple',31);
  const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,.1,0,-.07,0,0,0,-.12,0,.07,0,0],3));leafGeo.setIndex([0,1,2,0,2,3]);leafGeo.computeVertexNormals();const leafMat=new THREE.MeshBasicMaterial({color:SEASONS.autumn.particle,side:THREE.DoubleSide});const particles=new THREE.InstancedMesh(leafGeo,leafMat,SETTINGS.leafCount);particles.frustumCulled=false;scene.add(particles);const particleData=Array.from({length:SETTINGS.leafCount},()=>({x:(r()-.5)*65,y:r()*18,z:-30+r()*95,s:.65+r()*1.2,speed:.15+r()*.3}));const dummy=new THREE.Object3D();
  function setSeason(name){const s=SEASONS[name];scene.background.setHex(s.sky);scene.fog.color.setHex(s.fog);sun.color.setHex(s.sun);m.leaf.color.setHex(s.canopy);m.leaf2.color.setHex(s.secondary);m.moss.color.setHex(s.grass);leafMat.color.setHex(s.particle);snowMeshes.forEach(o=>o.visible=name==='winter');deciduous.forEach(o=>{o.visible=name!=='winter';});scene.userData.season=name;renderer.shadowMap.needsUpdate=true;}
  function update(time,reduced=false){moat.material.uniforms.uTime.value=reduced?0:time;pond.material.uniforms.uTime.value=reduced?0:time;waterMeshes.forEach(o=>o.material.uniforms.uTime.value=reduced?0:time);particleData.forEach((p,i)=>{const t=reduced?0:time;dummy.position.set(p.x+Math.sin(t*.13+i)*1.6,p.y-(t*p.speed)%20+2,p.z+Math.cos(t*.1+i)*.8);if(dummy.position.y<3)dummy.position.y+=19;if(dummy.position.x>-16&&dummy.position.x<-4&&dummy.position.z>-11&&dummy.position.z<3&&dummy.position.y<10)dummy.position.x+=20;dummy.rotation.set(t*.2+i,t*.3+i,t*.16);dummy.scale.setScalar(p.s);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);});particles.instanceMatrix.needsUpdate=true;}
  function cutaway(enabled){roofs.forEach(o=>o.visible=!enabled);renderer.shadowMap.needsUpdate=true;}
  // Bake static pieces by material. This turns thousands of tiny draw calls into
  // a few dozen batches while keeping roof cutaways and seasons independent.
  onProgress('整理构件，预备日光');
  scene.updateMatrixWorld(true);
  function mergeMeshes(list,parent){const groups=new Map();for(const o of list){const key=o.material.uuid+":"+o.castShadow+":"+o.receiveShadow;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}const result=[];for(const objects of groups.values()){const positions=[],normals=[],uvs=[],colors=[];for(const o of objects){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n?n.getX(i):0,n?n.getY(i):1,n?n.getZ(i):0);uvs.push(uv?.getX(i)||0,uv?.getY(i)||0);if(o.material.vertexColors)colors.push(...(o.userData.paintTint||[1,1,1]));}g.dispose();o.removeFromParent();}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));if(colors.length)g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeBoundingSphere();const o=new THREE.Mesh(g,objects[0].material);o.castShadow=objects.some(a=>a.castShadow);o.receiveShadow=true;parent.add(o);result.push(o);}return result;}
  const excluded=new Set([pond,...deciduous,...snowMeshes,...waterMeshes]);reflectionMeshes.forEach(o=>o.traverse(c=>excluded.add(c)));roofs.forEach(o=>o.traverse(c=>excluded.add(c)));
  const staticMeshes=[];root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!excluded.has(o))staticMeshes.push(o);});mergeMeshes(staticMeshes,root);await yieldFrame();
  for(const group of roofs){const meshes=[];group.traverse(o=>{if(o.isMesh)meshes.push(o);});mergeMeshes(meshes,group);}await yieldFrame();
  const mergedLeaves=mergeMeshes([...deciduous],root);deciduous.length=0;deciduous.push(...mergedLeaves);const mergedSnow=mergeMeshes([...snowMeshes],root);snowMeshes.length=0;snowMeshes.push(...mergedSnow);
  // Keep exterior roofs out of the tea room's artistic shadow field. Geometry
  // still casts its normal exterior shadow; only this local depth pass differs.
  root.traverse(o=>{if(o.isMesh){o.onBeforeShadow=(_r,_o,_c,shadowCamera,_g,depthMaterial)=>{if(shadowCamera===tea.shadowCamera&&!o.material.userData.surface)depthMaterial.depthWrite=false;};o.onAfterShadow=(_r,_o,_c,_s,_g,depthMaterial)=>{depthMaterial.depthWrite=true;};}});
  // Never recurse reflection rendering into another reflection camera.
  for(const waterMirror of [pond,moat]){const reflect=waterMirror.onBeforeRender;waterMirror.onBeforeRender=function(renderer,scene,camera,...rest){if(!camera.userData.walkCamera)return;reflect.call(this,renderer,scene,camera,...rest);};}
  setSeason('autumn');update(0);
  // The route audit checks solid walls/posts at eye height. Stairs are checked separately.
  scene.userData.colliders=colliders;
  return {scene,root,m,tea,colliders,roofs,setSeason,update,cutaway,waterMeshes,renderer,stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures})};
}
