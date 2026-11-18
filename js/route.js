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
  // Physical regions also cover return legs and door crossings.
  location(position){
    const {x,y,z}=position;let id;
    if(z>44)id='approach';
    else if(z>30.5)id='bridge';
    else if(z>=27.5)id='gate';
    else if(x< -5.3&&z>=20&&z<28)id='guard';
    else if(z>11)id='forecourt';
    else if(z>=10)id='entrance';
    else if(x< -3.7&&z>=-24.3&&z<=-16.5&&y>12.15&&y<17.15)id='stairs';
    else if(y>=16.8)id='lookout';
    else if(y>=11.95)id='upper';
    else if(z<=-15&&x<=6)id='stairs';
    else if(z>=3)id='corridor';
    else if(x< -5.25)id='tea';
    else if(x>5.25)id=z< -9.1?'armory':'study';
    else id='garden';
    const anchor=this.anchor(id);
    const floor=id==='stairs'?(y>=12?2:1):anchor.floor;
    return floor===anchor.floor?anchor:{...anchor,floor};
  }
  current(progress){
    const {position,target}=this.sample(progress),place=this.location(position);
    // On a stair approach the visible subject changes before the eye crosses
    // the room boundary. Use the same sampled gaze in either scroll direction.
    const eastApproach=place.id==='armory'&&position.z<=-14&&target.x<9&&target.z<position.z-1.5;
    const westApproach=place.id==='upper'&&position.x< -3.7&&target.x< -3.7&&target.z>position.z+2&&target.y>position.y+.5;
    if(eastApproach||westApproach)return {...this.anchor('stairs'),floor:westApproach?2:1};
    return place;
  }
  anchor(id){return this.anchors.find(a=>a.id===id);}
  audit(colliders){const collisions=[];const samples=12001,clearance=.18;for(let i=0;i<samples;i++){const progress=i/(samples-1),p=this.sample(progress).position;const hit=colliders.find(b=>p.x>b.min[0]-clearance&&p.x<b.max[0]+clearance&&p.y>b.min[1]-clearance&&p.y<b.max[1]+clearance&&p.z>b.min[2]-clearance&&p.z<b.max[2]+clearance);if(hit)collisions.push({progress,position:p.toArray(),bounds:hit});}return {samples,clearance,collisions};}
}
