import * as THREE from 'three';

// A broken mineral shoulder and offset crown replace the repeated dodecahedron.
// Broad facets stay real geometry; soft wash variation crosses their boundaries.
export function createPaintedStoneGeometry(seed=1) {
  const positions=[],colors=[],indices=[],sides=11;
  const hash=n=>.5+.5*Math.sin((n+seed*3.7)*91.71+Math.sin(n*17.3));
  const layers=[[-.83,.67],[-.18,1.],[.43,.82],[.83,.43]];
  layers.forEach(([height,radius],layer)=>{
    for(let i=0;i<sides;i++){
      const angle=i/sides*Math.PI*2;
      const chip=(i===2||i===7)?.84:1;
      const extent=radius*(.89+hash(i+7)*.19)*chip;
      positions.push(Math.cos(angle)*extent+(layer-1)*.045,
        height+(hash(i*3+layer*19)-.5)*(layer===3?.21:.14),
        Math.sin(angle)*extent*(.91+hash(i+29)*.16));
      const tint=.88+hash(i+layer*2)*.11;
      colors.push(tint,tint*(.99+hash(i+9)*.025),tint*(.98+hash(i+11)*.035));
    }
  });
  for(let layer=0;layer<layers.length-1;layer++)for(let i=0;i<sides;i++){
    const a=layer*sides+i,b=layer*sides+(i+1)%sides,c=a+sides,d=b+sides;
    if((i+layer)%2)indices.push(a,c,d,a,d,b);
    else indices.push(a,c,b,b,c,d);
  }
  positions.push(.08,.89,-.09,0,-.85,0);colors.push(.97,.965,.94,.87,.89,.9);
  const top=sides*layers.length,bottom=top+1;
  for(let i=0;i<sides;i++){
    indices.push(top,(layers.length-1)*sides+(i+1)%sides,(layers.length-1)*sides+i);
    indices.push(bottom,i,(i+1)%sides);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  const faceted=geometry.toNonIndexed();faceted.computeVertexNormals();faceted.computeBoundingSphere();geometry.dispose();
  return faceted;
}
