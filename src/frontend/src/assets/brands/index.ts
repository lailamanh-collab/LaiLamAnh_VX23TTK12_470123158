import appleLogo from "./apple.svg"
import samsungLogo from "./samsung.svg"
import xiaomiLogo from "./xiaomi.svg"
import oppoLogo from "./oppo.svg"
import vivoLogo from "./vivo.svg"
import realmeLogo from "./realme.svg"
import googleLogo from "./google.svg"
import honorLogo from "./honor.svg"

export const BRAND_LOGOS: Record<string, string> = {
  Apple: appleLogo,
  Samsung: samsungLogo,
  Xiaomi: xiaomiLogo,
  Oppo: oppoLogo,
  Vivo: vivoLogo,
  Realme: realmeLogo,
  Google: googleLogo,
  Honor: honorLogo,
}

export function getBrandLogo(brandName?: string): string {
  if (!brandName) return appleLogo
  const key = Object.keys(BRAND_LOGOS).find(
    (k) => k.toLowerCase() === brandName.toLowerCase()
  )
  return key ? BRAND_LOGOS[key] : appleLogo
}

export {
  appleLogo,
  samsungLogo,
  xiaomiLogo,
  oppoLogo,
  vivoLogo,
  realmeLogo,
  googleLogo,
  honorLogo,
}
