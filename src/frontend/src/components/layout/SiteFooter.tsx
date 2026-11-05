import { Link } from "react-router-dom"
import { facebookIcon, youtubeIcon, tiktokIcon, zaloIcon } from "../../assets/social"

type SiteFooterProps = {
  databaseConnected: boolean | null
}

export function SiteFooter({ databaseConnected }: SiteFooterProps) {
  let statusText = "Hệ thống sẵn sàng"
  if (databaseConnected === true) statusText = "Cơ sở dữ liệu sẵn sàng"
  if (databaseConnected === false) statusText = "Chưa kết nối cơ sở dữ liệu"

  return (
    <footer style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0", paddingTop: "52px", paddingBottom: "32px", marginTop: "auto" }}>
      <div style={{ maxWidth: "1340px", margin: "0 auto", padding: "0 20px" }}>
        {/* MAIN 5-COLUMN FOOTER GRID (RESPONSIVE) */}
        <div className="site-footer-grid">
          {/* COL 1: LOGO & ABOUT */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <strong style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a" }}>
                Home<span style={{ color: "#2563eb" }}>Fix</span>
              </strong>
            </div>

            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.85rem", lineHeight: 1.5, maxWidth: "260px" }}>
              Dịch vụ sửa chữa & bảo trì nhà cửa tận nơi uy tín, chuyên nghiệp
            </p>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: "32px",
                  height: "32px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s ease",
                  textDecoration: "none",
                }}
                title="Facebook"
              >
                <img src={facebookIcon} alt="Facebook" style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "contain" }} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: "32px",
                  height: "32px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s ease",
                  textDecoration: "none",
                }}
                title="YouTube"
              >
                <img src={youtubeIcon} alt="YouTube" style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "contain" }} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: "32px",
                  height: "32px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s ease",
                  textDecoration: "none",
                }}
                title="TikTok"
              >
                <img src={tiktokIcon} alt="TikTok" style={{ width: "28px", height: "32px", objectFit: "contain" }} />
              </a>
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: "32px",
                  height: "32px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s ease",
                  textDecoration: "none",
                }}
                title="Zalo"
              >
                <img src={zaloIcon} alt="Zalo" style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "contain" }} />
              </a>
            </div>
          </div>

          {/* COL 2: VỀ CHÚNG TÔI */}
          <div>
            <strong style={{ display: "block", fontSize: "0.92rem", color: "#0f172a", marginBottom: "16px", fontWeight: 700 }}>
              Về chúng tôi
            </strong>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.86rem" }}>
              <li>
                <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>Giới thiệu dịch vụ</Link>
              </li>
              <li>
                <Link to="/branches" style={{ color: "#64748b", textDecoration: "none" }}>Khu vực phục vụ</Link>
              </li>
              <li>
                <Link to="/services" style={{ color: "#64748b", textDecoration: "none" }}>Danh mục sửa chữa</Link>
              </li>
              <li>
                <Link to="/support" style={{ color: "#64748b", textDecoration: "none" }}>Tuyển dụng thợ kỹ thuật</Link>
              </li>
            </ul>
          </div>

          {/* COL 3: DỊCH VỤ */}
          <div>
            <strong style={{ display: "block", fontSize: "0.92rem", color: "#0f172a", marginBottom: "16px", fontWeight: 700 }}>
              Dịch vụ tại nhà
            </strong>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.86rem" }}>
              <li>
                <Link to="/pricing" style={{ color: "#64748b", textDecoration: "none" }}>Bảng giá dịch vụ</Link>
              </li>
              <li>
                <Link to="/support" style={{ color: "#64748b", textDecoration: "none" }}>Chính sách bảo hành 12 tháng</Link>
              </li>
              <li>
                <Link to="/services" style={{ color: "#64748b", textDecoration: "none" }}>Quy trình sửa chữa tại nhà</Link>
              </li>
              <li>
                <Link to="/support" style={{ color: "#64748b", textDecoration: "none" }}>Câu hỏi thường gặp (FAQ)</Link>
              </li>
            </ul>
          </div>

          {/* COL 4: HỖ TRỢ KHÁCH HÀNG */}
          <div>
            <strong style={{ display: "block", fontSize: "0.92rem", color: "#0f172a", marginBottom: "16px", fontWeight: 700 }}>
              Hỗ trợ khách hàng
            </strong>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.86rem" }}>
              <li>
                <Link to="/support" style={{ color: "#64748b", textDecoration: "none" }}>Hotline hỗ trợ 24/7</Link>
              </li>
              <li>
                <Link to="/booking" style={{ color: "#64748b", textDecoration: "none" }}>Đặt lịch sửa chữa ngay</Link>
              </li>
              <li>
                <Link to="/support" style={{ color: "#64748b", textDecoration: "none" }}>Chính sách bảo mật</Link>
              </li>
              <li>
                <Link to="/support" style={{ color: "#64748b", textDecoration: "none" }}>Điều khoản dịch vụ</Link>
              </li>
            </ul>
          </div>

          {/* COL 5: NHẬN THÔNG TIN KHUYẾN MÃI */}
          <div>
            <strong style={{ display: "block", fontSize: "0.92rem", color: "#0f172a", marginBottom: "12px", fontWeight: 700 }}>
              Nhận thông tin ưu đãi
            </strong>
            <p style={{ fontSize: "0.84rem", color: "#64748b", lineHeight: 1.5, margin: "0 0 14px" }}>
              Đăng ký email để nhận ưu đãi bảo trì nhà cửa định kỳ mới nhất từ HomeFix
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                alert("Cảm ơn bạn đã đăng ký nhận thông tin ưu đãi!")
              }}
              className="site-footer-newsletter-form"
            >
              <input
                type="email"
                required
                placeholder="Nhập email của bạn"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.86rem",
                  outline: "none",
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Đăng ký
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & POLICY ROW */}
        <div className="site-footer-bottom-bar">
          <div>
            © 2026 HomeFix - Dịch vụ Sửa Chữa Nhà Cửa Tại Nhà. Tất cả quyền được bảo lưu.
          </div>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: "14px" }}>
            <Link to="/support" style={{ color: "#94a3b8" }}>Điều khoản sử dụng</Link>
            <span style={{ opacity: 0.4 }}>•</span>
            <Link to="/support" style={{ color: "#94a3b8" }}>Chính sách bảo mật</Link>
            <span style={{ opacity: 0.4 }}>•</span>
            <Link to="/support" style={{ color: "#94a3b8" }}>Khu vực phục vụ</Link>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: databaseConnected ? "#16a34a" : "#ca8a04",
              }}
            />
            <span>{statusText}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
