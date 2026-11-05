import iphone16 from "./iphone-16.jpg"
import iphone15 from "./iphone-15.jpg"
import iphone14 from "./iphone-14.jpg"
import iphone13 from "./iphone-13.jpg"
import iphone12 from "./iphone-12.jpg"
import iphone11 from "./iphone-11.jpg"
import iphoneXs from "./iphone-xs.jpg"
import iphoneXr from "./iphone-xr.jpg"
import iphoneX from "./iphone-x.jpg"
import iphone8 from "./iphone-8.jpg"
import iphoneSe from "./iphone-se.jpg"
import samsungS24 from "./samsung-s24.jpg"
import samsungS23 from "./samsung-s23.jpg"
import samsungFold from "./samsung-fold.jpg"
import xiaomi14 from "./xiaomi-14.jpg"
import xiaomiRedmi from "./xiaomi-redmi.jpg"
import oppoPhone from "./oppo.jpg"
import vivoPhone from "./vivo.jpg"
import realmePhone from "./realme.jpg"
import googlePixel from "./google-pixel.jpg"
import honorPhone from "./honor.jpg"
import defaultPhone from "./default-phone.svg"

export const PHONE_IMAGES: Record<string, string> = {
  // Apple
  "iPhone 16": iphone16,
  "iPhone 16 Pro": iphone16,
  "iPhone 16 Pro Max": iphone16,
  "iPhone 15": iphone15,
  "iPhone 15 Pro": iphone15,
  "iPhone 15 Pro Max": iphone15,
  "iPhone 14": iphone14,
  "iPhone 14 Pro": iphone14,
  "iPhone 14 Pro Max": iphone14,
  "iPhone 13": iphone13,
  "iPhone 13 Pro": iphone13,
  "iPhone 13 Pro Max": iphone13,
  "iPhone 12": iphone12,
  "iPhone 12 Pro": iphone12,
  "iPhone 11": iphone11,
  "iPhone 11 Pro": iphone11,
  "iPhone XS": iphoneXs,
  "iPhone XS Max": iphoneXs,
  "iPhone XR": iphoneXr,
  "iPhone X": iphoneX,
  "iPhone 8": iphone8,
  "iPhone 8 Plus": iphone8,
  "iPhone SE": iphoneSe,

  // Samsung
  "Galaxy S24": samsungS24,
  "Galaxy S24 Ultra": samsungS24,
  "Galaxy S23": samsungS23,
  "Galaxy S23 Ultra": samsungS23,
  "Galaxy Z Fold": samsungFold,
  "Galaxy Z Flip": samsungFold,
  "Galaxy A55": samsungS23,
  "Galaxy A54": samsungS23,
  "Galaxy A35": samsungS23,
  "Galaxy Note": samsungS24,
  "Galaxy S22": samsungS23,
  "Galaxy S21": samsungS23,

  // Xiaomi
  "Xiaomi 14": xiaomi14,
  "Xiaomi 13": xiaomi14,
  "Xiaomi 12": xiaomi14,
  "Redmi": xiaomiRedmi,
  "POCO": xiaomiRedmi,

  // Oppo
  "Find X": oppoPhone,
  "Find N": oppoPhone,
  "Reno": oppoPhone,
  "Oppo": oppoPhone,

  // Vivo
  "Vivo X": vivoPhone,
  "Vivo V": vivoPhone,
  "Vivo Y": vivoPhone,
  "Vivo": vivoPhone,

  // Realme
  "Realme GT": realmePhone,
  "Realme 12": realmePhone,
  "Realme 11": realmePhone,
  "Realme C": realmePhone,
  "Realme": realmePhone,

  // Google
  "Pixel 9": googlePixel,
  "Pixel 8": googlePixel,
  "Pixel 7": googlePixel,
  "Pixel": googlePixel,

  // Honor
  "Honor Magic": honorPhone,
  "Honor 200": honorPhone,
  "Honor 90": honorPhone,
  "Honor X": honorPhone,
  "Honor": honorPhone,
}

export function getPhoneImage(modelName?: string): string {
  if (!modelName) return "/images/service-handyman.svg"
  const lower = modelName.toLowerCase()
  if (lower.includes("điện") || lower.includes("ổ cắm") || lower.includes("chập") || lower.includes("đèn") || lower.includes("aptomat") || lower.includes("cb")) return "/images/service-electrical.svg"
  if (lower.includes("nước") || lower.includes("vòi") || lower.includes("ống") || lower.includes("chậu") || lower.includes("bồn") || lower.includes("sen") || lower.includes("rò rỉ")) return "/images/service-plumbing.svg"
  if (lower.includes("điều hòa") || lower.includes("lạnh") || lower.includes("gas") || lower.includes("mát") || lower.includes("máy lạnh")) return "/images/service-ac.svg"
  if (lower.includes("gia dụng") || lower.includes("giặt") || lower.includes("tủ") || lower.includes("lò") || lower.includes("bếp") || lower.includes("nóng lạnh")) return "/images/service-appliance.svg"
  if (lower.includes("mốc") || lower.includes("tường") || lower.includes("sơn") || lower.includes("khóa") || lower.includes("nhà") || lower.includes("bảo trì") || lower.includes("thạch cao")) return "/images/service-handyman.svg"
  const key = Object.keys(PHONE_IMAGES).find(k => modelName.toLowerCase().includes(k.toLowerCase()))
  return key ? PHONE_IMAGES[key] : "/images/service-handyman.svg"
}

export {
  iphone16,
  iphone15,
  iphone14,
  iphone13,
  iphone12,
  iphone11,
  iphoneXs,
  iphoneXr,
  iphoneX,
  iphone8,
  iphoneSe,
  samsungS24,
  samsungS23,
  samsungFold,
  xiaomi14,
  xiaomiRedmi,
  oppoPhone,
  vivoPhone,
  realmePhone,
  googlePixel,
  honorPhone,
  defaultPhone,
}
