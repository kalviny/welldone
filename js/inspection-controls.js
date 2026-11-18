import * as THREE from 'three';

// Inspect from the current eye position: turn and change the lens, never move
// the camera through nearby walls or force an interior into an exterior orbit.
export class InspectionControls {
  constructor(camera,element){
    this.camera=camera;this.element=element;this.enabled=true;this.pointers=new Map();
    this.touchAction=element.style.touchAction;this.dirty=false;
    const direction=camera.getWorldDirection(new THREE.Vector3());
    this.yaw=Math.atan2(-direction.x,-direction.z);this.pitch=Math.asin(THREE.MathUtils.clamp(direction.y,-1,1));
    this.euler=new THREE.Euler(0,0,0,'YXZ');
    this.handlers={
      pointerdown:e=>this.down(e),pointermove:e=>this.move(e),
      pointerup:e=>this.up(e),pointercancel:()=>this.cancel(),lostpointercapture:e=>this.up(e),
      wheel:e=>{if(this.enabled){e.preventDefault();this.zoom(this.camera.fov+e.deltaY*.035);}},
      keydown:e=>this.key(e),contextmenu:e=>e.preventDefault()
    };
    for(const [type,handler]of Object.entries(this.handlers))element.addEventListener(type,handler,{passive:false});
    element.style.touchAction='none';
  }
  down(event){
    if(!this.enabled||(event.pointerType==='mouse'&&event.button!==0))return;
    event.preventDefault();this.element.focus({preventScroll:true});
    this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    this.element.setPointerCapture(event.pointerId);
  }
  distance(){const [a,b]=this.pointers.values();return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;}
  move(event){
    const previous=this.pointers.get(event.pointerId);if(!this.enabled||!previous)return;
    event.preventDefault();const distance=this.distance(),dx=event.clientX-previous.x,dy=event.clientY-previous.y;
    this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(this.pointers.size===1){this.yaw-=dx*.004;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.004,-Math.PI/2+.08,Math.PI/2-.08);this.dirty=true;}
    else{const next=this.distance();if(distance>1&&next>1)this.zoom(this.camera.fov*distance/next);}
  }
  zoom(fov){this.camera.fov=THREE.MathUtils.clamp(fov,25,80);this.camera.updateProjectionMatrix();}
  up(event){
    this.pointers.delete(event.pointerId);
    if(this.element.hasPointerCapture(event.pointerId))this.element.releasePointerCapture(event.pointerId);
  }
  cancel(){
    const ids=[...this.pointers.keys()];this.pointers.clear();
    for(const id of ids)if(this.element.hasPointerCapture(id))this.element.releasePointerCapture(id);
  }
  key(event){
    if(!this.enabled)return;
    const angles={ArrowLeft:[.05,0],ArrowRight:[-.05,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]};
    if(angles[event.key]){event.preventDefault();const [yaw,pitch]=angles[event.key];this.yaw+=yaw;this.pitch=THREE.MathUtils.clamp(this.pitch+pitch,-Math.PI/2+.08,Math.PI/2-.08);this.dirty=true;}
    else if(['+','=','-'].includes(event.key)){event.preventDefault();this.zoom(this.camera.fov+(event.key==='-'?3:-3));}
  }
  update(){if(this.enabled&&this.dirty){this.euler.set(this.pitch,this.yaw,0);this.camera.quaternion.setFromEuler(this.euler);this.dirty=false;}}
  dispose(){
    this.enabled=false;this.cancel();
    for(const [type,handler]of Object.entries(this.handlers))this.element.removeEventListener(type,handler);
    this.element.style.touchAction=this.touchAction;
  }
}
