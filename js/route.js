import * as THREE from 'three';
import { WAYPOINTS } from './config.js';

// A low-tension spline rounds corners without swinging into adjacent rooms.
export class WalkRoute {
  constructor(){
    this.points=WAYPOINTS;
    this.positions=new THREE.CatmullRomCurve3(WAYPOINTS.map(a=>new THREE.Vector3(...a.p)),false,'catmullrom',.08);
    this.targets=WAYPOINTS.map(a=>new THREE.Vector3(...a.t));
    this.samples=[];this.totalLength=0;let last=this.positions.getPoint(0);
    for(let i=0;i<=4000;i++){const t=i/4000,p=this.positions.getPoint(t);this.totalLength+=p.distanceTo(last);this.samples.push({t,d:this.totalLength});last=p;}
    this.anchors=WAYPOINTS.map((p,i)=>({...p,index:i,t:i/(WAYPOINTS.length-1)})).filter(a=>a.id).map(a=>({...a,progress:this.distanceAt(a.t)/this.totalLength}));
  }
  distanceAt(t){const n=t*(this.samples.length-1),i=Math.floor(n),a=this.samples[i],b=this.samples[Math.min(i+1,this.samples.length-1)];return THREE.MathUtils.lerp(a.d,b.d,n-i);}
  parameter(progress){const d=THREE.MathUtils.clamp(progress,0,1)*this.totalLength;let low=0,high=this.samples.length-1;while(low<high){const mid=(low+high)>>1;if(this.samples[mid].d<d)low=mid+1;else high=mid;}const b=this.samples[low],a=this.samples[Math.max(0,low-1)];return THREE.MathUtils.lerp(a.t,b.t,b.d===a.d?0:(d-a.d)/(b.d-a.d));}
  sample(progress){const t=this.parameter(progress),n=t*(WAYPOINTS.length-1),i=Math.min(Math.floor(n),WAYPOINTS.length-2),f=n-i,s=f*f*(3-2*f);return {position:this.positions.getPoint(t),target:this.targets[i].clone().lerp(this.targets[i+1],s)};}
  current(progress){let current=this.anchors[0];for(const a of this.anchors)if(progress>=a.progress-.006)current=a;return current;}
  anchor(id){return this.anchors.find(a=>a.id===id);}
  audit(colliders){const collisions=[];const samples=12001,clearance=.18;for(let i=0;i<samples;i++){const progress=i/(samples-1),p=this.sample(progress).position;const hit=colliders.find(b=>p.x>b.min[0]-clearance&&p.x<b.max[0]+clearance&&p.y>b.min[1]-clearance&&p.y<b.max[1]+clearance&&p.z>b.min[2]-clearance&&p.z<b.max[2]+clearance);if(hit)collisions.push({progress,position:p.toArray(),bounds:hit});}return {samples,clearance,collisions};}
}
