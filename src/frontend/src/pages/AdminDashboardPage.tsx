import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchAdminDashboard, type AdminDashboardData } from "../api/reports"
import { useAuth } from "../auth/AuthContext"

export function AdminDashboardPage() {
  const { token } = useAuth()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const loadData = async () => {
    if (!token) return
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await fetchAdminDashboard(token)
      setData(res)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi tải dữ liệu Dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [token])

  const formatMoney = (val?: number | null) => {
    if (val === undefined || val === null) return "0 đ"
    return `${new Intl.NumberFormat("vi-VN").format(val)} đ`
  }

  return (
    <main className="page">
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <Link className="text-link" to="/admin">
          ← Quay lại Trung tâm Quản trị
        </Link>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/admin/reports" className="btn btn-quiet" style={{ padding: "6px 14px", fontSize: "0.88rem" }}>
            📊 Xem Báo cáo Chi tiết
          </Link>
          <button className="btn btn-quiet" type="button" onClick={() => void loadData()} style={{ padding: "6px 14px", fontSize: "0.88rem" }}>
            🔄 Làm mới số liệu
          </button>
        </div>
      </div>

      <section className="hero" style={{ paddingBottom: "24px" }}>
        <div>
          <span className="eyebrow">Trung tâm Chỉ huy</span>
          <h1>Admin Dashboard (45.2)</h1>
          <p className="lede">
            Số liệu thống kê thời gian thực từ cơ sở dữ liệu về lịch hẹn, vận hành sửa chữa, khách hàng và doanh thu.
          </p>
        </div>
      </section>

      {errorMsg ? <p className="form-error" style={{ margin: "14px 0" }}>{errorMsg}</p> : null}

      {loading && !data ? (
        <p className="card" style={{ textAlign: "center", padding: "40px", color: "var(--color-muted)" }}>
          Đang tải dữ liệu dashboard thời gian thực...
        </p>
      ) : data ? (
        <>
          {/* STATISTIC CARDS (45.2) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "14px",
              margin: "20px 0 28px",
            }}
          >
            {/* Bookings Today */}
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid #0284c7" }}>
              <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                LỊCH HÔM NAY
              </span>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--color-ink)", margin: "4px 0" }}>
                {data.stats.bookingsToday}
              </div>
              <span className="muted" style={{ fontSize: "0.8rem" }}>Lịch khách hẹn hôm nay</span>
            </div>

            {/* Pending Bookings */}
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid #d97706", background: "#fefce8" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#92400e", letterSpacing: "0.05em" }}>
                CHỜ XÁC NHẬN
              </span>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#b45309", margin: "4px 0" }}>
                {data.stats.pendingBookings}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#92400e" }}>Cần admin duyệt</span>
            </div>

            {/* Confirmed Bookings */}
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid #0369a1", background: "#f0f9ff" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0369a1", letterSpacing: "0.05em" }}>
                ĐÃ XÁC NHẬN
              </span>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0284c7", margin: "4px 0" }}>
                {data.stats.confirmedBookings}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#0369a1" }}>Lịch phục vụ tại nhà</span>
            </div>

            {/* Home Repairs in Progress */}
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid #ea580c", background: "#fff7ed" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#9a3412", letterSpacing: "0.05em" }}>
                ĐANG SỬA CHỮA
              </span>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#ea580c", margin: "4px 0" }}>
                {data.stats.repairingBookings}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#9a3412" }}>Thợ đang thi công tại nhà</span>
            </div>

            {/* Completed Today */}
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid #16a34a", background: "#f0fdf4" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#166534", letterSpacing: "0.05em" }}>
                XONG HÔM NAY
              </span>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#15803d", margin: "4px 0" }}>
                {data.stats.completedToday}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#166534" }}>Toàn bộ: {data.stats.completedBookingsAllTime}</span>
            </div>

            {/* Total Customers */}
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid #8b5cf6" }}>
              <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                TỔNG KHÁCH HÀNG
              </span>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#6d28d9", margin: "4px 0" }}>
                {data.stats.totalCustomers}
              </div>
              <span className="muted" style={{ fontSize: "0.8rem" }}>Tài khoản khách hàng</span>
            </div>

            {/* Total Technicians */}
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid #6366f1" }}>
              <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                KỸ THUẬT VIÊN
              </span>
              <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#4f46e5", margin: "4px 0" }}>
                {data.stats.totalTechnicians}
              </div>
              <span className="muted" style={{ fontSize: "0.8rem" }}>Đang hoạt động</span>
            </div>

            {/* Repair Value */}
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid #059669", background: "#ecfdf5" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#065f46", letterSpacing: "0.05em" }}>
                GIÁ TRỊ SỬA CHỮA
              </span>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#047857", margin: "6px 0 2px" }}>
                {formatMoney(data.stats.totalRepairValue)}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#065f46" }}>Doanh thu hoàn tất</span>
            </div>
          </div>

          {/* CHARTS GRID (45.2) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: "20px" }}>
            {/* CHART 1: BOOKING BY DATE (PAST 7 DAYS) */}
            <section className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: 0 }}>Lịch hẹn theo ngày (7 ngày gần nhất)</h3>
                  <p style={{ margin: "2px 0 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>
                    Số lượng lịch đặt và doanh thu phát sinh
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "180px", paddingTop: "20px" }}>
                {data.bookingsByDate.map((item, idx) => {
                  const maxCount = Math.max(...data.bookingsByDate.map((x) => x.count), 1)
                  const heightPercent = Math.max((item.count / maxCount) * 100, 10)
                  return (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-ink)", marginBottom: "4px" }}>
                        {item.count}
                      </span>
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "36px",
                          height: `${heightPercent}%`,
                          background: "linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-strong) 100%)",
                          borderRadius: "6px 6px 0 0",
                          transition: "height 0.3s ease",
                        }}
                        title={`Ngày ${item.date}: ${item.count} lịch, Doanh thu: ${formatMoney(item.revenue)}`}
                      />
                      <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "6px", whiteSpace: "nowrap" }}>
                        {item.date.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* CHART 2: BOOKINGS BY STATUS */}
            <section className="card" style={{ padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>Phân bổ trạng thái lịch hẹn</h3>
                <p style={{ margin: "2px 0 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>
                  Tổng quan tình trạng các ca sửa chữa trong toàn hệ thống
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.bookingsByStatus.map((item, idx) => {
                  const totalBookings = data.bookingsByStatus.reduce((acc, curr) => acc + curr.count, 0) || 1
                  const pct = Math.round((item.count / totalBookings) * 100)
                  return (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: "4px" }}>
                        <strong>{item.statusLabel}</strong>
                        <span>
                          <strong>{item.count}</strong> ca ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background:
                              item.status === "Completed"
                                ? "#22c55e"
                                : item.status === "Cancelled"
                                ? "#ef4444"
                                : item.status === "Repairing"
                                ? "#f97316"
                                : item.status === "Inspecting"
                                ? "#6366f1"
                                : item.status === "Received"
                                ? "#eab308"
                                : item.status === "Confirmed"
                                ? "#0ea5e9"
                                : "#94a3b8",
                            borderRadius: "99px",
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* CHART 3: POPULAR REPAIR SERVICES */}
            <section className="card" style={{ padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>Dịch vụ sửa chữa phổ biến nhất</h3>
                <p style={{ margin: "2px 0 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>
                  Top dịch vụ được khách hàng yêu cầu nhiều nhất
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.popularServices.map((svc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.92rem" }}>
                        #{idx + 1} {svc.serviceName}
                      </strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                        {svc.count} lần đặt
                      </div>
                    </div>
                    <strong style={{ color: "var(--color-accent-strong)" }}>
                      {formatMoney(svc.revenue)}
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            {/* CHART 4: REPAIRED CATEGORIES */}
            <section className="card" style={{ padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>Nhóm dịch vụ sửa chữa nhiều nhất</h3>
                <p style={{ margin: "2px 0 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>
                  Tỷ trọng các nhóm sự cố tại nhà được tiếp nhận
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(data.popularCategories || data.repairedBrands || []).map((b, idx) => {
                  const catList = data.popularCategories || data.repairedBrands || []
                  const maxB = Math.max(...catList.map((x) => x.count), 1)
                  const pct = Math.round((b.count / maxB) * 100)
                  return (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: "4px" }}>
                        <strong>{b.categoryName || b.brandName || "Dịch vụ tại nhà"}</strong>
                        <span>
                          <strong>{b.count}</strong> ca sửa · Doanh thu: {formatMoney(b.revenue)}
                        </span>
                      </div>
                      <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: "var(--color-accent)",
                            borderRadius: "99px",
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* CHART 5: TOP REPAIRED SERVICES */}
            <section className="card" style={{ padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>Dịch vụ sửa chữa được đặt nhiều nhất</h3>
                <p style={{ margin: "2px 0 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>
                  Các dịch vụ kỹ thuật tại nhà khách hàng thường yêu cầu
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "10px" }}>
                {data.popularServices.map((s, idx) => (
                  <div key={idx} style={{ padding: "10px", background: "#f8fafc", borderRadius: "10px", border: "1px solid var(--color-line)" }}>
                    <span className="badge badge-quiet" style={{ fontSize: "0.75rem", marginBottom: "4px" }}>Dịch vụ tại nhà</span>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>{s.serviceName}</strong>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>{s.count} ca sửa · {formatMoney(s.revenue)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* CHART 6: BOOKINGS BY AREA */}
            <section className="card" style={{ padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>Lịch hẹn & Doanh thu theo Khu vực phục vụ</h3>
                <p style={{ margin: "2px 0 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>
                  Mức độ phân bổ tải công việc theo các khu vực quận huyện
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(data.bookingsByArea || data.bookingsByBranch || []).map((br, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "#f0fdf9",
                      borderRadius: "10px",
                      border: "1px solid #ccfbf1",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.95rem", color: "var(--color-ink)" }}>📍 {br.branchName}</strong>
                      <div style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>
                        {br.count} lịch tiếp nhận
                      </div>
                    </div>
                    <strong style={{ fontSize: "1rem", color: "var(--color-ok)" }}>
                      {formatMoney(br.revenue)}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </main>
  )
}
