const M = {jan:0,feb:1,mrt:2,maa:2,apr:3,mei:4,jun:5,jul:6,aug:7,sep:8,okt:9,nov:10,dec:11};
exports.parse = (text, q) => text.split('Bibliotheek-ID: ').slice(1).map(c => {
  const L = c.split('\n').map(s => s.trim()).filter(s => s && s !== '​');
  const id = L[0];
  const dm = c.match(/Uitgevoerd vanaf (\d+) (\w+) (\d{4})/);
  let start = null, days = null;
  if (dm) { start = new Date(+dm[3], M[dm[2].toLowerCase().slice(0,3)], +dm[1]); days = Math.round((new Date() - start) / 864e5); }
  const gi = L.indexOf('Advertentiegegevens bekijken');
  const adv = gi >= 0 ? L[gi+1] : null;
  const after = gi >= 0 ? L.slice(gi+3) : [];
  const di = after.findIndex(s => /^[A-Z0-9.-]+\.[A-Z]{2,}$/.test(s));
  const domain = di >= 0 ? after[di].toLowerCase() : null;
  const body = (di >= 0 ? after.slice(0, di) : after.slice(0,3)).join(' ').slice(0, 300);
  const headline = di >= 0 ? after[di+1] : null;
  const versions = /meerdere versies/.test(c);
  const multi = (c.match(/(\d+) advertenties gebruiken/)||[])[1];
  return { q, id, start: dm ? dm.slice(1).join(' ') : null, days, adv, domain, headline, body, versions, sameCreative: multi ? +multi : 1 };
});
