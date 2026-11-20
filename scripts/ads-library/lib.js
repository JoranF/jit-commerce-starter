const { chromium } = require('playwright');
exports.search = async (q, scrolls = 4) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ locale: 'nl-NL', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', viewport:{width:1366,height:900} });
  await ctx.route(/fbcdn\.net\/(v|o1|t\d)/, r => r.abort()); // skip media
  const p = await ctx.newPage();
  await p.goto(`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=NL&q=${encodeURIComponent(q)}&search_type=keyword_unordered&media_type=all`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(7000);
  for (let i = 0; i < scrolls; i++) { await p.mouse.wheel(0, 6000); await p.waitForTimeout(2500); }
  const text = await p.evaluate(() => document.body.innerText);
  await b.close();
  return text;
};
