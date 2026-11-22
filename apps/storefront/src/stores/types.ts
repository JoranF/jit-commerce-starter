/**
 * Eén winkel = één StoreConfig. De code is gedeeld; merk, kleuren, teksten en
 * beelden komen uit de config. Kies de winkel met NEXT_PUBLIC_STORE_ID.
 *
 * Teksten mogen {levertijd}, {verwerking}, {bezorging}, {bedenktijd} en {verzendkosten} bevatten;
 * die worden ingevuld vanuit het winkelbeleid van de regio (Medusa admin →
 * Settings → Regions → Metadata), zodat de site nooit iets anders belooft dan
 * de verzend- en retourpagina's.
 */
export type HexColor = `#${string}`

export type StoreImage = {
  src: string
  alt: string
  width: number
  height: number
}

export type StoreConfig = {
  id: string
  name: string
  /** Korte zin over de winkel: meta description, footer. */
  tagline: string
  /**
   * false = winkel met één product: de homepage is de landingspagina van dat
   * product en de navigatie is minimaal. true = gewone catalogus (starter).
   */
  catalog: boolean
  /** Handle van het hoofdproduct in Medusa. */
  productHandle: string
  /** Menu-/linktekst naar het product, bv. "De lamp" of "De koffie". */
  productLabel: string
  /** Anker van het koopblok op de homepage (zonder #). Standaard "kopen". */
  buyAnchor?: string

  theme: {
    colors: {
      /** Donkere merkkleur (hero-overgang, footer). */
      dark: HexColor
      /** Lichte achtergrond van de pagina. */
      light: HexColor
      /** Tekstkleur op licht. */
      ink: HexColor
      /** Accent (knoppen op donker, kleine highlights). */
      accent: HexColor
      /** Gedempte tekst en lijnen. */
      muted: HexColor
    }
    /** font-family namen; de lettertypen zelf worden geladen in stores/fonts.ts. */
    fonts: { display: string; body: string }
    /** Optionele textuur (herhalend beeld) als merkmotief in de footer. */
    texture?: string
  }

  seo: { title: string; description: string }

  hero: {
    title: string
    lead: string
    cta: string
    /** Breed beeld (desktop) en staand beeld (mobiel). */
    wide: StoreImage
    tall: StoreImage
    /**
     * Waar de lichtbron in het beeld zit (in %), voor het "lamp gaat aan"-moment.
     * Apart voor het brede en het staande beeld.
     */
    lightOrigin: { wide: { x: number; y: number }; tall: { x: number; y: number } }
    /**
     * Het "lamp gaat aan"-moment (licht spreidt vanuit lightOrigin). Standaard aan;
     * zet op false voor producten zonder licht. lightOrigin bepaalt dan alleen de
     * uitsnede van het beeld.
     */
    glow?: boolean
  }

  intro: { title: string; body: string; image: StoreImage }

  rooms: {
    title: string
    items: { image: StoreImage; title: string; body: string }[]
  }

  buy: {
    title: string
    image: StoreImage
    /** Alleen feiten die kloppen met het echte product. */
    facts: { label: string; value: string }[]
    promises: string[]
    /** Knoptekst "in winkelmand" per variant van het experiment pdp-cta-text. */
    ctaText: { control: string; test: string }
  }

  faq: { title: string; items: { q: string; a: string }[] }

  /**
   * Landingspagina per advertentie-invalshoek. Een advertentie met `angle=<key>`
   * in de URL krijgt deze kop/tekst in de hero (zelfde pagina, zelfde product),
   * zodat advertentie en pagina hetzelfde zeggen. Onbekende of lege angle = de
   * gewone hero. Per angle zie je in PostHog (ad_angle) en in het ads-rapport
   * wat het oplevert.
   */
  angles?: Record<
    string,
    {
      /** Korte naam voor rapporten, bv. "Cadeau". */
      label: string
      title?: string
      lead?: string
      cta?: string
    }
  >

  /** Toon bij gegenereerde beelden tot er echte productfoto's zijn. */
  imageNote?: string
  /**
   * Meta Pixel ID (Events Manager). Laadt pas na toestemming via de cookiebanner.
   * NEXT_PUBLIC_META_PIXEL_ID (build arg) gaat voor. Leeg = geen pixel.
   */
  metaPixelId?: string

  /**
   * Bedrijfsgegevens. Wettelijk verplicht op een webshop (KvK, adres, e-mail).
   * Leeg = wordt niet getoond.
   */
  company: {
    legalName?: string
    kvk?: string
    vat?: string
    address?: string
    email?: string
    phone?: string
  }
}
