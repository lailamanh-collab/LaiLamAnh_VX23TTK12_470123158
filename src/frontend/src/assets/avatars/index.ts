import tech1 from "./tech-1.jpg"
import tech2 from "./tech-2.jpg"
import tech3 from "./tech-3.jpg"
import customer1 from "./customer-1.jpg"
import customer2 from "./customer-2.jpg"
import customer3 from "./customer-3.jpg"
import defaultAvatar from "./default-avatar.svg"

export const AVATAR_IMAGES = {
  technicians: [tech1, tech2, tech3],
  customers: [customer1, customer2, customer3],
  default: defaultAvatar,
}

export function getAvatarImage(identifier?: string, isTechnician = false): string {
  if (!identifier) return defaultAvatar
  const pool = isTechnician ? AVATAR_IMAGES.technicians : AVATAR_IMAGES.customers
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash + identifier.charCodeAt(i)) % pool.length
  }
  return pool[hash] || defaultAvatar
}

export {
  tech1,
  tech2,
  tech3,
  customer1,
  customer2,
  customer3,
  defaultAvatar,
}
