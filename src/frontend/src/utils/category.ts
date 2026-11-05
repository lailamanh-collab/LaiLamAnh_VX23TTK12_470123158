const ICON_SLUG_MAP: Record<string, string> = {
  lightning: "⚡",
  bolt: "⚡",
  dien: "⚡",
  electric: "⚡",
  water: "🚰",
  nuoc: "🚰",
  plumbing: "🚰",
  wind: "❄️",
  air: "❄️",
  ac: "❄️",
  cold: "❄️",
  "dieu-hoa": "❄️",
  lanh: "❄️",
  appliance: "🧺",
  washer: "🧺",
  giadung: "🧺",
  "gia-dung": "🧺",
  "thiet-bi": "🧺",
  hammer: "🛠️",
  tool: "🛠️",
  wrench: "🔧",
  baotri: "🛠️",
  "bao-tri": "🛠️",
  nha: "🛠️",
}

export function getCategoryEmoji(iconName?: string | null, slug?: string, name?: string): string {
  if (iconName) {
    const trimmed = iconName.trim()
    const lower = trimmed.toLowerCase()
    if (ICON_SLUG_MAP[lower]) {
      return ICON_SLUG_MAP[lower]
    }
    // If it does not contain ascii letters a-z, it's already an emoji symbol
    if (!/[a-z]/i.test(trimmed)) {
      return trimmed
    }
  }

  const target = `${iconName || ""} ${slug || ""} ${name || ""}`.toLowerCase()
  if (target.includes("dieu") || target.includes("lanh") || target.includes("wind") || target.includes("ac")) return "❄️"
  if (target.includes("dien") || target.includes("lightning") || target.includes("bolt")) return "⚡"
  if (target.includes("nuoc") || target.includes("water") || target.includes("plumb") || target.includes("voi") || target.includes("ong") || target.includes("chau") || target.includes("bon")) return "🚰"
  if (target.includes("gia-dung") || target.includes("giadung") || target.includes("appliance") || target.includes("thiet-bi") || target.includes("giat") || target.includes("nong lanh")) return "🧺"
  if (target.includes("bao-tri") || target.includes("baotri") || target.includes("hammer") || target.includes("nha") || target.includes("moc") || target.includes("son") || target.includes("khoa")) return "🛠️"

  return "🛠️"
}

export interface CategoryTheme {
  emoji: string
  bg: string
  border: string
  color: string
  image: string
  label: string
}

export function getCategoryTheme(name?: string, categoryName?: string): CategoryTheme {
  const target = `${name || ""} ${categoryName || ""}`.toLowerCase()
  
  if (target.includes("dien") || target.includes("chập") || target.includes("aptomat") || target.includes("ổ cắm") || target.includes("chiếu sáng")) {
    return {
      emoji: "⚡",
      bg: "#eff6ff",
      border: "#bfdbfe",
      color: "#2563eb",
      image: "/images/service-electrical.svg",
      label: "Điện dân dụng",
    }
  }

  if (target.includes("nuoc") || target.includes("vòi") || target.includes("ống") || target.includes("bồn") || target.includes("chậu") || target.includes("rò rỉ") || target.includes("thông tắc")) {
    return {
      emoji: "🚰",
      bg: "#ecfeff",
      border: "#a5f3fc",
      color: "#0891b2",
      image: "/images/service-plumbing.svg",
      label: "Cấp thoát nước",
    }
  }

  if (target.includes("dieu") || target.includes("lanh") || target.includes("điều hòa") || target.includes("gas") || target.includes("mát") || target.includes("máy lạnh")) {
    return {
      emoji: "❄️",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      color: "#16a34a",
      image: "/images/service-ac.svg",
      label: "Điều hòa & Điện lạnh",
    }
  }

  if (target.includes("gia-dung") || target.includes("giặt") || target.includes("tủ lạnh") || target.includes("nóng lạnh") || target.includes("bình") || target.includes("vi sóng")) {
    return {
      emoji: "🧺",
      bg: "#faf5ff",
      border: "#e9d5ff",
      color: "#9333ea",
      image: "/images/service-appliance.svg",
      label: "Thiết bị gia dụng",
    }
  }

  return {
    emoji: "🛠️",
    bg: "#fff7ed",
    border: "#fed7aa",
    color: "#ea580c",
    image: "/images/service-handyman.svg",
    label: "Bảo trì nhà cửa",
  }
}
