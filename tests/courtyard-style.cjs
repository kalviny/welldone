// Validate shared watercolor changes in fresh desktop and narrow WebGL contexts.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require(process.env.SHARP_PATH || '/Users/zhanghong1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs = require('fs');
const assert = require('assert/strict');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/';
const scene = process.env.STYLE_SCENE || 'garden';
const fixedSeason = process.env.STYLE_SEASON || (scene === 'entrance' ? 'spring' : 'autumn');
const reportPath = process.env.STYLE_REPORT || 'tests/courtyard-style-verification.json';
const report = { url: base, scene, fixedSeason, checks: [], errors: [], metrics: [], seasons: [] };

function check(name, passed, detail) {
  report.checks.push({ name, passed: Boolean(passed), detail });
  assert(passed, `${name}: ${JSON.stringify(detail)}`);
}

async function measure(page) {
  return page.evaluate(async () => {
    const intervals = [];
    let previous;
    const startFrame = castle.renderer.info.render.frame;
    await new Promise(resolve => {
      const tick = time => {
        if (previous !== undefined) intervals.push(time - previous);
        previous = time;
        if (intervals.length < 90) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    return {
      fps: 1000 / (intervals.reduce((a, b) => a + b) / intervals.length),
      p95Ms: [...intervals].sort((a, b) => a - b)[Math.floor(intervals.length * .95)],
      rendererFrames: castle.renderer.info.render.frame - startFrame,
      stats: castle.stats()
    };
  });
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--enable-webgl', '--use-angle=metal']
  });
  try {
    for (const [label, width, height, dpr] of [['desktop', 1672, 941, 1], ['narrow', 390, 844, 2]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: label === 'narrow', hasTouch: label === 'narrow' });
      const page = await context.newPage();
      const requests = [];
      page.on('request', request => requests.push(request.url()));
      page.on('pageerror', error => report.errors.push(`${label}: ${error.message}`));
      page.on('console', message => { if (message.type() === 'error') report.errors.push(`${label}: ${message.text()}`); });
      page.on('response', response => { if (response.status() >= 400) report.errors.push(`${label}: ${response.status()} ${response.url()}`); });
      await page.goto(base);
      await page.waitForFunction(() => window.castle?.state.ready, null, { timeout: 120000 });
      check(`${label}: tea materials stay lazy at opening`, !requests.some(url => url.includes('/assets/tea/')));
      await page.evaluate(season => castle.setSeason(season), fixedSeason);
      check(`${label}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const audit = await page.evaluate(() => castle.audit());
      check(`${label}: route remains clear`, audit.collisions.length === 0, { samples: audit.samples, collisions: audit.collisions });

      for (const id of [...new Set(['approach', scene, 'garden'])]) {
        await page.evaluate(id => castle.jump(id, { instant: true }), id);
        await page.waitForFunction(() => castle.mode === 'walk' && castle.progress === castle.desired);
        const metrics = await measure(page);
        report.metrics.push({ label, id, width, height, dpr, ...metrics });
        check(`${label}: ${id} actively renders`, metrics.rendererFrames >= 80, metrics.rendererFrames);
        check(`${label}: ${id} browser sample exceeds 30 FPS`, metrics.fps >= 30, metrics.fps);
      }

      const stable = await page.evaluate(id => {
        castle.captureView(id);
        return castle.captureView(id) === castle.captureView(id);
      }, scene);
      check(`${label}: fixed ${scene} frame captures repeat exactly`, stable);

      const colors = new Set();
      for (const season of ['spring', 'summer', 'autumn', 'winter']) {
        await page.evaluate(season => castle.setSeason(season), season);
        const frame = await page.evaluate(id => ({ image: castle.captureView(id), season: castle.state.season, color: castle.world.m.leaf.color.getHex() }), scene);
        const png = Buffer.from(frame.image.split(',')[1], 'base64');
        const stats = await sharp(png).stats();
        check(`${label}: ${season} framebuffer is nonblank`, stats.channels.slice(0, 3).every(channel => channel.mean > 35 && channel.stdev > 12));
        check(`${label}: ${season} applied`, frame.season === season);
        colors.add(frame.color);
        const file = `tests/${scene === 'garden' ? 'courtyard' : scene}-${label}-${season}.png`;
        fs.writeFileSync(file, png);
        report.seasons.push({ label, season, file, mean: stats.channels.slice(0, 3).map(channel => channel.mean) });
      }
      check(`${label}: all seasons retain different foliage palettes`, colors.size === 4);
      await page.evaluate(async () => { castle.setSeason('autumn'); await castle.jump('tea', { instant: true }); });
      await page.waitForFunction(() => Boolean(castle.world.tea.paper));
      const teaLoads = requests.filter(url => url.includes('/assets/tea/')).length;
      await page.evaluate(async () => { await castle.world.tea.load(); await castle.world.tea.load(); });
      check(`${label}: tea texture loads remain cached`, teaLoads > 0 && requests.filter(url => url.includes('/assets/tea/')).length === teaLoads);
      await context.close();
    }
    check('no WebGL, console or HTTP errors', report.errors.length === 0, report.errors);
    report.status = 'passed';
  } finally {
    await browser.close();
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status || 'failed', checks: report.checks.length, errors: report.errors, metrics: report.metrics }, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
