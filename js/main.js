import { loadPaint, paperMap, paintImage } from './paint.js';
import * as THREE from 'three';
import { InspectionControls } from './inspection-controls.js';
import { SETTINGS,SEASONS } from './config.js';
import { buildWorld } from './world.js';
import { WalkRoute } from './route.js';
import { createWatercolorPass } from './watercolor-pass.js';
import { textureCanvas,yieldFrame } from './textures.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const container=$('#scene'),walk=$('#walk'),sticky=$('.walk-sticky');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let world,renderer,camera,controls,joinery,watercolor,progress=0,desired=0,currentId='',season='autumn',mode='walk',snapshot=null,transition=null,ready=false,visible=true,joineryVisible=false,materialsVisible=false,lastFrame=0,activeFloor=1;
let materialUrls=null,lastMaterial=-1,toastTimer,joineryLoading=null,navigationRequest=0,teaPrefetch=null;
const capturedPointers=new Set();
const fade=document.createElement('div');fade.className='navigation-fade';fade.setAttribute('aria-hidden','true');sticky.append(fade);
const route=new WalkRoute();
const state={ready:false,mode:'walk',season:'autumn'};
function renderScene(){renderer.info.autoReset=false;renderer.info.reset();watercolor.render(world.scene,camera,paperMap(),1);}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
function scrollRange(){return Math.max(1,walk.offsetHeight-sticky.offsetHeight);}
function sectionProgress(el){return THREE.MathUtils.clamp(-el.getBoundingClientRect().top/Math.max(1,el.offsetHeight-innerHeight),0,1);}
function resize(){if(!renderer)return;const w=container.clientWidth,h=container.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,w<650?SETTINGS.mobilePixelRatio:SETTINGS.pixelRatio));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(mode==='walk')applyWalk(progress);else if(mode==='inspect')resetInspectionGesture();joinery?.resize();onScroll();}
function onScroll(){if(mode==='walk')desired=THREE.MathUtils.clamp((scrollY-walk.offsetTop)/scrollRange(),0,1);if(materialsVisible)updateMaterials();if(joineryVisible&&joinery)joinery.render(sectionProgress($('#joinery')));}
function updateUI(){const a=route.current(progress);state.location=a.id;state.floor=a.floor;sticky.classList.toggle('walking',progress>.012);$('.hero-copy').style.opacity=String(Math.max(0,1-progress/.016));$('#route-progress').style.width=`${progress*100}%`;if(a.id!==currentId){currentId=a.id;$('#location-number').textContent=String(route.anchors.findIndex(stop=>stop.id===a.id)+1).padStart(2,'0');$('#location-title').textContent=`${a.name} · ${a.en}`;$('#location-caption').textContent=a.caption;$$('#chapter-dots button').forEach(b=>{b.classList.toggle('active',b.dataset.jump===a.id);b.setAttribute('aria-current',String(b.dataset.jump===a.id));});if($('#map-dialog').open)renderMap(activeFloor);}}
function walkView(p){const view=route.sample(p);if(innerWidth<600){const weight=1-THREE.MathUtils.smoothstep(Math.abs(p-route.anchor('tea').progress),.002,.025);view.target.x-=.2*weight;view.target.z+=1.7*weight;}return view;}
function applyWalk(p){const view=walkView(p);const teaWeight=1-THREE.MathUtils.smoothstep(Math.abs(p-route.anchor('tea').progress),.002,.025);const openingWeight=1-THREE.MathUtils.smoothstep(p,0,.045);camera.fov=(innerWidth<650?57:THREE.MathUtils.lerp(SETTINGS.cameraFov,SETTINGS.panoramaFov,openingWeight))-4*teaWeight;camera.updateProjectionMatrix();camera.position.copy(view.position);if(innerWidth<600&&p<.018)view.target.x+=8*(1-p/.018);camera.lookAt(view.target);if(innerWidth<600&&p<.018){ // Keep the castle below the opening copy in a tall viewport.
    camera.setViewOffset(container.clientWidth,container.clientHeight,0,-container.clientHeight*.10*(1-p/.018),container.clientWidth,container.clientHeight);
  }else camera.clearViewOffset();}
// Camera ownership: walk sampler, covered destination cut, or local look controller.
// No tween crosses the building between unrelated camera poses.
function setMode(value){mode=value;state.mode=value;}
function releaseInspection(){
  if(!controls)return;
  controls.enabled=false;controls.dispose();controls=null;
  for(const id of capturedPointers){if(renderer.domElement.hasPointerCapture(id))renderer.domElement.releasePointerCapture(id);}
  capturedPointers.clear();renderer.domElement.style.touchAction='pan-y pinch-zoom';
}
function createInspection(){
  releaseInspection();controls=new InspectionControls(camera,renderer.domElement);
}
function inspectionUI(enabled){
  $('#inspection-bar').hidden=!enabled;$('#inspect').hidden=enabled;
  $('.hero-copy').style.pointerEvents=enabled?'none':'';sticky.classList.toggle('inspecting',enabled);
}
function finishTransition(){
  const next=transition;transition=null;fade.style.opacity='0';setMode(next.destination);
  if(controls)controls.enabled=mode==='inspect';
}
function changeView(destination,commit,{instant=false}={}){
  releaseInspection();
  if(instant||reduced){transition=null;fade.style.opacity='1';commit();fade.style.opacity='0';setMode(destination);return;}
  // Replace a pending request; retain the current cover opacity.
  transition={destination,commit,elapsed:0,covered:false,opacity:Number(fade.style.opacity)||0};setMode('transition');
}
function advanceTransition(dt){
  const next=transition;if(!next)return;
  next.elapsed+=dt;
  if(!next.covered){
    fade.style.opacity=String(THREE.MathUtils.lerp(next.opacity,1,Math.min(1,next.elapsed/.14)));
    if(next.elapsed>=.14){fade.style.opacity='1';next.commit();if(controls)controls.enabled=false;next.covered=true;next.elapsed=0;}
  }else{
    fade.style.opacity=String(1-Math.min(1,next.elapsed/.18));
    if(next.elapsed>=.18)finishTransition();
  }
}
function unlockInspection(){
  if(!snapshot)return;
  document.body.style.overflow=snapshot.overflow;
  Object.assign(world.scene.fog,snapshot.fog);
  world.roofs.forEach((roof,i)=>roof.visible=snapshot.roofs[i]);renderer.shadowMap.needsUpdate=true;
  inspectionUI(false);
}
function placeWalk(p){
  progress=desired=p;applyWalk(p);updateUI();
  scrollTo({top:walk.offsetTop+p*scrollRange(),behavior:'instant'});
}
async function jump(id,{instant=false}={}){
  const anchor=route.anchor(id);if(!anchor)return;
  if(!ready){toast('城门即将开启，请稍候');return;}
  const request=++navigationRequest;
  $('#map-dialog').close();
  if(id==='tea'){
    state.destinationLoading=id;container.setAttribute('aria-busy','true');if(!world.tea.paper)toast('正在准备茶室材质…');
    try{await world.tea.load();}catch{toast('茶室纹理暂未加载，先显示基础材质');}
    if(request!==navigationRequest)return;
    state.destinationLoading=null;container.removeAttribute('aria-busy');
  }else{state.destinationLoading=null;container.removeAttribute('aria-busy');}
  // Stop browser smooth scrolling before it can overwrite the new destination.
  scrollTo({top:scrollY,behavior:'instant'});
  const commit=()=>{unlockInspection();snapshot=null;placeWalk(anchor.progress);$('#inspect').focus({preventScroll:true});};
  changeView('walk',commit,{instant});
}
function enterInspection(){
  if(!ready||mode!=='walk')return;
  ++navigationRequest;state.destinationLoading=null;container.removeAttribute('aria-busy');
  snapshot={progress,desired,scroll:scrollY,range:scrollRange(),width:container.clientWidth,height:container.clientHeight,
    position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov,view:camera.view?{...camera.view}:null,
    focus:$('#inspect'),overflow:document.body.style.overflow,roofs:world.roofs.map(roof=>roof.visible),fog:{near:world.scene.fog.near,far:world.scene.fog.far}};
  scrollTo({top:scrollY,behavior:'instant'});document.body.style.overflow='hidden';
  inspectionUI(true);
  // Keep the exact live pose, FOV, framing and roof visibility on entry.
  changeView('inspect',()=>{createInspection();$('#return-walk').focus({preventScroll:true});},{instant:true});
  toast('原地观察：拖动转向、缩放；返回后继续漫游');
}
function exitInspection(immediate=false){
  if(!snapshot)return;
  ++navigationRequest;state.destinationLoading=null;container.removeAttribute('aria-busy');
  changeView('walk',()=>{
    const saved=snapshot;unlockInspection();progress=saved.progress;desired=saved.desired;
    const sameSize=container.clientWidth===saved.width&&container.clientHeight===saved.height;
    if(sameSize){camera.position.copy(saved.position);camera.quaternion.copy(saved.quaternion);camera.fov=saved.fov;
      if(saved.view?.enabled)camera.setViewOffset(saved.view.fullWidth,saved.view.fullHeight,saved.view.offsetX,saved.view.offsetY,saved.view.width,saved.view.height);else camera.clearViewOffset();camera.updateProjectionMatrix();
    }else applyWalk(progress);
    scrollTo({top:walk.offsetTop+(saved.scroll-walk.offsetTop)/saved.range*scrollRange(),behavior:'instant'});
    // Keep the saved pose visible through the reveal, then resume any pending
    // scroll progression using the saved destination.
    updateUI();saved.focus?.focus({preventScroll:true});snapshot=null;
  },{instant:immediate});
  clearTimeout(toastTimer);$('#toast').classList.remove('visible');
}
function resetInspectionGesture(){if(mode==='inspect')controls?.cancel();}
function setSeason(name){if(!SEASONS[name])return;season=name;state.season=name;world?.setSeason(name);$$('[data-season]').forEach(b=>{const selected=b.dataset.season===name;b.setAttribute('aria-pressed',String(selected));b.classList.toggle('selected',selected);});$('#garden-season-caption').textContent=SEASONS[name].caption;const image=$('#garden-image');image.srcset=`./assets/garden-${name}-640.webp 640w, ./assets/garden-${name}-960.webp 960w, ./assets/garden-${name}-1600.webp 1600w`;image.src=`./assets/garden-${name}-960.webp`;image.alt=SEASONS[name].alt;}

const materialContent=[{kind:'wood',title:'木有年轮，<br>也有记忆。',description:'被脚步磨亮的杉木地板，留着暖色的纹路。每一道细痕，都是曾经的日常。'},{kind:'plaster',title:'把日光，<br>轻轻接住。',description:'灰泥不求平整如镜。细微的起伏，让午后的光有了温柔的落点。'},{kind:'roof',title:'层层叠叠，<br>听过雨声。',description:'蓝灰色瓦片顺着屋坡相叠。深檐把雨水送走，也为回廊留下一道阴凉。'},{kind:'stone',title:'石头记得，<br>山的形状。',description:'不规则的石块彼此依靠。缝隙里长出的苔藓，慢慢替岁月描边。'}];
function updateMaterials(){if(!materialUrls){materialUrls=materialContent.map(m=>{const c=textureCanvas(m.kind,2048),g=c.getContext('2d'),image=paintImage(m.kind);if(image){g.globalAlpha=m.kind==='plaster'?.82:m.kind==='stone'?.20:.32;g.drawImage(image,0,0,2048,2048);g.globalAlpha=1;}const paper=paintImage('paper');if(paper){g.globalCompositeOperation='multiply';g.globalAlpha=.15;g.fillStyle=g.createPattern(paper,'repeat');g.fillRect(0,0,2048,2048);g.globalAlpha=1;g.globalCompositeOperation='source-over';}return c.toDataURL('image/webp',.94);});}const p=sectionProgress($('#materials')),phase=Math.min(p*4,3.99999),index=Math.floor(phase),local=phase-index;const zoom=THREE.MathUtils.smoothstep(local,.2,.82),opacity=local>.86?1-THREE.MathUtils.smoothstep(local,.86,1):local<.09?THREE.MathUtils.smoothstep(local,0,.09):1;$('#material-surface').style.transform=`scale(${1+zoom*.9}) translate(${zoom*3}%,${-zoom*2}%)`;$('#material-surface').style.opacity=String(index===0&&local<.09?1:Math.max(.03,opacity));if(index!==lastMaterial){lastMaterial=index;const m=materialContent[index];$('#material-surface').style.backgroundImage=`url(${materialUrls[index]})`;$('#material-title').innerHTML=m.title;$('#material-description').textContent=m.description;$('#material-index').textContent=`0${index+1} — 04`;$$('#material-tabs span').forEach((s,i)=>s.classList.toggle('active',i===index));}$('.material-track span').style.width=`${p*100}%`;state.material={index,local,zoom};}

const mapNodes={1:[['lookout',215,8,130,52,'天守 · 楼梯'],['armory',365,76,102,55,'兵具间'],['tea',93,135,110,100,'茶室'],['study',357,135,110,100,'书斋'],['garden',215,125,130,95,'中庭'],['corridor',93,247,374,35,'主回廊'],['entrance',235,288,90,32,'主殿入口'],['forecourt',215,334,130,42,'前庭'],['guard',93,392,110,38,'守卫室'],['gate',235,392,90,38,'城门'],['bridge',250,442,60,34,'木桥'],['approach',220,488,120,30,'山路']],2:[['stairs',370,190,55,140,'上行木阶'],['upper',160,115,265,60,'上层回廊'],['lookout',160,190,55,140,'通往望楼']],3:[['lookout',165,160,250,180,'望楼 · 远山入窗']]};
function renderMap(floor=1){activeFloor=floor;$$('[data-floor]').forEach(b=>b.setAttribute('aria-selected',String(+b.dataset.floor===floor)));const nodes=mapNodes[floor];const view=floor===1?'60 0 440 535':'90 70 400 320';let svg=`<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="map-hatch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="#d1d7c6" stroke-width=".5"/></pattern></defs><rect x="80" y="5" width="400" height="430" fill="url(#map-hatch)" stroke="#c4cbb8" stroke-width="1"/><path d="M280 510V260H145V185M280 260H410V103H280V36" stroke="#9aaa88" stroke-dasharray="4 5" fill="none"/><text x="90" y="30" font-size="10">N ↑</text>`;for(const[id,x,y,w,h,label]of nodes){const actual=floor===1&&id==='lookout'?'stairs':id;svg+=`<g data-jump="${actual}" role="button" tabindex="0" aria-label="前往${label}" class="${currentId===actual?'current':''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${id==='garden'?'#d9dfc8':'#f4ecd8'}" stroke="#9aa78b"/><text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle">${label}</text></g>`;}svg+='</svg>';$('#floor-plan').innerHTML=svg;}
$$('.map-toggle').forEach(b=>b.addEventListener('click',()=>{renderMap(route.current(progress).floor);$('#map-dialog').showModal();}));$('#close-map').addEventListener('click',()=>$('#map-dialog').close());$('#map-dialog').addEventListener('click',e=>{if(e.target===$('#map-dialog'))$('#map-dialog').close();});$$('[data-floor]').forEach(b=>b.addEventListener('click',()=>renderMap(+b.dataset.floor)));
document.addEventListener('click',e=>{const button=e.target.closest('[data-jump]');if(button)jump(button.dataset.jump);});$('#floor-plan').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.dataset.jump){e.preventDefault();jump(e.target.dataset.jump);}});
$$('[data-season]').forEach(b=>b.addEventListener('click',()=>setSeason(b.dataset.season)));$('#begin').addEventListener('click',()=>jump('bridge'));$('#visit-garden').addEventListener('click',()=>jump('garden'));$('#inspect').addEventListener('click',enterInspection);$('#return-walk').addEventListener('click',()=>exitInspection());document.addEventListener('keydown',e=>{if(e.key!=='Escape'||$('#map-dialog').open)return;if(snapshot)exitInspection();else if(transition||state.destinationLoading){++navigationRequest;state.destinationLoading=null;container.removeAttribute('aria-busy');transition=null;fade.style.opacity='0';setMode('walk');applyWalk(progress);onScroll();}});
$$('a[href="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();jump('approach');}));
route.anchors.forEach((a,i)=>{const b=document.createElement('button');b.dataset.jump=a.id;b.title=`${i+1} ${a.name}`;b.setAttribute('aria-label',`前往${a.name}`);$('#chapter-dots').append(b);});
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{lastFrame=0;if(document.hidden)resetInspectionGesture();});addEventListener('blur',resetInspectionGesture);
const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===walk)visible=entry.isIntersecting;if(entry.target.id==='materials'){materialsVisible=entry.isIntersecting;if(materialsVisible)updateMaterials();}if(entry.target.id==='joinery'){joineryVisible=entry.isIntersecting;if(joineryVisible&&!joinery&&!joineryLoading){joineryLoading=import('./joinery.js').then(({createJoinery})=>{joinery=createJoinery($('#joinery-scene'));if(joineryVisible)joinery.render(sectionProgress($('#joinery')));}).catch(error=>{console.error(error);toast('木构示意暂未加载，请刷新重试。');});}if(joineryVisible)joinery?.render(sectionProgress(entry.target));}}},{rootMargin:'150px'});[walk,$('#materials'),$('#joinery')].forEach(e=>observer.observe(e));

async function init(){try{
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;container.append(renderer.domElement);
  watercolor=createWatercolorPass(renderer);
  camera=new THREE.PerspectiveCamera(SETTINGS.cameraFov,1,.07,350);camera.userData.walkCamera=true;renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','自由观察：拖动环视，方向键转向，滚轮或双指变焦');renderer.domElement.style.touchAction='pan-y pinch-zoom';renderer.domElement.addEventListener('gotpointercapture',e=>capturedPointers.add(e.pointerId));renderer.domElement.addEventListener('lostpointercapture',e=>capturedPointers.delete(e.pointerId));resize();applyWalk(0);
  $('#loading-text').textContent='调开颜料，铺好画纸';await loadPaint(renderer);
  world=await buildWorld(renderer,text=>$('#loading-text').textContent=text,async scene=>{if(renderer.compileAsync)await renderer.compileAsync(scene,camera);renderer.render(scene,camera);await yieldFrame();});$('#loading-text').textContent='让光落在屋檐上';await yieldFrame();if(renderer.compileAsync)await renderer.compileAsync(world.scene,camera);else renderer.compile(world.scene,camera);renderScene();await yieldFrame();renderer.shadowMap.autoUpdate=false;ready=state.ready=true;$('#loading').classList.add('loaded');onScroll();progress=desired;applyWalk(progress);updateUI();if(new URLSearchParams(location.search).get('room')==='tea')await jump('tea',{instant:true});
  window.castle={state,route,world,camera,renderer,jump,setSeason,enterInspection,exitInspection,audit:()=>route.audit(world.colliders),get progress(){return progress;},get desired(){return desired;},get mode(){return mode;},captureView(id){const a=route.anchor(id);if(!a)throw Error('Unknown anchor');applyWalk(a.progress);world.update(0,true);renderScene();return renderer.domElement.toDataURL('image/png');},renderAt(p){progress=desired=p;applyWalk(p);world.update(0,true);renderScene();updateUI();},stats:()=>world.stats()};
  requestAnimationFrame(animate);
}catch(error){console.error(error);$('#loading').classList.remove('loaded');$('#loading-text').textContent='场景未能加载，请使用支持 WebGL 的浏览器重试。';toast('三维场景加载失败，建筑图文仍可阅读。');}}
function animate(now){requestAnimationFrame(animate);if(document.hidden)return;const dt=lastFrame?Math.min((now-lastFrame)/1000,.05):.016;lastFrame=now;if(!visible&&mode!=='transition')return;
  if(mode==='walk'){progress=THREE.MathUtils.lerp(progress,desired,reduced?1:1-Math.exp(-dt*11));if(Math.abs(progress-desired)<.000005)progress=desired;applyWalk(progress);}else if(mode==='inspect'){controls.update();}else if(mode==='transition'){advanceTransition(dt);}

  if(progress>.40&&progress<.72&&!teaPrefetch)teaPrefetch=world.tea.load().catch(()=>toast('茶室纹理暂未加载，先显示基础材质'));
  updateUI();world.update(now*.001,reduced);renderScene();
}
init();
