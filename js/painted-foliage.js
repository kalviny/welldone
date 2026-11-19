import * as THREE from 'three';

// Unequal, lobed sprays occupy the original crown volume. These are closed
// rounded meshes, visible from every side, with no billboard or filled core.
export function createPaintedFoliageGeometry(compact=false) {
  const positions=[],normals=[],colors=[];
  const hash=n=>{const f=Math.sin(n*127.13+Math.sin(n*31.7)*13.1)*43758.5453;return f-Math.floor(f);};
  const segments=compact?10:16, count=compact?16:25;
  function island(x,y,z,radius,seed){
    const points=[],tints=[],indices=[];
    const stretch=.77+hash(seed+5)*.46,turn=hash(seed+7)*Math.PI*2;
    const depth=.86+hash(seed+17)*.24,lobes=3+Math.floor(hash(seed+3)*(compact?2:3));
    const leanX=(hash(seed+13)-.5)*.26,leanZ=(hash(seed+14)-.5)*.26;
    const layer=THREE.MathUtils.smoothstep(y,-.44,.44);
    const tint=new THREE.Vector3().lerpVectors(new THREE.Vector3(.86,.92,.94),new THREE.Vector3(1.075,1.065,.965),layer);
    const rings=[[.55,.79],[.91,.43],[1.,-.05],[.71,-.63]];
    const rotation=new THREE.Euler((hash(seed+9)-.5)*.34,turn,(hash(seed+12)-.5)*.26);
    function point(px,py,pz,light=1){
      const v=new THREE.Vector3(px,py,pz).applyEuler(rotation);
      points.push(x+v.x,y+v.y,z+v.z);
      tints.push(tint.x*light,tint.y*light,tint.z*light);
    }
    point(0,radius*depth*.99,0);
    for(let ring=0;ring<rings.length;ring++){
      const [width,height]=rings[ring];
      for(let j=0;j<segments;j++){
        const a=j/segments*Math.PI*2;
        // The same soft lobes follow each shoulder. No phase-shifted folds,
        // hard circular rim, or repeated oval unit is introduced by the rings.
        const edge=1+.115*Math.sin(a*lobes+seed)+.035*Math.sin(a*(lobes+2)-seed*.71)+.055*Math.sin(a*2+seed*.3);
        point(radius*(Math.cos(a)*width*edge+leanX*height),radius*depth*(height+.035*Math.sin(a*3+seed)),radius*(Math.sin(a)*width*edge*stretch+leanZ*height),1+(hash(seed+ring)-.5)*.018);
      }
    }
    const bottom=points.length/3;point(radius*leanX,-radius*depth*.89,radius*leanZ,.99);
    for(let j=0;j<segments;j++){
      const next=(j+1)%segments;
      indices.push(0,1+next,1+j);
      for(let ring=0;ring<rings.length-1;ring++){
        const a=1+ring*segments+j,b=1+ring*segments+next,c=a+segments,d=b+segments;
        indices.push(a,b,c,b,d,c);
      }
      indices.push(1+3*segments+j,1+3*segments+next,bottom);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(tints,3));
    g.setIndex(indices);g.computeVertexNormals();
    const unindexed=g.toNonIndexed(),p=unindexed.attributes.position,n=unindexed.attributes.normal,c=unindexed.attributes.color;
    for(let j=0;j<p.count;j++){
      positions.push(p.getX(j),p.getY(j),p.getZ(j));
      normals.push(n.getX(j),n.getY(j),n.getZ(j));
      colors.push(c.getX(j),c.getY(j),c.getZ(j));
    }
    g.dispose();unindexed.dispose();
  }
  // Jittered directions and several scales break the previous latitudinal rows.
  // Keep the same outer envelope so branch positions and framing remain stable.
  for(let i=0;i<count-4;i++){
    const height=THREE.MathUtils.clamp(1-2*(i+.5)/(count-4)+(hash(i+71)-.5)*.42,-.93,.93);
    const angle=i*2.399963+(hash(i+91)-.5)*1.25;
    const radial=Math.sqrt(1-height*height)*(.56+hash(i+13)*.20);
    const radius=.205+Math.pow(hash(i+23),1.45)*.205;
    island(Math.cos(angle)*radial,height*.50,Math.sin(angle)*radial,radius,i+11);
  }
  island(-.26,.10,.04,.35,67);island(.24,-.08,-.22,.29,73);
  island(.08,.29,.18,.31,83);island(-.08,-.30,.20,.25,97);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeBoundingSphere();
  return geometry;
}
