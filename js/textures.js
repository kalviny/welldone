import * as THREE from 'three';

export function random(seed=137){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const cache=new Map();
export function textureCanvas(kind, size=512){
  const key=`${kind}-${size}`;if(cache.has(key))return cache.get(key);
  const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),r=random(113+kind.length),s=size;
  const palettes={wood:['#ad906b','#6e5137','#d4b58b'],plaster:['#ece6ce','#cfc9af','#f9f1d9'],roof:['#82918b','#687b76','#9ba59b'],stone:['#9a9d8b','#6d766a','#b7baa6'],tatami:['#b3b180','#838858','#caca9c']};
  const p=palettes[kind]||palettes.stone;g.fillStyle=p[0];g.fillRect(0,0,s,s);
  if(kind==='wood'){
    for(let i=0;i<120;i++){const x=r()*s;g.strokeStyle=i%3===0?p[1]+'55':p[2]+'55';g.lineWidth=.5+r()*2;g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+Math.sin(i)*13,s*.3,x+Math.cos(i)*18,s*.7,x,s);g.stroke();}
    for(let x=0;x<s;x+=s/5){g.fillStyle=p[1]+'99';g.fillRect(x,0,2,s);g.fillStyle=p[2]+'77';g.fillRect(x+2,0,1,s);}
    for(let i=0;i<8;i++){g.strokeStyle=p[1]+'55';g.lineWidth=1;const x=r()*s,y=r()*s;for(let j=1;j<4;j++){g.beginPath();g.ellipse(x,y,j*2.5,j*10,.03,0,Math.PI*2);g.stroke();}}
  }else if(kind==='roof'){
    for(let y=0;y<s;y+=s/8)for(let x=0;x<s;x+=s/8){const grad=g.createLinearGradient(x,y,x+s/8,y);grad.addColorStop(0,p[1]);grad.addColorStop(.35,p[0]);grad.addColorStop(.68,p[2]);grad.addColorStop(1,p[1]);g.fillStyle=grad;g.fillRect(x,y,s/8,s/8-2);g.fillStyle='#cad0bb44';g.fillRect(x+3,y+2,s/8-6,2);}
  }else if(kind==='stone'){
    const h=s/5;for(let y=0;y<s;y+=h){for(let x=-h;x<s;x+=h*1.5){const xx=x+(Math.round(y/h)%2)*h*.7;g.fillStyle=[p[0],p[1],p[2]][Math.floor(r()*3)];g.beginPath();g.moveTo(xx+4,y+3);g.lineTo(xx+h*1.5-7,y+7);g.lineTo(xx+h*1.5-3,y+h-5);g.lineTo(xx+8,y+h-2);g.closePath();g.fill();g.strokeStyle='#59635266';g.lineWidth=2;g.stroke();}}
  }else if(kind==='tatami'){
    for(let y=0;y<s;y+=3){g.strokeStyle=y%2?p[1]+'88':p[2];g.beginPath();g.moveTo(0,y);g.lineTo(s,y);g.stroke();}for(let x=0;x<s;x+=9){g.fillStyle=p[2]+'55';g.fillRect(x,0,1,s);}
  }
  // Sparse broad brush marks, deliberately avoiding photographic noise.
  for(let i=0;i<150;i++){g.fillStyle=(i%2?p[1]:p[2])+'0c';g.fillRect(r()*s,r()*s,5+r()*50,2+r()*6);}
  cache.set(key,c);return c;
}
export function texture(kind, renderer){const key=`gpu-${kind}`;if(cache.has(key))return cache.get(key);const t=new THREE.CanvasTexture(textureCanvas(kind));t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());cache.set(key,t);return t;}
export const yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0));
