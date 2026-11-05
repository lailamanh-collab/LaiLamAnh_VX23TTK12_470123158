import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  branchQuan1,
  branchQuan7,
  branchThuDuc,
  workshopBg,
  heroRepair,
  bookingAdvisor,
} from "../assets"
import { getCategories, getServices, type ServiceCategory, type RepairService, formatPrice } from "../api/catalog"
import { getServiceAreas, type ServiceArea } from "../api/branches"
import { fetchPublicReviews, type ReviewItem } from "../api/reviews"
import { useAuth } from "../auth/AuthContext"
import { getCategoryEmoji } from "../utils/category"

interface AreaPreview {
  id: number
  name: string
  address: string
  hours: string
  phone: string
  image: string
}

const FALLBACK_AREAS: AreaPreview[] = [
  { id: 1, name: "Khu vực Quận 1 & Trung tâm TP.HCM", address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1", hours: "08:00 - 20:00", phone: "028 1234 5678", image: branchQuan1 },
  { id: 2, name: "Khu vực Quận 7 & Nam Sài Gòn", address: "456 Nguyễn Thị Thập, Phường Tân Quy, Quận 7", hours: "08:00 - 20:00", phone: "028 2345 6789", image: branchQuan7 },
  { id: 3, name: "Khu vực TP. Thủ Đức & Phía Đông", address: "789 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức", hours: "08:00 - 20:00", phone: "028 3456 7890", image: branchThuDuc },
]

const CATEGORY_META: Record<string, { icon: string; bg: string; color: string; sub: string }> = {
  "dien": { icon: "⚡", bg: "#eff6ff", color: "#2563eb", sub: "Ổ cắm, aptomat, chập điện, chiếu sáng" },
  "nuoc": { icon: "🚰", bg: "#ecfeff", color: "#0891b2", sub: "Đường ống, vòi sen, bồn cầu, rò rỉ" },
  "dieu-hoa": { icon: "❄️", bg: "#f0fdf4", color: "#16a34a", sub: "Vệ sinh, bơm gas, khắc phục sự cố lạnh" },
  "thiet-bi-gia-dung": { icon: "🧺", bg: "#fdf4ff", color: "#c026d3", sub: "Máy giặt, tủ lạnh, bình nước nóng" },
  "bao-tri-nha": { icon: "🛠️", bg: "#fff7ed", color: "#ea580c", sub: "Khóa cửa, sơn tường, trần, chống thấm" },
}

function resolveCategoryStyle(slug: string, name: string) {
  const lower = (slug || name).toLowerCase()
  if (lower.includes("dien") && !lower.includes("dieu")) return CATEGORY_META["dien"]
  if (lower.includes("nuoc")) return CATEGORY_META["nuoc"]
  if (lower.includes("dieu-hoa") || lower.includes("lanh") || lower.includes("dieu")) return CATEGORY_META["dieu-hoa"]
  if (lower.includes("gia-dung") || lower.includes("thiet-bi")) return CATEGORY_META["thiet-bi-gia-dung"]
  return CATEGORY_META["bao-tri-nha"]
}

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [heroSearch, setHeroSearch] = useState("")

  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<RepairService[]>([])
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [servicesLoading, setServicesLoading] = useState(true)
  const [areasLoading, setAreasLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.filter((c) => c.isActive)))
      .catch(() => {})
      .finally(() => setCategoriesLoading(false))

    getServices()
      .then((data) => setServices(data.filter((s) => s.isActive).slice(0, 8)))
      .catch(() => {})
      .finally(() => setServicesLoading(false))

    getServiceAreas()
      .then((data) => setAreas(data.filter((a) => a.isActive).slice(0, 3)))
      .catch(() => {})
      .finally(() => setAreasLoading(false))

    fetchPublicReviews(3)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }, [])

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(heroSearch.trim() ? `/services?q=${encodeURIComponent(heroSearch.trim())}` : "/services")
  }

  const displayedAreas: AreaPreview[] =
    !areasLoading && areas.length > 0
      ? areas.map((a, i) => ({
          id: a.id,
          name: a.name,
          address: a.address || a.description || "Khu vực nội thành phục vụ nhanh",
          hours: (() => {
            const oh = a.openingHours?.find((h) => h.dayOfWeek === new Date().toLocaleDateString("en-US", { weekday: "long" }))
            return oh && oh.isOpen ? `${oh.openTime} - ${oh.closeTime}` : "08:00 - 20:00"
          })(),
          phone: a.phone || "1900 8899",
          image: [branchQuan1, branchQuan7, branchThuDuc][i] ?? branchQuan1,
        }))
      : FALLBACK_AREAS

  const FALLBACK_CATEGORIES = [
    { id: 1, name: "Điện dân dụng", slug: "dien", iconName: "⚡", description: "Sửa chập điện, công tắc, bóng đèn, CB", servicesCount: 5 },
    { id: 2, name: "Nước & Thiết bị vệ sinh", slug: "nuoc", iconName: "🚰", description: "Sửa đường ống, vòi nước, bồn cầu, thông tắc", servicesCount: 5 },
    { id: 3, name: "Điều hòa & Điện lạnh", slug: "dieu-hoa", iconName: "❄️", description: "Vệ sinh, bảo dưỡng, nạp gas, sửa máy lạnh", servicesCount: 4 },
    { id: 4, name: "Thiết bị gia dụng", slug: "thiet-bi-gia-dung", iconName: "🧺", description: "Sửa máy giặt, bình nóng lạnh, tủ lạnh", servicesCount: 5 },
    { id: 5, name: "Bảo trì nhà cửa", slug: "bao-tri-nha", iconName: "🛠️", description: "Khóa cửa, khoan tường, chống thấm trần", servicesCount: 4 },
  ]

  const FALLBACK_REVIEWS = [
    { name: "Nguyễn Minh Tuấn", timeAgo: "2 ngày trước", comment: "Thợ đến rất đúng hẹn, kiểm tra đường điện chập chu đáo và báo giá trước khi làm. Rất hài lòng!", rating: 5 },
    { name: "Trần Thị Lan", timeAgo: "1 tuần trước", comment: "Vệ sinh 2 máy điều hòa sạch sẽ, thợ làm cẩn thận không để bẩn tường nhà. Giá cả minh bạch.", rating: 5 },
    { name: "Lê Hoàng Nam", timeAgo: "3 tuần trước", comment: "Thay bộ vòi rửa bát và sửa phao bồn cầu nhanh chóng. Có phiếu bảo hành đàng hoàng.", rating: 5 },
  ]

  const displayedReviews = useMemo(() => {
    if (reviewsLoading) return []
    if (reviews.length >= 3) return reviews.slice(0, 3)
    const needed = 3 - reviews.length
    const fallbacks = FALLBACK_REVIEWS.slice(0, needed).map((r, i) => ({
      id: `fallback-${i}`,
      customerName: r.name,
      rating: r.rating,
      comment: r.comment,
      timeAgo: r.timeAgo,
      createdAt: "",
    }))
    return [...reviews, ...fallbacks]
  }, [reviews, reviewsLoading])

  const reviewsLink = user?.role === "Admin" ? "/admin/reviews" : user?.role === "Customer" ? "/my-bookings" : "/support"

  return (
    <main className="home-page-container">
      {/* HERO SECTION */}
      <section
        className="home-hero-section"
        style={{
          background: `linear-gradient(90deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.88) 45%, rgba(15,23,42,0.65) 75%, rgba(15,23,42,0.3) 100%), url('${workshopBg}') center/cover no-repeat`,
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(37,99,235,0.25)", border: "1px solid rgba(59,130,246,0.4)", padding: "6px 14px", borderRadius: "999px", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.85rem" }}>⚡</span>
            <span style={{ color: "#93c5fd", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dịch vụ sửa chữa tại nhà 24/7</span>
          </div>
          <h1 className="home-hero-title">
            Dịch vụ sửa chữa nhà cửa<br />
            tận nơi nhanh chóng, uy tín
          </h1>
          <p className="home-hero-subtitle">
            Kỹ thuật viên có mặt sau 30 phút • Báo giá minh bạch • Bảo hành tận tâm 12 tháng
          </p>
          <form onSubmit={handleHeroSearch} className="home-hero-search-box">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "10px", flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="home-hero-search-input"
              placeholder="Tìm dịch vụ: điện, nước, điều hòa, máy giặt, rò rỉ nước..."
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
            />
            <button type="submit" className="home-hero-search-btn">
              Tìm thợ ngay
            </button>
          </form>
          <div className="home-quality-badges-row">
            {[
              {
                icon: (
                  <>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </>
                ),
                label: "Thợ có lý lịch rõ ràng",
                sub: "Đào tạo bài bản, trung thực",
              },
              {
                icon: (
                  <>
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </>
                ),
                label: "Báo giá trước khi làm",
                sub: "Không phụ phí phát sinh",
              },
              {
                icon: (
                  <>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </>
                ),
                label: "Bảo hành tới 12 tháng",
                sub: "Hỗ trợ xử lý lại miễn phí",
              },
              {
                icon: (
                  <>
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </>
                ),
                label: "Phủ khắp các quận",
                sub: "Kỹ thuật viên tại khu vực",
              },
            ].map((badge, i) => (
              <div key={i} className="home-quality-badge-item">
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    {badge.icon}
                  </svg>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.85rem", color: "#ffffff", fontWeight: 700 }}>
                    {badge.label}
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>{badge.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="home-hero-visual-col">
          <div style={{ position: "relative", width: "100%", maxWidth: "470px" }}>
            <img
              src={heroRepair}
              alt="Dịch vụ sửa chữa nhà cửa HomeFix"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "360px",
                objectFit: "cover",
                display: "block",
                borderRadius: "16px",
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.45))",
              }}
            />
            {/* Nút đặt lịch */}
            <Link to="/booking" className="home-floating-hero-btn" title="Đặt thợ sửa tại nhà ngay chỉ với vài bước">
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, lineHeight: 1.2, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  Đặt thợ ngay
                </span>
                <span style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}>
                  Có mặt sau 30 phút
                </span>
              </div>
              <div className="hero-btn-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* DUAL CARDS: NHÓM DỊCH VỤ & DỊCH VỤ PHỔ BIẾN */}
      <section className="home-dual-cards-row">
        {/* CARD 1: CÁC NHÓM DỊCH VỤ SỬA CHỮA */}
        <div className="home-section-card">
          <div className="home-section-card-header">
            <div>
              <h2 className="home-section-card-title">Nhóm dịch vụ chính</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b" }}>Đáp ứng toàn diện nhu cầu sửa chữa nhà ở</p>
            </div>
            <Link to="/services" className="home-section-card-link">
              Tất cả dịch vụ →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "12px" }}>
            {(categoriesLoading ? [] : categories.length > 0 ? categories : FALLBACK_CATEGORIES).map((cat) => {
              const meta = resolveCategoryStyle(cat.slug, cat.name)
              return (
                <div
                  key={cat.id}
                  onClick={() => navigate(`/services?category=${cat.id}`)}
                  style={{
                    cursor: "pointer",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#93c5fd"
                    e.currentTarget.style.boxShadow = "0 8px 18px rgba(37,99,235,0.08)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: meta.bg,
                        color: meta.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.3rem",
                        flexShrink: 0,
                        overflow: "hidden",
                        userSelect: "none",
                        lineHeight: 1,
                      }}
                    >
                      {getCategoryEmoji(cat.iconName, cat.slug, cat.name)}
                    </div>
                    <div>
                      <strong style={{ display: "block", fontSize: "0.92rem", color: "#0f172a" }}>{cat.name}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {cat.servicesCount || 0} dịch vụ có sẵn
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.4 }}>
                    {cat.description || meta.sub}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CARD 2: DỊCH VỤ SỬA CHỮA PHỔ BIẾN */}
        <div className="home-section-card">
          <div className="home-section-card-header">
            <div>
              <h2 className="home-section-card-title">Dịch vụ phổ biến</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b" }}>Khách hàng đặt nhiều nhất trong tháng</p>
            </div>
            <Link to="/pricing" className="home-section-card-link">
              Bảng giá chi tiết →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "12px" }}>
            {(servicesLoading ? [] : services).map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/booking?serviceId=${s.id}`)}
                style={{
                  cursor: "pointer",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "1px solid #f1f5f9",
                  background: "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#93c5fd"
                  e.currentTarget.style.background = "#ffffff"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#f1f5f9"
                  e.currentTarget.style.background = "#f8fafc"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.72rem", background: "#e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 }}>
                      {s.serviceCategoryName}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: s.pricingType === "FixedPrice" ? "#16a34a" : "#ea580c", fontWeight: 600 }}>
                      {s.pricingType === "FixedPrice" ? "Giá cố định" : "Kiểm tra báo giá"}
                    </span>
                  </div>
                  <strong style={{ fontSize: "0.88rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                    {s.name}
                  </strong>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {s.description || "Dịch vụ chất lượng cao, thợ tận nơi nhanh chóng"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #e2e8f0" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb" }}>
                    {formatPrice(s.basePrice, s.pricingType)}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>
                    Đặt thợ →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS CARD */}
      <section className="home-process-card">
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0 0 28px" }}>
          Quy trình sửa chữa tại nhà cùng HomeFix
        </h2>
        <div className="home-process-split">
          <div className="home-process-steps-row">
            {[
              { icon: "📅", num: 1, label: "Đặt lịch hẹn", desc: "Chọn dịch vụ, nhập địa chỉ nhà và khung giờ phù hợp" },
              { icon: "🛵", num: 2, label: "Thợ đến tận nhà", desc: "Kỹ thuật viên di chuyển và có mặt đúng hẹn" },
              { icon: "🔍", num: 3, label: "Khảo sát & Báo giá", desc: "Kiểm tra sự cố, thống nhất phương án và chi phí thực tế" },
              { icon: "🛠️", num: 4, label: "Nghiệm thu & Bảo hành", desc: "Sửa chữa hoàn tất, dọn dẹp và bảo hành chu đáo" },
            ].map((step, i, arr) => (
              <div key={step.num} style={{ display: "contents" }}>
                <div className="home-process-step-col">
                  <div className="home-process-icon-circle">
                    {step.icon}
                    <span className="home-process-badge-number">{step.num}</span>
                  </div>
                  <strong style={{ fontSize: "0.95rem", color: "#0f172a", marginBottom: "4px" }}>{step.label}</strong>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.4 }}>{step.desc}</span>
                </div>
                {i < arr.length - 1 && <span className="home-process-arrow">›</span>}
              </div>
            ))}
          </div>
          <div className="home-booking-feature-box">
            <div className="home-booking-phone-badge">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            </div>
            <div className="home-booking-text-col">
              <strong style={{ fontSize: "1.08rem", color: "#0f172a", display: "block", fontWeight: 800 }}>
                Đặt lịch thợ đến tận nhà
              </strong>
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Tiện lợi • Nhanh chóng • An tâm</span>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "10px 0 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "0.8rem",
                  color: "#334155",
                }}
              >
                {["Chọn khu vực và địa chỉ nhà bạn", "Chọn ngày và khung giờ thuận tiện", "Biết trước chi phí dự kiến minh bạch", "Kỹ thuật viên đến tận nơi đúng hẹn"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#16a34a",
                        color: "#ffffff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/booking"
                className="btn home-booking-cta-btn"
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  padding: "9px 22px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  display: "inline-block",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                }}
              >
                Đặt thợ ngay →
              </Link>
            </div>
            <div className="home-booking-advisor-col">
              <img src={bookingAdvisor} alt="Chuyên viên hỗ trợ HomeFix" style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }} />
            </div>
          </div>
        </div>
      </section>

      {/* DUAL BOTTOM CARDS: KHU VỰC PHỤC VỤ & ĐÁNH GIÁ */}
      <section className="home-branches-reviews-row">
        <div className="home-section-card">
          <div className="home-section-card-header">
            <div>
              <h2 className="home-section-card-title">Khu vực phục vụ</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b" }}>Đội thợ túc trực tại các khu vực trọng điểm</p>
            </div>
            <Link to="/branches" className="home-section-card-link">
              Tất cả khu vực →
            </Link>
          </div>
          <div className="home-branch-triplet-grid">
            {displayedAreas.map((b) => (
              <Link key={b.id} to="/branches" className="home-branch-mini-card">
                <img src={b.image} alt={b.name} className="home-branch-mini-img" />
                <div className="home-branch-mini-body">
                  <strong style={{ fontSize: "0.92rem", color: "#0f172a", marginBottom: "2px" }}>{b.name}</strong>
                  <div style={{ fontSize: "0.76rem", color: "#64748b" }}>📍 {b.address}</div>
                  <div style={{ fontSize: "0.76rem", color: "#64748b" }}>🕒 Giờ phục vụ: {b.hours}</div>
                  <div style={{ fontSize: "0.76rem", color: "#64748b" }}>📞 Hotline: {b.phone}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="home-section-card">
          <div className="home-section-card-header">
            <div>
              <h2 className="home-section-card-title">Khách hàng nhận xét</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b" }}>Hơn 10.000+ hộ gia đình đã tin tưởng sử dụng</p>
            </div>
            <Link to={reviewsLink} className="home-section-card-link">
              Xem tất cả →
            </Link>
          </div>
          <div className="home-reviews-triplet-grid">
            {reviewsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="home-review-mini-card" style={{ opacity: 0.4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#e2e8f0", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: "12px", background: "#e2e8f0", borderRadius: "4px", marginBottom: "4px" }} />
                        <div style={{ height: "10px", background: "#e2e8f0", borderRadius: "4px", width: "60%" }} />
                      </div>
                    </div>
                    <div style={{ height: "40px", background: "#e2e8f0", borderRadius: "4px" }} />
                  </div>
                ))
              : displayedReviews.map((r, i) => (
                  <div key={r.id ?? i} className="home-review-mini-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "#2563eb",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          flexShrink: 0,
                        }}
                      >
                        {r.customerName?.charAt(0)?.toUpperCase() ?? "K"}
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: "0.85rem", color: "#0f172a" }}>{r.customerName}</strong>
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : ("timeAgo" in r ? (r as any).timeAgo : "")}
                        </span>
                      </div>
                    </div>
                    <div style={{ color: "#eab308", fontSize: "0.85rem", marginBottom: "8px" }}>
                      {"★".repeat(Math.max(1, Math.min(5, r.rating)))}
                      {"☆".repeat(Math.max(0, 5 - Math.max(1, Math.min(5, r.rating))))}
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", lineHeight: 1.5 }}>"{r.comment}"</p>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </main>
  )
}
