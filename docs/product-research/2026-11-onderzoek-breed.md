# Breed productonderzoek — november 2026 (ronde 4)

Gemaakt met de `product-research-nl` skill. Antwoorden op stap 1: test-budget onbekend, aangenomen
**€500–1000**; geen niche-voorkeur; **dropship** (EU-magazijn liefst, China mag als de marge het draagt).

> **Status: ideeën om te valideren, geen bewezen winnaars.** ⚠️ = schatting of niet zelf geverifieerd.
> Leveranciersprijzen hieronder komen uit zoekresultaten, niet uit offertes. Ze kunnen er flink naast zitten.

## In één alinea

Na ~25 ideeën, prijschecks bij Action/Lidl/Decathlon/Kruidvat/Coolblue en een eigen scrape van de Meta Ads
Library (NL) is er **geen kandidaat die duidelijk beter is dan de Lichtval-lamp**. De beste nieuwe kandidaat is
een **vogelvoederhuisje met AI-camera** (winter, Tuinvogeltelling eind januari, cadeau voor 55+, filmt
fantastisch). Die haalt de €50+ break-even alleen bij ~€139 verkoopprijs **én** een inkoopprijs van ≤ ~$45, en
het product is electronica met wifi en een accu, dus de compliance is zwaarder dan bij de lamp. Advies:
**Lichtval blijft #1**. Doe deze week de twee goedkoopste stappen tegelijk: de CJ-offerte voor Lichtval
(staat klaar, nog niet verstuurd/gemerged, zie onder) en drie offertes voor de vogelcamera. Kies pas als je
echte prijzen hebt. Geen advertentiegeld vóór er een sample is.

## Wat er deze ronde anders is (en wat ik níet kon)

- **Nieuwe kostenpost die eerdere rondes misten:** sinds **1 juli 2026** heft de EU **€3 douanerecht per
  artikel** op pakketjes onder €150 van buiten de EU (tijdelijk, tot 1 juli 2028)
  ([Europese Commissie](https://commission.europa.eu/news-and-media/news/ensuring-fairness-and-safety-eur3-customs-duty-low-value-parcels-2026-06-29_nl),
  [SRA](https://www.sra.nl/nieuws/004501/2026/01/vanaf-1-juli-2026-3-vast-douanerecht-op-invoer-tot-150)).
  Er ligt ook een voorstel voor €2 *handling fee* per pakket ⚠️ (nog niet vastgesteld). Ik reken de €3 overal
  mee bij China-dropship. **Gevolg voor Lichtval: break-even CPA bij €119 zakt van ≈ €40 naar ≈ €37.**
- **Wel bereikbaar:** de Meta Ads Library (eigen scrape met `scripts/ads-library/`, 21 nov 2026, alleen
  *actieve* advertenties, land NL). Facebook was de eerste keer na 4 zoekopdrachten tijdelijk geblokkeerd; met
  langere pauzes ging het weer.
- **Niet bereikbaar vanuit deze cloud-sessie:** bol.com, AliExpress, Alibaba, Action, Lidl, Kruidvat,
  Decathlon, CJ-zoekpagina, Google Trends (netwerk-allowlist). Prijzen van die sites komen daarom uit
  zoekmachine-resultaten. **Die zijn soms oud of van een andere variant.** Zie "Zelf nachecken" onderaan voor
  de exacte lijst die je met de hand moet doen.
- Een CJ-API-sleutel is in deze sessie niet ingesteld, dus geen live CJ-prijzen.

## 1. Ruwe kandidaten (23) en waar het idee vandaan komt

| # | Idee | Richting | Bron van het idee |
|---|---|---|---|
| 1 | Vogelvoederhuisje met AI-camera (zonnepaneel) | seizoen / cadeau / tuin | Winter = voerseizoen; [Tuinvogeltelling 2026: ~130.000 tellers](https://www.bnnvara.nl/vroegevogels/artikelen/koolmees-is-meest-getelde-vogel-tijdens-nationale-tuinvogeltelling); [CJ trendlijst](https://cjdropshipping.com/blogs/winning-products/Best-Trending-Dropshipping-Products); Coolblue heeft er een eigen categorie voor |
| 2 | Rollende messenslijper (magneet-hoekblok, diamantschijf) | cadeau / keuken | Ads Library: Sharpify Slijpshop adverteert nu actief; HORL als premium-merk |
| 3 | Radiatorventilator-set | NL-probleem (oude huizen, gasprijs) | [SpeedComfort bij Gamma](https://www.gamma.nl/assortiment/speedcomfort-radiator-ventilator-trio-set/p/B173633), [AVROTROS Radar](https://radar.avrotros.nl/hulp-tips/hulpartikelen/item/bespaar-op-je-gasverbruik-met-een-radiatorventilator/) |
| 4 | Oplaadbare verwarmde inlegzolen | seizoen / fietsen in de kou | Ronde 2 (verwarmde handschoenen) → goedkopere variant gezocht; [Decathlon](https://www.decathlon.nl/vc/verwarmde-inlegzolen) |
| 5 | Huisdierportret op canvas (print-on-demand, EU) | cadeau / huisdier | Etsy, [huisdierenportret.nl](https://nl.trustpilot.com/review/huisdierenportret.nl) |
| 6 | Delfts-blauw tegeltje met eigen foto | cadeau / NL-specifiek | Ronde 3 Ads Library (Iedereenblij/Stroopwafel Studio 402–419 dagen) |
| 7 | Opblaasbaar ijsbad (dropstitch) | januari / "nieuw jaar, nieuwe ik" | [ijsbad-hype NL](https://www.welingelichtekringen.nl/gezondheid/ijsbad-blijft-populair-terwijl-het-helemaal-niet-gezond-is) |
| 8 | Infrarood saunadeken | januari / wellness | Trendlijsten |
| 9 | Walking pad (loopband onder bureau) | januari / thuiswerken | Trendlijsten |
| 10 | Elektrisch (verwarmd) droogrek | NL-probleem (kleine huizen, geen droger) | UK-trend "heated airer" |
| 11 | Luchtontvochtiger | NL-probleem (vochtige huizen in winter) | Seizoen |
| 12 | Digitale fotolijst met wifi (Frameo) | kerstcadeau voor (groot)ouders | Cadeau-seizoen |
| 13 | Orthopedische hondenmand (traagschuim) | huisdier / oudere honden | Pets-richting |
| 14 | Stoomborstel voor huisdieren | huisdier | Ronde 3 Ads Library (CharmPaws 458 dagen) |
| 15 | Wasstrips (abonnement) | herhaalaankoop | Ronde 3 Ads Library (Pure Laundry Club 424–508 dagen) |
| 16 | Elektrische schrobborstel | huishouden | Klassieke Meta-gadget |
| 17 | Slaapkoptelefoon (hoofdband) | slaap | Trendlijsten |
| 18 | Design "plug-in" wandlamp (met stekker) | wonen | Ronde 3 Ads Library (The Light Supplier, 464 dagen) |
| 19 | Padelracket onder eigen merk | sport / NL-groei | [876.000 padelspelers in 2025](https://www.ey.com/nl_nl/newsroom/2026/03/padelspelers-in-nederland-groei-zet-door-nieuwe-fase-in-professionalisering) |
| 20 | Waterdamp-sfeerhaard (3D-vlam) | winter / sfeer | Seizoen |
| 21 | Automatische (zelfreinigende) kattenbak | huisdier / hoge prijs | Pets-richting |
| 22 | Warmtecamera voor de smartphone (tocht opsporen) | NL-probleem (energie) | Energiebesparing |
| 23 | Gewichtsvest | sport / trend 2025–26 | Trendlijsten |

## 2. Snel afgevallen (één regel per stuk)

| # | Idee | Waarom eruit |
|---|---|---|
| 6 | Delfts-blauw fototegel | Markt zit op €18–30 per tegel ([Zazzle €18,35](https://www.zazzle.nl/tegeltje-256408756124007746), [Dutch Tile Project €29,95](https://thedutchtileproject.com/en-de/products/your-photo-on-a-tile-1)) → break-even CPA ≈ €10–20; plus upload-flow + printpartner nodig |
| 7 | IJsbad | PVC-versie al €69,95 op [bol (Lagoon)](https://www.bol.com/nl/nl/p/lagoon-ijsbad-120-cm-xxl-geschikt-voor-2-personen-incl-ijsbad-starter-pack-ice-bath-dompelbad-opvouwbaar-inklapbaar-ijsbad-wim-hof-methode-opblaasbaar/9300000164933358/); dropstitch €249–299 bij [Decathlon BE](https://www.decathlon.be/nl/p/mp/icebath-coolchill-premium-opblaasbaar-dropstich-ijsbad-135-cm/746e308b-9909-448c-9d52-35b27e875ca5/c1); ~10 kg verzending; gezondheids- en verdrinkingsrisico ([VRT](https://www.vrt.be/vrtnws/nl/2023/07/31/iceman-wim-hof-wordt-gelinkt-aan-13-verdrinkingen-hoe-gevaarl/)) |
| 8 | Saunadeken | Verwarmingselement + vrijwel altijd gezondheidsclaims (skill: hard reject); €150–230 retail |
| 9 | Walking pad | €129–179 bij [Decathlon](https://www.decathlon.be/nl/vc/walkingpad-loopband) en [Lidl DE €179](https://www.lidl.de/p/christopeit-walking-pad-4-2/p100375606); 20+ kg pakket |
| 10 | Elektrisch droogrek | [Action €59,95](https://androidworld.nl/aanbiedingen/dit-elektrische-action-droogrek-maakt-de-was-doen-makkelijker/) (dec 2025) |
| 11 | Ontvochtiger | Lidl TRONIC €59,99–89,99 in jan/feb 2026 ([overzicht](https://www.folderz.nl/aanbiedingen/luchtontvochtiger)) |
| 12 | Frameo-fotolijst | [Action €59,95](https://www.iphoned.nl/koopadvies/action-fotolijstje/); merken €70–110 |
| 13 | Orthopedische hondenmand | bol/Amazon €68–80 ([vergelijk.nl](https://www.vergelijk.nl/honden_mand/p/26/)), Kruidvat verkoopt er ook een; groot pakket, maten |
| 14 | Stoomborstel huisdier | Lage prijs (€20–30 ⚠️ niet zelf gecheckt) → break-even < €15 |
| 15 | Wasstrips | Wasmiddel = CLP-etikettering + detergentenverordening; [Kruidvat](https://www.kruidvat.nl/huis-schoonmaak/wasstrips) heeft ze; lage orderwaarde |
| 16 | Elektrische schrobborstel | [Lidl €14,99](https://www.lidl.de/p/silvercrest-elektrische-reinigungsbuerste-5-teilig/p100391443) |
| 17 | Slaapkoptelefoon | Lage prijs voor generiek (€20–40); premium is Soundcore €199 |
| 18 | Plug-in design wandlamp | Prijs "Plugify" niet terug te vinden ⚠️; Action verkoopt wandlampen voor [€4,95–7,95](https://www.action.com/nl-nl/p/3216786/oplaadbare-wandlamp/); en het is dezelfde categorie als Lichtval (geen spreiding) |
| 19 | Padelracket eigen merk | Eigen logo vraagt voorraad (MOQ) → past niet in dropship; spelers kopen merken; Decathlon Kuikma al vanaf ~€30 ⚠️ |
| 20 | Waterdamp-sfeerhaard | Retail €500–700 ([vergelijk.nl](https://www.vergelijk.nl/haard/p/16/)), fabriek $100–300 ([Alibaba](https://www.alibaba.com/product-detail/3D-Water-Steam-Fireplace-Insert-7_1600631243169.html)), groot en breekbaar |
| 21 | Automatische kattenbak | €189–330 op bol met veel merken ([BCC top 10](https://www.bcc.nl/huishouden/reinigen/zelfreinigende-kattenbak/top-10)); groot, mechanisch, storingsgevoelig → retouren |
| 22 | Warmtecamera | Sensor maakt hem duur; veel gemeenten/energieloketten lenen ze gratis uit ⚠️ |
| 23 | Gewichtsvest | 5–10 kg verzendgewicht per stuk; prijzen niet gecheckt ⚠️ |

## 3. Top 5 — gescoord en doorgerekend

### Rekenregels (zelfde als de skill, met twee aanpassingen)

```
prijs ex btw     = verkoopprijs / 1,21
landed cost      = product + verzending naar klant + €3 EU-douanerecht (China) (+ verpakking)
kosten           = 4% (betaling + retouren); 6% bij electronica (meer DOA/retour); 9% bij maatwerk (herdrukken)
+ verzending     = klant betaalt €4,95 → +€4,09 ex btw
break-even CPA   = prijs ex btw − landed cost − kosten + €4,09
```
Wisselkoers ⚠️ $1 ≈ €0,87. Doel uit de opdracht: **break-even CPA ≥ €50** (NL Meta e-com CPA ≈ €30–45).

### 3a. Score (0–2 per criterium, max 20)

| Criterium | Vogelcamera | Radiatorventilator | Rolslijper | Verwarmde zolen | Huisdierportret | *Lichtval (ref.)* |
|---|---|---|---|---|---|---|
| 1 Marge (landed ≤25% = 2) | 1 | 1 ⚠️ | 1 | 0 | 0 | *0* |
| 2 Prijspunt €39–89 | 1 (hoger) | 2 | 2 | 2 | 2 | *1* |
| 3 Laat zich zien in 3 sec | 2 | 1 | 2 | 1 | 1 | *2* |
| 4 Echt probleem/verlangen | 1 | 2 | 1 | 2 | 1 | *1* |
| 5 Niet goedkoop in winkels | 1 | 1 | 0 | 1 | 1 | *2* |
| 6 Levering ≤ 5 dagen EU | 0 ⚠️ | 0 | 1 ⚠️ | 0 | 2 | *0* |
| 7 Retour-/maatrisico | 1 | 1 | 2 | 0 | 2 | *1* |
| 8 Compliance simpel | 0 | 1 | 1 | 0 | 2 | *1* |
| 9 Merkbaar | 2 | 1 | 1 | 1 | 2 | *2* |
| 10 Upsell/bundel | 2 | 2 | 2 | 1 | 1 | *1* |
| **Totaal** | **11** | **12** | **13** | **8** | **14** | ***11*** |

**Kritische noot over deze tabel:** de score en de break-even zeggen verschillende dingen. Het
huisdierportret scoort het hoogst (14) maar verdient per verkoop te weinig om een Meta-sale te betalen. De
score is een filter op "makkelijk/veilig", de break-even is een filter op "kan het geld opleveren". Ik gebruik
de **break-even als harde drempel** en de score als tiebreaker. De scores zelf zijn mijn inschatting, geen meting.

### 3b. Break-even op 2 prijspunten

| Product | Landed cost ⚠️ | Prijs A | BE-CPA A | Prijs B | BE-CPA B | Haalt €50? |
|---|---|---|---|---|---|---|
| Vogelcamera (product $45 + €10 verz. + €3) | €52 | €119 | **€43** | €139 | **€59** | alleen bij €139 én ≤ $45 |
| Vogelcamera worst case ($69 + €11 + €3) | €73 | €119 | €22 | €139 | €38 | nee |
| Radiatorventilator trio (3 × $12 + €7 + €3) | €41 | €89 | €33 | €99 | €41 | nee |
| Radiatorventilator trio, goedkope fans (3 × $6) | €27 | €89 | €47 | €99 | **€55** | alleen goedkoop + €99 |
| Rolslijper (product $14 + €6 + €3) | €21 | €59 | €30 | €69 | €37 | nee (bundel €79: €41) |
| Verwarmde zolen ($26,50 + €9 + €3) | €35 | €69 | €22 | €79 | €30 | nee |
| Huisdierportret canvas 40×50 (POD EU) | €28 ⚠️ | €59 | €20 | €79 | €34 | nee |
| *Lichtval (AliExpress ~$63 incl. verz. + €3)* | *€61* | *€119* | *€37* | *€129* | *€45* | *nee* |
| *Lichtval als CJ $35 haalt (+€7 + €3)* | *€40* | *€119* | *€58* | *€129* | *€66* | *ja* |

Conclusie van deze tabel: **niets haalt de €50 met de prijzen die we nu kennen.** Twee producten kúnnen het
(vogelcamera, Lichtval), en beide hangen af van één getal dat we nog niet hebben: een echte inkoopprijs.

### 3c. Per product: prijsladder, leverancier, levering, compliance, upsell

#### 1. Vogelvoederhuisje met AI-camera

- **Wat:** voederhuisje met ingebouwde camera, zonnepaneel en accu; de app stuurt een melding met foto/video
  en herkent de vogelsoort. Je ziet een koolmees van 10 cm afstand — dat ís de advertentie.
- **Prijsladder NL/BE:**
  - Geen Action/Lidl-versie gevonden (Lidl DE heeft alleen huisjes zonder camera:
    [Dobar](https://www.lidl.de/p/dobar-vogelhaus-camouflage-2-0-mit-futtersilo-6-eckig-haengend-weiss/p100375664)).
    **Maar:** Action verkoopt solar-beveiligingscamera's voor [€29,95](https://www.iphoned.nl/deals/action-slimme-beveiligingscamera-zonne-energie/).
    De techniek is dus goedkoop en een Action-versie is denkbaar.
  - Zonder AI: Denver BFC-1200 [€64 bij Coolblue](https://www.coolblue.nl/product/947478/denver-bfc-1200.html) (ook bij [Kruidvat](https://www.kruidvat.nl/denver-bfc1200-fullhd-vogel-voed-camera/p/mp-00068793))
  - No-name op eBay.de: ca. €40–80 ([check24/eBay-overzicht](https://www.ebay.de/itm/397201057840)) ⚠️
  - Met AI: Camouflage EZ Birdspot [€154 bij Coolblue NL](https://www.coolblue.nl/product/974916/camouflage-ez-birdspot.html) (BE €199)
  - Birdfy [€198 bij MediaMarkt](https://www.mediamarkt.nl/nl/product/_birdfly-vogelvoederhuisje-met-zonnepaneel-ai-herkenning-lifetime-camera-1874612.html), Birdfy Pro 2 Lite [€199,99](https://bigshopper.be/nl/product/birdfy-feeder-pro-2-lite-smart-bird-solar-powered-with-camera-and-ai-recognition-eppambni8614100-1710600908.htm)
  - Bird Buddy Pro [€298,99 bij Hornbach DE](https://www.hornbach.de/p/vogelfutterhaus-birdbuddy-solar-smart-bird-feeder-pro-smartes-vogelfutterhaus-mit-kamera-solarbetrieben-hochaufloesende-ki-kamera-per-app-steuerbar/12334074/)
  - **Positie:** €129–139, "AI zonder abonnement", onder Camouflage (€154) en ver onder Birdfy/Bird Buddy.
- **Leverancier ⚠️ (niet geverifieerd, niet zelf geopend):**
  - Alibaba "Solar Chargeable AI Recognition Bird Feeder": **$69/stuk bij MOQ 20**
    ([link](https://www.alibaba.com/product-introduction/Hot-Newest-Solar-Chargeable-AI-Recognition_1600863636495.html)) — te duur voor de €50-drempel.
  - Alibaba samples ~$60 ([link](https://www.alibaba.com/product-detail/Schwarzwald-Wireless-Outdoor-Solar-Powered-Smart_1600941093912.html)); andere fabriek: [dcdvr](https://dcdvr.en.alibaba.com/product/1600971255926-928949322/smart_AI_recognition_bird_feeder_with_solar_camera_wireless_bird_feeder_camera.html) (prijs onbekend).
  - US-retail van eenvoudige 1080p-versies: [$53,94 Walmart](https://www.walmart.com/ip/7392601134), [VEVOR $84,99](https://www.vevor.com/muebles-para-mascotas-c_12715/vevor-smart-bird-feeder-with-camera-ai-identify-10000-bird-specie-solar-powered-p_010439579900).
    Als dat retail is, ligt de fabrieksprijs van de simpelste versie waarschijnlijk rond $30–45. **Dat is een redenering, geen offerte.**
  - CJ: geen listing gevonden via zoekmachine; alleen losse solar-camera's. → sourcing-aanvraag nodig.
  - VEVOR heeft EU-magazijnen ⚠️ (niet gecheckt of dít product er ligt) → mogelijke EU-route.
- **Levering:** China 7–15 werkdagen ⚠️; EU (VEVOR/CJ-EU, als het er ligt) 2–6 dagen.
- **Compliance (zwaar):**
  - CE onder de **RED** (radio), sinds **1 aug 2025 inclusief cybersecurity-eisen** (EN 18031) voor apparaten
    met internet ([Reed Smith](https://www.reedsmith.com/our-insights/blogs/viewpoints/102ktki/red-eu-cybersecurity-obligations-for-iot-products-from-august-2025/)).
    Vraag de testrapporten; zonder die rapporten niet verkopen.
  - **Batterijenverordening**: als jij de eerste bent die het in NL op de markt brengt, ben jij "producent":
    registratie bij [Stichting OPEN](https://stichting-open.org/en/current-status-of-batteries-regulation-implementation/) ([KVK](https://www.kvk.nl/en/sustainability/epr-batteries-and-accumulators-rules-for-producers-and-importers/)). Plus WEEE (ook OPEN). Plus GPSR-info op de pagina.
  - Privacy: camera gericht op de tuin (en soms de buren); app-data vaak op Chinese servers. Eerlijk vermelden.
  - Claims: "herkent 10.000 soorten" klopt vaak niet voor Europese vogels → alleen claimen wat je zelf getest hebt.
- **Upsell/bundel:** extra zonnepaneel, 2e huisje ("Duo" cadeau), SD-kaart, **vogelvoer** (biologisch; past bij
  [discussie over pesticiden in vogelvoer](https://nos.nl/l/2543201)), een NL-vogelgids als PDF.

#### 2. Radiatorventilator-set

- **Prijsladder:** SpeedComfort Mono €47,99–59,99 / Duo €85,60–104,95 / Trio €121,60–149,95
  ([Gamma](https://www.gamma.nl/assortiment/speedcomfort-radiator-ventilator-trio-set/p/B173633), [bol](https://www.bol.com/nl/nl/p/speedcomfort-radiator-ventilator-trio-set-universeel-geschikt-voor-standaard-smalle-en-enkelplaats-radiatoren-en-convectoren-magnetisch/9300000024949652/)).
  Action: niet gevonden ⚠️ (wel checken in de app; dit is precies een Action-product). Goedkope no-names op bol: niet kunnen zien ⚠️.
- **Leverancier ⚠️:** Minxin (Alibaba) magnetische booster met thermostaat; bedrijfsprofiel noemt $22,90–31,50, MOQ 1
  ([product](https://www.alibaba.fr/product-detail/Extendable-Radiator-Fan-Heat-Ventilator-OEM_11000028207341.html), [profiel](https://szminxin.en.alibaba.com/company_profile.html)) — onduidelijk of dat per fan of per set is.
- **Levering:** China 7–15 dagen. Seizoen is nú (nov–feb); een maand vertraging kost de helft van het seizoen.
- **Compliance:** laagspanning, maar de adapter valt onder LVD/EMC; WEEE. **Grootste risico zijn claims:** de
  besparing is omstreden ("scheelt maar een tientje", [Welingelichte Kringen](https://www.welingelichtekringen.nl/natuur-en-milieu/kastje-onder-je-radiator-scheelt-zelf-maar-een-tientje-per-jaar-deze-ketelinstelling-levert-veel-meer-op)); winkels noemen €100–200/jaar. "Bespaar €200" in een advertentie is een ACM-risico (misleidende duurzaamheidsclaim).
- **Upsell:** Mono → Duo → Trio (de set ís de upsell), verlengkabel.

#### 3. Rollende messenslijper

- **Prijsladder:** eBay.de €16,99–24,99, Shein €24,78 ([overzicht](https://www.ebay.de/itm/357865783123)), ManoMano-set €107,26,
  HORL 2 €157 ([Ubuy](https://www.ubuy.co.nl/nl/product/7T2PWFBUA-horl2-walnut)), HORL 2 Pro €349 ([knivesandtools](https://knivesandtools.com/en/pt/-horl-2-pro-knife-sharpener-ho2p-set.htm)). Lidl verkoopt (niet-rollende) slijpers voor €2–15.
- **Leverancier ⚠️:** fabrieksprijzen $6,49–8,68 bij MOQ 500–1200 ([made-in-china](https://www.made-in-china.com/Light-Industry-Daily-Use-Catalog/browse-Diamond-Knife-Sharpener-18202400000004.html)); dropship per stuk vermoedelijk $12–20 ⚠️; AliExpress-model "Aierlian" ([link](https://www.aliexpress.com/s/wiki-ssr/article/aierlian), prijs niet zichtbaar).
- **Levering:** China 7–12 dagen; CJ-EU waarschijnlijk ⚠️.
- **Compliance:** simpel (GPSR, waarschuwing sterke magneet). **Maar:** octrooirisico. In 2026 was er een UPC-zaak
  (Hamburg) over inbreuk op een Europees octrooi op een "roller grinder" (EP 4 117 857 B1,
  [uitspraak](https://www.veron.com/wp-content/uploads/pve-upc/fichiers/2026-05-06_LD_Hamburg_UPC_CFI_388-2025_en-GB.pdf)) ⚠️ partijen niet gecheckt. En de Tumbler-kloon van HORL werd publiek een knock-off genoemd ([Core77](https://www.core77.com/posts/117696/UPDATE-The-Tumbler-Knife-Sharpener-is-a-Knock-Off)). De skill zegt: lookalikes van een merkontwerp = hard reject.
- **Upsell:** wetsteen, strop, eiken blok, gravure.

#### 4. Verwarmde inlegzolen (oplaadbaar)

- **Prijsladder:** Action alleen wegwerp-warmtezolen [€0,88](https://www.action.com/nl-nl/p/2564132/thermofect-warmte-inlegzolen/);
  Decathlon HeatPerformance €129,95–199,95 ([link](https://www.decathlon.nl/p/mp/verwarmde-inlegzolen-pro-heatperformance/9ac8fad9-91a4-4864-a4f4-97b105a7c99c/c1)); Bertschat bij de [ANWB](https://www.anwb.nl/webwinkel/p/268879/bertschat-verwarmde-inlegzolen-elite).
- **Leverancier ⚠️:** Alibaba $26,50 (3–499 paar) ([link](https://www.alibaba.com/product-introduction/Carbon-Fiber-Intelligent-Remote-Control-Usb_1601102701453.html)).
- **Levering:** China, batterijlijnen zijn trager.
- **Compliance:** lithium (UN38.3, batterijenverordening), RF-afstandsbediening (RED), WEEE, maten.
- **Upsell:** tweede paar, verwarmde sokken.

#### 5. Huisdierportret op canvas (print-on-demand)

- **Prijsladder:** AH Fotoservice posters met eigen huisdierfoto vanaf [€18,90](https://fotoservice.ah.nl/fotocadeaus/dierencadeaus.html);
  handgeschilderd op Etsy ~€133 ([Etsy](https://www.etsy.com/r/similar/1875895063)).
- **Leverancier ⚠️:** Gelato (drukt o.a. in NL) — basisprijs niet publiek ([Gelato canvas](https://www.gelato.com/nl/custom-canvas));
  een vergelijker noemt €91,42 voor 50×75 ingelijst incl. verzending ([Printumo](https://printumo.com/compare/gelato)). €28 voor 40×50 is mijn schatting.
- **Levering:** 2–5 dagen in de EU (het enige product hier met snelle levering).
- **Compliance:** simpel; maatwerk valt buiten het 14-dagen-herroepingsrecht.
- **Upsell:** groter formaat, lijst, tweede dier. **Maar:** extra bouwwerk (foto-upload + voorbeeld) in Medusa.

## 4. Top 3 — met advocaat van de duivel

De top 3 kies ik op "kan het de €50 halen" (harde drempel), dan op score:
**1) vogelcamera, 2) radiatorventilator, 3) rolslijper.** Zolen en portret vallen af op break-even (≤ €34).

### #1 Vogelcamera — waarom het kan mislukken

Er adverteert in NL bijna niemand mee (zie Ads Library hieronder: één Belgische camerawinkel, 7 dagen). Dat kan
een gat in de markt zijn, maar de skill waarschuwt terecht: weinig concurrentie betekent vaak weinig vraag.
De koper is 55+ en vergelijkt op Coolblue, waar je naast Camouflage (€154) en Birdfy (€198) staat met een
onbekend merk. Electronica met wifi en een app levert meer gedoe op dan een lamp: 2,4 GHz-problemen, een
Chinese app, AI die een pimpelmees een "blue tit (US)" noemt, en in december geeft een zonnepaneel in Nederland
weinig stroom. Elk van die punten is een retour of een 1-sterreview. De compliance (RED-cybersecurity,
batterijregistratie, WEEE) is voor een beginner echt werk. En het seizoen is kort: als het sample pas half januari
binnen is, heb je drie weken tot de Tuinvogeltelling en daarna zakt de interesse. Tot slot: de marge hangt aan één
gok (≤ $45). De enige prijs die ik écht zag is $69, en daarmee werkt het niet.

### #2 Radiatorventilator — waarom het kan mislukken

Het is een product dat mensen in de bouwmarkt kopen en niet op Instagram: het filmt slecht (een fan op een
radiator is geen "wow"), dus je hebt een warmtecamera-video nodig om iets te laten zien. Het sterkste
verkoopargument (besparing) is precies het argument dat je niet hard mag maken, want de besparing is in
goed geïsoleerde huizen klein. SpeedComfort is een bekend merk bij Gamma/Praxis, en als Action er ooit een
voor €12,95 neerlegt, ben je klaar. De break-even haalt €50 alleen met de goedkoopste fans, en die zijn waarschijnlijk
ook het luidst. Het seizoen loopt nu al; met 2 weken China-levering verkoop je in februari aan mensen die over een
maand de verwarming lager zetten.

### #3 Rolslijper — waarom het kan mislukken

Hij staat al voor €17–25 op eBay en Shein, en een NL-dropshipper (Sharpify) draait op dit moment tientallen
advertenties met precies dit product en een kerst-hoek. Je komt dus als tweede of derde met hetzelfde product,
en de klant kan het voor een derde van jouw prijs vinden. Er speelt octrooi-/kopie-risico rond dit ontwerp. En
zelfs als alles goed gaat, is de break-even €30–41: onder het NL-gemiddelde CPA. Dit product verdient zijn plek in
de top 3 alleen omdat het simpel en robuust is, niet omdat het geld oplevert.

## 5. Vergelijking met de huidige Lichtval-lamp

| | Lichtval (huidig) | Vogelcamera | Radiatorventilator | Rolslijper |
|---|---|---|---|---|
| Bewezen vraag (Ads Library) | **Sterk**: Creative.Lighting 395 dagen, één advertentie 4,1 mln EU-bereik | Zwak: 1 NL-adverteerder, 7 dagen | Zie hieronder | Ja, maar druk (Sharpify) |
| Break-even nu bekend | €37 (€119) / €45 (€129) | €22–59 | €33–55 | €30–41 |
| Break-even als offerte meevalt | €58–66 (CJ $35) | €59 (bij $45 en €139) | €55 (goedkope fans, €99) | €41 |
| Compliance | Middel (LVD/EMC, WEEE, energielabel lichtbron) | **Zwaar** (RED-cyber, batterij, WEEE, privacy) | Middel + claimrisico | Licht + octrooirisico |
| Seizoen | Hele jaar (piek herfst/winter) | **Alleen dec–feb** | Alleen nov–feb | Cadeau-piek dec |
| Al gebouwd in de repo | **Ja** (winkel + product) | Nee | Nee | Nee |

**Oordeel: geen van de drie is duidelijk beter. Houd Lichtval.** De lamp heeft het sterkste vraag-signaal van alles
wat we in vier rondes zagen, werkt het hele jaar, heeft lichtere compliance dan de vogelcamera en staat al in de
winkel. Het zwakke punt van Lichtval (inkoopprijs onbekend, break-even €37) is precies hetzelfde zwakke punt als dat
van de vogelcamera, dus wisselen lost niets op. Wat de vogelcamera wél heeft: hoger prijspunt, een
cadeau-/seizoenshoek en een TikTok-vriendelijke video. Daarom is hij een goed **tweede spoor**, niet een vervanger.

Kritiek op mijn eigen oordeel: ik ben misschien bevooroordeeld richting "wat er al staat" (sunk cost). Als de
CJ-offerte voor Lichtval boven $50 uitkomt en de vogelcamera onder $40, draai ik het om. Daarom: eerst offertes.

**Let op:** de CJ-sourcing-aanvraag voor Lichtval (`docs/product-research/2026-11-cj-sourcing-lichtval.md`) staat
alleen op de branch `claude/intelligent-volta-tt4snu`, niet op main en niet op deze branch. Hij is dus mogelijk nog
niet verstuurd. Dat is stap 1 hieronder.

## 6. Validatieplan (goedkoopste stap eerst)

Dit plan is voor de vogelcamera (#1 van deze ronde), met de Lichtval-offerte er parallel naast omdat die gratis is.

| Stap | Wat | Kosten | Tijd | Stop als… | Door als… |
|---|---|---|---|---|---|
| 0 | **Zelf nachecken** (lijst onderaan): bol/Amazon.nl-prijzen en reviews, Action-app, Google Trends NL, Ads Library BE/DE | €0 | 1 uur | bol/Amazon heeft AI-modellen < €80 met 100+ reviews | er is een gat tussen ~€65 (geen AI) en €154 |
| 1a | **Lichtval:** CJ-sourcing-aanvraag versturen (tekst staat klaar) | €0 | 1–3 dagen | CJ > $50 incl. verzending | CJ ≤ $40 → Lichtval naar sample |
| 1b | **Vogelcamera:** offerte bij 3 leveranciers (CJ sourcing, 2× Alibaba "Verified" met Trade Assurance, + VEVOR EU) | €0 | 2–5 dagen | landed > €55 bij 10 stuks, óf geen CE-RED + EN 18031 rapport, óf AI alleen met abonnement, óf geen accu-documenten (UN38.3) | landed ≤ €50, documenten compleet |
| 2 | **1–2 samples** naar een NL-adres | €60–120 | 1–3 weken | setup > 15 min of lukt niet op gewone NL-router; < 7 van 10 vogelfoto's goed herkend (koolmees, pimpelmees, roodborst, merel, mus); accu leeg binnen 7 dagen in december; app niet in NL/EN | alles in orde + mooie beelden |
| 3 | **Eigen beelden** schieten (dat ís de advertentie) + winkel via de store factory + Meta Pixel/CAPI | €0–50 | 3–5 dagen | — | — |
| 4 | **Kleine advertentietest**: 3–5 creatives, €25/dag, 7 dagen, NL+BE, 45+ | €175–300 | 1 week | spend ≥ 1,5 × break-even (≈ €85 bij €139) zonder sale → product stoppen | CPA ≤ break-even → +20–30% budget per 2–3 dagen |

**Harde deadline:** als stap 4 niet vóór ~10 januari 2027 live is, parkeer de vogelcamera tot november 2027.
Na de Tuinvogeltelling (laatste weekend van januari ⚠️) zakt de interesse. Lichtval heeft die deadline niet.

**Budgetcheck:** stap 0–3 ≈ €60–170; stap 4 ≈ €175–300. Samen ruim binnen €500–1000, met geld over voor een tweede
ronde creatives of voor de Lichtval-test.

## 7. Wat ik zelf níet zeker weet (kritiek op dit onderzoek)

- **Leveranciersprijzen zijn zoekresultaten**, geen offertes. De vogelcamera-marge rust op een redenering ($30–45),
  niet op een prijs die ik heb gezien. De enige echte prijs ($69) maakt het product onrendabel.
- **bol.com en Amazon.nl kon ik niet openen.** Juist daar staan de no-name-varianten die jouw prijs onderuit kunnen
  halen. Dit is het grootste gat in dit onderzoek.
- **Ads Library = alleen actieve advertenties** en alleen advertenties met mijn NL-zoekwoorden. Een adverteerder die
  "bird feeder camera" in het Engels adverteert of in DE/BE target, mis ik. Bereik is geen omzet.
- **Scores zijn mijn oordeel.** Een ander kan bij "laat zich zien in 3 sec" of "merkbaar" makkelijk 1 punt anders scoren.
- **CPA-benchmarks (€30–45) zijn indicatief** en verschillen per bron; Q4 is duurder.
- **Wisselkoers, verzendkosten (€6–11) en het €2 handling-voorstel** zijn schattingen.
- Ik heb vier rondes lang steeds "één winnaar" aangewezen. Deze ronde wijs ik bewust **geen nieuwe winnaar** aan:
  zonder offerte en sample is dat raden.

## 8. Zelf nachecken (met de hand, ± 1 uur)

Vanuit de cloud-sessie niet bereikbaar, dus graag zelf (noteer prijs, aantal reviews, verkoper):

1. **bol.com**: zoek `vogelhuisje met camera`, `vogelvoederhuis camera AI`, `radiator ventilator`, `rollende messenslijper`.
   Sorteer op "populariteit". Noteer de 5 bovenste: prijs + aantal reviews.
2. **Amazon.nl**: dezelfde 4 zoektermen.
3. **Action-app** (NL én BE): `vogel`, `camera`, `radiator`, `slijper`.
4. **Google Trends** (regio Nederland, 5 jaar): `vogelhuisje met camera`, `vogelcamera`, `radiatorventilator`,
   `messenslijper`. Kijk of de piek elk jaar in december/januari zit en of de lijn stijgt.
5. **Meta Ads Library** (facebook.com/ads/library), land **België** en **Duitsland**, actieve advertenties:
   `vogelhuisje camera`, `Vogelfutterhaus Kamera`, `bird feeder camera`, `Birdfy`, `Bird Buddy`, `Netvue`.
   Noteer adverteerder + startdatum. 90+ dagen = sterk signaal.
   En land **Nederland**, de zoekwoorden die vanuit de cloud mislukten: `verwarmde zolen`, `huisdier portret`, `op = op`, `gratis verzending`, `kat`, `slapen`, `koken`.
6. **AliExpress**: `smart bird feeder camera AI solar` → sorteer op "orders". Noteer prijs incl. verzending naar NL
   en of er "ships from ES/DE/PL" bij staat.
7. **CJ** (na inloggen): `bird feeder camera` en `smart bird feeder` → prijs + warehouse.

## 9. Ads Library — wat er nu draait (NL, actief, 21 nov 2026)

Eigen scrape met `scripts/ads-library/` (headless, alleen actieve advertenties, land NL). "Resultaten" is het aantal dat Meta toont; de adverteerderskolom komt uit de eerste ~30 advertenties per zoekwoord. Dagen = sinds start van die advertentie.

| Zoekwoord | Resultaten | Adverteerders (langst lopende advertentie) |
|---|---|---|
| vogelhuisje camera | ~5 | Cameraexpert.be 7d, (onbekend) 3d |
| vogelcamera | 0 (Meta: "geen advertenties") | — |
| vogelvoederhuis | ~5 | Tuinhaard.com 5d |
| messenslijper | ~19 | VanPlek 281d, Chancenu 181d, Coolddy store 104d, Koken en Wonen 48d, Sharpify Slijpshop 39d, (onbekend) 17d |
| radiatorventilator | ~15 | (onbekend) 9d, SpeedComfortinternational 9d, Heatfan 4d |
| ijsbad | ~120 | (onbekend) 110d, Ticra Outdoor 60d, COMMIT 24d, Watery.nl 21d, Zonnecosmetica.com 13d, The Plunge 8d |
| padel | ~2.700 | PadelShop.com 593d, M3 Padel Academy 396d, Casa de Padel 363d, Jersix 285d, Garrincha Belgium 282d, Skull Padel 198d |
| wandlamp | ~370 | Creative.Lighting 397d, DMQ 296d, CaveTown 286d, Luminaire signature 274d, (onbekend) 272d, lampenlicht.nl 270d |
| hondenmand | ~300 | (onbekend) 192d, BuddyBeds 170d, Doodle-essentials.nl 123d, Ugc met BuddyBeds 116d, Pet Perfect 88d, vidaXL 75d |
| verwarmde zolen | ? | niet gelukt: Facebook blokkeerde tijdelijk (rate limit) ⚠️ |
| huisdier portret | ? | niet gelukt: Facebook blokkeerde tijdelijk (rate limit) ⚠️ |
| tegeltje | ~190 | Iedereenblij.nl 421d, Stroopwafel Studio 404d, Namensmij 337d, Studio Meuk 293d, (onbekend) 288d, Lieve Kadootjes 253d |
| op = op | ? | niet gelukt: Facebook blokkeerde tijdelijk (rate limit) ⚠️ |
| 1+1 gratis | ~50.000 | Prijatelj Zdravlja AB 1540d, Youcanprint 1329d, AutoScout24 482d, The Light Supplier 466d, HappySupps 370d, Goudtour 326d |
| bestel nu | ~42.000 | Decodeal 1164d, By La Nature 885d, Namly Design 785d, Pinauto Shop 706d, Lotgenootje 673d, Goedgemerkt 647d |
| gratis verzending | ? | niet gelukt: Facebook blokkeerde tijdelijk (rate limit) ⚠️ |
| cadeau voor hem | ~3.400 | AmeliaSieraden 569d, KHAIZEN 310d, DRKS 276d, Metaalversiering.nl 275d, Lindner & Co 208d, Bosch bedding 185d |
| kat | ? | niet gelukt: Facebook blokkeerde tijdelijk (rate limit) ⚠️ |
| slapen | ? | niet gelukt: Facebook blokkeerde tijdelijk (rate limit) ⚠️ |
| nekmassage | ~35 | CadanCe Huidinstituut 187d, Keyeclick 131d, IVY Hair Care 27d, Balungo.nl 27d, Keyeclick shop 4d, Leuzroog 4d |
| schoonmaken | ~5.500 | (onbekend) 424d, Netherlshop shop 418d, YOKUU 272d, Techweise 261d, Baby Brezza Benelux 245d, Chirurgisch Expertise Centrum 237d |
| tuin | ~11.000 | Sun Invest 1420d, KDV & BSO De Groene Tuin 1353d, Jasper de Ruiter - Natuurillustrator 1038d, (onbekend) 864d, BlokhuttenOutlet.nl 783d, devakhandel 719d |
| koken | ? | niet gelukt: Facebook blokkeerde tijdelijk (rate limit) ⚠️ |

**Hoe ik dit lees:**
- **Vogelcamera:** vrijwel leeg. Geen kleine webshop die er maanden op adverteert. Dat is géén bewijs van vraag; het is een open vraag.
- **Messenslijper:** volwassen markt met langlopers (VanPlek 281 dagen, elektrisch; Chancenu 181 dagen) en een rolslijper-dropshipper (Sharpify) die nu tientallen kerstadvertenties draait. Bewezen, maar druk.
- **Radiatorventilator:** SpeedComfort zelf en een nieuwe DTC-winkel (Heatfan, "nieuwe site") adverteren pas sinds dagen: seizoensgebonden, geen langlopers.
- **IJsbad / padel:** veel adverteerders, maar vooral sportscholen, wellness en gevestigde padelwinkels (PadelShop.com 593 dagen). Bevestigt de kill-redenen.
- **Wandlamp:** Creative.Lighting draait nog steeds (397 dagen) en er zijn meer langlopers (DMQ 296, CaveTown 286 dagen). Dit bevestigt de vraag naar design-wandlampen → steun voor Lichtval.
- **Hondenmand:** BuddyBeds (170 dagen) en Doodle-essentials (123 dagen) laten zien dat honden-comfort wél op Meta verkoopt. Ik heb de mand toch geschrapt (bol €68–80, groot pakket); als iemand dit wil heronderzoeken is BuddyBeds het startpunt.
- **Tegeltje:** Iedereenblij (421 dagen) en Stroopwafel Studio (404 dagen) lopen nog steeds: bewezen, maar lage prijs (zie kill-lijst).
- Zoekwoorden met `?` wil ik niet als "nul" lezen: "op = op" gaf eerder vandaag ~50.000 resultaten. Herhaal die met de hand.


## Bronnen (overige)

- Coolblue categorie vogelhuisjes met camera: https://www.coolblue.nl/wildlife-cameras/vogelhuisjes-met-camera
- Reviews smart bird feeders (wifi-problemen, abonnementen): [PopSci Bird Buddy](https://www.popsci.com/gear/bird-buddy-smart-bird-feeder-review),
  [Tom's Guide FeatherSnap](https://www.tomsguide.com/home/smart-home/feathersnap-scout-bird-feeder-review),
  [Digital Camera World PeckPerk](https://www.digitalcameraworld.com/au/cameras/bird-feeder-cameras/peckperk-bird-feeder-camera-review-if-youre-branching-out-into-ai-birdwatching-is-this-the-smart-option)
- CJ EU-magazijnen en levertijden (marketing van CJ zelf, 2–5 dagen): https://www.cjdropshipping.com/blogs/cj-news/CJ-s-Global-Warehouses ,
  https://www.spocket.co/blogs/cjdropshipping-overview
- Natuurpunt vogeltelweekend (BE): https://www.vrt.be/vrtnws/nl/2026/01/26/vogeltelweekend-natuurpunt-resultaten/
- Tuinvogeltelling 2025 (105.000 deelnemers): https://www.bnnvara.nl/vroegevogels/artikelen/ruim-100000-mensen-tellen-1-miljoen-vogels-tuinvogeltelling-2025
- Padel in cijfers 2025: https://www.nlpadel.nl/media/xvtejmk4/eyxknltb_padel_in_cijfers-2025.pdf
- Eerdere rondes: [2026-11-shortlist.md](./2026-11-shortlist.md)
