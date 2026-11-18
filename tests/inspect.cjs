const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-angle=metal']});
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/');
  await page.waitForFunction(()=>window.castle?.state.ready,{timeout:120000});
  await page.screenshot({path:'tests/opening-desktop.png'});
  const audit=await page.evaluate(()=>({audit:castle.audit(),stats:castle.stats(),route:castle.route.anchors.map(a=>({id:a.id,p:a.progress})),overflow:document.documentElement.scrollWidth>innerWidth}));
  fs.writeFileSync('tests/initial-audit.json',JSON.stringify({...audit,errors},null,2));
  console.log(JSON.stringify({stats:audit.stats,collisionCount:audit.audit.collisions.length,firstCollision:audit.audit.collisions[0],errors},null,2));
  for(const id of ['tea','garden','study','stairs','upper','lookout']){await page.evaluate(id=>castle.jump(id,{instant:true}),id);await page.waitForTimeout(200);await page.screenshot({path:`tests/view-${id}.png`});}
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
