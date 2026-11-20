import { store } from "@stores"

/** Koopknop in de merkstijl voor winkels met één product; anders Medusa's standaard. */
export const brandButton = store.catalog
  ? ""
  : "!h-12 !rounded-full !bg-brand-ink !text-brand-light !shadow-none hover:!bg-brand-ink/90 focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-brand-ink disabled:!bg-brand-ink/30"
