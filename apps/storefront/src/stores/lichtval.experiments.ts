import type { StoreConfig } from "./types"

/**
 * Inhoud van de lopende A/B-tests van Lichtval (alleen tekst en keuzes, geen code).
 * Dit bestand (plus de experiment-keys in constants.ts en analytics/src/config.ts)
 * is wat de autopilot zelf mag aanpassen; zie docs/autopilot/README.md.
 *
 * Regels: geen nieuwe beloftes of claims die niet in de rest van de winkel staan,
 * geen nepschaarste of nepreviews, Nederlands, kort.
 */
export const lichtvalExperiments: NonNullable<StoreConfig["experimentContent"]> = {
  defaultPack: { flag: "default-pack", test: "2 lampen" },
  heroCopy: {
    flag: "hero-copy",
    test: {
      title: "Rust op je muur, elke avond.",
      lead: "Zet hem aan en er valt een zachte sluier van warm licht over je muur, zoals licht door water. Boven de bank, naast het bed of in de hal.",
    },
  },
}
