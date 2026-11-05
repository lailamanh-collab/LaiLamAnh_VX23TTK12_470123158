import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getCategories, type ServiceCategory } from "../api/catalog"
import { getCategoryEmoji } from "../utils/category"

export function BrandsPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    getCategories().then((data) => {
      let filtered = data.filter((c) => c.isActive)
      if (search.trim()) {
        filtered = filtered.filter((c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
        )
      }
      setCategories(filtered)
    }).catch(() => setCategories([]))
  }, [search])

  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh", padding: "36px 20px 80px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* HEADER */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "4px 12px", borderRadius: "999px", display: "inline-block", marginBottom: "8px" }}>
            HỆ THỐNG DỊCH VỤ TẠI NHÀ
          </span>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", margin: "0 auto 8px", textAlign: "center" }}>
            Nhóm dịch vụ sửa chữa
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#64748b", margin: "0 auto 24px", maxWidth: "560px" }}>
            Chúng tôi cung cấp các gói sửa chữa và bảo dưỡng toàn diện cho ngôi nhà của bạn.
          </p>

          {/* SEARCH BAR */}
          <div style={{ position: "relative", maxWidth: "420px", margin: "0 auto" }}>
            <span style={{ position: "absolute", left: "14px", top: "12px", fontSize: "1rem", color: "#94a3b8" }}>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm nhóm dịch vụ..."
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
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            />
          </div>
        </section>

        {/* CATEGORIES GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "20px" }}>
          {categories.map((cat) => (
            <article
              key={cat.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                textAlign: "left",
                boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    flexShrink: 0,
                    overflow: "hidden",
                    userSelect: "none",
                    lineHeight: 1,
                  }}
                >
                  {getCategoryEmoji(cat.iconName, cat.slug, cat.name)}
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: "0 0 2px" }}>
                    {cat.name}
                  </h2>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {cat.servicesCount || 0} dịch vụ có sẵn
                  </span>
                </div>
              </div>

              <p style={{ margin: "0 0 20px", fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5, flex: 1 }}>
                {cat.description || "Dịch vụ chuyên nghiệp, hỗ trợ tận nhà nhanh chóng."}
              </p>

              {/* ACTION BUTTONS */}
              <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "auto" }}>
                <Link
                  to={`/booking?categoryId=${cat.id}`}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: "#2563eb",
                    color: "#ffffff",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  Đặt thợ ngay
                </Link>
                <Link
                  to={`/services?category=${cat.id}`}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: "#f1f5f9",
                    color: "#334155",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  Xem dịch vụ
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
