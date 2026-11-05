import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  adminGetCustomerDetail,
  adminGetCustomers,
  adminToggleCustomerStatus,
  adminGetAdmins,
  adminCreateAdmin,
  adminToggleAdminStatus,
  type CustomerDetail,
  type CustomerSummary,
  type AdminSummary,
} from "../api/adminBookings"
import {
  adminBranches,
  adminTechnicians,
  createTechnician,
  updateTechnician,
  saveSchedule,
  dayLabel,
  dayOrder,
  type Branch,
  type ScheduleDay,
  type Technician,
} from "../api/branches"
import { statusLabel } from "../api/bookings"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthContext"
import { useIsMobile } from "../utils/useMediaQuery"

type AccountTab = "customers" | "technicians" | "admins"

export function AdminCustomersPage() {
  const isMobile = useIsMobile(960)
  const { token, user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<AccountTab>("customers")

  // Data states
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [admins, setAdmins] = useState<AdminSummary[]>([])
  const [branches, setBranches] = useState<Branch[]>([])

  // Search & Loading states
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Modal states: Customer history
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Modal states: Technician
  const [showAddTechModal, setShowAddTechModal] = useState(false)
  const [selectedTechForEdit, setSelectedTechForEdit] = useState<Technician | null>(null)
  const [selectedTechForSchedule, setSelectedTechForSchedule] = useState<Technician | null>(null)
  const [techScheduleDraft, setTechScheduleDraft] = useState<ScheduleDay[]>([])

  // Modal states: Admin
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)

  // Form states: New Technician
  const [newTechName, setNewTechName] = useState("")
  const [newTechEmail, setNewTechEmail] = useState("")
  const [newTechPhone, setNewTechPhone] = useState("")
  const [newTechPassword, setNewTechPassword] = useState("")
  const [newTechBranchId, setNewTechBranchId] = useState("")

  // Form states: Edit Technician
  const [editTechName, setEditTechName] = useState("")
  const [editTechPhone, setEditTechPhone] = useState("")
  const [editTechBranchId, setEditTechBranchId] = useState("")

  // Form states: New Admin
  const [newAdminName, setNewAdminName] = useState("")
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminPhone, setNewAdminPhone] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")

  const [formSubmitting, setFormSubmitting] = useState(false)

  // Load all accounts
  async function loadData() {
    if (!token) return
    setLoading(true)
    setMessage("")
    try {
      if (activeTab === "customers") {
        const data = await adminGetCustomers(token, search)
        setCustomers(data)
      } else if (activeTab === "technicians") {
        const [techRows, branchRows] = await Promise.all([
          adminTechnicians(token),
          adminBranches(token),
        ])
        setBranches(branchRows)
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          setTechnicians(
            techRows.filter(
              (t) =>
                t.fullName.toLowerCase().includes(q) ||
                t.email.toLowerCase().includes(q) ||
                (t.phoneNumber && t.phoneNumber.includes(q)) ||
                (t.branchName && t.branchName.toLowerCase().includes(q))
            )
          )
        } else {
          setTechnicians(techRows)
        }
      } else if (activeTab === "admins") {
        const data = await adminGetAdmins(token, search)
        setAdmins(data)
      }
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không tải được danh sách tài khoản.")
    } finally {
      setLoading(false)
    }
  }

  // Pre-load branches for technician dropdowns
  useEffect(() => {
    if (token) {
      adminBranches(token)
        .then(setBranches)
        .catch(() => {})
    }
  }, [token])

  useEffect(() => {
    void loadData()
  }, [token, activeTab])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    void loadData()
  }

  // CUSTOMER ACTIONS
  async function handleToggleCustomerStatus(c: CustomerSummary) {
    if (!token) return
    try {
      await adminToggleCustomerStatus(token, c.id)
      setMessage(`Đã ${c.isActive ? "vô hiệu hóa" : "kích hoạt"} tài khoản khách hàng ${c.fullName}.`)
      await loadData()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không đổi được trạng thái tài khoản.")
    }
  }

  async function handleViewHistory(c: CustomerSummary) {
    if (!token) return
    setHistoryLoading(true)
    try {
      const detail = await adminGetCustomerDetail(token, c.id)
      setSelectedCustomer(detail)
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không tải được lịch sử khách hàng.")
    } finally {
      setHistoryLoading(false)
    }
  }

  // TECHNICIAN ACTIONS
  async function handleToggleTechStatus(t: Technician) {
    if (!token) return
    try {
      await updateTechnician(token, t.id, {
        fullName: t.fullName,
        phoneNumber: t.phoneNumber ?? "",
        branchId: t.branchId,
        isActive: !t.isActive,
      })
      setMessage(`Đã ${t.isActive ? "vô hiệu hóa" : "kích hoạt"} tài khoản kỹ thuật viên ${t.fullName}.`)
      await loadData()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không cập nhật được trạng thái KTV.")
    }
  }

  async function handleCreateTechnician(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setFormSubmitting(true)
    try {
      await createTechnician(token, {
        fullName: newTechName,
        email: newTechEmail,
        phoneNumber: newTechPhone,
        password: newTechPassword,
        branchId: Number(newTechBranchId),
        isActive: true,
      })
      setMessage(`Đã tạo tài khoản kỹ thuật viên thành công: ${newTechName}.`)
      setShowAddTechModal(false)
      setNewTechName("")
      setNewTechEmail("")
      setNewTechPhone("")
      setNewTechPassword("")
      setNewTechBranchId("")
      await loadData()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không tạo được kỹ thuật viên.")
    } finally {
      setFormSubmitting(false)
    }
  }

  function handleOpenEditTech(t: Technician) {
    setSelectedTechForEdit(t)
    setEditTechName(t.fullName)
    setEditTechPhone(t.phoneNumber ?? "")
    setEditTechBranchId(String(t.branchId))
  }

  async function handleSaveEditTech(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !selectedTechForEdit) return
    setFormSubmitting(true)
    try {
      await updateTechnician(token, selectedTechForEdit.id, {
        fullName: editTechName,
        phoneNumber: editTechPhone,
        branchId: Number(editTechBranchId),
        isActive: selectedTechForEdit.isActive,
      })
      setMessage(`Đã cập nhật thông tin kỹ thuật viên ${editTechName}.`)
      setSelectedTechForEdit(null)
      await loadData()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không cập nhật được thông tin KTV.")
    } finally {
      setFormSubmitting(false)
    }
  }

  function handleOpenScheduleModal(t: Technician) {
    setSelectedTechForSchedule(t)
    // Deep clone schedules or initialize all 7 days
    const existingMap = new Map(t.schedules.map((s) => [s.dayOfWeek, s]))
    const initialList: ScheduleDay[] = dayOrder.map((day) => {
      const match = existingMap.get(day)
      return (
        match ?? {
          dayOfWeek: day,
          isWorking: day !== "Sunday",
          startTime: "08:00",
          endTime: "17:00",
        }
      )
    })
    setTechScheduleDraft(initialList)
  }

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !selectedTechForSchedule) return
    setFormSubmitting(true)
    try {
      await saveSchedule(token, selectedTechForSchedule.id, techScheduleDraft)
      setMessage(`Đã cập nhật lịch làm việc cho kỹ thuật viên ${selectedTechForSchedule.fullName}.`)
      setSelectedTechForSchedule(null)
      await loadData()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không lưu được lịch làm việc.")
    } finally {
      setFormSubmitting(false)
    }
  }

  // ADMIN ACTIONS
  async function handleToggleAdminStatus(a: AdminSummary) {
    if (!token) return
    try {
      await adminToggleAdminStatus(token, a.id)
      setMessage(`Đã ${a.isActive ? "vô hiệu hóa" : "kích hoạt"} tài khoản quản trị viên ${a.fullName}.`)
      await loadData()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không cập nhật được trạng thái quản trị viên.")
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setFormSubmitting(true)
    try {
      await adminCreateAdmin(token, {
        fullName: newAdminName,
        email: newAdminEmail,
        phoneNumber: newAdminPhone,
        password: newAdminPassword,
      })
      setMessage(`Đã tạo tài khoản quản trị viên mới: ${newAdminName}.`)
      setShowAddAdminModal(false)
      setNewAdminName("")
      setNewAdminEmail("")
      setNewAdminPhone("")
      setNewAdminPassword("")
      await loadData()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không tạo được tài khoản quản trị viên.")
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <main className="page">
      <div style={{ marginBottom: "16px" }}>
        <Link className="text-link" to="/admin">
          ← Quay lại Trung tâm Quản trị
        </Link>
      </div>

      {/* HEADER SECTION */}
      <section className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1>Quản lý tài khoản</h1>
          <p className="section-intro">
            Quản trị tập trung toàn bộ tài khoản người dùng: Khách hàng, Kỹ thuật viên khu vực phục vụ và Quản trị viên hệ thống.
          </p>
        </div>
      </section>

      {message ? (
        <div className="p-3.5 mb-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium flex items-center justify-between">
          <span>{message}</span>
          <button type="button" className="text-blue-500 hover:text-blue-800 text-xs font-bold" onClick={() => setMessage("")}>
            ✕ Đóng
          </button>
        </div>
      ) : null}

      {/* UNIFIED ROLE TAB SWITCHER */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 mt-4 overflow-x-auto">
        <button
          type="button"
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "customers"
              ? "bg-white text-blue-600 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
          onClick={() => {
            setActiveTab("customers")
            setSearch("")
          }}
        >
          <span>👤 Khách hàng</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "customers" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"}`}>
            {customers.length}
          </span>
        </button>

        <button
          type="button"
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "technicians"
              ? "bg-white text-blue-600 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
          onClick={() => {
            setActiveTab("technicians")
            setSearch("")
          }}
        >
          <span>🔧 Kỹ thuật viên</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "technicians" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"}`}>
            {technicians.length}
          </span>
        </button>

        <button
          type="button"
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "admins"
              ? "bg-white text-blue-600 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
          onClick={() => {
            setActiveTab("admins")
            setSearch("")
          }}
        >
          <span>🛡️ Quản trị viên</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "admins" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"}`}>
            {admins.length}
          </span>
        </button>
      </div>

      {/* UNIFIED SEARCH & ACTION TOOLBAR */}
      <form className="card form mt-4 p-4 sm:p-5" onSubmit={handleSearchSubmit}>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end justify-between">
          <label className="field flex-1 m-0">
            <span>
              Tìm kiếm {activeTab === "customers" ? "khách hàng" : activeTab === "technicians" ? "kỹ thuật viên" : "quản trị viên"}
            </span>
            <input
              className="input w-full"
              type="search"
              placeholder={
                activeTab === "technicians"
                  ? "Nhập tên KTV, email, số điện thoại hoặc chi nhánh..."
                  : "Nhập họ tên, địa chỉ email hoặc số điện thoại..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button className="btn flex-1 sm:flex-initial" type="submit">
              🔍 Tìm kiếm
            </button>
            {search ? (
              <button
                className="btn btn-quiet flex-1 sm:flex-initial"
                type="button"
                onClick={() => {
                  setSearch("")
                  void loadData()
                }}
              >
                Xem tất cả
              </button>
            ) : null}

            {/* ADD ACTION BUTTONS PER ROLE */}
            {activeTab === "technicians" ? (
              <button
                className="btn flex-1 sm:flex-initial"
                type="button"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderColor: "transparent" }}
                onClick={() => setShowAddTechModal(true)}
              >
                + Thêm kỹ thuật viên
              </button>
            ) : null}

            {activeTab === "admins" ? (
              <button
                className="btn flex-1 sm:flex-initial"
                type="button"
                style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", borderColor: "transparent" }}
                onClick={() => setShowAddAdminModal(true)}
              >
                + Thêm quản trị viên
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {/* ============================================================== */}
      {/* TAB 1: KHÁCH HÀNG (CUSTOMERS)                                  */}
      {/* ============================================================== */}
      {activeTab === "customers" ? (
        <section className="card mt-5 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <strong>Danh sách khách hàng ({customers.length})</strong>
            {loading ? <span className="muted text-sm">Đang tải dữ liệu...</span> : null}
          </div>

          {customers.length === 0 && !loading ? (
            <p className="muted py-8 text-center">Không tìm thấy khách hàng nào phù hợp.</p>
          ) : isMobile ? (
            /* MOBILE BESPOKE CARD LIST */
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {customers.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                    boxShadow: "0 1px 4px rgba(15,23,42,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>{c.fullName}</div>
                      <div style={{ fontSize: "0.76rem", color: "var(--color-muted)", marginTop: "2px" }}>
                        Ngày tạo: {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    <span className={c.isActive ? "badge badge-completed" : "badge badge-cancelled"} style={{ whiteSpace: "nowrap" }}>
                      {c.isActive ? "Hoạt động" : "Đã khóa"}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "#475569", background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div>✉ <span style={{ fontWeight: 600 }}>{c.email}</span></div>
                    <div>📞 <span>{c.phoneNumber || "Chưa cập nhật SĐT"}</span></div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", textAlign: "center" }}>
                    <div style={{ padding: "8px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #dbeafe" }}>
                      <div style={{ fontSize: "0.72rem", color: "#1e40af", fontWeight: 600 }}>Tổng lịch đặt</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e3a8a" }}>{c.totalBookings}</div>
                    </div>
                    <div style={{ padding: "8px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: 600 }}>Đã hoàn thành</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#166534" }}>{c.completedBookings}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                    <button
                      className="btn btn-quiet"
                      type="button"
                      style={{ flex: 1, padding: "8px 12px", fontSize: "0.82rem", whiteSpace: "nowrap", textAlign: "center" }}
                      disabled={historyLoading}
                      onClick={() => void handleViewHistory(c)}
                    >
                      Lịch sử ({c.totalBookings})
                    </button>
                    <button
                      className="btn btn-quiet"
                      type="button"
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        fontSize: "0.82rem",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        color: c.isActive ? "var(--color-danger)" : "var(--color-ok)",
                        borderColor: c.isActive ? "#fecaca" : "#bbf7d0",
                        background: c.isActive ? "#fef2f2" : "#f0fdf4",
                      }}
                      onClick={() => void handleToggleCustomerStatus(c)}
                    >
                      {c.isActive ? "Khóa" : "Mở khóa"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* DESKTOP TABLE */
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table style={{ width: "100%", minWidth: "960px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-line)", color: "var(--color-muted)" }}>
                    <th style={{ padding: "12px 10px", minWidth: "160px" }}>Họ tên</th>
                    <th style={{ padding: "12px 10px", minWidth: "180px" }}>Email</th>
                    <th style={{ padding: "12px 10px", minWidth: "130px", whiteSpace: "nowrap" }}>Số điện thoại</th>
                    <th style={{ padding: "12px 10px", minWidth: "110px", whiteSpace: "nowrap" }}>Ngày tạo</th>
                    <th style={{ padding: "12px 10px", minWidth: "110px", whiteSpace: "nowrap" }}>Tổng lịch đặt</th>
                    <th style={{ padding: "12px 10px", minWidth: "110px", whiteSpace: "nowrap" }}>Hoàn thành</th>
                    <th style={{ padding: "12px 10px", minWidth: "110px", whiteSpace: "nowrap" }}>Trạng thái</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", minWidth: "170px", whiteSpace: "nowrap" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: "#0f172a" }}>{c.fullName}</td>
                      <td style={{ padding: "12px 10px" }}>{c.email}</td>
                      <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>{c.phoneNumber || "—"}</td>
                      <td style={{ padding: "12px 10px", color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                        {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>{c.totalBookings}</td>
                      <td style={{ padding: "12px 10px", color: "var(--color-ok)", fontWeight: 700, whiteSpace: "nowrap" }}>{c.completedBookings}</td>
                      <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                        <span className={c.isActive ? "badge badge-completed" : "badge badge-cancelled"}>
                          {c.isActive ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end", flexWrap: "nowrap" }}>
                          <button
                            className="btn btn-quiet"
                            type="button"
                            style={{ padding: "6px 12px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                            disabled={historyLoading}
                            onClick={() => void handleViewHistory(c)}
                          >
                            Lịch sử ({c.totalBookings})
                          </button>
                          <button
                            className="btn btn-quiet"
                            type="button"
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.8rem",
                              whiteSpace: "nowrap",
                              color: c.isActive ? "var(--color-danger)" : "var(--color-ok)",
                            }}
                            onClick={() => void handleToggleCustomerStatus(c)}
                          >
                            {c.isActive ? "Khóa" : "Mở khóa"}
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
      ) : null}

      {/* ============================================================== */}
      {/* TAB 2: KỸ THUẬT VIÊN (TECHNICIANS)                             */}
      {/* ============================================================== */}
      {activeTab === "technicians" ? (
        <section className="card mt-5 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <strong>Đội ngũ kỹ thuật viên ({technicians.length})</strong>
            {loading ? <span className="muted text-sm">Đang tải dữ liệu...</span> : null}
          </div>

          {technicians.length === 0 && !loading ? (
            <p className="muted py-8 text-center">Chưa có kỹ thuật viên nào trong danh sách.</p>
          ) : isMobile ? (
            /* MOBILE BESPOKE CARD LIST */
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {technicians.map((t) => {
                const workingDaysCount = t.schedules?.filter((s) => s.isWorking).length ?? 0
                return (
                  <div
                    key={t.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "16px",
                      boxShadow: "0 1px 4px rgba(15,23,42,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>🔧</span>
                          <strong style={{ fontSize: "1rem", color: "#0f172a" }}>{t.fullName}</strong>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#2563eb", marginTop: "2px", fontWeight: 600 }}>
                          📍 {t.branchName || "Chưa gán khu vực"}
                        </div>
                      </div>
                      <span className={t.isActive ? "badge badge-completed" : "badge badge-cancelled"} style={{ whiteSpace: "nowrap" }}>
                        {t.isActive ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "#475569", background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div>✉ <span style={{ fontWeight: 600 }}>{t.email}</span></div>
                      <div>📞 <span>{t.phoneNumber || "Chưa cập nhật SĐT"}</span></div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", textAlign: "center" }}>
                      <div style={{ padding: "8px", background: "#f1f5f9", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Chi nhánh trực</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>{t.branchName || "—"}</div>
                      </div>
                      <div style={{ padding: "8px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                        <div style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: 600 }}>Lịch làm việc</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534" }}>{workingDaysCount}/7 ngày/tuần</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                      <button
                        className="btn btn-quiet"
                        type="button"
                        style={{ flex: 1, padding: "8px 10px", fontSize: "0.82rem", whiteSpace: "nowrap", textAlign: "center" }}
                        onClick={() => handleOpenScheduleModal(t)}
                      >
                        📅 Lịch trực
                      </button>
                      <button
                        className="btn btn-quiet"
                        type="button"
                        style={{ flex: 1, padding: "8px 10px", fontSize: "0.82rem", whiteSpace: "nowrap", textAlign: "center" }}
                        onClick={() => handleOpenEditTech(t)}
                      >
                        ✏ Sửa
                      </button>
                      <button
                        className="btn btn-quiet"
                        type="button"
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          fontSize: "0.82rem",
                          whiteSpace: "nowrap",
                          textAlign: "center",
                          color: t.isActive ? "var(--color-danger)" : "var(--color-ok)",
                          borderColor: t.isActive ? "#fecaca" : "#bbf7d0",
                          background: t.isActive ? "#fef2f2" : "#f0fdf4",
                        }}
                        onClick={() => void handleToggleTechStatus(t)}
                      >
                        {t.isActive ? "Khóa" : "Mở"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* DESKTOP TABLE */
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table style={{ width: "100%", minWidth: "980px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-line)", color: "var(--color-muted)" }}>
                    <th style={{ padding: "12px 10px", minWidth: "160px" }}>Họ tên KTV</th>
                    <th style={{ padding: "12px 10px", minWidth: "180px" }}>Email</th>
                    <th style={{ padding: "12px 10px", minWidth: "130px", whiteSpace: "nowrap" }}>Số điện thoại</th>
                    <th style={{ padding: "12px 10px", minWidth: "150px" }}>Chi nhánh làm việc</th>
                    <th style={{ padding: "12px 10px", minWidth: "150px", whiteSpace: "nowrap" }}>Lịch làm việc tuần</th>
                    <th style={{ padding: "12px 10px", minWidth: "110px", whiteSpace: "nowrap" }}>Trạng thái</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", minWidth: "220px", whiteSpace: "nowrap" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((t) => {
                    const workingDaysCount = t.schedules?.filter((s) => s.isWorking).length ?? 0
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                        <td style={{ padding: "12px 10px", fontWeight: 700, color: "#0f172a" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>🔧</span>
                            <span>{t.fullName}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 10px" }}>{t.email}</td>
                        <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>{t.phoneNumber || "—"}</td>
                        <td style={{ padding: "12px 10px" }}>
                          <span className="badge badge-fixed font-semibold">📍 {t.branchName || "Chưa gán"}</span>
                        </td>
                        <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: "0.78rem", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                            {workingDaysCount}/7 ngày làm việc
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                          <span className={t.isActive ? "badge badge-completed" : "badge badge-cancelled"}>
                            {t.isActive ? "Hoạt động" : "Đã khóa"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end", flexWrap: "nowrap" }}>
                            <button
                              className="btn btn-quiet"
                              type="button"
                              style={{ padding: "6px 10px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                              onClick={() => handleOpenScheduleModal(t)}
                              title="Cấu hình ca làm việc theo tuần"
                            >
                              📅 Lịch trực
                            </button>
                            <button
                              className="btn btn-quiet"
                              type="button"
                              style={{ padding: "6px 10px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                              onClick={() => handleOpenEditTech(t)}
                              title="Chỉnh sửa thông tin KTV"
                            >
                              ✏ Sửa
                            </button>
                            <button
                              className="btn btn-quiet"
                              type="button"
                              style={{
                                padding: "6px 10px",
                                fontSize: "0.8rem",
                                whiteSpace: "nowrap",
                                color: t.isActive ? "var(--color-danger)" : "var(--color-ok)",
                              }}
                              onClick={() => void handleToggleTechStatus(t)}
                            >
                              {t.isActive ? "Khóa" : "Mở khóa"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {/* ============================================================== */}
      {/* TAB 3: QUẢN TRỊ VIÊN (ADMINS)                                   */}
      {/* ============================================================== */}
      {activeTab === "admins" ? (
        <section className="card mt-5 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <strong>Đội ngũ quản trị viên ({admins.length})</strong>
            {loading ? <span className="muted text-sm">Đang tải dữ liệu...</span> : null}
          </div>

          {admins.length === 0 && !loading ? (
            <p className="muted py-8 text-center">Không tìm thấy tài khoản quản trị viên nào.</p>
          ) : isMobile ? (
            /* MOBILE BESPOKE CARD LIST */
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {admins.map((a) => {
                const isSelf = currentUser?.email === a.email
                return (
                  <div
                    key={a.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "16px",
                      boxShadow: "0 1px 4px rgba(15,23,42,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>🛡️</span>
                          <strong style={{ fontSize: "1rem", color: "#0f172a" }}>{a.fullName}</strong>
                          {isSelf ? (
                            <span style={{ fontSize: "0.68rem", background: "#dbeafe", color: "#1d4ed8", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                              Bạn
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--color-muted)", marginTop: "2px" }}>
                          Ngày tạo: {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                      <span className={a.isActive ? "badge badge-completed" : "badge badge-cancelled"} style={{ whiteSpace: "nowrap" }}>
                        {a.isActive ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "#475569", background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div>✉ <span style={{ fontWeight: 600 }}>{a.email}</span></div>
                      <div>📞 <span>{a.phoneNumber || "Chưa cập nhật SĐT"}</span></div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", textAlign: "center" }}>
                      <div style={{ padding: "8px", background: "#faf5ff", borderRadius: "8px", border: "1px solid #f3e8ff" }}>
                        <div style={{ fontSize: "0.72rem", color: "#7e22ce", fontWeight: 600 }}>Vai trò</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#581c87" }}>Quản trị viên</div>
                      </div>
                      <div style={{ padding: "8px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #dbeafe" }}>
                        <div style={{ fontSize: "0.72rem", color: "#1d4ed8", fontWeight: 600 }}>Quyền hạn</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e3a8a" }}>Toàn quyền hệ thống</div>
                      </div>
                    </div>

                    <div style={{ paddingTop: "4px" }}>
                      <button
                        className="btn btn-quiet"
                        type="button"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          fontSize: "0.82rem",
                          whiteSpace: "nowrap",
                          textAlign: "center",
                          color: a.isActive ? "var(--color-danger)" : "var(--color-ok)",
                          borderColor: a.isActive ? "#fecaca" : "#bbf7d0",
                          background: a.isActive ? "#fef2f2" : "#f0fdf4",
                          opacity: isSelf ? 0.6 : 1,
                        }}
                        disabled={isSelf}
                        onClick={() => void handleToggleAdminStatus(a)}
                      >
                        {isSelf ? "Tài khoản hiện tại (Không thể khóa)" : a.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* DESKTOP TABLE */
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table style={{ width: "100%", minWidth: "980px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-line)", color: "var(--color-muted)" }}>
                    <th style={{ padding: "12px 10px", minWidth: "180px" }}>Họ tên Quản trị viên</th>
                    <th style={{ padding: "12px 10px", minWidth: "180px" }}>Email</th>
                    <th style={{ padding: "12px 10px", minWidth: "130px", whiteSpace: "nowrap" }}>Số điện thoại</th>
                    <th style={{ padding: "12px 10px", minWidth: "110px", whiteSpace: "nowrap" }}>Ngày tạo</th>
                    <th style={{ padding: "12px 10px", minWidth: "150px", whiteSpace: "nowrap" }}>Quyền hạn</th>
                    <th style={{ padding: "12px 10px", minWidth: "110px", whiteSpace: "nowrap" }}>Trạng thái</th>
                    <th style={{ padding: "12px 10px", textAlign: "right", minWidth: "120px", whiteSpace: "nowrap" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => {
                    const isSelf = currentUser?.email === a.email
                    return (
                      <tr key={a.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                        <td style={{ padding: "12px 10px", fontWeight: 700, color: "#0f172a" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>🛡️</span>
                            <span>{a.fullName}</span>
                            {isSelf ? (
                              <span style={{ fontSize: "0.68rem", background: "#dbeafe", color: "#1d4ed8", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                                Bạn
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td style={{ padding: "12px 10px" }}>{a.email}</td>
                        <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>{a.phoneNumber || "—"}</td>
                        <td style={{ padding: "12px 10px", color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                          {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                          <span className="badge badge-warning font-semibold">Toàn quyền Admin</span>
                        </td>
                        <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                          <span className={a.isActive ? "badge badge-completed" : "badge badge-cancelled"}>
                            {a.isActive ? "Hoạt động" : "Đã khóa"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end", flexWrap: "nowrap" }}>
                            <button
                              className="btn btn-quiet"
                              type="button"
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.8rem",
                                whiteSpace: "nowrap",
                                color: a.isActive ? "var(--color-danger)" : "var(--color-ok)",
                              }}
                              disabled={isSelf}
                              title={isSelf ? "Không thể khóa tài khoản của chính mình" : ""}
                              onClick={() => void handleToggleAdminStatus(a)}
                            >
                              {a.isActive ? "Khóa" : "Mở khóa"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {/* ============================================================== */}
      {/* MODAL 1: CUSTOMER HISTORY MODAL                                */}
      {/* ============================================================== */}
      {selectedCustomer ? (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCustomer(null)
          }}
        >
          <div className="card w-full max-w-2xl max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-2xl shadow-xl bg-white">
            <div className="flex justify-between items-start gap-3 mb-4">
              <div className="min-w-0">
                <span className="eyebrow">Lịch sử khách hàng</span>
                <h2 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900 truncate">{selectedCustomer.fullName}</h2>
                <p className="muted text-xs sm:text-sm mt-1 truncate">
                  {selectedCustomer.email} · {selectedCustomer.phoneNumber || "Không có SĐT"}
                </p>
              </div>
              <button
                className="btn btn-quiet shrink-0"
                type="button"
                onClick={() => setSelectedCustomer(null)}
                style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              >
                ✕ Đóng
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">
              Danh sách lịch hẹn ({selectedCustomer.bookings.length})
            </h3>
            {selectedCustomer.bookings.length === 0 ? (
              <p className="muted text-sm py-4 text-center">Khách hàng chưa tạo lịch hẹn nào.</p>
            ) : (
              <div className="flex flex-col gap-2.5 mt-3">
                {selectedCustomer.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-blue-600 font-bold">{b.bookingCode}</strong>
                        <span className="badge text-[0.72rem] sm:hidden">
                          {statusLabel[b.status] ?? b.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 font-medium">
                        {b.primaryServiceName || "Dịch vụ sửa chữa tại nhà"} {b.serviceCategoryName ? `(${b.serviceCategoryName})` : ""} · 📍 {b.serviceAreaName || b.branchName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Ngày {b.appointmentDate} lúc {b.slotStart} · Tạm tính: {new Intl.NumberFormat("vi-VN").format(b.estimatedTotal)} đ
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                      <span className="badge hidden sm:inline-flex">
                        {statusLabel[b.status] ?? b.status}
                      </span>
                      <Link
                        className="btn btn-quiet py-1.5 px-3 text-xs w-full sm:w-auto text-center"
                        to={`/my-bookings/${b.id}`}
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* MODAL 2: ADD TECHNICIAN MODAL                                  */}
      {/* ============================================================== */}
      {showAddTechModal ? (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !formSubmitting) setShowAddTechModal(false)
          }}
        >
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl shadow-xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="eyebrow">Thêm mới</span>
                <h2 className="text-xl font-bold text-slate-900">Tạo tài khoản Kỹ thuật viên</h2>
              </div>
              <button
                className="btn btn-quiet"
                type="button"
                onClick={() => setShowAddTechModal(false)}
                disabled={formSubmitting}
                style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              >
                ✕
              </button>
            </div>

            <form className="space-y-3.5" onSubmit={handleCreateTechnician}>
              <label className="field">
                <span>Họ và tên KTV *</span>
                <input
                  className="input"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Email đăng nhập *</span>
                <input
                  className="input"
                  type="email"
                  required
                  placeholder="technician@homerepair.vn"
                  value={newTechEmail}
                  onChange={(e) => setNewTechEmail(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Số điện thoại</span>
                <input
                  className="input"
                  type="tel"
                  placeholder="0901234567"
                  value={newTechPhone}
                  onChange={(e) => setNewTechPhone(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Mật khẩu ban đầu *</span>
                <input
                  className="input"
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự, gồm chữ hoa, thường & số"
                  value={newTechPassword}
                  onChange={(e) => setNewTechPassword(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Chi nhánh phân công *</span>
                <select
                  className="input"
                  required
                  value={newTechBranchId}
                  onChange={(e) => setNewTechBranchId(e.target.value)}
                >
                  <option value="">-- Chọn chi nhánh tiếp nhận --</option>
                  {branches
                    .filter((b) => b.isActive)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.address})
                      </option>
                    ))}
                </select>
              </label>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  className="btn btn-quiet flex-1"
                  onClick={() => setShowAddTechModal(false)}
                  disabled={formSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn flex-1"
                  disabled={formSubmitting}
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderColor: "transparent" }}
                >
                  {formSubmitting ? "Đang lưu..." : "Tạo tài khoản KTV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* MODAL 3: EDIT TECHNICIAN MODAL                                 */}
      {/* ============================================================== */}
      {selectedTechForEdit ? (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !formSubmitting) setSelectedTechForEdit(null)
          }}
        >
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl shadow-xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="eyebrow">Chỉnh sửa</span>
                <h2 className="text-xl font-bold text-slate-900">Cập nhật Kỹ thuật viên</h2>
              </div>
              <button
                className="btn btn-quiet"
                type="button"
                onClick={() => setSelectedTechForEdit(null)}
                disabled={formSubmitting}
                style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              >
                ✕
              </button>
            </div>

            <form className="space-y-3.5" onSubmit={handleSaveEditTech}>
              <label className="field">
                <span>Họ và tên KTV *</span>
                <input
                  className="input"
                  required
                  value={editTechName}
                  onChange={(e) => setEditTechName(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Email (Không thể thay đổi)</span>
                <input className="input bg-slate-100 text-slate-500 cursor-not-allowed" disabled value={selectedTechForEdit.email} />
              </label>

              <label className="field">
                <span>Số điện thoại</span>
                <input
                  className="input"
                  type="tel"
                  placeholder="0901234567"
                  value={editTechPhone}
                  onChange={(e) => setEditTechPhone(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Chi nhánh phân công *</span>
                <select
                  className="input"
                  required
                  value={editTechBranchId}
                  onChange={(e) => setEditTechBranchId(e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.isActive ? "" : "(Tạm ngưng)"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  className="btn btn-quiet flex-1"
                  onClick={() => setSelectedTechForEdit(null)}
                  disabled={formSubmitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn flex-1" disabled={formSubmitting}>
                  {formSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* MODAL 4: TECHNICIAN SCHEDULE MODAL                             */}
      {/* ============================================================== */}
      {selectedTechForSchedule ? (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !formSubmitting) setSelectedTechForSchedule(null)
          }}
        >
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl shadow-xl bg-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="eyebrow">Lịch trực tuần</span>
                <h2 className="text-xl font-bold text-slate-900">
                  Lịch làm việc của {selectedTechForSchedule.fullName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chi nhánh: {selectedTechForSchedule.branchName}
                </p>
              </div>
              <button
                className="btn btn-quiet"
                type="button"
                onClick={() => setSelectedTechForSchedule(null)}
                disabled={formSubmitting}
                style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              >
                ✕
              </button>
            </div>

            <form className="space-y-2.5" onSubmit={handleSaveSchedule}>
              <div className="space-y-2">
                {dayOrder.map((day) => {
                  const schedule = techScheduleDraft.find((s) => s.dayOfWeek === day) || {
                    dayOfWeek: day,
                    isWorking: false,
                    startTime: "08:00",
                    endTime: "17:00",
                  }
                  return (
                    <div
                      key={day}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        schedule.isWorking ? "bg-white border-blue-200" : "bg-slate-50 border-slate-200 opacity-75"
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800 text-sm">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={schedule.isWorking}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setTechScheduleDraft((prev) =>
                              prev.map((s) => (s.dayOfWeek === day ? { ...s, isWorking: checked } : s))
                            )
                          }}
                        />
                        <span>{dayLabel[day]}</span>
                      </label>

                      {schedule.isWorking ? (
                        <div className="flex items-center gap-2 text-xs">
                          <input
                            type="time"
                            className="input py-1 px-2 h-8 text-xs font-medium w-24"
                            value={schedule.startTime.slice(0, 5)}
                            onChange={(e) => {
                              const v = e.target.value
                              setTechScheduleDraft((prev) =>
                                prev.map((s) => (s.dayOfWeek === day ? { ...s, startTime: v } : s))
                              )
                            }}
                          />
                          <span className="text-slate-400">đến</span>
                          <input
                            type="time"
                            className="input py-1 px-2 h-8 text-xs font-medium w-24"
                            value={schedule.endTime.slice(0, 5)}
                            onChange={(e) => {
                              const v = e.target.value
                              setTechScheduleDraft((prev) =>
                                prev.map((s) => (s.dayOfWeek === day ? { ...s, endTime: v } : s))
                              )
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Nghỉ</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  className="btn btn-quiet flex-1"
                  onClick={() => setSelectedTechForSchedule(null)}
                  disabled={formSubmitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn flex-1" disabled={formSubmitting}>
                  {formSubmitting ? "Đang lưu..." : "Lưu lịch trực tuần"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* MODAL 5: ADD ADMIN MODAL                                       */}
      {/* ============================================================== */}
      {showAddAdminModal ? (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !formSubmitting) setShowAddAdminModal(false)
          }}
        >
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl shadow-xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="eyebrow">Thêm mới</span>
                <h2 className="text-xl font-bold text-slate-900">Tạo tài khoản Quản trị viên</h2>
              </div>
              <button
                className="btn btn-quiet"
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                disabled={formSubmitting}
                style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              >
                ✕
              </button>
            </div>

            <form className="space-y-3.5" onSubmit={handleCreateAdmin}>
              <label className="field">
                <span>Họ và tên Quản trị viên *</span>
                <input
                  className="input"
                  required
                  placeholder="Ví dụ: Lê Hoàng Long"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Email đăng nhập *</span>
                <input
                  className="input"
                  type="email"
                  required
                  placeholder="admin.hq@homerepair.vn"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Số điện thoại</span>
                <input
                  className="input"
                  type="tel"
                  placeholder="0901234567"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Mật khẩu quản trị *</span>
                <input
                  className="input"
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự, gồm chữ hoa, thường & số"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                />
              </label>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-800">
                ⚠️ Tài khoản Quản trị viên có toàn quyền truy cập: xem báo cáo, phân công lịch hẹn, quản lý danh mục, nhân sự và hệ thống chi nhánh.
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  className="btn btn-quiet flex-1"
                  onClick={() => setShowAddAdminModal(false)}
                  disabled={formSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn flex-1"
                  disabled={formSubmitting}
                  style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", borderColor: "transparent" }}
                >
                  {formSubmitting ? "Đang tạo..." : "Tạo tài khoản Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  )
}
