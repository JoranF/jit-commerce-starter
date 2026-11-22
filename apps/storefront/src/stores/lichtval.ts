import type { StoreConfig } from "./types"

/**
 * Lichtval: winkel met één product, een wandlamp met een gehamerde reflector die
 * een waterpatroon op de muur werpt.
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
 * - Beelden zijn AI-sfeerbeelden (fal). Vervang door eigen foto's van de echte lamp
 *   en haal dan `imageNote` weg.
 * - Patroon staat stil en is met de hand te verstellen (bevestigd via de AliExpress-
 *   listing, 21 nov 2026); FAQ "Beweegt het licht?" klopt. Nog controleren met de
 *   sample: overige `buy.facts`, aansluiting (stekker of vaste aansluiting) en lichtkleur.
 * - Vul `company` in (KvK, adres, e-mail): wettelijk verplicht.
 */
export const lichtval: StoreConfig = {
  id: "lichtval",
  name: "Lichtval",
  tagline: "Wandlampen met het licht van water.",
  catalog: false,
  productHandle: "lichtval-wandlamp",

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
      "Een wandlamp van aluminium en staal met een gehamerde reflector. Hij werpt een zacht golfpatroon op je muur, zoals licht dat van water weerkaatst.",
  },

  hero: {
    title: "Waterlicht op je muur.",
    lead: "Een wandlamp met een reflector van gehamerd staal. Zet hem aan en je muur krijgt het patroon van licht op water.",
    cta: "Bekijk de lamp",
    wide: {
      src: "/stores/lichtval/hero-breed.jpg",
      alt: "Een wandlamp van aluminium en staal op een lichte muur in de schemering, met een golvend lichtpatroon eromheen.",
      width: 2400,
      height: 1340,
    },
    tall: {
      src: "/stores/lichtval/hero-mobiel.jpg",
      alt: "Een wandlamp van aluminium en staal op een lichte muur in de schemering, met een golvend lichtpatroon eromheen.",
      width: 1290,
      height: 2311,
    },
    lightOrigin: { wide: { x: 77, y: 46 }, tall: { x: 56, y: 33 } },
  },

  intro: {
    title: "Rust, zodra het donker wordt.",
    body: "Het licht valt op een reflector van gehamerd staal en breekt daar in zachte golven, zoals zonlicht dat van water weerkaatst. Draai de kop een stukje en het patroon schuift mee over de muur.",
    image: {
      src: "/stores/lichtval/detail.jpg",
      alt: "Close-up van de aluminium kop en de gehamerde stalen reflector, met warm licht op het metaal.",
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
          alt: "De wandlamp boven een zandkleurige bank in een woonkamer, 's avonds.",
          width: 1500,
          height: 1862,
        },
        title: "Boven de bank",
        body: "Als sfeerlicht voor de avond. De grote lamp kan uit.",
      },
      {
        image: {
          src: "/stores/lichtval/slaapkamer.jpg",
          alt: "De wandlamp naast een bed met grijsgroen linnen, in een donkere slaapkamer.",
          width: 1500,
          height: 1862,
        },
        title: "Naast het bed",
        body: "Zacht genoeg om bij te lezen of in slaap te vallen.",
      },
      {
        image: {
          src: "/stores/lichtval/hal.jpg",
          alt: "De wandlamp in een smalle hal met een houten bankje en een jas aan de haak.",
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
      alt: "De Lichtval wandlamp: ronde muurplaat, dunne stalen arm, aluminium kop en een gehamerde stalen reflector.",
      width: 1600,
      height: 1600,
    },
    facts: [
      { label: "Materiaal", value: "Aluminium en roestvrij staal" },
      { label: "Reflector", value: "Gehamerd staal" },
      { label: "Kop", value: "Draait tot 180°" },
    ],
    promises: [
      "In huis binnen {levertijd} werkdagen, met track & trace",
      "Verzendkosten {verzendkosten}, betalen met iDEAL",
      "{bedenktijd} dagen bedenktijd",
      "2 jaar garantie",
    ],
    ctaText: { control: "In winkelmand", test: "Bestel de lamp" },
  },

  faq: {
    title: "Vragen",
    items: [
      {
        q: "Wanneer is mijn lamp in huis?",
        a: "We versturen je lamp binnen {verwerking} werkdagen. Daarna duurt de bezorging {bezorging} werkdagen. Zodra hij onderweg is, krijg je een track & trace-code per e-mail.",
      },
      {
        q: "Beweegt het licht?",
        a: "Nee, het patroon staat stil, net als de schaduw van een raam. Draai je de kop van de lamp, dan schuift het patroon over de muur.",
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

  imageNote: "Sfeerbeelden. De lamp die je ontvangt kan in afwerking licht afwijken.",

  company: {
    legalName: "Joran Information Technology",
    kvk: "96539402",
    vat: "NL005215436B31",
    address: "Prins Bernhardstraat 8, 6668 AH Randwijk",
    email: "joranfloor@gmail.com",
  },
}
