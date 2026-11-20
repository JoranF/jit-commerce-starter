# Meta Ads Library — product research helpers

Reads the public Meta Ads Library (country NL) with headless Chromium. Used by the
`product-research-nl` skill to find products that small shops have advertised for months.

Needs network access to `www.facebook.com`, `facebook.com` and `static.xx.fbcdn.net`.
Run from this folder; results go to `ads.json`.

```bash
node search.js "op = op" "1+1 gratis" "verzwaringsknuffel"   # ads per keyword: advertiser, start date, days running, headline
node reach.js "Velwave" 3                                    # EU reach of the first 3 ads (opens "Transparantie per locatie")
```

How to read it:
- Many small advertisers + ads running 30+ days = proven demand.
- EU reach 100k+ per ad = someone is spending real money; 1M+ = going hard.
- Big retailers (Bol, Action, Bever…) say little about a single product; look at small webshops.

Keep it light: a few dozen searches, with pauses. For heavy or automated use, Meta's official
Ad Library API (needs identity verification) is the proper route.
