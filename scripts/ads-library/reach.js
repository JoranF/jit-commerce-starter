const { chromium } = require('playwright');
(async () => {
  const q = process.argv[2], n = +(process.argv[3]||3);
  const b = await chromium.launch();
  const ctx = await b.newContext({ locale: 'nl-NL', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', viewport:{width:1366,height:900} });
  await ctx.route(/fbcdn\.net\/(v|o1|t\d)/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=NL&q=${encodeURIComponent(q)}&search_type=keyword_unordered&media_type=all`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(8000);
  const btns = p.getByText('Advertentiegegevens bekijken', { exact: true });
  const c = Math.min(await btns.count(), n);
  for (let i = 0; i < c; i++) {
    try {
      for (const t of ['Alle cookies toestaan','Optionele cookies weigeren','OK']) { const k=p.getByRole('button',{name:t}); if (await k.count()) await k.first().click({timeout:3000}).catch(()=>{}); } await btns.nth(i).click({force:true, timeout:8000}); await p.waitForTimeout(4000);
      const eu = p.getByText('Transparantie per locatie', { exact: false }).last();
      if (await eu.count()) { await eu.click().catch(()=>{}); await p.waitForTimeout(3000); }
      const dlg = await p.locator('[role="dialog"]').last().innerText().catch(()=> '');
      const lines = dlg.split('\n').filter(s=>s.trim());
      await p.screenshot({path:'reach'+i+'.png'}); const k=lines.findIndex(s=>/Transparantie per locatie/.test(s)); const r=lines.findIndex(s=>/[Bb]ereik/.test(s)); const pick = r>=0 ? lines.slice(r-1, r+30) : ['no reach line'];
      console.log(`--- ad ${i+1}:`, lines.slice(0,1).join(''), '\n', pick.join(' | '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
    } catch (e) { console.log('ad', i+1, 'ERR', e.message.slice(0,80)); }
  }
  await b.close();
})();
