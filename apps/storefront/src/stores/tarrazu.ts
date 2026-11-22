import type { StoreConfig } from "./types"

/**
 * Tarrazú: winkel met één product. Gemaakt met `pnpm new-store tarrazu`.
 *
 * Teksten bewust algemeen: er is nog geen leverancier. Zodra die er is: smaak,
 * branding, hoogte en (als het klopt) de streek Tarrazú toevoegen aan facts/intro.
 * Keuzes en open punten: docs/beslissingen/tarrazu.md.
 * Beelden in public/stores/tarrazu/ zijn effen placeholders: vervang ze (fal.ai,
 * zie CLAUDE.md) en pas width/height aan.
 */
export const tarrazu: StoreConfig = {
  id: "tarrazu",
  name: "Tarrazú",
  tagline: "Koffiebonen uit Costa Rica.",
  catalog: false,
  productHandle: "tarrazu-koffiebonen",
  productLabel: "De koffie",
  buyAnchor: "koffie",

  theme: {
    // Gebrande boon (donker), crème (pagina), rijpe koffiekers (accent).
    colors: {
      dark: "#2B1D16",
      light: "#F4EFE6",
      ink: "#23180F",
      accent: "#D9895B",
      muted: "#7A6A5C",
    },
    fonts: { display: "Hedvig Letters Serif", body: "Schibsted Grotesk Variable" },
  },

  seo: {
    title: "Tarrazú | Koffiebonen uit Costa Rica",
    description:
      "Hele koffiebonen uit Costa Rica, in zakken van 250 g, 500 g en 1 kg. Thuis vers gemalen, met track & trace bezorgd.",
  },

  hero: {
    title: "Koffie uit de bergen van Costa Rica.",
    lead: "Hele bonen, in 250 g, 500 g of 1 kg. Maal ze vlak voor het zetten, dan proef je het meest.",
    cta: "Bekijk de koffie",
    wide: { src: "/stores/tarrazu/hero-breed.png", alt: "Koffiebonen en een kop koffie op een houten tafel in ochtendlicht.", width: 2400, height: 1340 },
    tall: { src: "/stores/tarrazu/hero-mobiel.png", alt: "Koffiebonen en een kop koffie op een houten tafel in ochtendlicht.", width: 1290, height: 2311 },
    lightOrigin: { wide: { x: 70, y: 50 }, tall: { x: 50, y: 40 } },
    glow: false,
  },

  intro: {
    title: "Waarom Costa Rica.",
    body: "Costa Rica staat bekend om koffie van hooggelegen plantages, waar de bessen langzaam rijpen. Tarrazú, in de bergen ten zuiden van San José, is de bekendste van die streken.",
    image: { src: "/stores/tarrazu/detail.png", alt: "Close-up van gebrande koffiebonen.", width: 1500, height: 1500 },
  },

  rooms: {
    title: "Zo zet je hem",
    items: [
      {
        image: { src: "/stores/tarrazu/kamer-1.png", alt: "Koffie die door een filter loopt.", width: 1500, height: 1862 },
        title: "Filter",
        body: "Middelgrof gemalen, ongeveer 6 gram koffie per 100 ml water net van de kook.",
      },
      {
        image: { src: "/stores/tarrazu/kamer-2.png", alt: "Een espresso met crema.", width: 1500, height: 1862 },
        title: "Espresso",
        body: "Fijn gemalen, vlak voor het zetten. Stel je molen bij tot de shot rond de 25 seconden loopt.",
      },
      {
        image: { src: "/stores/tarrazu/kamer-3.png", alt: "Een French press met koffie.", width: 1500, height: 1862 },
        title: "French press",
        body: "Grof gemalen, vier minuten laten trekken en dan langzaam het filter naar beneden drukken.",
      },
    ],
  },

  buy: {
    title: "Tarrazú koffiebonen",
    image: { src: "/stores/tarrazu/product.png", alt: "Een zak Tarrazú koffiebonen.", width: 1600, height: 1600 },
    // Alleen feiten die kloppen; smaak, branding en hoogte volgen zodra de leverancier vaststaat.
    facts: [
      { label: "Herkomst", value: "Costa Rica" },
      { label: "Vorm", value: "Hele bonen" },
      { label: "Formaten", value: "250 g, 500 g en 1 kg" },
    ],
    promises: [
      "In huis binnen {levertijd} werkdagen, met track & trace",
      "Verzendkosten {verzendkosten}, betalen met iDEAL",
      "Ongeopende zakken: {bedenktijd} dagen bedenktijd",
    ],
    ctaText: { control: "In winkelmand", test: "Bestel de koffie" },
  },

  faq: {
    title: "Vragen",
    items: [
      {
        q: "Wanneer is mijn koffie in huis?",
        a: "We versturen je bestelling binnen {verwerking} werkdagen. Daarna duurt de bezorging {bezorging} werkdagen. Zodra hij onderweg is, krijg je een track & trace-code per e-mail.",
      },
      {
        q: "Kan ik ook gemalen koffie bestellen?",
        a: "Nu nog niet: we verkopen alleen hele bonen. Die blijven langer lekker, en je maalt ze zelf precies goed voor jouw manier van zetten.",
      },
      {
        q: "Hoe bewaar ik de bonen?",
        a: "Luchtdicht, koel en donker, bijvoorbeeld in de zak of een afgesloten pot in de kast. Niet in de koelkast: daar trekt vocht in de bonen.",
      },
      {
        q: "Kan ik de koffie terugsturen?",
        a: "Ongeopende zakken kun je binnen {bedenktijd} dagen na ontvangst terugsturen. Stuur ons een e-mail, dan regelen we de retour. Geopende zakken nemen we om hygiënische redenen niet terug.",
      },
      {
        q: "Hoe betaal ik?",
        a: "Je betaalt veilig via Mollie, bijvoorbeeld met iDEAL, Bancontact of creditcard.",
      },
    ],
  },

  // Invalshoeken voor advertenties: angle=<key> in de advertentie-URL.
  angles: {
    standaard: { label: "Standaard" },
    espresso: {
      label: "Espresso",
      title: "Bonen voor je espressomachine.",
      lead: "Hele bonen uit Costa Rica. Maal ze vlak voor het zetten en stel je molen af op jouw machine.",
    },
    cadeau: {
      label: "Cadeau",
      title: "Koffie uit Costa Rica, als cadeau.",
      lead: "Hele bonen in 250 g, 500 g of 1 kg. Voor wie thuis zijn eigen koffie maalt.",
    },
  },

  imageNote: "Sfeerbeelden. De zak die je ontvangt kan afwijken.",

  // Zelfde onderneming als Lichtval (handelsnaam Tarrazú nog inschrijven bij de KvK).
  company: {
    legalName: "Joran Information Technology",
    kvk: "96539402",
    vat: "NL005215436B31",
    address: "Prins Bernhardstraat 8, 6668 AH Randwijk",
    email: "joranfloor@gmail.com",
  },
}
