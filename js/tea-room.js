import * as THREE from 'three';

// A real, orbitable room. All maps are isolated watercolor surface samples
// rectified from the user's supplied reference, never a backdrop of the room.
export function createTeaRoom(root, renderer, colliders) {
  const group = new THREE.Group();
  group.name = 'watercolor-tea-room';
  root.add(group);
  // Dedicated high-resolution room shadow field. Its zero irradiance leaves the
  // castle's exterior lighting unchanged; tea pigment shaders consume its mask.
  const roomKey=new THREE.DirectionalLight(0xffffff,0);
  roomKey.position.set(-7,8.8,-4);roomKey.target.position.set(-12,5.2,-8);
  roomKey.castShadow=true;roomKey.shadow.mapSize.set(1024,1024);
  Object.assign(roomKey.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:38});
  roomKey.shadow.bias=-.00015;roomKey.shadow.normalBias=.018;roomKey.shadow.radius=4;
  root.add(roomKey,roomKey.target);

  const maps = new Map(), materials = [], loader = new THREE.TextureLoader();
  const paperUniform = { value: null };
  function paint(name, color = 0xffffff) {
    const fallback={cedar:0xc49b70,'table-top':0xd6af79,'table-edge':0xc69b6a,tatami:0xe2d3a5,ceramic:0xa3ab88,plaster:0xf5e4c4,'blue-slate':0x96aaa8,'sage-cloth':0xb7c2a5,'olive-canopy':0xb3ba93};
    const material = new THREE.MeshLambertMaterial({ color:new THREE.Color(fallback[name]||0xf0e8d1).multiply(new THREE.Color(color)), toneMapped: false });
    material.userData.loadedColor=color;
    material.userData.surface = name;
    material.onBeforeCompile = shader => {
      shader.uniforms.uPaper = paperUniform;
      shader.vertexShader = 'varying vec3 vPaintNormal;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaintNormal = normalize(mat3(modelMatrix) * normal);');
      shader.fragmentShader = '#undef SHADOWMAP_TYPE_PCF_SOFT\n#define SHADOWMAP_TYPE_PCF\nuniform sampler2D uPaper; varying vec3 vPaintNormal;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>', `#include <shadowmap_pars_fragment>
        // The room light is the first shadow light traversed within the scene's
        // first root group. Exterior sunlight must not double-darken the wash.
        float getTeaShadow(){
          #if defined(USE_SHADOWMAP) && NUM_DIR_LIGHT_SHADOWS > 0
            DirectionalLightShadow s=directionalLightShadows[0];
            return receiveShadow ? getShadow(directionalShadowMap[0],s.shadowMapSize,s.shadowIntensity,s.shadowBias,s.shadowRadius,vDirectionalShadowCoord[0]) : 1.;
          #else
            return 1.;
          #endif
        }
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float illumination = ${name==='ceramic'?'.72 + .28':name==='sage-cloth'?'.84 + .16':'.90 + .10'} * dot(normalize(vPaintNormal), normalize(vec3(-.4,.8,.6)));
        float tooth = texture2D(uPaper, gl_FragCoord.xy / 512.).r - .5;
        diffuseColor.rgb *= illumination + tooth * .075;
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        // Keep watercolor albedo luminous while real geometry casts soft shadows.
        outgoingLight = diffuseColor.rgb * mix(.66, 1.06, getTeaShadow());
        #include <opaque_fragment>
      `);
    };
    material.customProgramCacheKey = () => 'tea-watercolor-light-v5-'+name;
    materials.push(material);
    return material;
  }
  const m = {
    wall: paint('plaster'), wood: paint('cedar'), top: paint('table-top'),
    edge: paint('table-edge'), paper: paint('shoji-paper'), tatami: paint('tatami'),
    cloth: paint('sage-cloth', 0xe4e8d8), border: paint('sage-cloth', 0xeaf0dc),
    slate: paint('blue-slate'), ceramic: paint('ceramic'), cream: paint('shoji-paper',0xfff9e9),
    ceiling: paint('plaster',0xf5f6f1), stone:paint('footing'), canopy:paint('olive-canopy')
  };
  m.canopy.side=THREE.DoubleSide;m.canopy.color.setHex(0xffffff);m.edge.color.setHex(0xeee0cd);m.edge.userData.loadedColor=0xeee0cd;
  m.top.color.setHex(0xfff5df);m.top.userData.loadedColor=0xfff5df;
  const fadedMark=paint('table-edge',0xffefce);fadedMark.transparent=true;fadedMark.opacity=.23;fadedMark.depthWrite=false;
  function box(x,y,z,w,h,d,material,solid=false,bevel=0) {
    let geometry;
    if(bevel){
      const shape = new THREE.Shape(); const a=w/2-bevel,b=h/2-bevel;
      shape.moveTo(-a,-b);shape.lineTo(a,-b);shape.lineTo(a,b);shape.lineTo(-a,b);shape.closePath();
      geometry = new THREE.ExtrudeGeometry(shape,{depth:Math.max(.01,d-2*bevel),bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:2});
      geometry.translate(0,0,-d/2+bevel);
      // Stable box UVs keep painted faces recognizable when orbiting.
      const pos=geometry.attributes.position,norm=geometry.attributes.normal,uv=geometry.attributes.uv;
      for(let i=0;i<pos.count;i++){
        const nx=Math.abs(norm.getX(i)),ny=Math.abs(norm.getY(i)),nz=Math.abs(norm.getZ(i));
        if(ny>nx&&ny>nz)uv.setXY(i,pos.getX(i)/w+.5,pos.getZ(i)/d+.5);
        else if(nx>nz)uv.setXY(i,pos.getZ(i)/d+.5,pos.getY(i)/h+.5);
        else uv.setXY(i,pos.getX(i)/w+.5,pos.getY(i)/h+.5);
      }
    }else geometry=new THREE.BoxGeometry(w,h,d);
    if(material===m.wood && h<Math.max(w,d)){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++){const u=uv.getX(i);uv.setXY(i,uv.getY(i),u);}}
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    if(solid)colliders.push({min:[x-w/2,y-h/2,z-d/2],max:[x+w/2,y+h/2,z+d/2]});
    return mesh;
  }
  function lattice(x,z,w,h,rotation=0,y=5.35,columns=6){
    const frame=new THREE.Group();frame.position.set(x,y,z);frame.rotation.y=rotation;group.add(frame);
    const add=(xx,yy,zz,ww,hh,dd,ma)=>{const o=box(0,0,0,ww,hh,dd,ma);frame.add(o);o.position.set(xx,yy,zz);return o;};
    add(0,h/2,0,w,h,.06,m.paper);
    for(const side of[-1,1]){
      for(let i=0;i<=columns;i++)add(-w/2+i*w/columns,h/2,side*.055,i===0||i===columns?.055:.026,h,.04,m.wood);
      for(let i=0;i<=4;i++)add(0,i*h/4,side*.055,w,i===0||i===4?.06:.032,.045,m.wood);
    }
    frame.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(frame);colliders.push({min:bounds.min.toArray(),max:bounds.max.toArray(),kind:'tea-lattice'});
    return frame;
  }
  // Warm interior linings sit inside the existing structural walls.
  box(-14.79,7.1,-4, .05,3.8,11.7,m.wall);
  box(-10,7.1,-9.78, 9.6,3.8,.05,m.wall);
  box(-10,5.205,-3.95,9.6,.02,11.7,m.edge);
  box(-14.7,5.33,-4,.11,.18,11.6,m.wood);
  box(-10,5.33,-9.65,9.5,.18,.12,m.wood);
  box(-14.7,9.08,-4,.22,.25,11.8,m.wood).castShadow=false;
  // The rear wall has a plain upper edge, framing the open roof light.
  // Mat slabs end at the foreground threshold. Their bindings wrap the edges.
  const xEdges=[-14.7,-12.95,-11.2,-9.45,-7.7];
  for(let xi=0;xi<4;xi++){
    const zs=xi===3?[-9.65,-6.80,-3.95,-1.1]:[-9.65,-6.80,-3.95];
    for(let zi=0;zi<zs.length-1;zi++){
      const w=xEdges[xi+1]-xEdges[xi],d=zs[zi+1]-zs[zi],x=(xEdges[xi]+xEdges[xi+1])/2,z=(zs[zi]+zs[zi+1])/2;
      box(x,5.265,z,w-.014,.13,d-.014,m.tatami,false,.008);
      for(const sign of[-1,1]){
        box(x+sign*(w/2-.025),5.337,z,.042,.015,d-.014,m.border);
        box(x+sign*(w/2-.053),5.338,z,.013,.016,d-.014,m.cloth);
        box(x+sign*(w/2-.025),5.27,z+d/2,.042,.13,.018,m.border);
      }
      box(x,5.337,z+d/2-.02,w-.02,.014,.035,m.border);
    }
  }
  // Left shoji, rear display screen, a plain hanging scroll and a cedar shelf.
  lattice(-14.7,-4.3,4.5,2.8,Math.PI/2,5.35,10);
  lattice(-11.9,-9.57,1.72,2.15,0,5.61);
  box(-11.9,7.05,-9.43,.75,1.35,.035,m.cloth);
  box(-11.9,7.06,-9.40,.50,1.10,.025,m.cream);
  box(-11.88,7.10,-9.38,.035,.9,.008,fadedMark);
  box(-11.9,7.75,-9.42,.8,.045,.055,m.wood);
  box(-11.9,6.35,-9.42,.8,.045,.055,m.wood);
  box(-12.45,6.26,-9.21,3.2,.15,.65,m.edge,false,.025);
  // A low solid table, with softened corners and individual cedar legs.
  const tx=-12.2,tz=-6.8;
  const tabletop=box(tx,5.84,tz,3.3,.16,1.25,m.top,true,.025);
  box(tx,5.83,tz+.625,3.29,.15,.025,m.edge);
  box(tx+1.65,5.83,tz,.025,.15,1.23,m.edge);
  for(const x of[-1.28,1.28])for(const z of[-.4,.4])box(tx+x,5.55,tz+z,.13,.47,.15,m.wood,false,.016);
  function cushion(x,z,w,d){
    const g=new THREE.SphereGeometry(1,48,24),p=g.attributes.position;
    const soft=(v,e)=>Math.sign(v)*Math.pow(Math.abs(v),e);
    for(let i=0;i<p.count;i++)p.setXYZ(i,soft(p.getX(i),.12)*w/2,soft(p.getY(i),.4)*.105,soft(p.getZ(i),.12)*d/2);
    g.computeVertexNormals();const o=new THREE.Mesh(g,m.cloth);o.position.set(x,5.44,z);o.castShadow=o.receiveShadow=true;group.add(o);
  }
  cushion(-14.15,-6.7,1.1,.85);cushion(-10.5,-6.95,1,.7);
  // Lathed ceramic keeps the vessel genuinely round from every inspection angle.
  const profile=[[.0,0],[.18,0],[.27,.07],[.32,.19],[.29,.31],[.18,.40],[.10,.41],[.10,.43]];
  const curve=new THREE.SplineCurve(profile.map(p=>new THREE.Vector2(...p)));
  const vessel=new THREE.Mesh(new THREE.LatheGeometry(curve.getPoints(48),64),m.ceramic);vessel.scale.set(.85,.85,.85);vessel.position.set(tx-.80,5.93,tz+.03);vessel.castShadow=true;group.add(vessel);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.085,.016,8,40),m.ceramic);rim.rotation.x=Math.PI/2;rim.position.set(tx-.80,6.295,tz+.03);group.add(rim);
  const opening=new THREE.Mesh(new THREE.CircleGeometry(.070,32),new THREE.MeshBasicMaterial({color:0x52604c,toneMapped:false}));opening.rotation.x=-Math.PI/2;opening.position.set(tx-.80,6.295,tz+.03);group.add(opening);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.21,.205,.25,32,1,true),m.cream);cup.position.set(tx-.03,6.055,tz-.1);group.add(cup);
  const cupInner=new THREE.Mesh(new THREE.CircleGeometry(.19,32),new THREE.MeshBasicMaterial({color:0xd2c5a8,toneMapped:false}));cupInner.rotation.x=-Math.PI/2;cupInner.position.set(tx-.03,6.175,tz-.1);group.add(cupInner);
  const cupRim=new THREE.Mesh(new THREE.TorusGeometry(.205,.015,6,32),m.cream);cupRim.rotation.x=Math.PI/2;cupRim.position.set(tx-.03,6.19,tz-.1);group.add(cupRim);
  // Paper lantern with four timber legs and a muted blue-green stone cap.
  const lx=-8.51,lz=-9.65;
  box(lx,5.81,lz,.72,.94,.65,m.wall);
  for(const sx of[-1,1])for(const sz of[-1,1])box(lx+sx*.375,5.81,lz+sz*.34,.075,1.04,.075,m.wood);
  box(lx,6.30,lz,.87,.14,.80,m.slate,false,.025);
  // The near post and stone shoe anchor the open edge of the raised platform.
  box(-6.99,7.35,-6.5,.22,4.0,.22,m.wood,true,.015).castShadow=false;
  box(-6.99,5.25,-6.5,.50,.24,.50,m.stone,false,.02);
  // Quiet olive paper shades, with real ribs and cords.
  function shade(x,y,z,r){
    const geo=new THREE.ConeGeometry(r,.28,12,1,true);const canopy=new THREE.Mesh(geo,m.canopy);canopy.position.set(x,y,z);canopy.castShadow=true;group.add(canopy);
    const thread=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,1.2,6),m.wood);thread.position.set(x,y+.7,z);group.add(thread);
    for(let i=0;i<10;i++){const a=i*Math.PI/5;const start=new THREE.Vector3(x,y+.14,z),end=new THREE.Vector3(x+Math.cos(a)*r,y-.14,z+Math.sin(a)*r);const length=start.distanceTo(end);const rib=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,length,5),m.canopy);rib.position.copy(start).add(end).multiplyScalar(.5);rib.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize());group.add(rib);}
  }
  shade(-14.15,7.98,-7.5,.84);
  shade(-15.7,9.75,-9.5,1.65);
  // Soft painted contact shadows preserve the light, diffuse reference atmosphere.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const c=shadowCanvas.getContext('2d');const grad=c.createRadialGradient(64,64,10,64,64,64);grad.addColorStop(0,'rgba(78,65,32,.62)');grad.addColorStop(.55,'rgba(86,71,37,.36)');grad.addColorStop(1,'rgba(86,71,37,0)');c.fillStyle=grad;c.fillRect(0,0,128,128);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas);shadowTexture.colorSpace=THREE.SRGBColorSpace;
  for(const [x,z,w,d]of[[tx+.35,tz+.2,4.2,3],[-10.4,-7.1,1.6,1.2],[lx,lz,1.7,1.3]]){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,toneMapped:false}));o.rotation.x=-Math.PI/2;o.position.set(x,5.35,z);group.add(o);}
  for(const dx of[-1.16,1.16])for(const dz of[-.5,.5]){
    const o=new THREE.Mesh(new THREE.PlaneGeometry(.7,.6),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,toneMapped:false}));o.rotation.x=-Math.PI/2;o.position.set(tx+dx+.12,5.355,tz+dz+.12);group.add(o);
  }
  const wallShade=new THREE.Mesh(new THREE.PlaneGeometry(2.7,3.0),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity:.52,depthWrite:false,toneMapped:false}));wallShade.rotation.y=Math.PI/2;wallShade.position.set(-14.735,6.9,-7.0);group.add(wallShade);
  const cornerShade=new THREE.Mesh(new THREE.PlaneGeometry(1.9,3.4),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity:.24,depthWrite:false,toneMapped:false}));cornerShade.position.set(-14.2,7.0,-9.70);group.add(cornerShade);
  const shadeCanvas=document.createElement('canvas');shadeCanvas.width=shadeCanvas.height=512;
  const sc=shadeCanvas.getContext('2d');sc.filter='blur(7px)';
  const wash=sc.createLinearGradient(0,60,400,460);wash.addColorStop(0,'rgba(106,111,73,.43)');wash.addColorStop(.6,'rgba(106,111,73,.30)');wash.addColorStop(1,'rgba(94,99,64,0)');
  sc.fillStyle=wash;sc.beginPath();sc.moveTo(124,70);sc.lineTo(343,44);sc.bezierCurveTo(410,108,489,250,531,420);sc.lineTo(182,275);sc.bezierCurveTo(155,180,132,105,124,70);sc.fill();
  const st=new THREE.CanvasTexture(shadeCanvas);st.colorSpace=THREE.SRGBColorSpace;
  const lampWash=new THREE.Mesh(new THREE.PlaneGeometry(3.2,2.9),new THREE.MeshBasicMaterial({map:st,transparent:true,depthWrite:false,toneMapped:false}));
  lampWash.rotation.y=Math.PI/2;lampWash.position.set(-14.72,6.85,-8.0);group.add(lampWash);
  const shelfOcclusion=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.6),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity:.7,depthWrite:false,toneMapped:false}));shelfOcclusion.position.set(-12.45,6.04,-9.70);group.add(shelfOcclusion);
  // A fine ochre brush stroke rests on the scroll, never floating in the room.
  box(-11.9,7.07,-9.365,.025,.78,.005,fadedMark);
  let loading;
  function load(){
    if(!loading)loading=Promise.all([...new Set(materials.map(o=>o.userData.surface)), 'paper-tooth'].map(async name=>{
      const t=await loader.loadAsync(new URL(`../assets/tea/${name}.webp`,import.meta.url).href);t.colorSpace=name==='paper-tooth'?THREE.NoColorSpace:THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(name==='tatami')t.repeat.set(2,6);if(name==='plaster')t.repeat.set(1.8,1.6);if(name==='sage-cloth')t.repeat.set(2,2);maps.set(name,t);
    })).then(()=>{paperUniform.value=maps.get('paper-tooth');for(const material of materials){material.map=maps.get(material.userData.surface);material.color.setHex(material.userData.loadedColor);material.needsUpdate=true;}});
    return loading;
  }
  return {group,materials:m,shadowCamera:roomKey.shadow.camera,load,get paper(){return paperUniform.value;}};
}
