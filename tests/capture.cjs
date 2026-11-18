// Development-only: regenerate responsive illustrations from the actual scene.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require(process.env.SHARP_PATH||'/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-angle=metal']});
 const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>console.error('Page error:',e));
 await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(()=>window.castle?.state.ready,{timeout:120000});
 for(const season of ['spring','summer','autumn','winter']){
   const data=await page.evaluate(season=>{castle.setSeason(season);return castle.captureView('garden');},season);
   const input=Buffer.from(data.split(',')[1],'base64');
   for(const width of [640,960,1600])await sharp(input).resize(width,Math.round(width*9/16),{fit:'cover'}).webp({quality:88}).toFile(`assets/garden-${season}-${width}.webp`);
 }
 await page.evaluate(()=>castle.setSeason('autumn'));
 await page.evaluate(()=>castle.world.tea.load());
 for(const id of ['tea','study','lookout']){
   const data=await page.evaluate(id=>castle.captureView(id),id);const input=Buffer.from(data.split(',')[1],'base64');
   for(const width of [640,960])await sharp(input).resize(width,Math.round(width*.75),{fit:'cover'}).webp({quality:88}).toFile(`assets/${id}-${width}.webp`);
 }
 console.log('Generated 18 responsive WebP scene illustrations.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
