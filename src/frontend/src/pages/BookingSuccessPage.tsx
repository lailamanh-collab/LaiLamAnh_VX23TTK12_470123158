import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import type { BookingDetail } from "../api/bookings"
import { formatPrice } from "../api/catalog"
import { useIsMobile } from "../utils/useMediaQuery"

export interface BookingSuccessState {
  booking?: BookingDetail
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  addressLine?: string
  ward?: string
  district?: string
  city?: string
  fullAddress?: string
  serviceAreaName?: string
  serviceCategoryName?: string
  appointmentDate?: string
  slotTime?: string
  problemDescription?: string
  services?: { name: string; price: number | null; pricingType: string; desc?: string }[]
  totalAmount?: number
}

interface BookingSuccessProps {
  initialData?: BookingSuccessState
}

export function BookingSuccessPage({ initialData }: BookingSuccessProps = {}) {
  const isMobile = useIsMobile(900)
  const location = useLocation()
  const state = initialData || (location.state as BookingSuccessState) || {}

  const [copiedCode, setCopiedCode] = useState(false)

  const bookingCode = state.booking?.bookingCode || "HF-20261015-001"
  const bookingId = state.booking?.id || 1

  const customerName = state.customerName || state.booking?.customerName || "Nguyễn Văn A"
  const customerPhone = state.customerPhone || state.booking?.customerPhone || "0901 234 567"
  const fullAddress =
    state.fullAddress ||
    state.booking?.fullAddress ||
    [state.addressLine, state.ward, state.district, state.city].filter(Boolean).join(", ") ||
    "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM"

  const serviceAreaName =
    state.serviceAreaName || state.booking?.serviceAreaName || "Khu vực Quận 1 & Trung tâm TP.HCM"

  const appointmentDate = state.appointmentDate || state.booking?.appointmentDate || "Thứ 3, 15/10/2026"
  const slotTime = state.slotTime || state.booking?.slotStart || "14:00 - 15:00"
  const problemDesc = state.problemDescription || state.booking?.problemDescription || "Kiểm tra và sửa chữa thiết bị tại nhà"

  const services =
    state.services && state.services.length > 0
      ? state.services
      : state.booking?.services && state.booking.services.length > 0
      ? state.booking.services.map((s) => ({
          name: s.serviceName,
          price: s.unitPrice,
          pricingType: s.pricingType,
          desc: "Dịch vụ kỹ thuật chuyên nghiệp",
        }))
      : [
          { name: "Sửa chập điện aptomat", price: 250000, pricingType: "FixedPrice", desc: "Kiểm tra và xử lý đường dây chập" },
        ]

  const totalCost = state.totalAmount ?? state.booking?.estimatedTotal ?? 250000

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(bookingCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* HERO CELEBRATION */}
        <section style={{ textAlign: "center", position: "relative", marginBottom: "36px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#10b981",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 10px 25px rgba(16,185,129,0.3)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", margin: "0 auto 8px", textAlign: "center", letterSpacing: "-0.02em" }}>
            Đặt lịch sửa chữa tại nhà thành công!
          </h1>
          <p style={{ fontSize: "1rem", color: "#64748b", margin: "0 auto 20px", maxWidth: "600px", lineHeight: 1.5 }}>
            Yêu cầu sửa chữa của bạn đã được tiếp nhận. Đội ngũ kỹ thuật viên HomeFix tại khu vực sẽ liên hệ xác nhận và có mặt đúng khung giờ hẹn.
          </p>

          {/* BOOKING CODE BADGE */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "8px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Mã lịch hẹn:</span>
            <strong style={{ fontSize: "1.1rem", color: "#2563eb", letterSpacing: "0.5px" }}>{bookingCode}</strong>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                background: copiedCode ? "#ecfdf5" : "#f1f5f9",
                color: copiedCode ? "#059669" : "#334155",
                border: "none",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {copiedCode ? "✓ Đã chép" : "Sao chép"}
            </button>
          </div>
        </section>

        {/* DETAILS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: "24px", marginBottom: "36px" }}>
          {/* LEFT: HOME & TIME INFO */}
          <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📍</span>
              <span>Thông tin địa chỉ & thời gian phục vụ</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #f1f5f9", paddingBottom: "10px" }}>
                <span style={{ color: "#64748b" }}>Khách hàng:</span>
                <strong style={{ color: "#0f172a" }}>{customerName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #f1f5f9", paddingBottom: "10px" }}>
                <span style={{ color: "#64748b" }}>Số điện thoại:</span>
                <strong style={{ color: "#0f172a" }}>{customerPhone}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #f1f5f9", paddingBottom: "10px" }}>
                <span style={{ color: "#64748b" }}>Khu vực phục vụ:</span>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>{serviceAreaName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #f1f5f9", paddingBottom: "10px" }}>
                <span style={{ color: "#64748b" }}>Địa chỉ sửa chữa:</span>
                <span style={{ color: "#0f172a", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{fullAddress}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #f1f5f9", paddingBottom: "10px" }}>
                <span style={{ color: "#64748b" }}>Thời gian hẹn:</span>
                <strong style={{ color: "#2563eb" }}>{appointmentDate} ({slotTime})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Mô tả sự cố:</span>
                <span style={{ color: "#475569", textAlign: "right", maxWidth: "65%" }}>{problemDesc}</span>
              </div>
            </div>

            {/* PROCESS STEPS TIMELINE INFO */}
            <div style={{ marginTop: "20px", background: "#f8fafc", borderRadius: "12px", padding: "14px", border: "1px solid #e2e8f0" }}>
              <strong style={{ display: "block", fontSize: "0.82rem", color: "#0f172a", marginBottom: "8px" }}>
                Các bước tiếp theo:
              </strong>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", color: "#64748b" }}>
                <li>1. Quản trị viên phân công thợ kỹ thuật phụ trách khu vực của bạn.</li>
                <li>2. Thợ gọi điện xác nhận trước khi bắt đầu di chuyển đến nhà.</li>
                <li>3. Khảo sát thực tế, thống nhất báo giá và tiến hành sửa chữa.</li>
                <li>4. Nghiệm thu bàn giao và kích hoạt bảo hành điện tử 12 tháng.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: SERVICES & ESTIMATED COST */}
          <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🛠️</span>
                <span>Dịch vụ yêu cầu sửa chữa</span>
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {services.map((svc, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                    <div>
                      <strong style={{ display: "block", fontSize: "0.88rem", color: "#0f172a" }}>{svc.name}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{svc.desc || "Dịch vụ tại nhà"}</span>
                    </div>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2563eb" }}>
                      {formatPrice(svc.price, (svc.pricingType as any) || "FixedPrice")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: "14px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>Tổng chi phí dự kiến:</span>
                  <strong style={{ fontSize: "1.35rem", color: "#2563eb", fontWeight: 900 }}>
                    {totalCost.toLocaleString("vi-VN")}đ
                  </strong>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>
                  * Chi phí thực tế sẽ được thợ kiểm tra trực tiếp và thống nhất với bạn trước khi tiến hành sửa chữa.
                </span>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  to={`/my-bookings/${bookingId}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 0",
                    background: "#2563eb",
                    color: "#ffffff",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                  }}
                >
                  Theo dõi tiến độ lịch hẹn →
                </Link>
                <Link
                  to="/"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "10px 0",
                    background: "#f1f5f9",
                    color: "#334155",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    textDecoration: "none",
                  }}
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
