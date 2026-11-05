import screenIcon from "./screen.svg"
import batteryIcon from "./battery.svg"
import cameraIcon from "./camera.svg"
import speakerIcon from "./speaker.svg"
import chargingIcon from "./charging.svg"
import cleaningIcon from "./cleaning.svg"
import backglassIcon from "./backglass.svg"
import motherboardIcon from "./motherboard.svg"
import powerIcon from "./power.svg"
import softwareIcon from "./software.svg"
import waterIcon from "./water.svg"

export const SERVICE_ICONS: Record<string, string> = {
  screen: screenIcon,
  battery: batteryIcon,
  camera: cameraIcon,
  speaker: speakerIcon,
  port: chargingIcon,
  charging: chargingIcon,
  clean: cleaningIcon,
  cleaning: cleaningIcon,
  case: backglassIcon,
  backglass: backglassIcon,
  motherboard: motherboardIcon,
  mainboard: motherboardIcon,
  power: powerIcon,
  software: softwareIcon,
  water: waterIcon,
}

export function getServiceIcon(nameOrCode?: string): string {
  if (!nameOrCode) return cleaningIcon
  const lower = nameOrCode.toLowerCase()
  if (lower.includes("điện") || lower.includes("chập") || lower.includes("ổ cắm") || lower.includes("aptomat") || lower.includes("cb") || lower.includes("nguồn")) return powerIcon
  if (lower.includes("nước") || lower.includes("vòi") || lower.includes("ống") || lower.includes("chậu") || lower.includes("rò rỉ") || lower.includes("thông tắc")) return waterIcon
  if (lower.includes("điều hòa") || lower.includes("lạnh") || lower.includes("máy giặt") || lower.includes("tủ lạnh") || lower.includes("nạp gas") || lower.includes("vệ sinh")) return cleaningIcon
  if (lower.includes("bơm") || lower.includes("bình") || lower.includes("nóng lạnh")) return powerIcon
  return cleaningIcon
}

export {
  screenIcon,
  batteryIcon,
  cameraIcon,
  speakerIcon,
  chargingIcon,
  cleaningIcon,
  backglassIcon,
  motherboardIcon,
  powerIcon,
  softwareIcon,
  waterIcon,
}
