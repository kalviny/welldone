import { PIGMENTS } from './paint-palette.js';
import * as THREE from 'three';

// Shared watercolor surface samples, cached once across the castle and chapters.
// See SOURCES.md for the user-supplied reference and its artwork terms.
const maps = new Map();
let loading;
export function loadPaint(renderer) {
  if (!loading) {
    const loader = new THREE.TextureLoader();
    loading = Promise.all(['wood','bark','plaster','roof','stone','wash','floor','moss','paper','foliage','water','mountain','cloud'].map(async kind => {
      const map = await loader.loadAsync(new URL(`../assets/paint/${kind}.webp`, import.meta.url).href);
      map.colorSpace = kind === 'paper' ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      maps.set(kind, map);
    }));
  }
  return loading;
}
export const paintMap = kind => maps.get(kind);
export const paperMap = () => maps.get('paper');
export const paintImage = kind => maps.get(kind)?.image;

// The small source swatches contain paper tooth as well as pigment. A filtered
// middle wash carries the surface; fine grain is only a subordinate accent.
const washRecipes={
  wood:{scale:1.,broad:.39,middle:.21,fine:.40,reserve:.15,bias:.1,chroma:.44,ceiling:1.36},
  bark:{scale:1.50,broad:.26,middle:.36,fine:.38,reserve:.025,bias:.15,chroma:.61,ceiling:1.33},
  plaster:{scale:.48,broad:.46,middle:.36,fine:.18,reserve:.24,bias:.5,chroma:.34,ceiling:1.18},
  stone:{scale:1.20,broad:.28,middle:.40,fine:.32,reserve:.09,bias:.25,chroma:.52,ceiling:1.28},
  foliage:{scale:1.70,broad:.28,middle:.43,fine:.29,reserve:.055,bias:.15,chroma:.18,ceiling:1.30},
  roof:{scale:.32,broad:.30,middle:.42,fine:.28,reserve:.30,bias:.35,chroma:.30,ceiling:1.36},
  water:{scale:.32,broad:.56,middle:.36,fine:.08,reserve:.025,bias:1.5,chroma:.58,ceiling:1.25},
  mountain:{scale:.12,broad:.40,middle:.48,fine:.12,reserve:.06,bias:1.1,chroma:.55,ceiling:1.30},
  wash:{scale:.46,broad:.52,middle:.38,fine:.10,reserve:.08,bias:1.3,chroma:.50,ceiling:1.27},
  floor:{scale:.38,broad:.45,middle:.31,fine:.24,reserve:.24,bias:.25,chroma:.45,ceiling:1.38},
  moss:{scale:.52,broad:.39,middle:.36,fine:.25,reserve:.025,bias:.4,chroma:.10,ceiling:1.18}
};

export function paintMaterial(color, kind='wash') {
  const surface = maps.get(kind) || maps.get('wash');
  const pigmentProfile=PIGMENTS[kind]||PIGMENTS.wash;
  const recipe=washRecipes[kind]||washRecipes.wash;
  const timber=kind==='wood'||kind==='bark';
  const material = new THREE.MeshLambertMaterial({color, map:surface, toneMapped:false});
  material.userData.paint = true;
  material.userData.paintKind = kind;
  material.userData.paintBlossom = {value:0};
  material.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0],paintAxis:[0,0,0]};
  material.onBeforeCompile = shader => {
    const surfaceUv=kind==='roof'&&material.userData.paintUv;
    const isotropic=['roof','moss','floor','foliage'].includes(kind);
    shader.uniforms.uPigment = {value:surface};
    shader.uniforms.uPaper = {value:maps.get('paper')};
    if(kind==='foliage')shader.uniforms.uBlossom=material.userData.paintBlossom;
    shader.vertexShader = (surfaceUv?'varying vec2 vPaintSurfaceUv; ':'')+(timber?'attribute vec3 paintAxis; varying vec3 vPaintAxis; ':'')+'varying vec3 vPaintWorld; varying vec3 vPaintNormal;\n'+shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      vec4 paintPosition=vec4(transformed,1.);
      vec3 paintNormal=normal;
      #ifdef USE_INSTANCING
        paintPosition=instanceMatrix*paintPosition;
        paintNormal=mat3(instanceMatrix)*paintNormal;
      #endif
      vPaintWorld=(modelMatrix*paintPosition).xyz;
      vPaintNormal=normalize(mat3(modelMatrix)*paintNormal);
      ${surfaceUv?'vPaintSurfaceUv=uv;':''}
      ${timber?`// Batched meshes carry the original timber axis; unbatched and instanced
      // pieces derive it from their complete object transform.
      vPaintAxis=paintAxis;
      if(dot(vPaintAxis,vPaintAxis)<.1){
        mat4 paintFrame=modelMatrix;
        #ifdef USE_INSTANCING
          paintFrame=modelMatrix*instanceMatrix;
        #endif
        vec3 frameSize=vec3(length(paintFrame[0].xyz),length(paintFrame[1].xyz),length(paintFrame[2].xyz));
        vPaintAxis=normalize(frameSize.x>frameSize.y&&frameSize.x>frameSize.z?paintFrame[0].xyz:frameSize.z>frameSize.y?paintFrame[2].xyz:paintFrame[1].xyz);
      }`:''}
      #include <project_vertex>
    `);
    shader.fragmentShader = (surfaceUv?'varying vec2 vPaintSurfaceUv; ':'')+(kind==='foliage'?'uniform float uBlossom; ':'')+(timber?'varying vec3 vPaintAxis; ':'')+'uniform sampler2D uPigment; uniform sampler2D uPaper; varying vec3 vPaintWorld; varying vec3 vPaintNormal;\n'+shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>', '#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>');
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      vec3 n=normalize(vPaintNormal);
      vec3 weights=pow(abs(n),vec3(5.));weights/=max(.001,weights.x+weights.y+weights.z);
      vec3 q=vPaintWorld*${recipe.scale.toFixed(3)};
      vec2 coordX=${timber?'vec2(q.z,q.y*.16)':'q.yz'};
      vec2 coordY=${timber?'vec2(q.x,q.z*.16)':'q.xz'};
      vec2 coordZ=${timber?'vec2(q.x,q.y*.16)':'q.xy'};
      ${surfaceUv?'coordX=vPaintSurfaceUv*.32;coordY=coordX;coordZ=coordX;':''}
      ${timber?`vec3 grainAxis=normalize(vPaintAxis);
      vec3 grainSide=normalize(cross(grainAxis,abs(grainAxis.y)>.8?vec3(0.,0.,1.):vec3(0.,1.,0.)));
      vec3 grainBack=cross(grainAxis,grainSide);
      float along=dot(q,grainAxis)*.125;
      vec2 timberUv=vec2((dot(q,grainSide)+dot(q,grainBack))*.95,along);
      coordX=timberUv;coordY=timberUv;coordZ=timberUv;`:''}
      vec3 pigment=texture2D(uPigment,coordX,${recipe.bias.toFixed(2)}).rgb*weights.x+texture2D(uPigment,coordY,${recipe.bias.toFixed(2)}).rgb*weights.y+texture2D(uPigment,coordZ,${recipe.bias.toFixed(2)}).rgb*weights.z;
      float density=dot(pigment,vec3(.2126,.7152,.0722));
      vec2 pigmentUv=${kind==='foliage'?'vec2(q.x+q.z*.67,q.y+q.z*.32)':'weights.x>.5?coordX:weights.y>.5?coordY:coordZ'};
      // Rotate the independent wash layers. A directional source swatch must
      // never become the same long band at three different scales.
      vec2 middleUv=${isotropic?'mat2(.8,.6,-.6,.8)*pigmentUv*.67':'pigmentUv*.57'}+vec2(.37,.19);
      vec2 broadUv=${isotropic?'mat2(.36,-.933,.933,.36)*pigmentUv*.31':'pigmentUv*.18'}+vec2(.17,.43);
      ${timber?`middleUv=timberUv*.71+vec2(.37,.19);
      broadUv=vec2(dot(q,vec3(.61,.23,.43)),dot(q,vec3(-.31,.77,.37)))*.24+vec2(.17,.43);`:''}
      vec3 middlePigment=texture2D(uPigment,middleUv,.65).rgb;
      vec3 broadPigment=texture2D(uPigment,broadUv,1.15).rgb;
      float coarse=dot(broadPigment,vec3(.2126,.7152,.0722));
      float medium=dot(middlePigment,vec3(.2126,.7152,.0722));
      float fine=(density-${pigmentProfile.mean.toFixed(5)})/${pigmentProfile.deviation.toFixed(5)};
      float broad=(coarse-${pigmentProfile.mean.toFixed(5)})/${pigmentProfile.deviation.toFixed(5)};
      float middle=(medium-${pigmentProfile.mean.toFixed(5)})/${pigmentProfile.deviation.toFixed(5)};
      float pigmentDepth=clamp(fine*${recipe.fine.toFixed(3)}+middle*${recipe.middle.toFixed(3)}+broad*${recipe.broad.toFixed(3)},-2.1,2.1);
      // Preserve the reference's pigment hue as well as its wash boundaries.
      // Normalize against the measured sample mean: the requested palette tint
      // supplies albedo once, rather than multiplying two full-colored paints.
      vec3 sampleMean=vec3(${pigmentProfile.rgb.join(',')});
      vec3 mixedPigment=pigment*${recipe.fine.toFixed(3)}+middlePigment*${recipe.middle.toFixed(3)}+broadPigment*${recipe.broad.toFixed(3)};
      float mixedDensity=dot(mixedPigment,vec3(.2126,.7152,.0722));
      vec3 chroma=(mixedPigment/max(mixedDensity,.025))/(sampleMean/${pigmentProfile.mean.toFixed(5)});
      diffuseColor.rgb*=mix(vec3(1.),clamp(chroma,vec3(.76),vec3(1.27)),${recipe.chroma.toFixed(3)}${kind==='foliage'?'*(1.-uBlossom)':''});
      diffuseColor.rgb*=clamp(1.+pigmentDepth*${pigmentProfile.strength.toFixed(3)},.65,${recipe.ceiling.toFixed(3)});
      float reserve=smoothstep(.12,1.45,pigmentDepth)*${recipe.reserve.toFixed(3)};
      diffuseColor.rgb=mix(diffuseColor.rgb,${timber?'vec3(.91,.72,.49)':kind==='foliage'?'diffuseColor.rgb*vec3(1.10,1.08,1.025)':kind==='moss'?'diffuseColor.rgb*vec3(1.045,1.035,.985)':'vec3(.94,.92,.86)'},reserve);
      ${kind==='wood'?`float warmBand=smoothstep(-.65,.50,-fine)*smoothstep(-.65,.60,-middle);diffuseColor.rgb*=mix(vec3(1.),vec3(1.045,.94,.82),warmBand*.36);`:''}
      ${kind==='foliage'?`float overlapWash=smoothstep(-.65,.7,-fine)*smoothstep(-.60,.8,-middle);float leafTop=smoothstep(-.35,.75,n.y);vec3 coolLeaf=mix(vec3(.94,.975,1.01),vec3(1.055,1.035,.98),leafTop);vec3 coralPetal=mix(vec3(1.015,.965,.95),vec3(1.045,1.025,1.005),leafTop);diffuseColor.rgb*=mix(coolLeaf,coralPetal,uBlossom);diffuseColor.rgb*=mix(vec3(1.),mix(vec3(.92,.95,.965),vec3(1.,.94,.915),uBlossom),overlapWash*.50);`:''}
      ${kind==='floor'?`float paperPool=smoothstep(-.25,.80,broad)*smoothstep(-.60,.70,middle);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.94,.79,.58),paperPool*.18);`:''}
      ${kind==='moss'?`float paleGrass=smoothstep(-.6,.9,broad);diffuseColor.rgb*=mix(vec3(.975,.985,.975),vec3(1.035,1.025,.99),paleGrass);`:''}
      ${kind==='stone'?`float topPlane=smoothstep(-.15,.85,n.y)*.74+.26*smoothstep(-.8,1.2,broad);float mineral=smoothstep(-.10,1.10,-middle)*smoothstep(-.65,.75,-broad);diffuseColor.rgb=mix(diffuseColor.rgb*vec3(.86,.94,1.025),diffuseColor.rgb*vec3(1.055,1.035,.995),topPlane);diffuseColor.rgb*=mix(vec3(1.),vec3(.88,.94,.99),mineral*.42);`:''}
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec3 paintN=normalize(vPaintNormal);
      float orientation=${kind==='foliage'?'.975+.025':kind==='stone'?'.94+.06':'.95+.05'}*dot(paintN,normalize(vec3(-.45,.85,.5)));
      float shadow=mix(.91,1.035,getShadowMask());
      float tooth=texture2D(uPaper,gl_FragCoord.xy/512.).r-.5;
      outgoingLight=diffuseColor.rgb*orientation*shadow*(1.+tooth*.09);
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey=()=>`castle-spring-cloud-washes-v5-${kind}-${!!material.userData.paintUv}`;
  return material;
}
