const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-angle=metal']});
 const report={checks:[],errors:[]};
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4174/welldone/');await page.waitForFunction(()=>window.castle?.state.ready);
 await page.evaluate(()=>castle.jump('tea',{instant:true}));await page.locator('#inspect').tap();await page.waitForFunction(()=>castle.mode==='inspect');const before=await page.evaluate(()=>castle.camera.quaternion.toArray());
 const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:400,id:0}]});for(let i=0;i<8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180+i*9,y:400+i*4,id:0}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(250);const orbit=await page.evaluate(()=>castle.camera.quaternion.toArray());if(!orbit.some((n,i)=>Math.abs(n-before[i])>.01))throw Error('Touch look did not change direction');report.checks.push('single-finger local look');const lens=await page.evaluate(()=>castle.camera.fov);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:400,id:0},{x:240,y:400,id:1}]});for(let i=0;i<6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:150-i*7,y:400,id:0},{x:240+i*7,y:400,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(250);const pinch=await page.evaluate(()=>castle.camera.fov);if(Math.abs(pinch-lens)<1)throw Error('Pinch did not change the lens');report.checks.push('two-finger zoom');
 await page.locator('#return-walk').tap();await page.waitForFunction(()=>castle.mode==='walk');report.checks.push('touch return to walk');
 for(const [id,f]of[['architecture',0],['materials',.42],['joinery',.5],['rooms',0]]){await page.evaluate(([id,f])=>{const e=document.getElementById(id);scrollTo({top:e.offsetTop+Math.max(0,e.offsetHeight-innerHeight)*f,behavior:'instant'});},[id,f]);await page.waitForTimeout(450);await page.screenshot({path:`tests/mobile-${id}.png`});const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);if(!fits)throw Error(`${id} overflows`);report.checks.push(`mobile ${id} layout`);}
 if(report.errors.length)throw Error(report.errors.join('\n'));report.status='passed';
 }finally{await browser.close();fs.writeFileSync('tests/mobile-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exit(1);});
