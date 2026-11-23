# Meta-advertenties: draaiboek voor een verkoop onder €50

Stand 23 november 2026. Doel: **kosten per verkoop (CPA) onder €50** voor Lichtval (1 lamp €129,
break-even €53). ⚠️ = schatting of niet bevestigd. Bronnen onderaan; waar een getal van mij komt
(niet uit een bron) staat dat erbij. Geen enkele bron geeft garanties: dit zijn de hefbomen en de
volgorde waarin je ze het goedkoopst gebruikt.

## 1. De rekensom die alles bepaalt

**CPA = kosten per linkklik ÷ conversie van klik naar aankoop.** Voor €50 heb je nodig:

| Kosten per klik | Conversie nodig voor CPA €50 |
|---|---|
| €0,50 | 1,0% |
| €0,70 | 1,4% |
| €0,90 | 1,8% |
| €1,20 | 2,4% |

Sensitiviteit (CPA in €): 

| CPC \ conversie | 0,8% | 1,2% | 1,6% | 2,0% |
|---|---|---|---|---|
| €0,50 | 63 | 42 | 31 | 25 |
| €0,70 | 88 | 58 | 44 | 35 |
| €0,90 | 113 | 75 | 56 | 45 |
| €1,20 | 150 | 100 | 75 | 60 |

Referenties (bronnen onderaan): mediane conversie op Meta-verkeer ≈ 1,5% (alle branches; voor een
nieuwe winkel met een product van €129 is 0,8–1,2% realistischer ⚠️). NL gemiddeld CPC ≈ €0,58 en CPM
≈ €8,45 volgens Searchlab, maar andere bronnen wijken sterk af: meet je eigen cijfers. Q4 is het
duurst, januari/februari het goedkoopst. **Conclusie: €50 is haalbaar, maar alleen als de klik
≤ €0,70 kost én de pagina ≥ 1,4% haalt.** Allebei zijn te sturen.

Ondergrens voor je rekensom: break-even is €53 bij 1 lamp, ≈ €63 gemiddeld als 25% de set van twee
kiest, maar ≈ €48 als CJ ook nog btw bij invoer rekent (zie `docs/beslissingen/lichtval.md`). Met
CPA €50 verdien je dus nauwelijks iets per eerste verkoop: **de winst zit in de set van twee en in
EU-voorraad**, niet in de eerste lamp.

## 2. Hefbomen, op volgorde van effect per euro

### A. Meten zodat Meta kan leren (nu in de code)
Meta optimaliseert alleen op events die het kan koppelen aan een persoon; Meta zegt zelf dat
een hogere Event Match Quality (EMQ, streef ≥ 6) de kosten per actie kan verlagen.
- ✅ Purchase gaat via pixel én Conversions API met gedeeld `event_id` (ontdubbeld), met e-mail,
  telefoon, naam, plaats, postcode, `fbp`, `fbc`, IP en user agent.
- ✅ **Nieuw:** ViewContent, AddToCart, InitiateCheckout en AddPaymentInfo gaan nu óók server-side mee
  (`POST /store/meta-event`, zelfde `event_id` als de pixel). Reden: adblockers en iOS missen een deel
  van de browser-events, en dankzij de bovenste funnel kun je (zie D) op een eerder event optimaliseren
  zonder blind te zijn.
- ✅ **Nieuw:** ViewContent stuurt nu `value` + `currency` mee (was leeg).
- ⬜ Jij: pixel-ID + `META_CAPI_TOKEN` + `META_TEST_EVENT_CODE` zetten, in Events Manager → *Test events*
  controleren dat elk event **één keer** binnenkomt ("Ontdubbeld"), en EMQ per event bekijken. Domein
  verifiëren in Business Manager.
- ⬜ Cookiebanner: de pixel laadt pas na "Accepteren" (AVG). Dat kost meetbare conversies. Houd het
  accepteer-percentage in de gaten; een duidelijke, rustige banner (geen donker patroon) helpt.

### B. Pagina: conversie is de grootste hefboom
Een verbetering van conversie 1,2% → 1,8% verlaagt je CPA met een derde, zonder één extra euro aan advertenties.
- ✅ Al gedaan: hero per advertentie (`angle`), prijs per keuze met "Bespaar €39", bezorgdatum, iDEAL
  e.a., checkout in één kolom, "Volg je bestelling".
- ⬜ **Echte reviews en foto's.** Een onderzoek van ProductLair (211 producten) laat zien dat hetzelfde budget bij een
  duurder product met weinig reviews veel minder verkoopt dan bij een goedkoop product met veel reviews:
  sociale bewijskracht weegt zwaarder naarmate de prijs stijgt. Doe: sample + 5–10 stuks naar mensen
  uit je omgeving of testers (eerlijk vermelden dat ze het gratis kregen), echte reviews in `store.reviews`.
  Niets verzinnen (zie `docs/autopilot/README.md` regel 4).
- ⬜ **WebwinkelKeur / Trustpilot** zichtbaar bij de knop en in de checkout. Onafhankelijke cijfers over het effect
  zijn er niet gevonden, maar vertrouwen is de rem bij een onbekende winkel met een product van €129.
- ⬜ **Achteraf betalen / in3 / Klarna** via Mollie aanzetten (in Mollie-dashboard, en in de admin bij
  de regio "Alle betaalmethodes (Mollie)" aanvinken). Voor een aankoop van €129–219 is gespreid betalen
  waarschijnlijk een van de weinige dingen die de drempel echt verlaagt ⚠️ (geen harde cijfers gevonden;
  test met de A/B-pipeline of vergelijk voor/na).
- ⬜ **Verzendkosten**: €4,95 bij de kassa is een bekende afhaker. Optie: prijs naar €133,95 met "gratis
  verzending" (zelfde opbrengst). Dat is een prijsbesluit voor jou, geen autopilot. 
- ⬜ **Snelheid op mobiel** in de Instagram/Facebook-browser: meet `/nl` en `/nl/a/<angle>` met
  Lighthouse (mobiel) vóór je start; elke seconde laden kost kliks die je al betaald hebt.

### C. Advertenties (creative): bepaalt je CPC
Sinds Andromeda (Meta's nieuwe ad-retrieval) telt vooral *hoe verschillend* je advertenties zijn: bijna-dubbelen
tellen als één. Meta's eigen advies (nov 2024) voor Advantage+ shopping: ≥ 20 gevarieerde advertenties,
20–30% van het budget voor nieuwe, wekelijks vernieuwen. Met €30–60 per dag kun je dat niet bekostigen;
**start met 6–8 echt verschillende concepten** en vernieuw wekelijks 2–3.

Conceptenlijst (alle: lamp gaat aan in het donker in de eerste 2 seconden; 4:5 + 9:16):
1. `sfeer`: waterlicht op de muur, close-up, geen tekst eerste 3 s
2. `slaapkamer`: naast het bed, rust voor het slapen (geen gezondheidsclaims: zie onder)
3. Set van twee: twee lampen aan weerszijden van het bed/de bank ("Bespaar €39")
4. Voor/na: kale witte muur → lamp aan
5. Reactie/ontvangst: iemand doet de lamp voor het eerst aan (echt, eigen video)
6. Maat/schaal: hand + lamp (kleine lamp, 33 cm: voorkomt retouren)
7. Statisch beeld 4:5 met één zin (voor mensen die geen video kijken)
8. Eerlijke levertijd + service ("Antwoord binnen één werkdag")

Kijkcijfers om per advertentie te bewaken (DataAlly, 14.219 advertenties, home goods mediaan): hook rate
≈ 22,8%, hold rate ≈ 23%, link-CTR ≈ 1,15%. Onder 21,5% hook of 1,0% CTR is slechter dan de mediaan.
Hook rate = 3-seconde views ÷ vertoningen (definities verschillen per bron: vergelijk binnen één bron).
Is hook goed en CTR slecht → het aanbod of de knop deugt niet; is CTR goed en conversie slecht → de pagina.

**Meta-regels (advertentierichtlijnen, mijn kennis, controleer in de actuele regels):** geen claims als
"helpt tegen stress/slapeloosheid" (gezondheid) en geen "jij hebt…"-persoonlijke kenmerken. Sfeer en
gevoel mag ("rust in de kamer"), genezen niet. Concurrenten gebruiken zulke claims (RippleGlow: "reduceert
stress"); jij niet: een afgekeurd account kost je weken.

### D. Opzet van de campagne: de leerfase is het probleem bij €50 per verkoop
Meta wil ≈ 50 optimalisatie-events per week per advertentieset. Bij CPA €50 is dat €357 per dag: onhaalbaar
voor een test. Een bericht dat Meta zelf aanhaalt (via derden, niet zelf geverifieerd) zegt dat sets onder 50
per week ≈ 28% duurder per aankoop zijn. Daarom:

| Stap | Wat | Waarom |
|---|---|---|
| 1 | **Eén campagne, één advertentieset**, Verkoop/Purchase, NL + BE, breed (Advantage+ doelgroep, geen interesses), alle 6–8 concepten in die ene set | Alle events in één pot; geen versnippering |
| 2 | Dagbudget **€50–60** (≈ 1× je doel-CPA), 10 dagen = €500–600. De oude €25–30 per dag levert ≈ 4 aankopen per week: te weinig om iets te beslissen ⚠️ | Statistiek: met 4 aankopen per week is elke conclusie ruis |
| 3 | Na 5 dagen: < 1 aankoop maar wel winkelmandjes (IC/ATC komen binnen)? Maak een **tweede 7-daagse test** met *Initiate Checkout* als optimalisatie-event (meer events, nog dicht bij de aankoop) en vergelijk op **kosten per aankoop**, niet op kosten per mandje | Bronnen: ATC levert meer volume, maar minder koopintentie; oordeel op CPA-aankoop |
| 4 | Niet aanpassen tijdens de leerfase: max. één wijziging per week; budgetstappen ≤ 20% per 72 uur (de autopilot doet dit) | Elke wijziging reset het leren |
| 5 | Pas na ≥ 10 aankopen en CPA < €50: tweede set (set van twee als hoofdaanbod) en wekelijks 2–3 nieuwe concepten | Schalen op bewezen winnaars |
| 6 | **Geen retargeting-set** vóór ≈ 1.000 winkelmand-events in 90 dagen of €100+ per dag. Eerst uitsluiten: klanten (aankoop 180 dagen) | Bronnen: bij kleine accounts onnodig en instabiel |

Doelgroep: breed laten staan. Leeftijd 30–65 in de plannen is goed als *suggestie*, niet als harde grens.
Attributie: standaard (7 dagen klik / 1 dag weergave) in Ads Manager; beoordeel zelf op **PostHog-bestellingen
per advertentie** (dat doet `npm run ads`), want Meta rekent soms te veel of te weinig toe.

### E. Timing
Januari en februari zijn volgens de Nederlandse bron de goedkoopste maanden; Q4 de duurste. Het plan
(sample binnen begin december, live begin januari) past daarbij. Niet eerder starten.

### F. Marge: de echte reden dat €50 kan werken
Ieder verbeterpunt aan de kostenkant rekent mee als extra ruimte voor advertenties:
- **Duo als hoofdaanbod** (laat zien in de hero): break-even €85 i.p.v. €55. Elke verkochte set heeft ruim €30 meer
  ruimte voor dezelfde advertentie-euro.
- **Duo-inkoopprijs** opvragen bij CJ (2 in één pakket scheelt verzending).
- **EU-voorraad** na 10 verkopen met winst: lagere inkoop, levering 2–3 dagen, hogere conversie (de grootste stap).
- **IOSS/btw** met de boekhouder: kan €6 per lamp schelen.

## 3. Wat de code nu voor je doet (en wat jij moet zetten)

| Onderdeel | Staat |
|---|---|
| Purchase pixel + CAPI, ontdubbeld, rijke matching | ✅ |
| ViewContent/AddToCart/InitiateCheckout/AddPaymentInfo ook server-side, met value | ✅ nieuw |
| UTM → `ad_*` op elk event en bestelling → PostHog per advertentie | ✅ |
| Hero per advertentie (`angle`) | ✅ |
| Advertentie pauzeren op "nul verkopen na 2× break-even" of "te dure CPA" | ✅ |
| **Nieuw:** pauzeren op creative-signaal: CTR < 0,6% na ≥ 3000 vertoningen en ≥ 0,6× break-even uitgegeven | ✅ |
| Rapport met CTR, winkelmandjes, doel-CPA (€50) naast break-even (€53) | ✅ nieuw |
| Opschalen +20% per 72 uur bij CPA ≤ 0,7× break-even | ✅ |
| Meta-account koppelen (`adAccountId` in `analytics/src/stores.ts`, `META_ADS_TOKEN`) | ⬜ jij |
| Pixel + CAPI-sleutels, domeinverificatie | ⬜ jij |
| Video's van het echte licht (sample) | ⬜ jij |

## 4. Beslisboom tijdens de test (kijk dagelijks 5 minuten)

| Je ziet | Dan is het… | Doe |
|---|---|---|
| Hook rate < 20% | beeld/eerste 2 seconden | nieuwe opening, zelfde pagina |
| Hook oké, link-CTR < 0,8% | aanbod/tekst/knop | andere kop en call-to-action in de advertentie |
| CTR ≥ 1%, maar < 3% *in winkelmand* van de bezoekers | de pagina (prijs, vertrouwen, foto's) | reviews, betaalopties, verzending; niet meer budget |
| Winkelmand oké, weinig checkouts | checkout (verzendkosten, betaalmethoden, vertrouwen) | gratis verzending, iDEAL/Klarna zichtbaar |
| Checkout oké, aankoop mislukt | betaling | Mollie-logs, iDEAL-bank, 3-D Secure |
| CPM > €15 | doelgroep te smal of Q4-veiling | breder, wachten tot januari |
| Frequentie > 2,5 binnen 7 dagen | creatives uitgeput | nieuwe concepten |

**Stoppen:** na €300 uitgegeven met 0 aankopen én < 3% winkelmand → product stoppen (bestaande regel uit de hercheck).
**Door:** CPA < €50 over ≥ 10 aankopen → +20% per 3 dagen.

## 5. Eerlijke kanttekeningen

- Niemand kan een CPA onder €50 garanderen. Dit is een kans-vergroter: de hefbomen hierboven halen
  het uit het gebied waar het onmogelijk is naar het gebied waar het haalbaar is.
- De 8–15 werkdagen levering uit China drukt de conversie ⚠️. Zonder EU-voorraad is €50 het strakke doel, niet het
  verwachte gemiddelde.
- Concurrenten (NL-dropshippers met dezelfde lamp vanaf €69,95) drukken de CVR en drijven je CPM op. Merk, echt
  beeld en de set van twee zijn je verschil.
- Alle benchmarks hier zijn gemiddelden uit vendor-blogs, geen audit van jouw account. Vervang ze zo snel
  mogelijk door je eigen medianen.

## Bronnen

- Andromeda en aantal creatives: [Jetfuel](https://jetfuel.agency/metas-2026-algorithm-update-what-andromeda-changed-and-how-to-adapt-your-ads/), [Skaleit](https://skaleit.agency/blog/meta-andromeda-strategy-2026-ecommerce-roas/), [UGCBuilder](https://ugcbuilder.com/blog/meta-andromeda), [Conduit](https://www.conduitsa.com/blogs/news/meta-creative-volume-playbook-2026) (Meta's eigen cijfer van nov 2024 wordt hierdoor aangehaald, niet zelf geverifieerd)
- Leerfase/volume: [ppc.land (Meta: onder 50 per week ≈ 28% duurder)](https://ppc.land/meta-says-ad-sets-under-50-weekly-conversions-cost-28-more-per-purchase/), [Lebesgue](https://lebesgue.io/blog/facebook-ads-learning-phase/), [Cometly](https://www.cometly.com/post/facebook-ads-learning-phase-optimization)
- NL-kosten: [Searchlab 2026](https://searchlab.nl/statistieken/facebook-ads-statistieken-2026), [SuperAds NL](https://www.superads.ai/facebook-ads-costs/cost-per-purchase/netherlands), [Triple Whale benchmarks](https://www.triplewhale.com/blog/facebook-ads-benchmarks.md), [Madgicx](https://madgicx.com/research/meta-ads-benchmarks)
- Dropshipping, break-even en budget: [AdAdvisor](https://adadvisor.ai/blog/facebook-ads-for-dropshipping), [ProductLair](https://productlair.com/blog/how-much-to-spend-on-dropshipping-ads), [Funnelish](https://funnelish.com/blog/facebook-ads-in-2021)
- Conversions API en EMQ: [Meta best practices](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices), [Meta verifying setup](https://developers.facebook.com/documentation/ads-commerce/conversions-api/verifying-setup), [Stape](https://stape.io/blog/how-to-improve-event-match-quality-facebook)
- Creative-benchmarks: [DataAlly UGC benchmarks](https://www.dataally.ai/blog/ugc-ad-benchmarks), [Billo hook/hold](https://billo.app/blog/hook-rate-to-hold-rate)
- Retargeting bij klein budget: [MHI Growth Engine](https://mhigrowthengine.com/blog/video-view-retargeting-meta/), [Lets Run Facebook Ads](https://www.buzzsprout.com/265021/episodes/18740047-why-retargeting-doesn-t-work-for-small-ad-budgets)
- Betaalmethoden: [Shopify NL gespreid betalen](https://www.shopify.com/nl/blog/gespreid-betalen-oplossingen), [Lightspeed](https://www.lightspeedhq.com/nl/blog/webshop-checkout/)
