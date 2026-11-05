import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { getCategories, getServices, type RepairService, type ServiceCategory, formatPrice } from "../api/catalog"
import { useIsMobile } from "../utils/useMediaQuery"
import { getCategoryEmoji } from "../utils/category"

export function PricingPage() {
  const [params, setParams] = useSearchParams()
  const initialCat = params.get("category") || "all"
  const serviceIdParam = params.get("serviceId")
  const isMobile = useIsMobile(768)

  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<RepairService[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat)
  const [search, setSearch] = useState("")

  useEffect(() => {
    Promise.all([getCategories(), getServices()])
      .then(([cats, svcs]) => {
        setCategories(cats.filter((c) => c.isActive))
        setServices(svcs.filter((s) => s.isActive))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedCategory !== "all" && String(s.serviceCategoryId) !== selectedCategory) {
        return false
      }
      if (serviceIdParam && String(s.id) === serviceIdParam) {
        return true
      }
      if (search.trim()) {
        const lower = search.toLowerCase()
        return (
          s.name.toLowerCase().includes(lower) ||
          (s.description && s.description.toLowerCase().includes(lower)) ||
          s.serviceCategoryName.toLowerCase().includes(lower)
        )
      }
      return true
    })
  }, [services, selectedCategory, serviceIdParam, search])

  const handleCategorySelect = (catId: string) => {
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
        padding: isMobile ? "24px 12px 64px" : "36px 20px 80px",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        {/* HEADER SECTION */}
        <section style={{ textAlign: "center", marginBottom: isMobile ? "24px" : "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#eff6ff",
              color: "#2563eb",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: isMobile ? "0.74rem" : "0.82rem",
              fontWeight: 700,
              marginBottom: "12px",
              maxWidth: "100%",
            }}
          >
            <span>📋</span>
            <span>BẢNG GIÁ NIÊM YẾT MINH BẠCH</span>
          </div>

          <h1
            style={{
              fontSize: isMobile ? "1.55rem" : "2.25rem",
              fontWeight: 900,
              color: "#0f172a",
              margin: "0 auto 10px",
              textAlign: "center",
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
            }}
          >
            Bảng giá dịch vụ sửa chữa nhà cửa tại nhà
          </h1>

          <p
            style={{
              fontSize: isMobile ? "0.88rem" : "0.98rem",
              color: "#64748b",
              margin: "0 auto 20px",
              maxWidth: "680px",
              lineHeight: 1.55,
            }}
          >
            Bảng giá tiêu chuẩn áp dụng cho tất cả khu vực. Kỹ thuật viên kiểm tra thực tế, báo giá rõ ràng và chỉ thực hiện khi khách hàng đồng ý.
          </p>

          {/* SEARCH BAR */}
          <div style={{ maxWidth: "480px", margin: "0 auto", position: "relative", width: "100%" }}>
            <span style={{ position: "absolute", left: "14px", top: "11px", fontSize: "1rem", color: "#94a3b8" }}>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ (ổ cắm, vòi nước, điều hòa, máy giặt...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: "42px",
                padding: "0 16px 0 42px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontSize: "0.88rem",
                outline: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                boxSizing: "border-box",
              }}
            />
          </div>
        </section>

        {/* CATEGORY TABS - RESPONSIVE WRAP & SCROLL */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "8px",
            marginBottom: "20px",
            justifyContent: isMobile ? "flex-start" : "center",
            flexWrap: isMobile ? "nowrap" : "wrap",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <button
            type="button"
            onClick={() => handleCategorySelect("all")}
            style={{
              padding: isMobile ? "8px 14px" : "10px 18px",
              borderRadius: "10px",
              border: "1px solid",
              borderColor: selectedCategory === "all" ? "#2563eb" : "#e2e8f0",
              background: selectedCategory === "all" ? "#2563eb" : "#ffffff",
              color: selectedCategory === "all" ? "#ffffff" : "#334155",
              fontWeight: 700,
              fontSize: isMobile ? "0.82rem" : "0.88rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Tất cả ({services.length})
          </button>
          {categories.map((c) => {
            const isSelected = selectedCategory === String(c.id)
            const emoji = getCategoryEmoji(c.iconName, c.slug, c.name)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCategorySelect(String(c.id))}
                style={{
                  padding: isMobile ? "8px 14px" : "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                  background: isSelected ? "#2563eb" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#334155",
                  fontWeight: 700,
                  fontSize: isMobile ? "0.82rem" : "0.88rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{emoji}</span>
                <span>{c.name}</span>
                <span style={{ opacity: 0.8, fontSize: "0.76rem" }}>({c.servicesCount || 0})</span>
              </button>
            )
          })}
        </div>

        {/* POLICY INFO BANNER */}
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "14px",
            padding: isMobile ? "12px 14px" : "16px 20px",
            marginBottom: "24px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <div style={{ fontSize: "1.3rem", lineHeight: 1, flexShrink: 0 }}>💡</div>
          <div style={{ fontSize: isMobile ? "0.82rem" : "0.86rem", color: "#1e40af", lineHeight: 1.5 }}>
            <strong>Chính sách minh bạch chi phí:</strong> Đối với dịch vụ <strong>"Giá cố định"</strong>, giá đã bao gồm công sửa chữa cơ bản. Đối với dịch vụ <strong>"Kiểm tra & Báo giá"</strong> (như sự cố chập điện âm tường, rò rỉ nước phức tạp), thợ sẽ đến khảo sát trực tiếp tại nhà và gửi phiếu báo giá chi tiết. Khách hàng hoàn toàn có quyền không thực hiện nếu không đồng ý với chi phí.
          </div>
        </div>

        {/* RESPONSIVE DISPLAY: MOBILE CARDS vs DESKTOP TABLE */}
        {isMobile ? (
          /* MOBILE CARDS VIEW */
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {loading ? (
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                Đang tải bảng giá dịch vụ...
              </div>
            ) : filteredServices.length === 0 ? (
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                Không có dịch vụ nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredServices.map((svc) => (
                <div
                  key={svc.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    boxShadow: "0 2px 6px rgba(15,23,42,0.02)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "999px", fontWeight: 600 }}>
                      {svc.serviceCategoryName}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: svc.pricingType === "FixedPrice" ? "#f0fdf4" : "#fff7ed",
                        color: svc.pricingType === "FixedPrice" ? "#16a34a" : "#ea580c",
                      }}
                    >
                      {svc.pricingType === "FixedPrice" ? "Giá cố định" : "Kiểm tra báo giá"}
                    </span>
                  </div>

                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block", marginBottom: "3px", lineHeight: 1.35 }}>
                      {svc.name}
                    </strong>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.45 }}>
                      {svc.description || "Dịch vụ tận nhà chuyên nghiệp"}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#f8fafc",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>⏱️ {svc.estimatedDuration || "30-60 phút"} · 🛡️ 12 tháng</span>
                    <strong style={{ fontSize: "1rem", color: "#2563eb", fontWeight: 800 }}>
                      {formatPrice(svc.basePrice, svc.pricingType)}
                    </strong>
                  </div>

                  <Link
                    to={`/booking?serviceId=${svc.id}`}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "10px 0",
                      background: "#2563eb",
                      color: "#ffffff",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      textDecoration: "none",
                      boxShadow: "0 2px 6px rgba(37,99,235,0.2)",
                    }}
                  >
                    Đặt thợ ngay →
                  </Link>
                </div>
              ))
            )}
          </div>
        ) : (
          /* DESKTOP / TABLET TABLE VIEW */
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              boxShadow: "0 4px 14px rgba(15,23,42,0.03)",
            }}
          >
            <div className="table-responsive" style={{ overflowX: "auto", width: "100%" }}>
              <table style={{ width: "100%", minWidth: "900px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569" }}>Nhóm</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569" }}>Dịch vụ sửa chữa</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569" }}>Hình thức</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569" }}>Đơn giá dự kiến</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569" }}>Thời gian thi công</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569" }}>Bảo hành</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        Đang tải bảng giá dịch vụ...
                      </td>
                    </tr>
                  ) : filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        Không có dịch vụ nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((svc) => (
                      <tr
                        key={svc.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          <span style={{ fontSize: "0.75rem", background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: "999px", fontWeight: 600 }}>
                            {svc.serviceCategoryName}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          <strong style={{ display: "block", color: "#0f172a", fontSize: "0.92rem", marginBottom: "2px" }}>
                            {svc.name}
                          </strong>
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {svc.description || "Dịch vụ tận nhà chuyên nghiệp"}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          <span
                            style={{
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              padding: "4px 9px",
                              borderRadius: "6px",
                              background: svc.pricingType === "FixedPrice" ? "#f0fdf4" : "#fff7ed",
                              color: svc.pricingType === "FixedPrice" ? "#16a34a" : "#ea580c",
                            }}
                          >
                            {svc.pricingType === "FixedPrice" ? "Giá cố định" : "Kiểm tra báo giá"}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          <strong style={{ color: "#2563eb", fontSize: "0.98rem" }}>
                            {formatPrice(svc.basePrice, svc.pricingType)}
                          </strong>
                        </td>
                        <td style={{ padding: "16px 20px", verticalAlign: "middle", color: "#64748b" }}>
                          ⏱️ {svc.estimatedDuration || "30 - 60 phút"}
                        </td>
                        <td style={{ padding: "16px 20px", verticalAlign: "middle", color: "#16a34a", fontWeight: 600 }}>
                          🛡️ 12 tháng
                        </td>
                        <td style={{ padding: "16px 20px", verticalAlign: "middle", textAlign: "right" }}>
                          <Link
                            to={`/booking?serviceId=${svc.id}`}
                            style={{
                              display: "inline-block",
                              padding: "8px 16px",
                              background: "#2563eb",
                              color: "#ffffff",
                              borderRadius: "8px",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              textDecoration: "none",
                              boxShadow: "0 2px 6px rgba(37,99,235,0.2)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Đặt thợ
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
