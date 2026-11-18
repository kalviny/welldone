const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require(process.env.SHARP_PATH||'/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('fs'),assert=require('assert/strict');
const phase=process.env.STAIR_PHASE||'after',report={checks:[],errors:[],samples:[],screenshots:[]};
function check(name,ok,detail){report.checks.push({name,passed:!!ok,detail});assert(ok,`${name}: ${JSON.stringify(detail)}`);}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-angle=metal']});try{
for(const [label,width,height]of[['desktop',1440,960],['narrow',390,844]]){
const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:label==='narrow'?2:1,isMobile:label==='narrow',hasTouch:label==='narrow'});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(process.env.TEST_URL||'http://127.0.0.1:4180/');await page.waitForFunction(()=>window.castle?.state.ready);
const landmarks=await page.evaluate(()=>{const r=castle.route,armory=r.anchor('armory').index,stairs=r.anchor('stairs').index,upper=r.anchor('upper').index;return{armory,stairs,upper,firstFoot:stairs+1,secondFoot:upper+2,secondTop:upper+4};});
// Dense intermediate samples: center and four rays around it must not stare
// into a nearby floor underside while climbing either open stair lane.
const dense=await page.evaluate(async landmarks=>{const c=castle,THREE=await import('./vendor/three.module.js');c.world.scene.updateMatrixWorld(true);const roots=c.world.root.children.filter(o=>o.isMesh&&!o.material?.transparent&&o.material?.type!=='ShaderMaterial'),ray=new THREE.Raycaster(),bad=[],samples=[];
for(const [start,end]of[[landmarks.firstFoot,landmarks.upper],[landmarks.secondFoot,landmarks.secondTop]])for(let key=start;key<=end+.00001;key+=.02){const p=c.route.distanceAt(Math.min(key,end)/(c.route.points.length-1))/c.route.totalLength;c.renderAt(p);for(const [x,y]of[[0,0],[-.12,0],[.12,0],[0,.12],[0,-.12]]){ray.setFromCamera(new THREE.Vector2(x,y),c.camera);const hit=ray.intersectObjects(roots,true)[0];if(hit){const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);if(normal.y<-.75&&hit.distance<5)bad.push({key,ray:[x,y],distance:hit.distance,normal:normal.toArray(),point:hit.point.toArray()});}}samples.push({key,progress:p,location:c.state.location,floor:c.state.floor});}
return{samples,bad};},landmarks);
check(`${label}: intermediate ascent framing has no nearby floor underside`,dense.bad.length===0,{rays:dense.samples.length*5,bad:dense.bad});report.samples.push({viewport:label,...dense});
const cases=[['armory',landmarks.armory,'armory',1],['stair-reveal',landmarks.armory+.5,'stairs',1],['stair-approach',landmarks.armory+1.25,'stairs',1],['first-ascent',landmarks.firstFoot+.5,'stairs',1],['upper-landing',landmarks.upper,'upper',2],['second-approach',landmarks.secondFoot,'stairs',2],['second-ascent',landmarks.secondFoot+.5,'stairs',2],['lookout-landing',landmarks.secondTop,'lookout',3]];
const tiles=[];
for(const direction of ['forward','backward'])for(const [name,key,expected,floor]of direction==='forward'?cases:[...cases].reverse()){
const p=await page.evaluate(key=>castle.route.distanceAt(key/(castle.route.points.length-1))/castle.route.totalLength,key);
await page.evaluate(p=>{const el=document.querySelector('#walk'),sticky=document.querySelector('.walk-sticky');scrollTo({top:el.offsetTop+p*(el.offsetHeight-sticky.offsetHeight),behavior:'instant'});},p);
await page.waitForFunction(p=>Math.abs(castle.progress-p)<.00015&&Math.abs(castle.progress-castle.desired)<.000005,p);
const actual=await page.evaluate(()=>({id:castle.state.location,floor:castle.state.floor,title:document.querySelector('#location-title').textContent,caption:document.querySelector('#location-caption').textContent}));check(`${label}: ${direction} ${name} label`,actual.id===expected&&actual.floor===floor,actual);
if(direction==='forward'){const path=`tests/stair-${phase}-${label}-${name}.png`;await page.screenshot({path});report.screenshots.push(path);const tile=await sharp(path).resize(360,240,{fit:'contain',background:'#eeede5'}).extend({top:28,bottom:0,left:0,right:0,background:'#eeede5'}).composite([{input:Buffer.from(`<svg width="360" height="28"><text x="6" y="19" font-family="sans-serif" font-size="13">${label} · ${name}</text></svg>`),left:0,top:0}]).png().toBuffer();tiles.push({input:tile,left:(tiles.length%4)*360,top:Math.floor(tiles.length/4)*268});}
}
await sharp({create:{width:1440,height:Math.ceil(tiles.length/4)*268,channels:3,background:'#eeede5'}}).composite(tiles).png().toFile(`tests/stair-${phase}-${label}-contact.png`);
await context.close();}
check('no browser errors',report.errors.length===0,report.errors);report.status='passed';
}finally{await browser.close();fs.writeFileSync(`tests/stair-${phase}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status||'failed',checks:report.checks.length,last:report.checks.at(-1),screenshots:report.screenshots,errors:report.errors}));}})().catch(e=>{console.error(e);process.exit(1)});
