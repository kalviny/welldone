import * as THREE from 'three';
import { paintMap } from './paint.js';
import { PIGMENTS } from './paint-palette.js';

// Architecture remains a live reflection. World-space pigment controls its local
// continuity and softened edges; there are no image-space rows or stepped shifts.
export function paintReflection(reflector, strength=1, garden=false) {
  const material=reflector.material,profile=PIGMENTS.water;
  Object.assign(material.uniforms,{
    uTime:{value:0},uWaterPigment:{value:paintMap('water')},uBreakup:{value:strength},
    uCoolWash:{value:new THREE.Color(0x92b8b3)},uPaleWash:{value:new THREE.Color(0xd4d0b1)},
    uDeepWash:{value:new THREE.Color(0x63999b)},uGardenWash:{value:garden?1:0},
    uWaterOrigin:{value:new THREE.Vector2(reflector.position.x,reflector.position.z)},
    uWaterSpan:{value:new THREE.Vector2(reflector.geometry.parameters.width,reflector.geometry.parameters.height)}
  });
  material.vertexShader='varying vec3 vWaterWorld;\n'+material.vertexShader;
  material.vertexShader=material.vertexShader.replace('vUv = textureMatrix * vec4( position, 1.0 );',
    'vWaterWorld=(modelMatrix*vec4(position,1.)).xyz;\nvUv = textureMatrix * vec4( position, 1.0 );');
  material.fragmentShader=`
    uniform sampler2D uWaterPigment; uniform float uTime; uniform float uBreakup;
    uniform vec3 uCoolWash; uniform vec3 uPaleWash; uniform vec3 uDeepWash;
    uniform float uGardenWash;
    uniform vec2 uWaterOrigin; uniform vec2 uWaterSpan; varying vec3 vWaterWorld;
  `+material.fragmentShader;
  material.fragmentShader=material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`
    vec2 q=vWaterWorld.xz*.31;
    vec3 pigment=texture2D(uWaterPigment,q,1.5).rgb;
    vec3 middlePigment=texture2D(uWaterPigment,q*2.7+vec2(.37,.13),.8).rgb;
    vec3 broadPigment=texture2D(uWaterPigment,q*.39+vec2(.19,.43),2.4).rgb;
    float density=(dot(pigment,vec3(.2126,.7152,.0722))-${profile.mean})/${profile.deviation};
    float middleDensity=(dot(middlePigment,vec3(.2126,.7152,.0722))-${profile.mean})/${profile.deviation};
    float broadDensity=(dot(broadPigment,vec3(.2126,.7152,.0722))-${profile.mean})/${profile.deviation};
    vec2 uv=vUv.xy/vUv.w;
    // Irregular paint patches change opacity and edge shape. Tiny continuous
    // lateral shifts preserve narrow screen rails and vertical posts.
    float washPatch=smoothstep(-.65,.85,middleDensity+density*.31);
    uv.x+=(middleDensity*.00065+density*.00045)*uBreakup;
    uv.y+=(middleDensity-density)*.00019*uBreakup;
    uv.x+=sin(uTime*.17+q.y*1.1)*.00018;
    vec4 base=texture2D(tDiffuse,uv)*.80;
    base+=texture2D(tDiffuse,uv+vec2(.00085,.0003))*.10;
    base+=texture2D(tDiffuse,uv-vec2(.00085,.0003))*.10;
    vec2 field=(vWaterWorld.xz-uWaterOrigin)/uWaterSpan;
    // Pond illumination and its deep cyan basin belong to its physical footprint.
    // The long moat keeps its own broad world-space field, independent of the pond.
    vec2 drift=vec2(density,middleDensity)*.045;
    float pool=smoothstep(-.35,.38,field.y*.92+field.x*.20+broadDensity*.11);
    float reserve=1.-smoothstep(.24,.75,length((field+vec2(.20,.18)+drift)*vec2(1.15,.90)));
    float moatDepth=smoothstep(-1.15,1.05,broadDensity*.65+density*.24);
    float deep=mix(moatDepth*.45,pool*.94,uGardenWash);
    float lightReserve=mix(smoothstep(-.25,1.4,density)*.44,reserve*.88,uGardenWash);
    vec3 wash=mix(uCoolWash,uPaleWash,lightReserve);
    wash=mix(wash,uDeepWash,deep*(1.-lightReserve*.40));
    wash*=1.+clamp(density*.038+middleDensity*.024,-.10,.10);
    float luminance=dot(base.rgb,vec3(.2126,.7152,.0722));
    float ink=1.-smoothstep(.13,.53,luminance);
    vec3 reflection=mix(base.rgb,vec3(luminance*.68,luminance*.96,luminance*.95),.81);
    // Medium pale openings cross reflected forms with soft, unequal boundaries.
    // Dark silhouettes survive between the openings.
    float gap=smoothstep(.37,.87,washPatch+density*.075)*.61;
    float retention=mix(.16,.83,ink)*(1.-gap);
    base.rgb=mix(wash,reflection,retention);
  `);
  material.fragmentShader=material.fragmentShader.replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4(base.rgb,1.0)');
  material.toneMapped=false;
  return reflector;
}
