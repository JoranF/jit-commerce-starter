import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import MollieIn3Service from "./service"

export default ModuleProvider(Modules.PAYMENT, { services: [MollieIn3Service] })
