const { chromium } = require('playwright');
const fs = require('fs');
const URL = 'file:///home/claude/echo-breathing-monitor/app/index.html';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  for (const f of process.argv.slice(2)) {
    const R = JSON.parse(fs.readFileSync(f));
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
    await ctx.addInitScript(r => { window.__replay = r; }, { I: R.I, Q: R.Q });
    const p = await ctx.newPage();
    await p.goto(URL + '?sim=steady&speed=5'); await p.click('#startBtn');
    const rows = []; let lastT = -1;
    while (true) {
      await p.waitForTimeout(150);
      const s = await p.evaluate(() => window.__echo.state);
      const t = Math.floor(s.simT);
      if (t !== lastT) { rows.push([t, s.monState, s.band, s.clar, s.snr, (await p.textContent('#bpm')).trim()]); lastT = t; }
      if (s.simT * 10 >= R.I.length + 5) break;
    }
    const st = await p.evaluate(() => window.__echo.state);
    console.log(`== ${f} (${R.label}) ${R.I.length / 10}s | seen ${(await p.textContent('#seenV')).trim()} | pauses ${JSON.stringify(st.pauses)}`);
    for (const r of rows) if (r[0] % 3 === 0) console.log(`${String(r[0]).padStart(4)}s ${r[1].padEnd(9)} band ${r[2].toFixed(1).padStart(7)} clar ${r[3].toFixed(1).padStart(5)} snr ${r[4].toFixed(1).padStart(5)} bpm ${r[5]}`);
    await ctx.close();
  }
  await b.close();
})();
