// Regression for lazy room textures and the local watercolor render pass.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require(process.env.SHARP_PATH||'/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-angle=metal']});
 const report={checks:[],errors:[],metrics:[]};
 try{
  const page=await browser.newPage({viewport:{width:1672,height:941},deviceScaleFactor:1});
  const requests=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await page.goto('http://127.0.0.1:4174/welldone/');await page.waitForFunction(()=>window.castle?.state.ready);
  assert(!requests.some(u=>u.includes('/assets/tea/')));report.checks.push('opening does not request tea material maps');
  await page.evaluate(()=>castle.jump('tea',{instant:true}));await page.waitForFunction(()=>!!castle.world.tea.paper);
  assert(requests.filter(u=>u.includes('/assets/tea/')).every(u=>u.includes('/welldone/assets/tea/')));report.checks.push('lazy tea maps load under repository subpath');
  for(const [label,width,height]of[['desktop',1672,941],['narrow',390,844]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>castle.jump('tea',{instant:true}));await page.waitForTimeout(350);
   const data=await page.evaluate(()=>castle.captureView('tea'));const png=Buffer.from(data.split(',')[1],'base64');fs.writeFileSync(`tests/tea-${label}.png`,png);await page.screenshot({path:`tests/tea-${label}-ui.png`});
   const stats=await sharp(png).stats();assert(stats.channels.slice(0,3).every(c=>c.mean>35&&c.stdev>12));report.checks.push(`${label} live framebuffer is nonblank`);
   const metrics=await page.evaluate(async()=>{const dt=[];let last;await new Promise(resolve=>{const frame=t=>{if(last)dt.push(t-last);last=t;if(dt.length<90)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});return{fps:1000/(dt.reduce((a,b)=>a+b)/dt.length),p95:dt.sort((a,b)=>a-b)[85],stats:castle.stats()};});report.metrics.push({label,width,height,...metrics});
   const before=await page.evaluate(()=>({p:castle.progress,pos:castle.camera.position.toArray()}));await page.locator('#inspect').click();await page.mouse.move(width*.5,height*.5);await page.mouse.down();await page.mouse.move(width*.65,height*.56,{steps:8});await page.mouse.up();await page.waitForTimeout(200);await page.screenshot({path:`tests/tea-${label}-orbit.png`});await page.locator('#return-walk').click();await page.waitForFunction(()=>castle.mode==='walk');
   const after=await page.evaluate(()=>({p:castle.progress,pos:castle.camera.position.toArray()}));assert(Math.abs(before.p-after.p)<.0001&&before.pos.every((v,i)=>Math.abs(v-after.pos[i])<.02));report.checks.push(`${label} orbit returns to exact tea pose`);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.checks.push(`${label} no horizontal overflow`);
  }
  const count=requests.filter(u=>u.includes('/assets/tea/')).length;await page.evaluate(async()=>{await castle.world.tea.load();await castle.world.tea.load();});assert.equal(requests.filter(u=>u.includes('/assets/tea/')).length,count);report.checks.push('tea texture loads are cached');
  assert.equal(report.errors.length,0);report.status='passed';
 }finally{await browser.close();fs.writeFileSync('tests/tea-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exit(1);});
