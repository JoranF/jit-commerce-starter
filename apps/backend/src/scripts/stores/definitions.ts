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
}

export const STORE_SETUPS: Record<string, StoreSetup> = {
  lichtval: {
    id: "lichtval",
    product: {
      handle: "lichtval-wandlamp",
      title: "Lichtval wandlamp",
      subtitle: "Met een reflector van gehamerd staal",
      description: [
        "Een wandlamp van aluminium en roestvrij staal. Het licht valt op een reflector van gehamerd staal en breekt daar in zachte golven, zoals zonlicht dat van water weerkaatst.",
        "De kop draait tot 180°. Draai hem een stukje en het golfpatroon schuift mee over de muur. Mooi boven de bank, naast het bed of in de hal.",
      ].join("\n\n"),
      images: [
        { file: "1-lamp.jpg", alt: "De Lichtval wandlamp: ronde muurplaat, dunne stalen arm, aluminium kop en een gehamerde stalen reflector, met een golvend lichtpatroon op de muur." },
        { file: "2-woonkamer.jpg", alt: "De wandlamp boven een zandkleurige bank in een woonkamer, 's avonds." },
        { file: "3-detail.jpg", alt: "Close-up van de aluminium kop en de gehamerde stalen reflector." },
        { file: "4-slaapkamer.jpg", alt: "De wandlamp naast een bed met grijsgroen linnen, in een donkere slaapkamer." },
        { file: "5-hal.jpg", alt: "De wandlamp in een smalle hal met een houten bankje." },
      ],
      // Keuzes en rekensom: docs/beslissingen/lichtval.md
      optionTitle: "Aantal",
      variants: [
        { title: "1 lamp", sku: "LICHTVAL-WANDLAMP", priceEur: 129 },
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
  },
}
