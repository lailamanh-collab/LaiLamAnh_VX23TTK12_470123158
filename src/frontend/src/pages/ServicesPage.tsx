import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { getCategories, getServices, type RepairService, type ServiceCategory, formatPrice } from "../api/catalog"
import { useIsMobile } from "../utils/useMediaQuery"
import { getCategoryEmoji } from "../utils/category"

export function ServicesPage() {
  const [params, setParams] = useSearchParams()
  const initialCategory = params.get("category") || params.get("categoryId") || "all"
  const initialSearch = params.get("q") || ""
  const isMobile = useIsMobile(960)

  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<RepairService[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [selectedPricingType, setSelectedPricingType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch)

  useEffect(() => {
    Promise.all([getCategories(), getServices()])
      .then(([cats, svcs]) => {
        setCategories(cats.filter((c) => c.isActive))
        setServices(svcs.filter((s) => s.isActive))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const cat = params.get("category") || params.get("categoryId")
    if (cat) setSelectedCategory(cat)
    const q = params.get("q")
    if (q !== null) setSearchTerm(q)
  }, [params])

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Category filter
      if (selectedCategory !== "all") {
        if (String(s.serviceCategoryId) !== selectedCategory) {
          const matchCat = categories.find((c) => String(c.id) === selectedCategory || c.slug === selectedCategory)
          if (!matchCat || matchCat.id !== s.serviceCategoryId) return false
        }
      }
      // Pricing type filter
      if (selectedPricingType !== "all" && s.pricingType !== selectedPricingType) {
        return false
      }
      // Search filter
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase()
        const matchName = s.name.toLowerCase().includes(lower)
        const matchDesc = s.description?.toLowerCase().includes(lower) ?? false
        const matchCat = s.serviceCategoryName.toLowerCase().includes(lower)
        if (!matchName && !matchDesc && !matchCat) return false
      }
      return true
    })
  }, [services, selectedCategory, selectedPricingType, searchTerm, categories])

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId)
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (catId === "all") next.delete("category")
      else next.set("category", catId)
      return next
    })
  }

  return (
    <main
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        padding: isMobile ? "20px 12px 64px" : "32px 20px 80px",
      }}
    >
      <div style={{ maxWidth: "1340px", margin: "0 auto", width: "100%" }}>
        {/* HEADER SECTION */}
        <section style={{ marginBottom: isMobile ? "20px" : "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#eff6ff",
              color: "#2563eb",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: isMobile ? "0.74rem" : "0.8rem",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            <span>🛠️</span>
            <span>DỊCH VỤ SỬA CHỮA TẬN NHÀ</span>
          </div>

          <h1
            style={{
              fontSize: isMobile ? "1.5rem" : "2rem",
              fontWeight: 900,
              color: "#0f172a",
              margin: "0 0 8px",
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
            }}
          >
            Danh mục dịch vụ sửa chữa nhà cửa
          </h1>

          <p style={{ margin: 0, fontSize: isMobile ? "0.86rem" : "0.95rem", color: "#64748b", maxWidth: "680px", lineHeight: 1.5 }}>
            Khám phá hơn 20+ dịch vụ sửa chữa chuyên nghiệp tận nơi. Kỹ thuật viên tay nghề cao, có mặt nhanh chóng, báo giá minh bạch trước khi thi công.
          </p>
        </section>

        {/* SEARCH & FILTERS BAR */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            marginBottom: "24px",
            background: "#ffffff",
            padding: isMobile ? "12px" : "16px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 240px", width: "100%" }}>
            <span style={{ position: "absolute", left: "14px", top: "11px", fontSize: "1rem", color: "#94a3b8" }}>🔍</span>
            <input
              type="text"
              placeholder="Tìm tên dịch vụ, sự cố (điện, nước, điều hòa, máy giặt...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 16px 0 42px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              style={{
                flex: isMobile ? 1 : "initial",
                height: "40px",
                padding: "0 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontSize: "0.84rem",
                fontWeight: 600,
                color: "#334155",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">Tất cả nhóm dịch vụ</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.servicesCount || 0})
                </option>
              ))}
            </select>

            <select
              value={selectedPricingType}
              onChange={(e) => setSelectedPricingType(e.target.value)}
              style={{
                flex: isMobile ? 1 : "initial",
                height: "40px",
                padding: "0 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontSize: "0.84rem",
                fontWeight: 600,
                color: "#334155",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">Tất cả hình thức giá</option>
              <option value="FixedPrice">Giá trọn gói cố định</option>
              <option value="InspectionRequired">Khảo sát & Báo giá tại nhà</option>
            </select>
          </div>
        </div>

        {/* MAIN LAYOUT: CATEGORY SIDEBAR + SERVICES GRID */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "16px" : "28px" }}>
          {/* CATEGORY SIDEBAR (DESKTOP) OR HORIZONTAL SCROLL CHIPS (MOBILE) */}
          {isMobile ? (
            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "4px",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <button
                type="button"
                onClick={() => handleCategoryChange("all")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: selectedCategory === "all" ? "#2563eb" : "#e2e8f0",
                  background: selectedCategory === "all" ? "#2563eb" : "#ffffff",
                  color: selectedCategory === "all" ? "#ffffff" : "#334155",
                  fontWeight: selectedCategory === "all" ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                🏠 Tất cả ({services.length})
              </button>
              {categories.map((cat) => {
                const isActive = selectedCategory === String(cat.id)
                const emoji = getCategoryEmoji(cat.iconName, cat.slug, cat.name)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(String(cat.id))}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "999px",
                      border: "1px solid",
                      borderColor: isActive ? "#2563eb" : "#e2e8f0",
                      background: isActive ? "#2563eb" : "#ffffff",
                      color: isActive ? "#ffffff" : "#334155",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <aside style={{ width: "260px", flexShrink: 0 }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px", position: "sticky", top: "84px" }}>
                <strong style={{ display: "block", fontSize: "0.82rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px", fontWeight: 700 }}>
                  Nhóm dịch vụ
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("all")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "none",
                      background: selectedCategory === "all" ? "#eff6ff" : "transparent",
                      color: selectedCategory === "all" ? "#2563eb" : "#334155",
                      fontWeight: selectedCategory === "all" ? 700 : 500,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🏠</span>
                      <span>Tất cả dịch vụ</span>
                    </span>
                    <span style={{ fontSize: "0.78rem", background: selectedCategory === "all" ? "#dbeafe" : "#f1f5f9", padding: "2px 7px", borderRadius: "999px" }}>
                      {services.length}
                    </span>
                  </button>

                  {categories.map((cat) => {
                    const isActive = selectedCategory === String(cat.id)
                    const emoji = getCategoryEmoji(cat.iconName, cat.slug, cat.name)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(String(cat.id))}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: "none",
                          background: isActive ? "#eff6ff" : "transparent",
                          color: isActive ? "#2563eb" : "#334155",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: "0.88rem",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{emoji}</span>
                          <span>{cat.name}</span>
                        </span>
                        <span style={{ fontSize: "0.78rem", background: isActive ? "#dbeafe" : "#f1f5f9", padding: "2px 7px", borderRadius: "999px" }}>
                          {cat.servicesCount || 0}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* SERVICE COMMITMENTS */}
                <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px dashed #e2e8f0" }}>
                  <strong style={{ display: "block", fontSize: "0.82rem", color: "#0f172a", marginBottom: "8px", fontWeight: 700 }}>
                    Cam kết dịch vụ HomeFix
                  </strong>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.78rem", color: "#64748b" }}>
                    <li style={{ display: "flex", gap: "6px" }}>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                      <span>Thợ có mặt trong 30-45 phút</span>
                    </li>
                    <li style={{ display: "flex", gap: "6px" }}>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                      <span>Báo giá minh bạch trước khi sửa</span>
                    </li>
                    <li style={{ display: "flex", gap: "6px" }}>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                      <span>Bảo hành chu đáo lên đến 12 tháng</span>
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          )}

          {/* SERVICES GRID */}
          <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", opacity: 0.5 }}>
                    <div style={{ height: "18px", width: "40%", background: "#e2e8f0", borderRadius: "4px", marginBottom: "12px" }} />
                    <div style={{ height: "24px", width: "70%", background: "#e2e8f0", borderRadius: "4px", marginBottom: "10px" }} />
                    <div style={{ height: "40px", background: "#e2e8f0", borderRadius: "6px" }} />
                  </div>
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "48px 24px", textAlign: "center" }}>
                <span style={{ fontSize: "3rem", display: "block", marginBottom: "12px" }}>🔍</span>
                <h3 style={{ fontSize: "1.2rem", color: "#0f172a", margin: "0 0 8px" }}>Không tìm thấy dịch vụ phù hợp</h3>
                <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0 0 20px" }}>
                  Hãy thử tìm kiếm với từ khóa khác hoặc chọn tất cả các nhóm dịch vụ.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all")
                    setSelectedPricingType("all")
                    setSearchTerm("")
                  }}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: isMobile ? "14px" : "18px",
                }}
              >
                {filteredServices.map((svc) => (
                  <article
                    key={svc.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      padding: isMobile ? "18px 16px" : "22px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 6px rgba(15,23,42,0.02)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#93c5fd"
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(37,99,235,0.06)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0"
                      e.currentTarget.style.boxShadow = "0 2px 6px rgba(15,23,42,0.02)"
                    }}
                  >
                    <div>
                      {/* CATEGORY & PRICING BADGES */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "6px" }}>
                        <span style={{ fontSize: "0.74rem", background: "#eff6ff", color: "#2563eb", padding: "3px 10px", borderRadius: "999px", fontWeight: 700 }}>
                          {svc.serviceCategoryName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: svc.pricingType === "FixedPrice" ? "#f0fdf4" : "#fff7ed",
                            color: svc.pricingType === "FixedPrice" ? "#16a34a" : "#ea580c",
                          }}
                        >
                          {svc.pricingType === "FixedPrice" ? "Giá cố định" : "Khảo sát báo giá"}
                        </span>
                      </div>

                      {/* SERVICE NAME */}
                      <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px", lineHeight: 1.35 }}>
                        {svc.name}
                      </h2>

                      {/* DESCRIPTION */}
                      <p style={{ margin: "0 0 14px", fontSize: "0.84rem", color: "#64748b", lineHeight: 1.5, minHeight: "38px" }}>
                        {svc.description || "Dịch vụ kỹ thuật chuyên nghiệp, xử lý triệt để sự cố tại nhà."}
                      </p>

                      {/* FEATURES / DURATION */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                        <span style={{ fontSize: "0.72rem", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", padding: "2px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span>⏱️</span>
                          <span>{svc.estimatedDuration || "30 - 60 phút"}</span>
                        </span>
                        <span style={{ fontSize: "0.72rem", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", padding: "2px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span>🛡️</span>
                          <span>Bảo hành 12 tháng</span>
                        </span>
                      </div>
                    </div>

                    {/* PRICE & ACTIONS */}
                    <div style={{ paddingTop: "14px", borderTop: "1px solid #f1f5f9", marginTop: "auto" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "4px" }}>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Chi phí dự kiến:</span>
                        <strong style={{ fontSize: "1.08rem", fontWeight: 800, color: "#2563eb" }}>
                          {formatPrice(svc.basePrice, svc.pricingType)}
                        </strong>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <Link
                          to={`/pricing?serviceId=${svc.id}`}
                          style={{
                            flex: 1,
                            padding: "9px 0",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#334155",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            borderRadius: "8px",
                            textAlign: "center",
                            textDecoration: "none",
                          }}
                        >
                          Bảng giá
                        </Link>
                        <Link
                          to={`/booking?serviceId=${svc.id}`}
                          style={{
                            flex: 1.3,
                            padding: "9px 0",
                            background: "#2563eb",
                            color: "#ffffff",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            borderRadius: "8px",
                            textAlign: "center",
                            textDecoration: "none",
                            boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                          }}
                        >
                          Đặt thợ ngay
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
