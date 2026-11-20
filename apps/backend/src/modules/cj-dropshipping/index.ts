import { Module } from "@medusajs/framework/utils"
import CjDropshippingService from "./service"

export const CJ_DROPSHIPPING_MODULE = "cjDropshipping"

export default Module(CJ_DROPSHIPPING_MODULE, {
  service: CjDropshippingService,
})

export type { CjModuleOptions } from "./service"
export { CjDropshippingService }
