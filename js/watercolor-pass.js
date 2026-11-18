import * as THREE from 'three';

// A lightweight screen-space pigment pass over a LIVE multisampled scene render.
// This never samples the target illustration; only a small extracted paper grain.
export function createWatercolorPass(renderer) {
  let target, width=0, height=0;
  const uniforms={uFrame:{value:null},uPaper:{value:null},uSize:{value:new THREE.Vector2()},uStrength:{value:1}};
  const material=new THREE.ShaderMaterial({
    uniforms,depthTest:false,depthWrite:false,toneMapped:false,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
      uniform sampler2D uFrame; uniform sampler2D uPaper;
      uniform vec2 uSize; uniform float uStrength; varying vec2 vUv;
      void main(){
        vec2 px=1./uSize;
        float tooth=texture2D(uPaper,vUv*uSize/512.).r-.5;
        float crossTooth=texture2D(uPaper,vUv.yx*uSize.yx/417.+.31).r-.5;
        vec2 uv=vUv+vec2(tooth,crossTooth)*px*2.1*uStrength;
        vec3 center=texture2D(uFrame,uv).rgb;
        vec3 a=texture2D(uFrame,uv+vec2(px.x,0.)*1.25).rgb;
        vec3 b=texture2D(uFrame,uv-vec2(px.x,0.)*1.25).rgb;
        vec3 c=texture2D(uFrame,uv+vec2(0.,px.y)*1.25).rgb;
        vec3 d=texture2D(uFrame,uv-vec2(0.,px.y)*1.25).rgb;
        vec3 wash=center*.84+(a+b+c+d)*.04;
        vec3 pooled=min(min(a,b),min(c,d));
        wash=mix(wash,pooled,.07)* (1.+tooth*.48);
        gl_FragColor=vec4(mix(texture2D(uFrame,vUv).rgb,wash,uStrength),1.);
        #include <colorspace_fragment>
      }
    `
  });
  const scene=new THREE.Scene();scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);camera.position.z=1;
  function render(world,cameraView,paper,strength=1){
    if(!paper||strength<.001){renderer.render(world,cameraView);return;}
    const size=renderer.getDrawingBufferSize(new THREE.Vector2());
    if(width!==size.x||height!==size.y){
      target?.dispose();width=size.x;height=size.y;
      target=new THREE.WebGLRenderTarget(width,height,{samples:4});
      target.texture.colorSpace=THREE.SRGBColorSpace;
      uniforms.uFrame.value=target.texture;uniforms.uSize.value.copy(size);
    }
    uniforms.uPaper.value=paper;uniforms.uStrength.value=strength;
    renderer.setRenderTarget(target);
    renderer.render(world,cameraView);
    renderer.setRenderTarget(null);
    renderer.render(scene,camera);
  }
  return {render};
}
