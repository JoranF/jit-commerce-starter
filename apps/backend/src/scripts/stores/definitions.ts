import type { RegionStorePolicies } from "../../lib/region-store-policies"

/**
 * Backend-kant van een winkel: het product, de foto's en het winkelbeleid.
 * Hoort bij apps/storefront/src/stores/<id>.ts (zelfde id en product-handle).
 * Uitvoeren: `medusa exec ./src/scripts/stores/setup-store.ts <id>`, of zet
 * STORE_ID=<id> op de backend (dan draait het bij elke start, idempotent).
 */
export type StoreSetup = {
  id: string
  product: {
    handle: string
    title: string
    subtitle?: string
    description: string
    /**
     * Verhoog dit getal om een bestaand product eenmalig te laten bijwerken bij de
     * volgende start: foto's vervangen en de prijzen van de varianten op de waarden
     * hieronder zetten (ook als ze in de admin zijn aangepast). Staat als
     * `store_setup_revision` in de metadata van het product.
     */
    revision?: number
    /** Bestanden in src/scripts/assets/<id>/, in volgorde; de eerste is de thumbnail. */
    images: { file: string; alt: string }[]
    /** Naam van de productoptie waar de varianten op verschillen, bv. "Aantal". */
    optionTitle: string
    /**
     * Varianten; de eerste is de standaardkeuze in de winkel. Ontbrekende varianten
     * (op SKU) worden bij een bestaand product toegevoegd; prijzen van bestaande
     * varianten beheer je daarna in de admin.
     */
    variants: {
      /** Waarde van de optie, zichtbaar voor de klant (bv. "1 lamp"). */
      title: string
      sku: string
      /** Verkoopprijs in EUR inclusief btw (prijzen zijn incl. btw ingesteld). */
      priceEur: number
      /** Bv. { cj_vid: "...", cj_quantity: 2 } zodra de CJ-variant bekend is (dropshipping). */
      metadata?: Record<string, unknown>
    }[]
  }
  /** Winkelbeleid in de metadata van elke regio (levertijden, bedenktijd). */
  policies: Partial<RegionStorePolicies>
  /** Naam en omschrijving van de verzendoptie "Standaard" (type-code: standard). */
  standardShipping?: { name?: string; description?: string }
  /**
   * Verzendopties (type-code) die niet in de winkel getoond worden, bv. "express"
   * als "volgende dag" niet kan. Wordt verborgen (enabled_in_store=false), niet verwijderd.
   */
  hideShippingCodes?: string[]
  /** Demo-producten van de starter op concept zetten (niet verwijderen). */
  hideDemoProducts?: boolean
  /**
   * Verlaagd btw-tarief voor het product (bv. voedingsmiddelen). Het product krijgt
   * producttype `typeName`, met per land een eigen tarief dat voorgaat op het
   * standaardtarief van de regio (NL 21% → 9%). Verzendkosten krijgen hetzelfde
   * tarief (ze volgen de goederen). Alleen voor winkels die uitsluitend dit soort
   * producten verkopen. Idempotent.
   */
  reducedVat?: { typeName: string; rates: Record<string, number> }
  /**
   * Merk en bedrijfsgegevens voor de e-mails aan klanten (bevestiging, verzending).
   * Gelijk houden met apps/storefront/src/stores/<id>.ts (company, theme.colors).
   * De bevestigingsmail moet wettelijk je bedrijfsgegevens en het herroepingsrecht noemen.
   */
  brand?: {
    name: string
    /** Kleuren in de e-mail: donker (kop, knop), licht (achtergrond), accent (lijntje). */
    colors?: { dark: string; light: string; accent?: string }
    company: { legalName: string; kvk?: string; vat?: string; address?: string; email: string }
  }
}

export const STORE_SETUPS: Record<string, StoreSetup> = {
  lichtval: {
    id: "lichtval",
    product: {
      handle: "lichtval-wandlamp",
      title: "Lichtval wandlamp",
      subtitle: "Met een plaat van gegolfd staal",
      description: [
        "Een wandlamp met een donkere ronde schijf op een smalle staaf. Erachter zit een plaat van gegolfd roestvrij staal: het licht valt erop en breekt in een zachte sluier over je muur, zoals licht dat door water valt.",
        "33 cm hoog, schijf van 10,5 cm, 8 cm diep. Warm wit licht, 220 V. Mooi boven de bank, naast het bed of in de hal. Neem er twee voor aan weerszijden van het bed.",
      ].join("\n\n"),
      images: [
        { file: "1-lamp.jpg", alt: "De Lichtval wandlamp aan: een donkere ronde schijf op een smalle verticale staaf, met een sluier van warm licht op een lichte muur." },
        { file: "2-woonkamer.jpg", alt: "De wandlamp aan boven een zandkleurige bank in een woonkamer, 's avonds." },
        { file: "3-detail.jpg", alt: "Close-up van de wandlamp aan op een ruwe muur, met een sluier van warm licht." },
        { file: "4-slaapkamer.jpg", alt: "Twee wandlampen aan weerszijden van een bed met grijsgroen linnen." },
        { file: "5-hal.jpg", alt: "De wandlamp aan in een smalle hal met jassen aan de haak." },
      ],
      // 2: foto's van de echte CJ-lamp, prijs 1 lamp €119 → €129 (22 nov 2026).
      revision: 2,
      // Keuzes en rekensom: docs/beslissingen/lichtval.md
      optionTitle: "Aantal",
      variants: [
        { title: "1 lamp", sku: "LICHTVAL-WANDLAMP", priceEur: 129 },
        // Zodra de vid bekend is: metadata: { cj_vid: "<vid van de lamp>", cj_quantity: 2 }
        // (één Duo = twee lampen bij CJ; zonder cj_quantity stuurt CJ er maar één).
        { title: "2 lampen", sku: "LICHTVAL-WANDLAMP-DUO", priceEur: 219 },
      ],
    },
    // Dropshipping vanuit China (CJ, CJPacket Ordinary E): 1–3 werkdagen verwerking, 7–12 werkdagen onderweg.
    // Pas aan zodra de leverancier vaststaat (EU-magazijn = veel korter).
    policies: {
      return_window_days: 14,
      free_returns: false,
      shipping_rate: 4.95,
      handling_days_min: 1,
      handling_days_max: 3,
      transit_days_min: 7,
      transit_days_max: 12,
    },
    standardShipping: {
      name: "Verzending met track & trace (8–15 werkdagen)",
      description: "Binnen 8–15 werkdagen in huis, met track & trace.",
    },
    hideShippingCodes: ["express"],
    hideDemoProducts: true,
    brand: {
      name: "Lichtval",
      colors: { dark: "#16323A", light: "#EDEFEB", accent: "#F0CB86" },
      company: {
        legalName: "Joran Information Technology",
        kvk: "96539402",
        vat: "NL005215436B31",
        address: "Prins Bernhardstraat 8, 6668 AH Randwijk",
        email: "joranfloor@gmail.com",
      },
    },
  },
  tarrazu: {
    id: "tarrazu",
    product: {
      handle: "tarrazu-koffiebonen",
      title: "Tarrazú koffiebonen",
      subtitle: "Hele bonen uit Costa Rica",
      description: [
        "Hele koffiebonen uit Costa Rica, het land dat bekendstaat om koffie van hooggelegen plantages.",
        "In zakken van 250 g, 500 g en 1 kg. Maal ze vlak voor het zetten: filter middelgrof, espresso fijn, French press grof. Bewaar ze luchtdicht, koel en donker.",
      ].join("\n\n"),
      images: [{ file: "1-product.png", alt: "Een zak Tarrazú koffiebonen." }],
      optionTitle: "Gewicht",
      variants: [
        { title: "250 g", sku: "TARRAZU-250", priceEur: 12.95 },
        { title: "500 g", sku: "TARRAZU-500", priceEur: 22.95 },
        { title: "1 kg", sku: "TARRAZU-1000", priceEur: 39.95 },
      ],
    },
    // Aanname tot er een leverancier is: brander/importeur in de EU, 1–2 dagen verwerking,
    // 1–3 dagen bezorging. Pas aan zodra de leverancier vaststaat (docs/beslissingen/tarrazu.md).
    policies: {
      return_window_days: 14,
      free_returns: false,
      shipping_rate: 4.95,
      handling_days_min: 1,
      handling_days_max: 2,
      transit_days_min: 1,
      transit_days_max: 3,
    },
    standardShipping: {
      name: "Verzending met track & trace",
      description: "Met track & trace.",
    },
    hideShippingCodes: ["express"],
    hideDemoProducts: true,
    // Koffie is een voedingsmiddel: verlaagd btw-tarief (NL 9%, BE 6%, DE 7%).
    reducedVat: { typeName: "Voedingsmiddelen", rates: { nl: 9, be: 6, de: 7 } },
  },
  // new-store:insert (niet weghalen: hier voegt `pnpm new-store` winkels toe)
}
