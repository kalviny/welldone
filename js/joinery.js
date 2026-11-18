import * as THREE from 'three';
import { paintMaterial, paperMap } from './paint.js';
import { createWatercolorPass } from './watercolor-pass.js';

export function createJoinery(container){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(renderer.domElement);
  const watercolor=createWatercolorPass(renderer);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xeee8d8);const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(12,9,15);camera.lookAt(0,2.1,1.5);
  scene.add(new THREE.HemisphereLight(0xfff2d5,0x899579,3));const sun=new THREE.DirectionalLight(0xfff0cf,3);sun.position.set(-5,10,8);scene.add(sun);
  const material=paintMaterial(0xd4a66b,'wood'),dark=paintMaterial(0xa78253,'wood');
  function cube(w,h,d,x,y,z,ma=material,group=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),ma);o.position.set(x,y,z);group.add(o);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry),new THREE.LineBasicMaterial({color:0x584d37,transparent:true,opacity:.2}));o.add(edge);return o;}
  // Two cheeks and an open mortise, with a correspondingly smaller tenon.
  const post=new THREE.Group();scene.add(post);cube(1.4,2.6,1.4,0,1.3,0,material,post);cube(.34,1.1,1.4,-.53,3.15,0,material,post);cube(.34,1.1,1.4,.53,3.15,0,material,post);cube(.72,1.1,.28,0,3.15,-.56,dark,post);
  const beam=new THREE.Group();scene.add(beam);cube(1.35,.9,3.5,0,3.12,2.35,material,beam);cube(.66,.85,1.3,0,3.12,.05,dark,beam);
  const peg=new THREE.Group();scene.add(peg);cube(1.8,.18,.18,0,3.25,.08,dark,peg);
  const grid=new THREE.GridHelper(10,10,0xc0c7b4,0xd0d3c6);grid.material.transparent=true;grid.material.opacity=.35;scene.add(grid);
  const guides=new THREE.Group();scene.add(guides);const lineMat=new THREE.LineDashedMaterial({color:0x7b8c6c,dashSize:.13,gapSize:.1,transparent:true,opacity:.6});for(const pts of[[[0,3.12,0],[0,3.12,4.8]],[[0,3.25,0],[-3,3.25,0]]]){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p))),lineMat);line.computeLineDistances();guides.add(line);}
  let previous=-1;
  function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.zoom=w<650?.72:1;camera.updateProjectionMatrix();previous=-1;}
  function render(progress){if(Math.abs(progress-previous)<.0003)return;previous=progress;const spread=Math.sin(Math.PI*THREE.MathUtils.clamp(progress,0,1));beam.position.z=spread*2.5;peg.position.x=-spread*2.7;peg.position.y=spread*.6;guides.visible=spread>.15;watercolor.render(scene,camera,paperMap(),.8);}
  resize();return {resize,render,renderer,scene};
}
