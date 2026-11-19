const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const report={url:base,checks:[],errors:[],warnings:[],requests:[],screenshots:[]};
function check(name,value,detail){report.checks.push({name,passed:!!value,detail});if(!value)throw Error(`${name}: ${JSON.stringify(detail)}`);}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-angle=metal']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);report.requests.push(r.url());});
 const start=Date.now();await page.goto(base);await page.waitForFunction(()=>window.castle?.state.ready,{timeout:120000});
 check('scene ready',true,{milliseconds:Date.now()-start,stats:await page.evaluate(()=>castle.stats())});
 check('below-fold WebP not requested initially',!report.requests.some(u=>/\/assets\/(garden-|tea-\d|study-\d|lookout-\d)/.test(u)));
 await page.waitForTimeout(500);await page.screenshot({path:'tests/desktop.png'});report.screenshots.push('desktop.png');
 check('desktop no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const audit=await page.evaluate(()=>castle.audit());check('route camera clearance includes solid walls, posts and paper screens',audit.collisions.length===0,{samples:audit.samples,collisions:audit.collisions.slice(0,5)});
 const floorAudit=await page.evaluate(async()=>{const THREE=await import('./vendor/three.module.js');castle.world.scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(),bad=[];const roots=castle.world.root.children.filter(o=>o.isMesh&&!o.material?.transparent&&o.material?.type!=='ShaderMaterial');for(let i=0;i<=200;i++){const p=castle.route.sample(i/200).position;ray.set(p,new THREE.Vector3(0,-1,0));ray.far=8;const hits=ray.intersectObjects(roots,true).filter(h=>h.object.visible);const d=hits[0]?.distance;if(d===undefined||d>2.15||d<1.05)bad.push({p:i/200,clearance:d,position:p.toArray()});}return bad;});
 report.floorAudit=floorAudit;check('route has continuous walkable support',floorAudit.length===0,floorAudit);
 // Exercise every shared jump anchor through visible chapter buttons.
 const anchors=await page.evaluate(()=>castle.route.anchors.map(a=>({id:a.id,progress:a.progress})));
 for(const a of anchors){await page.locator(`#chapter-dots [data-jump="${a.id}"]`).click();await page.waitForFunction(p=>castle.mode==='walk'&&Math.abs(castle.progress-p)<.0006,a.progress,{timeout:10000});const camera=await page.evaluate(()=>({pos:castle.camera.position.toArray(),mode:castle.mode,scroll:scrollY,title:document.querySelector('#location-title').textContent}));check(`jump ${a.id}`,camera.mode==='walk'&&camera.pos.every(Number.isFinite),camera);}
 await page.evaluate(()=>castle.jump('tea',{instant:true}));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForFunction(()=>castle.progress===castle.desired);const before=await page.evaluate(()=>({progress:castle.progress,pos:castle.camera.position.toArray(),q:castle.camera.quaternion.toArray(),scroll:scrollY}));
 await page.locator('#inspect').click();await page.waitForFunction(()=>castle.mode==='inspect');check('inspection entered',await page.evaluate(()=>castle.mode==='inspect'&&document.body.style.overflow==='hidden'));
 await page.mouse.move(950,420);await page.mouse.down();await page.mouse.move(1090,490,{steps:8});await page.mouse.up();await page.mouse.wheel(0,-280);await page.waitForTimeout(350);
 const inspected=await page.evaluate(()=>({pos:castle.camera.position.toArray(),q:castle.camera.quaternion.toArray()}));check('local look changes direction without moving through walls',inspected.q.some((x,i)=>Math.abs(x-before.q[i])>.01)&&inspected.pos.every((x,i)=>Math.abs(x-before.pos[i])<.00001),{before,inspected});
 await page.locator('#return-walk').click();await page.waitForFunction(()=>castle.mode==='walk');await page.waitForTimeout(100);const restored=await page.evaluate(()=>({progress:castle.progress,pos:castle.camera.position.toArray(),q:castle.camera.quaternion.toArray(),scroll:scrollY,roofs:castle.world.roofs.every(o=>o.visible)}));check('inspection returns to saved pose and scroll',Math.abs(before.progress-restored.progress)<.0001&&before.pos.every((x,i)=>Math.abs(x-restored.pos[i])<.02)&&Math.abs(before.scroll-restored.scroll)<2&&restored.roofs,restored);
 const poses=[];for(const s of['spring','summer','autumn','winter']){await page.locator(`.season-control [data-season="${s}"]`).click();poses.push(await page.evaluate(()=>({season:castle.state.season,pos:castle.camera.position.toArray(),color:castle.world.m.leaf.color.getHex()})));}check('all four seasons update materials',new Set(poses.map(p=>p.color)).size===4,poses);check('season keeps camera pose',poses.every(p=>p.pos.every((x,i)=>Math.abs(x-poses[0].pos[i])<.02)));
 await page.locator('.season-control [data-season="autumn"]').click();
 // The whole scroll track stays within the 3D viewer, including its endpoint.
 check('only the 3D section remains',await page.locator('main section').evaluateAll(es=>es.length===1&&es[0].id==='walk'));
 check('editorial pages and navigation removed',await page.locator('#architecture,#materials,#joinery,#gardens,#rooms,.desktop-nav,footer,.hero-copy').count()===0);
 await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
 await page.waitForFunction(()=>castle.progress===1&&castle.desired===1);
 check('scroll endpoint stays in full-screen 3D',await page.locator('.walk-sticky').evaluate(e=>{const b=e.getBoundingClientRect();return Math.abs(b.top)<2&&Math.abs(b.bottom-innerHeight)<2;}));
 await page.screenshot({path:'tests/3d-only-endpoint.png'});
 await page.locator('#chapter-dots [data-jump="approach"]').click();await page.waitForFunction(()=>castle.mode==='walk'&&castle.progress===0);
 check('editorial modules and images never requested',!report.requests.some(u=>/joinery\.js|\/assets\/(garden-|tea-\d|study-\d|lookout-\d|paint\/page)/.test(u)));
 // Tall viewport, same live WebGL implementation.
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>castle.jump('approach',{instant:true}));await page.waitForTimeout(400);await page.screenshot({path:'tests/mobile.png'});check('narrow no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 check('mobile primary controls fit viewport',await page.locator('#inspect').evaluate(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.bottom<=innerHeight;}));
 await page.locator('#chapter-dots [data-jump="tea"]').click();await page.waitForFunction(()=>castle.mode==='walk'&&Math.abs(castle.progress-castle.route.anchor('tea').progress)<.0001);await page.locator('#inspect').click();await page.waitForFunction(()=>castle.mode==='inspect');await page.locator('#return-walk').click();await page.waitForFunction(()=>castle.mode==='walk');check('narrow inspection return',true);
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>castle.jump('lookout',{instant:true}));await page.waitForTimeout(150);
 check('short landscape viewer fits',await page.locator('.walk-sticky').evaluate(e=>Math.abs(e.getBoundingClientRect().height-innerHeight)<2));
 check('short landscape controls fit',await page.locator('#inspect').evaluate(e=>{const b=e.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight;}));
 check('no console or network errors',report.errors.length===0,report.errors);
 report.status='passed';
 }finally{await browser.close();fs.writeFileSync('tests/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status||'failed',checks:report.checks.length,errors:report.errors,warnings:report.warnings},null,2));}
})().catch(e=>{console.error(e);process.exit(1);});
