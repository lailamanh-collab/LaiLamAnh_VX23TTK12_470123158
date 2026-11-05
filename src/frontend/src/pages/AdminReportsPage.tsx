import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { adminTechnicians, getBranches, type Branch, type Technician } from "../api/branches"
import { fetchAdminReports, type ReportResultData } from "../api/reports"
import { useAuth } from "../auth/AuthContext"

export function AdminReportsPage() {
  const { token } = useAuth()

  const [report, setReport] = useState<ReportResultData | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Filter state (45.16)
  const [activePreset, setActivePreset] = useState<string>("All")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [branchId, setBranchId] = useState<string>("")
  const [technicianId, setTechnicianId] = useState<string>("")
  const [status, setStatus] = useState<string>("")

  // Active Report Tab: "technicians" | "branches" | "services" | "brands"
  const [activeReportTab, setActiveReportTab] = useState<"technicians" | "branches" | "services" | "brands">("technicians")

  const applyPreset = (preset: string) => {
    setActivePreset(preset)
    const today = new Date()
    const formatDate = (d: Date) => d.toISOString().slice(0, 10)

    if (preset === "Today") {
      const dStr = formatDate(today)
      setFromDate(dStr)
      setToDate(dStr)
    } else if (preset === "7days") {
      const past = new Date()
      past.setDate(today.getDate() - 6)
      setFromDate(formatDate(past))
      setToDate(formatDate(today))
    } else if (preset === "30days") {
      const past = new Date()
      past.setDate(today.getDate() - 29)
      setFromDate(formatDate(past))
      setToDate(formatDate(today))
    } else if (preset === "ThisMonth") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      setFromDate(formatDate(first))
      setToDate(formatDate(today))
    } else {
      setFromDate("")
      setToDate("")
    }
  }

  const loadReport = async () => {
    if (!token) return
    setLoading(true)
    setErrorMsg("")
    try {
      const [repData, branchList, techList] = await Promise.all([
        fetchAdminReports(token, {
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          branchId: branchId ? Number(branchId) : undefined,
          technicianId: technicianId ? Number(technicianId) : undefined,
          status: status || undefined,
        }),
        getBranches().catch(() => []),
        adminTechnicians(token).catch(() => []),
      ])
      setReport(repData)
      setBranches(branchList)
      setTechnicians(techList)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi tải báo cáo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReport()
  }, [token, fromDate, toDate, branchId, technicianId, status])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void loadReport()
  }

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
        <Link to="/admin/dashboard" className="btn btn-quiet" style={{ padding: "6px 14px", fontSize: "0.88rem" }}>
          📈 Xem Admin Dashboard
        </Link>
      </div>

      <section className="hero" style={{ paddingBottom: "24px" }}>
        <div>
          <span className="eyebrow">Phân tích & Thống kê</span>
          <h1>Báo cáo Hoạt động Sửa chữa Nhà cửa</h1>
          <p className="lede">
            Báo cáo chi tiết theo khoảng ngày, khu vực phục vụ, kỹ thuật viên, nhóm dịch vụ và dịch vụ sửa chữa.
          </p>
        </div>
      </section>

      {errorMsg ? <p className="form-error" style={{ margin: "14px 0" }}>{errorMsg}</p> : null}

      {/* FILTER PANEL */}
      <div className="card" style={{ padding: "20px", margin: "20px 0" }}>
        {/* Preset date buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-ink)", marginRight: "4px" }}>
            Mốc thời gian:
          </span>
          {[
            { id: "All", label: "Toàn thời gian" },
            { id: "Today", label: "Hôm nay" },
            { id: "7days", label: "7 ngày qua" },
            { id: "30days", label: "30 ngày qua" },
            { id: "ThisMonth", label: "Tháng này" },
          ].map((btn) => (
            <button
              key={btn.id}
              className={`btn ${activePreset === btn.id ? "" : "btn-quiet"}`}
              type="button"
              onClick={() => applyPreset(btn.id)}
              style={{ padding: "4px 12px", fontSize: "0.85rem", borderRadius: "20px" }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleFilterSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: "12px", alignItems: "flex-end" }}>
            <label className="field" style={{ margin: 0 }}>
              <span>Từ ngày</span>
              <input
                className="input"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setActivePreset("custom")
                }}
              />
            </label>

            <label className="field" style={{ margin: 0 }}>
              <span>Đến ngày</span>
              <input
                className="input"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setActivePreset("custom")
                }}
              />
            </label>

            <label className="field" style={{ margin: 0 }}>
              <span>Khu vực phục vụ</span>
              <select className="input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Tất cả khu vực</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>

            <label className="field" style={{ margin: 0 }}>
              <span>Kỹ thuật viên</span>
              <select className="input" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
                <option value="">Tất cả kỹ thuật viên</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.fullName} ({t.branchName})</option>
                ))}
              </select>
            </label>

            <label className="field" style={{ margin: 0 }}>
              <span>Trạng thái</span>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                <option value="Pending">Chờ xác nhận</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="Assigned">Đã phân công</option>
                <option value="OnTheWay">Đang di chuyển</option>
                <option value="Inspecting">Đang kiểm tra</option>
                <option value="Repairing">Đang sửa chữa</option>
                <option value="Completed">Đã hoàn thành</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn" type="submit" style={{ flex: 1 }} disabled={loading}>
                {loading ? "Đang tải báo cáo..." : "Áp dụng lọc"}
              </button>
              {(fromDate || toDate || branchId || technicianId || status) ? (
                <button
                  className="btn btn-quiet"
                  type="button"
                  onClick={() => {
                    setActivePreset("All")
                    setFromDate("")
                    setToDate("")
                    setBranchId("")
                    setTechnicianId("")
                    setStatus("")
                  }}
                >
                  Xóa lọc
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      {/* REPORT SUMMARY KPI CARDS */}
      {report ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            <div className="card" style={{ padding: "18px" }}>
              <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 700 }}>TỔNG LỊCH ĐẶT</span>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, margin: "4px 0" }}>
                {report.summary.totalBookings}
              </div>
              <span className="muted" style={{ fontSize: "0.8rem" }}>Trong phạm vi lọc</span>
            </div>

            <div className="card" style={{ padding: "18px", background: "#f0fdf4", borderColor: "#bbf7d0" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#166534" }}>HOÀN THÀNH</span>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#15803d", margin: "4px 0" }}>
                {report.summary.completedBookings}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#166534" }}>
                Tỷ lệ: {report.summary.totalBookings > 0 ? Math.round((report.summary.completedBookings / report.summary.totalBookings) * 100) : 0}%
              </span>
            </div>

            <div className="card" style={{ padding: "18px", background: "#fee2e2" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#991b1b" }}>ĐÃ HỦY</span>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#b91c1c", margin: "4px 0" }}>
                {report.summary.cancelledBookings}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#991b1b" }}>
                Tỷ lệ hủy: {report.summary.totalBookings > 0 ? Math.round((report.summary.cancelledBookings / report.summary.totalBookings) * 100) : 0}%
              </span>
            </div>

            <div className="card" style={{ padding: "18px", background: "#ecfdf5", borderLeft: "4px solid #059669" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#065f46" }}>DOANH THU SỬA</span>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#047857", margin: "6px 0 2px" }}>
                {formatMoney(report.summary.totalRevenue)}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#065f46" }}>Giá trị thực tế hoàn tất</span>
            </div>

            <div className="card" style={{ padding: "18px" }}>
              <span className="muted" style={{ fontSize: "0.82rem", fontWeight: 700 }}>GIÁ TRỊ TB / CA</span>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--color-ink)", margin: "6px 0 2px" }}>
                {formatMoney(report.summary.averageBookingValue)}
              </div>
              <span className="muted" style={{ fontSize: "0.8rem" }}>Trung bình mỗi ca xong</span>
            </div>
          </div>

          {/* REPORT TABS NAVIGATION (45.15) */}
          <div style={{ display: "flex", gap: "10px", margin: "16px 0", borderBottom: "2px solid var(--color-line)", paddingBottom: "8px", flexWrap: "wrap" }}>
            <button
              className={`btn ${activeReportTab === "technicians" ? "" : "btn-quiet"}`}
              type="button"
              onClick={() => setActiveReportTab("technicians")}
            >
              👨‍🔧 Hiệu suất Kỹ thuật viên ({report.technicianPerformance.length})
            </button>
            <button
              className={`btn ${activeReportTab === "branches" ? "" : "btn-quiet"}`}
              type="button"
              onClick={() => setActiveReportTab("branches")}
            >
              🏪 Hiệu suất Khu vực phục vụ ({report.branchPerformance.length})
            </button>
            <button
              className={`btn ${activeReportTab === "services" ? "" : "btn-quiet"}`}
              type="button"
              onClick={() => setActiveReportTab("services")}
            >
              🔧 Báo cáo Dịch vụ ({report.servicePerformance.length})
            </button>
            <button
              className={`btn ${activeReportTab === "brands" ? "" : "btn-quiet"}`}
              type="button"
              onClick={() => setActiveReportTab("brands")}
            >
              📁 Báo cáo Nhóm dịch vụ ({report.brandPerformance.length})
            </button>
          </div>

          {/* TAB 1: TECHNICIAN PERFORMANCE */}
          {activeReportTab === "technicians" ? (
            <section className="card" style={{ overflowX: "auto" }}>
              <h3 style={{ margin: "0 0 16px" }}>Bảng xếp hạng năng suất Kỹ thuật viên</h3>
              {report.technicianPerformance.length === 0 ? (
                <p className="muted">Chưa có dữ liệu kỹ thuật viên trong bộ lọc này.</p>
              ) : (
                <table style={{ width: "100%", minWidth: "800px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-line)", color: "var(--color-muted)" }}>
                      <th style={{ padding: "10px" }}>Kỹ thuật viên</th>
                      <th style={{ padding: "10px" }}>Khu vực trực</th>
                      <th style={{ padding: "10px" }}>Ca được giao</th>
                      <th style={{ padding: "10px" }}>Ca hoàn thành</th>
                      <th style={{ padding: "10px" }}>Tỷ lệ hoàn tất</th>
                      <th style={{ padding: "10px" }}>Đánh giá sao</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Doanh thu mang lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.technicianPerformance.map((tech) => {
                      const ratePct = tech.totalAssigned > 0 ? Math.round((tech.completedJobs / tech.totalAssigned) * 100) : 0
                      return (
                        <tr key={tech.technicianId} style={{ borderBottom: "1px solid var(--color-line)" }}>
                          <td style={{ padding: "12px 10px" }}>
                            <strong>👨‍🔧 {tech.technicianName}</strong>
                          </td>
                          <td style={{ padding: "12px 10px" }}>📍 {tech.branchName}</td>
                          <td style={{ padding: "12px 10px" }}>{tech.totalAssigned}</td>
                          <td style={{ padding: "12px 10px", fontWeight: 700, color: "#16a34a" }}>
                            {tech.completedJobs}
                          </td>
                          <td style={{ padding: "12px 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "60px", height: "6px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${ratePct}%`, background: "#22c55e" }} />
                              </div>
                              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{ratePct}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 10px" }}>
                            <span style={{ color: "#f59e0b", fontWeight: 700 }}>★ {tech.averageRating.toFixed(1)}</span>
                            <span style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginLeft: "4px" }}>({tech.totalReviews} lượt)</span>
                          </td>
                          <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700, color: "var(--color-ok)" }}>
                            {formatMoney(tech.totalRevenue)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}

          {/* TAB 2: SERVICE AREA PERFORMANCE */}
          {activeReportTab === "branches" ? (
            <section className="card" style={{ overflowX: "auto" }}>
              <h3 style={{ margin: "0 0 16px" }}>Báo cáo kết quả theo Khu vực phục vụ</h3>
              {report.branchPerformance.length === 0 ? (
                <p className="muted">Chưa có dữ liệu khu vực trong bộ lọc này.</p>
              ) : (
                <table style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-line)", color: "var(--color-muted)" }}>
                      <th style={{ padding: "10px" }}>Khu vực phục vụ</th>
                      <th style={{ padding: "10px" }}>Tổng lịch đặt</th>
                      <th style={{ padding: "10px" }}>Lịch hoàn thành</th>
                      <th style={{ padding: "10px" }}>Tỷ lệ hoàn tất</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Tổng doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.branchPerformance.map((br) => {
                      const ratePct = br.totalBookings > 0 ? Math.round((br.completedBookings / br.totalBookings) * 100) : 0
                      return (
                        <tr key={br.branchId} style={{ borderBottom: "1px solid var(--color-line)" }}>
                          <td style={{ padding: "12px 10px" }}>
                            <strong>📍 {br.branchName}</strong>
                          </td>
                          <td style={{ padding: "12px 10px" }}>{br.totalBookings}</td>
                          <td style={{ padding: "12px 10px", fontWeight: 700, color: "#16a34a" }}>
                            {br.completedBookings}
                          </td>
                          <td style={{ padding: "12px 10px" }}>{ratePct}%</td>
                          <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700, color: "var(--color-ok)" }}>
                            {formatMoney(br.revenue)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}

          {/* TAB 3: SERVICE PERFORMANCE */}
          {activeReportTab === "services" ? (
            <section className="card" style={{ overflowX: "auto" }}>
              <h3 style={{ margin: "0 0 16px" }}>Báo cáo Dịch vụ sửa chữa</h3>
              {report.servicePerformance.length === 0 ? (
                <p className="muted">Chưa có dữ liệu dịch vụ trong bộ lọc này.</p>
              ) : (
                <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-line)", color: "var(--color-muted)" }}>
                      <th style={{ padding: "10px" }}>Dịch vụ</th>
                      <th style={{ padding: "10px" }}>Số lượt thực hiện</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Tổng doanh thu dịch vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.servicePerformance.map((svc) => (
                      <tr key={svc.serviceId} style={{ borderBottom: "1px solid var(--color-line)" }}>
                        <td style={{ padding: "12px 10px" }}>
                          <strong>🔧 {svc.serviceName}</strong>
                        </td>
                        <td style={{ padding: "12px 10px" }}>{svc.count} lượt</td>
                        <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700, color: "var(--color-accent-strong)" }}>
                          {formatMoney(svc.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}

          {/* TAB 4: CATEGORY PERFORMANCE */}
          {activeReportTab === "brands" ? (
            <section className="card" style={{ overflowX: "auto" }}>
              <h3 style={{ margin: "0 0 16px" }}>Báo cáo theo Nhóm dịch vụ</h3>
              {report.brandPerformance.length === 0 ? (
                <p className="muted">Chưa có dữ liệu nhóm dịch vụ trong bộ lọc này.</p>
              ) : (
                <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-line)", color: "var(--color-muted)" }}>
                      <th style={{ padding: "10px" }}>Nhóm dịch vụ</th>
                      <th style={{ padding: "10px" }}>Số ca sửa chữa</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Tổng giá trị sửa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.brandPerformance.map((br, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--color-line)" }}>
                        <td style={{ padding: "12px 10px" }}>
                          <strong>📁 {br.brandName}</strong>
                        </td>
                        <td style={{ padding: "12px 10px" }}>{br.count} ca</td>
                        <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700, color: "var(--color-ok)" }}>
                          {formatMoney(br.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  )
}
