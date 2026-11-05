import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  adminAssignTechnician,
  adminCancelBooking,
  adminConfirmBooking,
  adminGetBookings,
  type AdminBooking,
  type AdminBookingFilter,
} from "../api/adminBookings"
import { adminBranches, adminTechnicians, type Branch, type Technician } from "../api/branches"
import { formatPrice } from "../api/catalog"
import { statusLabel } from "../api/bookings"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthContext"
import { formatDateTimeVi } from "../utils/date"
import { useIsMobile } from "../utils/useMediaQuery"

const statuses = [
  { id: "", label: "Tất cả trạng thái" },
  { id: "Pending", label: "Chờ xác nhận" },
  { id: "Confirmed", label: "Đã xác nhận" },
  { id: "Received", label: "Đã tiếp nhận tại nhà" },
  { id: "Inspecting", label: "Đang kiểm tra khảo sát" },
  { id: "Repairing", label: "Đang thi công" },
  { id: "Completed", label: "Hoàn thành" },
  { id: "Cancelled", label: "Đã hủy" },
]

export function AdminBookingsPage() {
  const isMobile = useIsMobile(1080)
  const [userSelectedView, setUserSelectedView] = useState<"card" | "table" | null>(null)
  const currentView = userSelectedView ?? (isMobile ? "card" : "table")
  const { token } = useAuth()
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Filter state
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [branchId, setBranchId] = useState("")
  const [technicianId, setTechnicianId] = useState("")
  const [date, setDate] = useState("")

  // Selected booking for drawer / modal
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null)
  const [assignTechId, setAssignTechId] = useState<string>("")
  const [actionNote, setActionNote] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [showCancelBox, setShowCancelBox] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  async function loadData() {
    if (!token) return
    setLoading(true)
    setMessage("")
    try {
      const filter: AdminBookingFilter = {
        search: search.trim() || undefined,
        status: status || undefined,
        branchId: branchId ? Number(branchId) : undefined,
        technicianId: technicianId ? Number(technicianId) : undefined,
        date: date || undefined,
      }
      const data = await adminGetBookings(token, filter)
      setBookings(data)
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không tải được danh sách lịch hẹn.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    Promise.all([adminBranches(token), adminTechnicians(token)])
      .then(([b, t]) => {
        setBranches(b)
        setTechnicians(t)
      })
      .catch(() => setMessage("Không tải được chi nhánh hoặc kỹ thuật viên."))
  }, [token])

  useEffect(() => {
    void loadData()
  }, [token, status, branchId, technicianId, date])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    void loadData()
  }

  function getStatusBadgeClass(st: string) {
    switch (st) {
      case "Pending": return "badge badge-pending"
      case "Confirmed": return "badge badge-confirmed"
      case "Received": return "badge badge-received"
      case "Inspecting": return "badge badge-inspecting"
      case "Repairing": return "badge badge-repairing"
      case "Completed": return "badge badge-completed"
      case "Cancelled": return "badge badge-cancelled"
      default: return "badge"
    }
  }

  async function handleConfirm(b: AdminBooking) {
    if (!token) return
    setActionLoading(true)
    setMessage("")
    try {
      await adminConfirmBooking(token, b.id, "Admin xác nhận lịch.")
      await loadData()
      if (selectedBooking && selectedBooking.id === b.id) {
        setSelectedBooking((prev) => prev ? { ...prev, status: "Confirmed" } : null)
      }
      setMessage(`Đã xác nhận lịch hẹn ${b.bookingCode}.`)
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không xác nhận được lịch.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAssign() {
    if (!token || !selectedBooking || !assignTechId) return
    setActionLoading(true)
    setMessage("")
    try {
      await adminAssignTechnician(token, selectedBooking.id, Number(assignTechId), actionNote.trim() || undefined)
      await loadData()
      const tech = technicians.find((t) => t.id === Number(assignTechId))
      setSelectedBooking((prev) => prev ? { ...prev, technicianId: Number(assignTechId), technicianName: tech?.fullName ?? null } : null)
      setActionNote("")
      setMessage(`Đã phân công kỹ thuật viên cho ${selectedBooking.bookingCode}.`)
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không phân công được kỹ thuật viên.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!token || !selectedBooking) return
    setActionLoading(true)
    setMessage("")
    try {
      await adminCancelBooking(token, selectedBooking.id, cancelReason.trim() || "Admin hủy lịch.")
      await loadData()
      setSelectedBooking((prev) => prev ? { ...prev, status: "Cancelled" } : null)
      setShowCancelBox(false)
      setCancelReason("")
      setMessage(`Đã hủy lịch hẹn ${selectedBooking.bookingCode}.`)
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không hủy được lịch.")
    } finally {
      setActionLoading(false)
    }
  }

  // Filter technicians belonging to selected booking's branch
  const availableTechs = selectedBooking
    ? technicians.filter((t) => t.branchId === selectedBooking.branchId && t.isActive)
    : []

  return (
    <main className="page">
      <div style={{ marginBottom: "16px" }}>
        <Link className="text-link" to="/admin">
          ← Quay lại Trung tâm Quản trị
        </Link>
      </div>

      <section className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>Điều phối & Quản lý lịch hẹn</h1>
          <p className="section-intro">Tìm kiếm, lọc trạng thái, xác nhận lịch và phân công kỹ thuật viên theo khu vực phục vụ.</p>
        </div>
      </section>

      {message ? <p className="form-success" style={{ margin: "12px 0" }}>{message}</p> : null}

      {/* SEARCH & FILTERS TOOLBAR */}
      <form className="card form" onSubmit={handleSearchSubmit} style={{ marginTop: "16px", padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "12px", alignItems: "flex-end" }}>
          <label className="field">
            <span>Tìm kiếm tương đối</span>
            <input
              className="input"
              type="search"
              placeholder="Mã, tên khách, SĐT, dịch vụ, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Trạng thái</span>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Khu vực phục vụ</span>
            <select className="input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">Tất cả khu vực phục vụ</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Kỹ thuật viên</span>
            <select className="input" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
              <option value="">Tất cả kỹ thuật viên</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.fullName} ({t.branchName})</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Ngày hẹn</span>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn" type="submit" style={{ flex: 1 }}>
              Tìm kiếm
            </button>
            {(search || status || branchId || technicianId || date) ? (
              <button
                className="btn btn-quiet"
                type="button"
                onClick={() => {
                  setSearch("")
                  setStatus("")
                  setBranchId("")
                  setTechnicianId("")
                  setDate("")
                }}
              >
                Xóa lọc
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {/* BOOKING LIST / TABLE */}
      <section className="card" style={{ marginTop: "20px", padding: isMobile ? "14px" : "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <strong style={{ fontSize: "1.05rem" }}>Danh sách lịch hẹn ({bookings.length})</strong>
            {loading ? <span className="muted" style={{ fontSize: "0.85rem" }}>Đang tải...</span> : null}
          </div>

          {/* VIEW SWITCHER */}
          <div style={{ display: "inline-flex", gap: "4px", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
            <button
              type="button"
              onClick={() => setUserSelectedView("card")}
              style={{
                padding: "5px 12px",
                fontSize: "0.82rem",
                borderRadius: "6px",
                border: "none",
                background: currentView === "card" ? "#ffffff" : "transparent",
                color: currentView === "card" ? "#2563eb" : "#64748b",
                fontWeight: currentView === "card" ? 700 : 500,
                boxShadow: currentView === "card" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
              }}
            >
              <span>🗂️</span>
              <span>Dạng thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setUserSelectedView("table")}
              style={{
                padding: "5px 12px",
                fontSize: "0.82rem",
                borderRadius: "6px",
                border: "none",
                background: currentView === "table" ? "#ffffff" : "transparent",
                color: currentView === "table" ? "#2563eb" : "#64748b",
                fontWeight: currentView === "table" ? 700 : 500,
                boxShadow: currentView === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
              }}
            >
              <span>📊</span>
              <span>Dạng bảng</span>
            </button>
          </div>
        </div>

        {bookings.length === 0 && !loading ? (
          <p className="muted" style={{ padding: "24px 0", textAlign: "center" }}>
            Không tìm thấy lịch hẹn nào phù hợp với bộ lọc.
          </p>
        ) : currentView === "card" ? (
          /* RESPONSIVE BESPOKE CARDS - CLEAN FOR MOBILE & TABLET & DESKTOP */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))",
              gap: "16px",
            }}
          >
            {bookings.map((b) => (
              <div
                key={b.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* HEADER: Booking Code + Status Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-accent-strong)" }}>
                    {b.bookingCode}
                  </span>
                  <span className={getStatusBadgeClass(b.status)} style={{ whiteSpace: "nowrap" }}>
                    {statusLabel[b.status] ?? b.status}
                  </span>
                </div>

                {/* SERVICE & APPOINTMENT TIME */}
                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "10px 12px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    🛠️ {b.primaryServiceName || "Sửa chữa tại nhà"}
                  </div>
                  {b.serviceCategoryName && (
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "6px" }}>
                      Nhóm dịch vụ: <strong>{b.serviceCategoryName}</strong>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#334155" }}>
                    <span>🗓️</span>
                    <span>{b.appointmentDate} • <strong>{b.slotStart} – {b.slotEnd}</strong></span>
                  </div>
                </div>

                {/* CUSTOMER INFO & ADDRESS */}
                <div style={{ fontSize: "0.84rem", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>👤 {b.customerName}</span>
                    <span style={{ color: "#64748b" }}>({b.customerPhone || b.customerEmail})</span>
                  </div>
                  {b.fullAddress && (
                    <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.4 }}>
                      📍 {b.fullAddress}
                    </div>
                  )}
                  <div style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 500 }}>
                    🏢 {b.serviceAreaName || b.branchName || "Khu vực chung"}
                  </div>
                </div>

                {/* TECHNICIAN & ESTIMATED TOTAL */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px dashed #e2e8f0" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Kỹ thuật viên:</span>
                    {b.technicianName ? (
                      <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>👨‍🔧 {b.technicianName}</strong>
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "#f59e0b", fontWeight: 600 }}>Chưa phân công</span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Tạm tính:</span>
                    <strong style={{ fontSize: "1.05rem", color: "#16a34a" }}>
                      {new Intl.NumberFormat("vi-VN").format(b.estimatedTotal)} đ
                    </strong>
                  </div>
                </div>

                {/* ACTION BUTTONS (CLEAN FULL HORIZONTAL BUTTONS) */}
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  {b.status === "Pending" ? (
                    <button
                      className="btn"
                      type="button"
                      style={{
                        flex: 1,
                        height: "38px",
                        padding: "0 14px",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      disabled={actionLoading}
                      onClick={() => void handleConfirm(b)}
                    >
                      ✓ Xác nhận
                    </button>
                  ) : null}
                  <button
                    className="btn btn-quiet"
                    type="button"
                    style={{
                      flex: 1,
                      height: "38px",
                      padding: "0 14px",
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => {
                      setSelectedBooking(b)
                      setAssignTechId(b.technicianId ? String(b.technicianId) : "")
                      setShowCancelBox(false)
                    }}
                  >
                    Điều phối thợ →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* DESKTOP TABLE - WITH MIN-WIDTH & WHITE-SPACE NOWRAP SAFEGUARDS */
          <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch", borderRadius: "10px", border: "1px solid var(--color-line)" }}>
            <table style={{ width: "100%", minWidth: "1320px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-line)", color: "var(--color-muted)", background: "#f8fafc" }}>
                  <th style={{ padding: "12px 14px", width: "130px", minWidth: "130px", whiteSpace: "nowrap" }}>Mã lịch</th>
                  <th style={{ padding: "12px 14px", minWidth: "220px" }}>Khách hàng</th>
                  <th style={{ padding: "12px 14px", minWidth: "180px" }}>Dịch vụ sửa chữa</th>
                  <th style={{ padding: "12px 14px", minWidth: "150px" }}>Khu vực phục vụ</th>
                  <th style={{ padding: "12px 14px", width: "150px", minWidth: "150px", whiteSpace: "nowrap" }}>Thời gian hẹn</th>
                  <th style={{ padding: "12px 14px", width: "190px", minWidth: "190px", whiteSpace: "nowrap" }}>Kỹ thuật viên</th>
                  <th style={{ padding: "12px 14px", width: "110px", minWidth: "110px", whiteSpace: "nowrap" }}>Tạm tính</th>
                  <th style={{ padding: "12px 14px", width: "130px", minWidth: "130px", whiteSpace: "nowrap" }}>Trạng thái</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", width: "230px", minWidth: "230px", whiteSpace: "nowrap" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                    <td style={{ padding: "14px", fontWeight: 700, color: "var(--color-accent-strong)", whiteSpace: "nowrap" }}>
                      {b.bookingCode}
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{b.customerName}</div>
                      <div className="muted" style={{ fontSize: "0.82rem" }}>{b.customerPhone || b.customerEmail}</div>
                      {b.fullAddress && <div className="muted" style={{ fontSize: "0.78rem", maxWidth: "260px", marginTop: "2px" }}>📍 {b.fullAddress}</div>}
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontWeight: 600 }}>{b.primaryServiceName || "Sửa chữa tại nhà"}</div>
                      {b.serviceCategoryName && <div className="muted" style={{ fontSize: "0.8rem" }}>{b.serviceCategoryName}</div>}
                    </td>
                    <td style={{ padding: "14px" }}>
                      {b.serviceAreaName || b.branchName}
                    </td>
                    <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600 }}>{b.appointmentDate}</div>
                      <div className="muted" style={{ fontSize: "0.82rem" }}>{b.slotStart} – {b.slotEnd}</div>
                    </td>
                    <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                      {b.technicianName ? (
                        <div style={{ fontWeight: 600, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <span>👨‍🔧</span>
                          <span>{b.technicianName}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#d97706", fontSize: "0.85rem", fontWeight: 500 }}>Chưa gán</span>
                      )}
                    </td>
                    <td style={{ padding: "14px", fontWeight: 700, whiteSpace: "nowrap", color: "#16a34a" }}>
                      {new Intl.NumberFormat("vi-VN").format(b.estimatedTotal)} đ
                    </td>
                    <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                      <span className={getStatusBadgeClass(b.status)}>
                        {statusLabel[b.status] ?? b.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", gap: "8px", justifyContent: "flex-end", alignItems: "center", flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                        {b.status === "Pending" ? (
                          <button
                            className="btn"
                            type="button"
                            style={{
                              minWidth: "92px",
                              height: "34px",
                              minHeight: "34px",
                              padding: "0 12px",
                              fontSize: "0.82rem",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            disabled={actionLoading}
                            onClick={() => void handleConfirm(b)}
                          >
                            ✓ Xác nhận
                          </button>
                        ) : null}
                        <button
                          className="btn btn-quiet"
                          type="button"
                          style={{
                            minWidth: "105px",
                            height: "34px",
                            minHeight: "34px",
                            padding: "0 12px",
                            fontSize: "0.82rem",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onClick={() => {
                            setSelectedBooking(b)
                            setAssignTechId(b.technicianId ? String(b.technicianId) : "")
                            setShowCancelBox(false)
                          }}
                        >
                          Điều phối →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DISPATCHING & DETAIL MODAL */}
      {selectedBooking ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedBooking(null)
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "780px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span className="eyebrow">Chi tiết & Điều phối</span>
                <h2 style={{ margin: "2px 0 0" }}>{selectedBooking.bookingCode}</h2>
              </div>
              <button
                className="btn btn-quiet"
                type="button"
                onClick={() => setSelectedBooking(null)}
                style={{ padding: "4px 10px" }}
              >
                ✕ Đóng
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "16px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid var(--color-line)" }}>
              <div>
                <strong>👤 Thông tin khách hàng</strong>
                <p style={{ margin: "4px 0" }}>{selectedBooking.customerName}</p>
                <p style={{ margin: "2px 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>
                  SĐT: {selectedBooking.customerPhone || "Chưa có"} · Email: {selectedBooking.customerEmail}
                </p>
              </div>
              <div>
                <strong>🏠 Địa chỉ & Dịch vụ sửa chữa</strong>
                <p style={{ margin: "4px 0" }}>{selectedBooking.serviceCategoryName ? `${selectedBooking.serviceCategoryName} • ` : ""}{selectedBooking.primaryServiceName || "Sửa chữa tại nhà"}</p>
                <p style={{ margin: "2px 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>
                  📍 {selectedBooking.fullAddress || selectedBooking.serviceAreaName || selectedBooking.branchName} · ⏰ {selectedBooking.appointmentDate} ({selectedBooking.slotStart} – {selectedBooking.slotEnd})
                </p>
              </div>
            </div>

            {/* Services List */}
            <div style={{ margin: "16px 0" }}>
              <strong>Dịch vụ đã chọn:</strong>
              <ul className="plain-list" style={{ marginTop: "8px" }}>
                {selectedBooking.services.map((s) => (
                  <li key={s.repairServiceId} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>{s.serviceName} ({s.pricingType === "FixedPrice" ? "Cố định" : "Cần kiểm tra"})</span>
                    <strong>{formatPrice(s.pricingType, s.unitPrice)}</strong>
                  </li>
                ))}
              </ul>
              <div style={{ borderTop: "1px solid var(--color-line)", paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
                <span>Tổng tạm tính:</span>
                <strong style={{ color: "var(--color-accent-strong)" }}>
                  {new Intl.NumberFormat("vi-VN").format(selectedBooking.estimatedTotal)} đ
                </strong>
              </div>
            </div>

            {selectedBooking.problemDescription ? (
              <div style={{ margin: "12px 0", background: "#fff", padding: "12px", borderRadius: "10px", border: "1px solid var(--color-line)" }}>
                <strong>Mô tả lỗi của khách:</strong>
                <p style={{ margin: "4px 0 0", color: "var(--color-ink)" }}>{selectedBooking.problemDescription}</p>
              </div>
            ) : null}

            {/* DISPATCHING SECTION: ASSIGN TECHNICIAN */}
            {selectedBooking.status !== "Completed" && selectedBooking.status !== "Cancelled" ? (
              <div style={{ background: "#f0fdf9", border: "1px solid #a7f3d0", padding: "16px", borderRadius: "12px", margin: "16px 0" }}>
                <strong style={{ color: "var(--color-accent-strong)" }}>👨‍🔧 Phân công kỹ thuật viên (Chi nhánh: {selectedBooking.branchName})</strong>
                <p style={{ margin: "4px 0 12px", fontSize: "0.85rem", color: "var(--color-muted)" }}>
                  Chỉ được phân công các kỹ thuật viên thuộc chi nhánh này theo quy định hệ thống.
                </p>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                  <label className="field" style={{ flex: 1, minWidth: "220px", margin: 0 }}>
                    <span>Chọn kỹ thuật viên:</span>
                    <select
                      className="input"
                      value={assignTechId}
                      onChange={(e) => setAssignTechId(e.target.value)}
                    >
                      <option value="">-- Chưa chọn kỹ thuật viên --</option>
                      {availableTechs.map((t) => (
                        <option key={t.id} value={t.id}>{t.fullName}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field" style={{ flex: 1, minWidth: "200px", margin: 0 }}>
                    <span>Ghi chú phân công (tùy chọn):</span>
                    <input
                      className="input"
                      placeholder="Ghi chú điều phối..."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                    />
                  </label>
                  <button
                    className="btn"
                    type="button"
                    disabled={actionLoading || !assignTechId || assignTechId === String(selectedBooking.technicianId)}
                    onClick={() => void handleAssign()}
                  >
                    {selectedBooking.technicianId ? "Đổi phân công" : "Lưu phân công"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* CONFIRM OR CANCEL ACTIONS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginTop: "20px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {selectedBooking.status === "Pending" ? (
                  <button
                    className="btn"
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleConfirm(selectedBooking)}
                  >
                    Xác nhận lịch hẹn (Pending → Confirmed)
                  </button>
                ) : null}

                {selectedBooking.status !== "Completed" && selectedBooking.status !== "Cancelled" && !showCancelBox ? (
                  <button
                    className="btn btn-quiet"
                    type="button"
                    style={{ color: "var(--color-danger)", borderColor: "#fca5a5" }}
                    onClick={() => setShowCancelBox(true)}
                  >
                    Hủy lịch hẹn này
                  </button>
                ) : null}
              </div>

              <span className={getStatusBadgeClass(selectedBooking.status)}>
                Trạng thái: {statusLabel[selectedBooking.status] ?? selectedBooking.status}
              </span>
            </div>

            {/* Cancel input box */}
            {showCancelBox ? (
              <div style={{ background: "#fff1f2", padding: "14px", borderRadius: "10px", marginTop: "16px", border: "1px solid #fecdd3" }}>
                <strong style={{ color: "var(--color-danger)" }}>Lý do hủy lịch:</strong>
                <input
                  className="input"
                  style={{ margin: "8px 0" }}
                  placeholder="Nhập lý do hủy..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn"
                    style={{ background: "var(--color-danger)" }}
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleCancel()}
                  >
                    Xác nhận hủy
                  </button>
                  <button
                    className="btn btn-quiet"
                    type="button"
                    onClick={() => setShowCancelBox(false)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}

            {/* Timeline history */}
            <div style={{ marginTop: "20px", borderTop: "1px solid var(--color-line)", paddingTop: "16px" }}>
              <strong>Lịch sử trạng thái & điều phối:</strong>
              <div className="history-feed" style={{ marginTop: "10px" }}>
                {selectedBooking.timeline.map((item, idx) => (
                  <div key={idx} className="history-item">
                    <div className="history-dot" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600 }}>{statusLabel[item.toStatus] ?? item.toStatus}</span>
                        <span className="muted" style={{ fontSize: "0.8rem" }}>
                          {formatDateTimeVi(item.changedAt)}
                        </span>
                      </div>
                      {item.note ? <p style={{ margin: "2px 0 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>{item.note}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
