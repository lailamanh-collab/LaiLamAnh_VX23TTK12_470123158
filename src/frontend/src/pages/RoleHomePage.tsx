import { Link } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"

export function RoleHomePage({ title, description }: { title: string; description: string }) {
  const { user } = useAuth()

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">{title}</p>
          <h1>Xin chào, {user?.fullName}</h1>
          <p className="lede">{description}</p>
        </div>
      </section>

      {user?.role === "Admin" ? (
        <section style={{ marginTop: "32px" }}>
          <h2>Phân hệ quản trị hệ thống</h2>
          <p className="section-intro">Chọn khu vực chức năng bạn cần quản lý:</p>

          <div className="step-grid" style={{ marginTop: "16px" }}>
            <Link to="/admin/dashboard" className="card card-button" style={{ padding: "24px", borderColor: "var(--color-primary-light)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📈</div>
              <strong style={{ fontSize: "1.2rem", color: "var(--color-primary)" }}>Dashboard Chỉ huy</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "0.92rem" }}>
                Thống kê trực quan: biểu đồ lịch hẹn theo ngày, trạng thái, dịch vụ, doanh thu và tải chi nhánh.
              </p>
            </Link>

            <Link to="/admin/reports" className="card card-button" style={{ padding: "24px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📊</div>
              <strong style={{ fontSize: "1.2rem" }}>Báo cáo Thống kê</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "0.92rem" }}>
                Bộ lọc nâng cao theo khoảng ngày, chi nhánh, KTV; bảng xếp hạng năng suất KTV, doanh số dịch vụ.
              </p>
            </Link>

            <Link to="/admin/bookings" className="card card-button" style={{ padding: "24px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
              <strong style={{ fontSize: "1.2rem" }}>Điều phối & Lịch hẹn</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "0.92rem" }}>
                Xem toàn bộ lịch hẹn, tìm kiếm đa chiều, duyệt trạng thái, phân công kỹ thuật viên theo chi nhánh.
              </p>
            </Link>

            <Link to="/admin/customers" className="card card-button" style={{ padding: "24px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👥</div>
              <strong style={{ fontSize: "1.2rem" }}>Quản lý Tài khoản</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "0.92rem" }}>
                Quản lý tập trung toàn bộ tài khoản: Khách hàng (User), Kỹ thuật viên (KTV) và Quản trị viên (Admin).
              </p>
            </Link>

            <Link to="/admin/operations" className="card card-button" style={{ padding: "24px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏪</div>
              <strong style={{ fontSize: "1.2rem" }}>Cửa hàng & Kỹ thuật viên</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "0.92rem" }}>
                Quản lý chi nhánh, giờ mở cửa, sức chứa mỗi slot, hồ sơ kỹ thuật viên và lịch trực tuần.
              </p>
            </Link>

            <Link to="/admin/catalog" className="card card-button" style={{ padding: "24px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏷️</div>
              <strong style={{ fontSize: "1.2rem" }}>Danh mục & Bảng giá</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "0.92rem" }}>
                Quản lý Hãng điện thoại, Dòng máy, Dịch vụ sửa chữa và Bảng giá theo từng dòng máy cụ thể.
              </p>
            </Link>

            <Link to="/admin/reviews" className="card card-button" style={{ padding: "24px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⭐</div>
              <strong style={{ fontSize: "1.2rem" }}>Đánh giá & Phản hồi</strong>
              <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: "0.92rem" }}>
                Xem toàn bộ đánh giá, theo dõi điểm số sao, lọc theo chi nhánh/KTV, ẩn hoặc xóa đánh giá.
              </p>
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  )
}
