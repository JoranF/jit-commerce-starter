import { lichtvalExperiments } from "./lichtval.experiments"
import type { StoreConfig } from "./types"

/**
 * Lichtval: winkel met één product, een wandlamp (CJ, "Small Size Warm Light", 33 cm)
 * met een plaat van gegolfd staal die een zachte sluier van licht op de muur werpt.
 * Keuzes en rekensom: docs/beslissingen/lichtval.md.
 *
 * Ontwerp (zie .claude/skills/frontend-design):
 * - Kleur: de muur bij schemering (petrol) tegen het warme licht van de lamp.
 *   Licht kalkgrijs als pagina, inkt-petrol als tekst. Eén accent: warm licht.
 * - Type: Hedvig Letters Serif voor koppen (groot, rustig), Schibsted Grotesk
 *   voor tekst en knoppen.
 * - Eén moment: bij het laden gaat de lamp "aan" en het licht spreidt zich over
 *   de muur. Daarna staat alles stil, want het echte lichtpatroon beweegt ook niet.
 * - Links uitgelijnd, veel ruimte, geen kaartjes, geen labels in hoofdletters.
 *
 * TODO vóór livegang (na ontvangst sample):
 * - Beelden zijn AI-sfeerbeelden (fal, op basis van de CJ-productfoto's, 22 nov 2026).
 *   Vervang door eigen foto's van de sample en haal dan `imageNote` weg.
 * - Nog controleren met de sample: aansluiting (stekker of vaste aansluiting), lichtkleur,
 *   of het patroon stilstaat, en de maten in `buy.facts`.
 */
export const lichtval: StoreConfig = {
  id: "lichtval",
  name: "Lichtval",
  tagline: "Wandlampen met het licht van water.",
  catalog: false,
  productHandle: "lichtval-wandlamp",
  productLabel: "De lamp",
  buyAnchor: "lamp",

  theme: {
    colors: {
      dark: "#16323A",
      light: "#EDEFEB",
      ink: "#142629",
      accent: "#F0CB86",
      muted: "#5F7374",
    },
    fonts: { display: "Hedvig Letters Serif", body: "Schibsted Grotesk Variable" },
    // Gegenereerd met scripts/brand/caustics.py (licht op water, naadloos).
    texture: "/stores/lichtval/caustics.png",
  },

  seo: {
    title: "Lichtval | Wandlamp met waterlicht",
    description:
      "Een wandlamp met een plaat van gegolfd staal. Hij werpt een zachte sluier van warm licht op je muur, zoals licht dat door water valt.",
  },

  hero: {
    title: "Waterlicht op je muur.",
    lead: "Een wandlamp met een plaat van gegolfd staal. Zet hem aan en er valt een zachte sluier van warm licht over je muur.",
    cta: "Bekijk de lamp",
    wide: {
      src: "/stores/lichtval/hero-breed.jpg",
      alt: "De Lichtval wandlamp aan op een blauwgrijze muur in de schemering, met een sluier van warm licht eromheen.",
      width: 2400,
      height: 1340,
    },
    tall: {
      src: "/stores/lichtval/hero-mobiel.jpg",
      alt: "De Lichtval wandlamp aan op een blauwgrijze muur in de schemering, met een sluier van warm licht eromheen.",
      width: 1290,
      height: 2311,
    },
    lightOrigin: { wide: { x: 77, y: 33 }, tall: { x: 57, y: 33 } },
  },

  intro: {
    title: "Rust, zodra het donker wordt.",
    body: "Achter de ronde schijf zit een plaat van gegolfd staal. Het licht valt erop en breekt in zachte plooien, zoals licht dat door water op de bodem valt. Overdag een rustig object, 's avonds de mooiste plek van de kamer.",
    image: {
      src: "/stores/lichtval/detail.jpg",
      alt: "Close-up van de wandlamp aan op een ruwe muur: een donkere ronde schijf op een smalle staaf, met een sluier van warm licht eromheen.",
      width: 1500,
      height: 1500,
    },
  },

  rooms: {
    title: "Waar hij het mooist is",
    items: [
      {
        image: {
          src: "/stores/lichtval/woonkamer.jpg",
          alt: "De wandlamp aan boven een zandkleurige bank in een woonkamer, 's avonds.",
          width: 1500,
          height: 1862,
        },
        title: "Boven de bank",
        body: "Als sfeerlicht voor de avond. De grote lamp kan uit.",
      },
      {
        image: {
          src: "/stores/lichtval/slaapkamer.jpg",
          alt: "Twee wandlampen aan weerszijden van een bed met grijsgroen linnen, in een donkere slaapkamer.",
          width: 1500,
          height: 1862,
        },
        title: "Naast het bed",
        body: "Eén aan elke kant, met de set van twee. Zacht genoeg om in slaap te vallen.",
      },
      {
        image: {
          src: "/stores/lichtval/hal.jpg",
          alt: "De wandlamp aan in een smalle hal, met jassen aan de haak en een houten bankje.",
          width: 1500,
          height: 1862,
        },
        title: "In de hal",
        body: "Het eerste wat je ziet als je thuiskomt.",
      },
    ],
  },

  buy: {
    title: "Lichtval wandlamp",
    image: {
      src: "/stores/lichtval/lamp.jpg",
      alt: "De Lichtval wandlamp aan: een donkere ronde schijf op een smalle verticale staaf, met een sluier van warm licht op een lichte muur.",
      width: 1600,
      height: 1600,
    },
    facts: [
      { label: "Materiaal", value: "Metaal en gegolfd roestvrij staal" },
      { label: "Maat", value: "33 cm hoog, schijf 10,5 cm, 8 cm diep" },
      { label: "Licht", value: "Warm wit, 220 V" },
    ],
    promises: [
      "In huis binnen {levertijd} werkdagen, met track & trace",
      "Verzendkosten {verzendkosten}, betalen met iDEAL",
      "{bedenktijd} dagen bedenktijd",
      "2 jaar garantie",
    ],
    ctaText: { control: "In winkelmand", test: "Bestel de lamp" },
    packs: { unit: "lamp", sizes: { "1 lamp": 1, "2 lampen": 2 } },
    optionImages: {
      "2 lampen": {
        src: "/stores/lichtval/slaapkamer.jpg",
        alt: "Twee Lichtval wandlampen aan weerszijden van een bed, allebei aan.",
        width: 1500,
        height: 1862,
      },
    },
  },

  faq: {
    title: "Vragen",
    items: [
      {
        q: "Wanneer is mijn lamp in huis?",
        a: "We versturen je lamp binnen {verwerking} werkdagen. Daarna duurt de bezorging {bezorging} werkdagen. Zodra hij onderweg is, krijg je een track & trace-code per e-mail.",
      },
      {
        q: "Waar is mijn bestelling?",
        a: "In de bevestiging van je bestelling staat een link naar 'Volg je bestelling'. Daar zie je waar je pakket is en wanneer het aankomt. Duurt het langer dan {levertijd} werkdagen? Mail ons, dan zoeken we het voor je uit.",
      },
      {
        // TODO bij het sample controleren: kwam het pakket zonder extra kosten aan?
        q: "Moet ik bij de bezorging nog iets betalen?",
        a: "Nee. Alle kosten zitten in de prijs en de verzendkosten. Je betaalt bij de bezorging niets extra, ook geen douane- of invoerkosten.",
      },
      {
        q: "Wat als mijn lamp beschadigd aankomt?",
        a: "Stuur ons een foto van de lamp en de verpakking. Dan sturen we je een nieuwe lamp of krijg je je geld terug, wat jij wilt. De kapotte lamp hoef je niet terug te sturen.",
      },
      {
        q: "Beweegt het licht?",
        a: "Nee, het patroon staat stil, net als de schaduw van een raam. Het is een zachte, vaste sluier van licht op je muur.",
      },
      {
        q: "Kan ik er twee bestellen?",
        a: "Ja. Kies bij het bestellen voor 2 lampen: dan betaal je minder dan voor twee losse lampen. Mooi aan weerszijden van het bed of naast elkaar in de hal.",
      },
      {
        q: "Kan ik de lamp terugsturen?",
        a: "Ja. Je hebt {bedenktijd} dagen bedenktijd na ontvangst. Stuur ons een e-mail, dan regelen we de retour. De verzendkosten voor het terugsturen zijn voor jou; je krijgt je geld terug zodra de lamp bij ons is.",
      },
      {
        q: "Hoe zit het met garantie?",
        a: "Je hebt 2 jaar garantie. Werkt je lamp niet goed, stuur ons dan een foto of video. We zorgen voor een oplossing.",
      },
      {
        q: "Hoe betaal ik?",
        a: "Je betaalt veilig via Mollie, bijvoorbeeld met iDEAL, Bancontact of creditcard.",
      },
    ],
  },

  // Invalshoeken voor advertenties: zet `angle=<key>` in de URL van de advertentie.
  angles: {
    sfeer: { label: "Sfeer" },
    slaapkamer: {
      label: "Slaapkamer",
      title: "Zacht licht naast je bed.",
      lead: "Een wandlamp die een sluier van warm licht over je muur legt. Genoeg om bij te lezen, zacht genoeg om bij in slaap te vallen.",
    },
    cadeau: {
      label: "Cadeau",
      title: "Een cadeau dat elke avond aangaat.",
      lead: "Een wandlamp met een plaat van gegolfd staal. Zet hem aan en er valt een zachte sluier van warm licht over de muur.",
    },
  },

  imageNote: "Sfeerbeelden. De lamp die je ontvangt kan in afwerking licht afwijken.",

  // TODO vóór livegang: fabrikant (naam + adres uit de CE-verklaring van CJ) en
  // waarschuwingen (aansluiting) invullen; tot dan meldt `pnpm check-store` dit.
  // productSafety: {
  //   manufacturer: "<naam en adres fabrikant>",
  //   euResponsible: "Joran Information Technology, Prins Bernhardstraat 8, 6668 AH Randwijk, joranfloor@gmail.com",
  //   identifier: "LICHTVAL-WANDLAMP",
  //   warnings: ["Alleen voor gebruik binnenshuis.", "..."],
  // },

  paymentMethods: ["ideal", "bancontact", "card", "paypal", "applepay"],

  // A/B-tests zonder code; los bestand zodat de autopilot alleen dát mag aanpassen.
  experimentContent: lichtvalExperiments,

  company: {
    legalName: "Joran Information Technology",
    kvk: "96539402",
    vat: "NL005215436B31",
    address: "Prins Bernhardstraat 8, 6668 AH Randwijk",
    email: "joranfloor@gmail.com",
  },
}
