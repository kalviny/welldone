const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
const report={checks:[],errors:[],screenshots:[]};
function check(name,ok,detail){report.checks.push({name,passed:!!ok,detail});assert(ok,`${name}: ${JSON.stringify(detail)}`);}
const url=process.env.TEST_URL||'http://127.0.0.1:4180/';
const expected=['approach','approach','approach','bridge','bridge','gate','forecourt','guard','forecourt','forecourt','forecourt','entrance','corridor','corridor','corridor','tea','tea','garden','garden','garden','garden','study','study','study','armory','stairs','stairs','stairs','stairs','upper','upper','stairs','stairs','lookout','lookout','lookout'];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-angle=metal']});try{
for(const [label,width,height]of[['desktop',1440,960],['narrow',390,844]]){const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:label==='narrow'?2:1,isMobile:label==='narrow',hasTouch:label==='narrow'});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});await page.goto(url);await page.waitForFunction(()=>window.castle?.state.ready);
const points=await page.evaluate(()=>castle.route.points.map((p,i)=>({i,p:castle.route.distanceAt(i/(castle.route.points.length-1))/castle.route.totalLength,position:p.p})));
for(const direction of ['forward','backward'])for(const point of direction==='forward'?points:[...points].reverse()){
 await page.evaluate(p=>{const el=document.querySelector('#walk'),sticky=document.querySelector('.walk-sticky');scrollTo({top:el.offsetTop+p*(el.offsetHeight-sticky.offsetHeight),behavior:'instant'});},point.p);
 await page.waitForFunction(p=>Math.abs(castle.progress-p)<.00015&&Math.abs(castle.progress-castle.desired)<.000005,point.p);
 const location=await page.evaluate(()=>({id:castle.state.location,floor:castle.state.floor,title:document.querySelector('#location-title').textContent,number:document.querySelector('#location-number').textContent}));
 check(`${label}: ${direction} waypoint ${point.i} belongs to ${expected[point.i]}`,location.id===expected[point.i]&&location.number!=='00',{...point,...location});
}
for(const id of ['tea','garden','study','lookout']){
 await page.evaluate(id=>castle.jump(id,{instant:true}),id);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForFunction(()=>castle.progress===castle.desired);
 const before=await page.evaluate(()=>({pos:castle.camera.position.toArray(),q:castle.camera.quaternion.toArray(),fov:castle.camera.fov,p:castle.progress,roofs:castle.world.roofs.map(r=>r.visible),location:castle.state.location}));
 await page.locator('#inspect').click();const entry=await page.evaluate(()=>({pos:castle.camera.position.toArray(),q:castle.camera.quaternion.toArray(),fov:castle.camera.fov,roofs:castle.world.roofs.map(r=>r.visible),location:castle.state.location}));
 check(`${label}: ${id} enters in place`,before.pos.every((v,i)=>Math.abs(v-entry.pos[i])<1e-8)&&before.q.every((v,i)=>Math.abs(v-entry.q[i])<1e-8)&&before.fov===entry.fov&&JSON.stringify(before.roofs)===JSON.stringify(entry.roofs)&&entry.location===id,{before,entry});
 if(id==='tea'||id==='garden'){const path=`tests/local-${label}-${id}-entry.png`;await page.screenshot({path});report.screenshots.push(path);}
 // A complete turn cannot carry the camera through a wall.
 const canvas=page.locator('#scene canvas');await canvas.focus();for(let i=0;i<130;i++)await page.keyboard.press('ArrowRight');await page.mouse.move(width*.55,height*.45);await page.mouse.wheel(0,-200);
 const after=await page.evaluate(()=>({pos:castle.camera.position.toArray(),q:castle.camera.quaternion.toArray(),fov:castle.camera.fov,p:castle.progress}));
 check(`${label}: ${id} full turn and zoom keep eye position`,before.pos.every((v,i)=>Math.abs(v-after.pos[i])<1e-8)&&before.p===after.p&&Math.abs(before.fov-after.fov)>1&&before.q.some((v,i)=>Math.abs(v-after.q[i])>.01));
 await page.keyboard.press('Escape');await page.waitForFunction(()=>castle.mode==='walk');const returned=await page.evaluate(()=>({pos:castle.camera.position.toArray(),q:castle.camera.quaternion.toArray(),fov:castle.camera.fov,location:castle.state.location}));
 check(`${label}: ${id} return restores pose and location`,before.pos.every((v,i)=>Math.abs(v-returned.pos[i])<.02)&&before.q.every((v,i)=>Math.abs(v-returned.q[i])<.001)&&before.fov===returned.fov&&returned.location===id);
}
await context.close();}
check('no browser errors',report.errors.length===0,report.errors);report.status='passed';
}finally{await browser.close();fs.writeFileSync('tests/local-inspection-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status||'failed',checks:report.checks.length,last:report.checks.at(-1),errors:report.errors}));}})().catch(e=>{console.error(e);process.exit(1)});
