// Final panorama verification: desktop + a fresh narrow context (actual mobile LOD).
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
const base=process.env.TEST_URL||'http://127.0.0.1:4174/welldone/';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-angle=metal']});const report={url:base,errors:[],checks:[],metrics:[]};try{
 for(const [label,width,height,dpr]of[['desktop',1672,941,1],['narrow',390,844,2]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr,isMobile:width<650,hasTouch:width<650});const requests=[];
  page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  const started=Date.now();await page.goto(base);await page.waitForFunction(()=>window.castle?.state.ready,{timeout:120000});const readyMs=Date.now()-started;
  assert(!requests.some(u=>u.includes('/assets/tea/')));report.checks.push(`${label}: tea-specific textures remain lazy`);
  assert(!requests.some(u=>/\/assets\/(garden-|tea-\d|study-\d|lookout-\d)/.test(u)));report.checks.push(`${label}: below-fold images remain lazy`);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.checks.push(`${label}: layout fits`);
  const image=await page.evaluate(()=>castle.captureView('approach'));fs.writeFileSync(`tests/panorama-${label}.png`,Buffer.from(image.split(',')[1],'base64'));await page.screenshot({path:`tests/panorama-${label}-ui.png`});
  const metrics=await page.evaluate(async()=>{let last;const frames=[];await new Promise(resolve=>{const frame=t=>{if(last)frames.push(t-last);last=t;if(frames.length<90)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});return{fps:1000/(frames.reduce((a,b)=>a+b)/frames.length),p95:frames.sort((a,b)=>a-b)[85],stats:castle.stats()};});report.metrics.push({label,width,height,dpr,readyMs,...metrics});
  const before=await page.evaluate(()=>({position:castle.camera.position.toArray(),q:castle.camera.quaternion.toArray(),p:castle.progress}));await page.locator('#inspect').click();await page.waitForFunction(()=>castle.mode==='inspect');await page.mouse.move(width*.55,height*.48);await page.mouse.down();await page.mouse.move(width*.65,height*.43,{steps:8});await page.mouse.up();await page.waitForTimeout(200);await page.screenshot({path:`tests/panorama-${label}-orbit.png`});assert(await page.evaluate(q=>castle.camera.quaternion.toArray().some((n,i)=>Math.abs(n-q[i])>.01),before.q));await page.locator('#return-walk').click();await page.waitForFunction(()=>castle.mode==='walk');assert(await page.evaluate(b=>Math.abs(castle.progress-b.p)<.0001&&castle.camera.position.toArray().every((n,i)=>Math.abs(n-b.position[i])<.02),before));report.checks.push(`${label}: local look and precise return`);
  for(const season of ['spring','summer','autumn','winter']){await page.evaluate(s=>castle.setSeason(s),season);await page.waitForTimeout(80);assert(await page.evaluate(s=>castle.state.season===s&&castle.world.scene.userData.season===s,season));}report.checks.push(`${label}: four seasons remain functional`);
  await page.close();
 }
 assert.equal(report.errors.length,0);report.status='passed';
}finally{await browser.close();fs.writeFileSync('tests/panorama-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}})().catch(e=>{console.error(e);process.exit(1);});
