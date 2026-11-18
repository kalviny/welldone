import { PIGMENTS } from './paint-palette.js';
import * as THREE from 'three';

// Shared watercolor surface samples, cached once across the castle and chapters.
// See SOURCES.md for the user-supplied reference and its artwork terms.
const maps = new Map();
let loading;
export function loadPaint(renderer) {
  if (!loading) {
    const loader = new THREE.TextureLoader();
    loading = Promise.all(['wood','plaster','roof','stone','wash','paper','foliage','water','mountain','cloud'].map(async kind => {
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

export function paintMaterial(color, kind='wash') {
  const surface = maps.get(kind) || maps.get('wash');
  const pigmentProfile=PIGMENTS[kind]||PIGMENTS.wash;
  const material = new THREE.MeshLambertMaterial({color, map:surface, toneMapped:false});
  material.userData.paint = true;
  material.onBeforeCompile = shader => {
    shader.uniforms.uPigment = {value:surface};
    shader.uniforms.uPaper = {value:maps.get('paper')};
    shader.vertexShader = 'varying vec3 vPaintWorld; varying vec3 vPaintNormal;\n'+shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      vec4 paintPosition=vec4(transformed,1.);
      vec3 paintNormal=normal;
      #ifdef USE_INSTANCING
        paintPosition=instanceMatrix*paintPosition;
        paintNormal=mat3(instanceMatrix)*paintNormal;
      #endif
      vPaintWorld=(modelMatrix*paintPosition).xyz;
      vPaintNormal=normalize(mat3(modelMatrix)*paintNormal);
      #include <project_vertex>
    `);
    shader.fragmentShader = 'uniform sampler2D uPigment; uniform sampler2D uPaper; varying vec3 vPaintWorld; varying vec3 vPaintNormal;\n'+shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>', '#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>');
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      vec3 n=normalize(vPaintNormal);
      vec3 weights=pow(abs(n),vec3(5.));weights/=max(.001,weights.x+weights.y+weights.z);
      vec3 q=vPaintWorld*${kind==='wood'?'.42':kind==='roof'?'.50':kind==='stone'?'.32':kind==='foliage'?'.85':kind==='water'?'.28':kind==='mountain'?'.12':'.25'};
      ${kind==='wood'?'q.y*=.22;':''}
      vec3 pigment=texture2D(uPigment,q.yz).rgb*weights.x+texture2D(uPigment,q.xz).rgb*weights.y+texture2D(uPigment,q.xy).rgb*weights.z;
      ${kind==='water'?'pigment=mix(pigment,texture2D(uPigment,q.zx*1.7+.31).rgb,.38);':''}
      float density=dot(pigment,vec3(.2126,.7152,.0722));
      vec2 pigmentUv=weights.x>.5?q.yz:weights.y>.5?q.xz:q.xy;
      float coarse=dot(texture2D(uPigment,pigmentUv*.29+vec2(.17,.43)).rgb,vec3(.2126,.7152,.0722));
      float fine=(density-${pigmentProfile.mean.toFixed(5)})/${pigmentProfile.deviation.toFixed(5)};
      float broad=(coarse-${pigmentProfile.mean.toFixed(5)})/${pigmentProfile.deviation.toFixed(5)};
      float pigmentDepth=clamp(fine*${kind==='foliage'?'.50':'.68'}+broad*${kind==='foliage'?'.50':'.32'},-2.1,2.1);
      diffuseColor.rgb*=clamp(1.+pigmentDepth*${pigmentProfile.strength.toFixed(3)},.56,1.35);
      ${['stone','water','foliage','mountain'].includes(kind)?'diffuseColor.rgb*=vec3(1.+broad*.018,1.,1.-broad*.018);':''}
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec3 paintN=normalize(vPaintNormal);
      float orientation=${kind==='foliage'?'.86+.14':'.86+.14'}*dot(paintN,normalize(vec3(-.45,.85,.5)));
      float shadow=mix(.83,1.06,getShadowMask());
      float tooth=texture2D(uPaper,gl_FragCoord.xy/512.).r-.5;
      outgoingLight=diffuseColor.rgb*orientation*shadow*(1.+tooth*.075);
      ${kind==='foliage'?'float reserve=smoothstep(.9,2.1,pigmentDepth)*.10;outgoingLight=mix(outgoingLight,vec3(.93,.89,.78),reserve);':kind==='roof'?'float reserve=smoothstep(1.3,2.1,pigmentDepth)*.03;outgoingLight=mix(outgoingLight,vec3(.93,.89,.78),reserve);':''}
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey=()=>`castle-pigment-panorama-v3-${kind}`;
  return material;
}
