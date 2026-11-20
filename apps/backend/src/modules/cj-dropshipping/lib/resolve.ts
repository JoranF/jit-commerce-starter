import { CJ_DROPSHIPPING_MODULE } from "../index"
import type CjDropshippingService from "../service"

/** The CJ module is only registered when CJ_API_KEY is set. */
export function resolveCj(container: { resolve: (key: string) => unknown }) {
  try {
    return container.resolve(CJ_DROPSHIPPING_MODULE) as CjDropshippingService
  } catch {
    return undefined
  }
}
