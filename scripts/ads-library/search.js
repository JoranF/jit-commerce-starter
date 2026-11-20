const { search } = require('./lib'); const { parse } = require('./parse'); const fs = require('fs');
(async () => { const out = (fs.existsSync('ads.json') ? JSON.parse(fs.readFileSync('ads.json')) : []);
  for (const q of process.argv.slice(2)) { for (let t=0;t<2;t++){ try { const tx = await search(q, 5); const n=(tx.match(/~?([\d.]+) resultaten/)||[])[1]; const ads=parse(tx,q); if(!n&&!ads.length){ console.log(q,'empty, page start:',tx.slice(0,120).replace(/\n/g,' ')); await new Promise(r=>setTimeout(r,15000)); continue;} out.push(...ads); console.log(q,'→',n,ads.length); break;} catch(e){console.log(q,'ERR',e.message.slice(0,80));} }
    await new Promise(r=>setTimeout(r,8000)); }
  fs.writeFileSync('ads.json', JSON.stringify(out,null,1)); })();
