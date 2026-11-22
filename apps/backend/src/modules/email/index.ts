import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import EmailNotificationService from "./service"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [EmailNotificationService],
})
