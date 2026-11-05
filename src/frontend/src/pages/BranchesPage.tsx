import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getServiceAreas, type ServiceArea } from "../api/branches"
import {
  branchCauGiay,
  branchDongDa,
  branchHaiBaTrung,
  branchThanhXuan,
  branchBaDinh,
  branchLongBien,
} from "../assets"

interface AreaDisplayItem extends ServiceArea {
  city: string
  district: string
  image: string
  rating: number
  featuredServices: Array<{ name: string; icon: string }>
}

function parseAreaMeta(name: string, address?: string): { city: string; district: string } {
  let city = "TP. Hồ Chí Minh"
  const text = `${name} ${address || ""}`.toLowerCase()
  if (text.includes("hà nội") || text.includes("cầu giấy") || text.includes("đống đa")) {
    city = "Hà Nội"
  } else if (text.includes("đà nẵng") || text.includes("hải châu")) {
    city = "Đà Nẵng"
  }

  let district = "Quận 1"
  if (text.includes("quận 10")) district = "Quận 10"
  else if (text.includes("quận 1")) district = "Quận 1"
  else if (text.includes("quận 3")) district = "Quận 3"
  else if (text.includes("quận 7")) district = "Quận 7"
  else if (text.includes("bình thạnh")) district = "Bình Thạnh"
  else if (text.includes("gò vấp")) district = "Gò Vấp"
  else if (text.includes("thủ đức")) district = "TP. Thủ Đức"
  else if (text.includes("cầu giấy")) district = "Cầu Giấy"
  else if (text.includes("đống đa")) district = "Đống Đa"
  else if (text.includes("hải châu")) district = "Hải Châu"

  return { city, district }
}

const COMMON_HOME_SERVICES = [
  { name: "Sửa chập điện", icon: "⚡" },
  { name: "Sửa rò rỉ nước", icon: "🚰" },
  { name: "Vệ sinh điều hòa", icon: "❄️" },
  { name: "Sửa máy giặt", icon: "🧺" },
  { name: "Sửa khóa & Cửa", icon: "🛠️" },
]

const AREA_IMAGES = [
  branchDongDa,
  branchCauGiay,
  branchHaiBaTrung,
  branchThanhXuan,
  branchBaDinh,
  branchLongBien,
]

export function BranchesPage() {
  const navigate = useNavigate()
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState<string>("all")
  const [search, setSearch] = useState<string>("")

  useEffect(() => {
    getServiceAreas()
      .then((data) => setAreas(data.filter((a) => a.isActive)))
      .catch(() => setAreas([]))
      .finally(() => setLoading(false))
  }, [])

  const areaItems: AreaDisplayItem[] = useMemo(() => {
    return areas.map((area, idx) => {
      const meta = parseAreaMeta(area.name, area.address || area.description)
      return {
        ...area,
        city: meta.city,
        district: meta.district,
        image: AREA_IMAGES[idx % AREA_IMAGES.length],
        rating: 4.8 + (idx % 3) * 0.1,
        featuredServices: COMMON_HOME_SERVICES,
      }
    })
  }, [areas])

  const filteredAreas = useMemo(() => {
    return areaItems.filter((item) => {
      if (selectedCity !== "all" && item.city !== selectedCity) return false
      if (search.trim()) {
        const lower = search.toLowerCase()
        return (
          item.name.toLowerCase().includes(lower) ||
          (item.address && item.address.toLowerCase().includes(lower)) ||
          item.district.toLowerCase().includes(lower)
        )
      }
      return true
    })
  }, [areaItems, selectedCity, search])

  const cities = ["all", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"]

  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh", padding: "36px 20px 80px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* HEADER */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#eff6ff", color: "#2563eb", padding: "4px 14px", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 700, marginBottom: "10px" }}>
            <span>📍</span>
            <span>MẠNG LƯỚI PHỤC VỤ TẬN NƠI</span>
          </div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", margin: "0 auto 10px", textAlign: "center", letterSpacing: "-0.02em" }}>
            Khu vực phục vụ sửa chữa tại nhà
          </h1>
          <p style={{ fontSize: "0.98rem", color: "#64748b", margin: "0 auto 24px", maxWidth: "680px", lineHeight: 1.5 }}>
            HomeFix bố trí các đội kỹ thuật viên cơ động túc trực khắp các quận huyện. Luôn sẵn sàng có mặt tại địa chỉ nhà bạn trong vòng 30 - 45 phút.
          </p>

          {/* SEARCH & FILTER */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <span style={{ position: "absolute", left: "14px", top: "12px", fontSize: "1rem", color: "#94a3b8" }}>🔍</span>
              <input
                type="text"
                placeholder="Tìm khu vực, quận huyện..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 16px 0 42px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCity(c)}
                  style={{
                    height: "44px",
                    padding: "0 16px",
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: selectedCity === c ? "#2563eb" : "#cbd5e1",
                    background: selectedCity === c ? "#2563eb" : "#ffffff",
                    color: selectedCity === c ? "#ffffff" : "#334155",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {c === "all" ? "Tất cả thành phố" : c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* AREAS GRID */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "20px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: "300px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", opacity: 0.5 }} />
            ))}
          </div>
        ) : filteredAreas.length === 0 ? (
          <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "48px 20px", textAlign: "center" }}>
            <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "12px" }}>📍</span>
            <h3 style={{ fontSize: "1.15rem", color: "#0f172a", margin: "0 0 6px" }}>Không tìm thấy khu vực phù hợp</h3>
            <p style={{ fontSize: "0.88rem", color: "#64748b" }}>Vui lòng chọn thành phố khác hoặc tìm kiếm với từ khóa quận huyện.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "20px" }}>
            {filteredAreas.map((area) => (
              <article
                key={area.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 12px rgba(15,23,42,0.02)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#93c5fd"
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.08)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.02)"
                }}
              >
                {/* PHOTO HEADER */}
                <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
                  <img
                    src={area.image}
                    alt={area.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15,23,42,0.75)", color: "#ffffff", backdropFilter: "blur(4px)", padding: "4px 10px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>⭐</span>
                    <span>{area.rating.toFixed(1)}</span>
                  </div>
                  <div style={{ position: "absolute", bottom: "12px", left: "12px", background: "#2563eb", color: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                    {area.city}
                  </div>
                </div>

                {/* BODY CONTENT */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                    {area.name}
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.84rem", color: "#64748b", marginBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span>📍</span>
                      <span>{area.address || area.description || "Trạm kỹ thuật cơ động khu vực"}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span>📞</span>
                      <span>Hotline: <strong style={{ color: "#0f172a" }}>{area.phone || "1900 8899"}</strong></span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span>🕒</span>
                      <span>Giờ phục vụ: 08:00 - 20:00 (Cả T7 & CN)</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span>⚡</span>
                      <span>Thời gian tiếp cận: <strong style={{ color: "#16a34a" }}>30 - 45 phút</strong></span>
                    </div>
                  </div>

                  {/* FEATURED SERVICES PILLS */}
                  <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px dashed #e2e8f0" }}>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                      DỊCH VỤ TRỌNG ĐIỂM TẠI KHU VỰC:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                      {area.featuredServices.map((svc, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: "0.74rem",
                            background: "#f1f5f9",
                            color: "#334155",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontWeight: 500,
                          }}
                        >
                          {svc.icon} {svc.name}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/booking?branchId=${area.id}&serviceAreaId=${area.id}`)}
                      style={{
                        width: "100%",
                        padding: "11px 0",
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(37,99,235,0.2)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Đặt thợ khu vực này →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
