import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  adminBranches,
  adminTechnicians,
  createTechnician,
  dayLabel,
  dayOrder,
  defaultHours,
  saveBranch,
  saveSchedule,
  updateTechnician,
  type Branch,
  type OpeningHour,
  type Technician,
  type WeekDay,
} from "../api/branches"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthContext"
import { useIsMobile } from "../utils/useMediaQuery"

export function AdminOperationsPage() {
  const isMobile = useIsMobile(960)
  const { token } = useAuth()

  const [branches, setBranches] = useState<Branch[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Feedback alerts
  const [message, setMessage] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Active tab: "branches" | "technicians" | "schedules"
  const [activeTab, setActiveTab] = useState<"branches" | "technicians" | "schedules">("branches")

  // Form states - Branch
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [capacity, setCapacity] = useState("4")

  // Form states - Technician
  const [techName, setTechName] = useState("")
  const [techEmail, setTechEmail] = useState("")
  const [techPhone, setTechPhone] = useState("")
  const [techPassword, setTechPassword] = useState("")
  const [techBranchId, setTechBranchId] = useState("")

  // Schedule management
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null)

  // Search & Filter
  const [branchSearch, setBranchSearch] = useState("")
  const [techSearch, setTechSearch] = useState("")
  const [techBranchFilter, setTechBranchFilter] = useState("")

  async function reload() {
    if (!token) return
    setLoading(true)
    try {
      const [branchRows, techRows] = await Promise.all([adminBranches(token), adminTechnicians(token)])
      setBranches(branchRows)
      setTechnicians(techRows)
      if (selectedTech) {
        const updated = techRows.find((t) => t.id === selectedTech.id)
        if (updated) setSelectedTech(updated)
      }
    } catch {
      setErrorMsg("Không tải được dữ liệu khu vực phục vụ.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [token])

  async function run(action: () => Promise<unknown>, successText = "Đã lưu thành công.") {
    setMessage("")
    setErrorMsg("")
    setActionLoading(true)
    try {
      await action()
      await reload()
      setMessage(successText)
    } catch (error) {
      setErrorMsg(error instanceof ApiError ? error.message : "Thao tác không thành công.")
    } finally {
      setActionLoading(false)
    }
  }

  // Filtered lists
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const term = branchSearch.trim().toLowerCase()
      if (!term) return true
      return b.name.toLowerCase().includes(term) || b.address.toLowerCase().includes(term) || b.phone.includes(term)
    })
  }, [branches, branchSearch])

  const filteredTechnicians = useMemo(() => {
    return technicians.filter((t) => {
      const term = techSearch.trim().toLowerCase()
      const matchesSearch = !term || t.fullName.toLowerCase().includes(term) || t.email.toLowerCase().includes(term) || (t.phoneNumber && t.phoneNumber.includes(term))
      const matchesBranch = !techBranchFilter || String(t.branchId) === techBranchFilter
      return matchesSearch && matchesBranch
    })
  }, [technicians, techSearch, techBranchFilter])

  return (
    <main className="page" style={{ maxWidth: "1360px", margin: "0 auto", padding: isMobile ? "16px 12px 60px" : "24px 20px 80px" }}>
      {/* BACK TO ADMIN PORTAL */}
      <div style={{ marginBottom: "16px" }}>
        <Link className="text-link" to="/admin">
          ← Quay lại Trung tâm Quản trị
        </Link>
      </div>

      {/* HERO BANNER */}
      <section className="hero" style={{ paddingBottom: "24px", marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">Quản trị & Vận hành</span>
          <h1 style={{ fontSize: isMobile ? "1.6rem" : "2.2rem", margin: "4px 0 8px" }}>
            Quản lý Khu vực phục vụ & Kỹ thuật viên
          </h1>
          <p className="lede" style={{ fontSize: isMobile ? "0.9rem" : "1.05rem", margin: 0 }}>
            Quản lý các khu vực phục vụ sửa chữa tại nhà, năng lực tiếp nhận mỗi slot, danh sách kỹ thuật viên và lịch trực tuần.
          </p>
        </div>
      </section>

      {/* FEEDBACK ALERTS */}
      {loading ? <p style={{ margin: "14px 0", color: "#64748b", textAlign: "center" }}>Đang đồng bộ dữ liệu trạm điều phối...</p> : null}
      {message ? <p className="form-success" style={{ margin: "14px 0" }}>{message}</p> : null}
      {errorMsg ? <p className="form-error" style={{ margin: "14px 0" }}>{errorMsg}</p> : null}

      {/* QUICK STATS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          gap: isMobile ? "10px" : "16px",
          marginBottom: "24px",
        }}
      >
        <div
          onClick={() => setActiveTab("branches")}
          style={{
            background: activeTab === "branches" ? "#eff6ff" : "#ffffff",
            border: activeTab === "branches" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b" }}>KHU VỰC PHỤC VỤ</span>
            <span style={{ fontSize: "1.2rem" }}>📍</span>
          </div>
          <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px" }}>
            {branches.length}
          </div>
          <span style={{ fontSize: "0.76rem", color: "#16a34a", fontWeight: 600 }}>
            {branches.filter((b) => b.isActive).length} khu vực đang hoạt động
          </span>
        </div>

        <div
          onClick={() => setActiveTab("technicians")}
          style={{
            background: activeTab === "technicians" ? "#eff6ff" : "#ffffff",
            border: activeTab === "technicians" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b" }}>KỸ THUẬT VIÊN</span>
            <span style={{ fontSize: "1.2rem" }}>👨‍🔧</span>
          </div>
          <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px" }}>
            {technicians.length}
          </div>
          <span style={{ fontSize: "0.76rem", color: "#2563eb", fontWeight: 600 }}>
            {technicians.filter((t) => t.isActive).length} nhân sự sẵn sàng
          </span>
        </div>

        <div
          onClick={() => {
            if (technicians.length > 0 && !selectedTech) {
              setSelectedTech(technicians[0])
            }
            setActiveTab("schedules")
          }}
          style={{
            background: activeTab === "schedules" ? "#eff6ff" : "#ffffff",
            border: activeTab === "schedules" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
            gridColumn: isMobile ? "1 / -1" : "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b" }}>LỊCH TRỰC TUẦN</span>
            <span style={{ fontSize: "1.2rem" }}>📅</span>
          </div>
          <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px" }}>
            {selectedTech ? selectedTech.fullName.split(" ").slice(-1)[0] : "Cấu hình"}
          </div>
          <span style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 600 }}>
            {selectedTech ? `Đang chọn: ${selectedTech.fullName}` : "Bấm để thiết lập lịch làm việc"}
          </span>
        </div>
      </div>

      {/* SEGMENTED TAB NAVIGATION */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          background: "#ffffff",
          padding: "6px",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          marginBottom: "24px",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("branches")}
          style={{
            flex: isMobile ? "initial" : 1,
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "branches" ? "#2563eb" : "transparent",
            color: activeTab === "branches" ? "#ffffff" : "#475569",
            fontWeight: 700,
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          <span>📍</span>
          <span>Khu vực phục vụ ({branches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("technicians")}
          style={{
            flex: isMobile ? "initial" : 1,
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "technicians" ? "#2563eb" : "transparent",
            color: activeTab === "technicians" ? "#ffffff" : "#475569",
            fontWeight: 700,
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          <span>👨‍🔧</span>
          <span>Kỹ thuật viên ({technicians.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (technicians.length > 0 && !selectedTech) {
              setSelectedTech(technicians[0])
            }
            setActiveTab("schedules")
          }}
          style={{
            flex: isMobile ? "initial" : 1,
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "schedules" ? "#2563eb" : "transparent",
            color: activeTab === "schedules" ? "#ffffff" : "#475569",
            fontWeight: 700,
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          <span>📅</span>
          <span>Lịch làm việc {selectedTech ? `· ${selectedTech.fullName}` : ""}</span>
        </button>
      </div>

      {/* ================= TAB 1: SERVICE AREAS ================= */}
      {activeTab === "branches" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "380px 1fr", gap: "20px", alignItems: "flex-start" }}>
          {/* FORM: THÊM KHU VỰC PHỤC VỤ */}
          <section className="card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>
              + Thêm khu vực phục vụ mới
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 16px" }}>
              Khai báo khu vực tiếp nhận và điều phối kỹ thuật viên sửa chữa tại nhà.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!token || !name.trim()) return
                const hours: OpeningHour[] = defaultHours()
                void run(
                  () =>
                    saveBranch(token, {
                      name: name.trim(),
                      address: address.trim(),
                      phone: phone.trim(),
                      capacityPerSlot: Number(capacity) || 4,
                      slotMinutes: 30,
                      isActive: true,
                      openingHours: hours,
                    }),
                  `Đã thêm khu vực ${name}.`
                )
                setName("")
                setAddress("")
                setPhone("")
                setCapacity("4")
              }}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Tên khu vực phục vụ *</span>
                <input
                  className="input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Trạm Khu vực Cầu Giấy"
                  required
                />
              </label>

              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Địa chỉ văn phòng / trạm điều phối *</span>
                <input
                  className="input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: 123 Cầu Giấy, Quan Hoa, Hà Nội"
                  required
                />
              </label>

              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Số điện thoại hotline điều phối *</span>
                <input
                  className="input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 024 3768 9999"
                  required
                />
              </label>

              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Số ca tiếp nhận tối đa mỗi khung giờ (30 phút)</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="20"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Mặc định: 4"
                  required
                />
              </label>

              <button className="btn" type="submit" disabled={actionLoading || !name.trim()} style={{ width: "100%", marginTop: "4px" }}>
                {actionLoading ? "Đang lưu..." : "Lưu khu vực"}
              </button>
            </form>
          </section>

          {/* LIST: DANH SÁCH KHU VỰC PHỤC VỤ */}
          <section className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Danh sách khu vực phục vụ ({filteredBranches.length})
                </h2>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Mạng lưới trạm điều phối thợ sửa chữa tại nhà theo khu vực
                </span>
              </div>

              <input
                type="search"
                className="input"
                placeholder="Tìm khu vực, địa chỉ..."
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                style={{ width: isMobile ? "100%" : "240px", height: "36px", fontSize: "0.84rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "580px", overflowY: "auto", paddingRight: "4px" }}>
              {filteredBranches.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: b.isActive ? "#ffffff" : "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: isMobile ? "flex-start" : "center",
                    justifyContent: "space-between",
                    flexDirection: isMobile ? "column" : "row",
                    gap: "12px",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.02)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "0.95rem", color: b.isActive ? "#0f172a" : "#94a3b8" }}>
                        {b.name}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          background: "#eff6ff",
                          color: "#2563eb",
                          padding: "1px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {b.capacityPerSlot} chỗ / slot
                      </span>
                      {b.isActive ? (
                        <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600 }}>● Đang hoạt động</span>
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>○ Tạm đóng</span>
                      )}
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>
                      📍 {b.address}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                      📞 Hotline: <strong style={{ color: "#334155" }}>{b.phone}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignSelf: isMobile ? "flex-end" : "center", flexShrink: 0 }}>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => {
                        if (!token) return
                        void run(
                          () => saveBranch(token, { ...b, isActive: !b.isActive }, b.id),
                          `Đã ${b.isActive ? "tạm đóng" : "kích hoạt"} khu vực ${b.name}.`
                        )
                      }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        border: b.isActive ? "1px solid #cbd5e1" : "1px solid #86efac",
                        background: b.isActive ? "#ffffff" : "#f0fdf4",
                        color: b.isActive ? "#475569" : "#16a34a",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.isActive ? "Tạm đóng" : "Kích hoạt"}
                    </button>
                  </div>
                </div>
              ))}

              {filteredBranches.length === 0 && (
                <p style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0" }}>
                  Không tìm thấy khu vực nào phù hợp.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ================= TAB 2: TECHNICIANS ================= */}
      {activeTab === "technicians" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "380px 1fr", gap: "20px", alignItems: "flex-start" }}>
          {/* FORM: THÊM KỸ THUẬT VIÊN */}
          <section className="card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>
              + Thêm kỹ thuật viên mới
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 16px" }}>
              Tạo tài khoản phân quyền KTV và gán khu vực phụ trách.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!token || !techName.trim() || !techEmail.trim() || !techPassword.trim() || !techBranchId) return
                void run(
                  () =>
                    createTechnician(token, {
                      fullName: techName.trim(),
                      email: techEmail.trim(),
                      phoneNumber: techPhone.trim(),
                      password: techPassword.trim(),
                      branchId: Number(techBranchId),
                      isActive: true,
                    }),
                  `Đã tạo tài khoản cho kỹ thuật viên ${techName}.`
                )
                setTechName("")
                setTechEmail("")
                setTechPhone("")
                setTechPassword("")
                setTechBranchId("")
              }}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Họ và tên *</span>
                <input
                  className="input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Kỹ Thuật"
                  required
                />
              </label>

              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Email đăng nhập *</span>
                <input
                  className="input"
                  type="email"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={techEmail}
                  onChange={(e) => setTechEmail(e.target.value)}
                  placeholder="VD: ktv.caugiay@homerepair.vn"
                  required
                />
              </label>

              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Số điện thoại</span>
                <input
                  className="input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={techPhone}
                  onChange={(e) => setTechPhone(e.target.value)}
                  placeholder="VD: 0987 654 321"
                />
              </label>

              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Mật khẩu khởi tạo *</span>
                <input
                  className="input"
                  type="password"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={techPassword}
                  onChange={(e) => setTechPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  required
                />
              </label>

              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>Khu vực trực / phụ trách *</span>
                <select
                  className="input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={techBranchId}
                  onChange={(e) => setTechBranchId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn khu vực phụ trách --</option>
                  {branches.filter((b) => b.isActive).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>

              <button className="btn" type="submit" disabled={actionLoading || !techName.trim() || !techEmail.trim() || !techBranchId} style={{ width: "100%", marginTop: "4px" }}>
                {actionLoading ? "Đang tạo..." : "Tạo tài khoản KTV"}
              </button>
            </form>
          </section>

          {/* LIST: DANH SÁCH KỸ THUẬT VIÊN */}
          <section className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Danh sách kỹ thuật viên ({filteredTechnicians.length})
                </h2>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Đội ngũ trực tiếp đến nhà khách hàng kiểm tra và sửa chữa
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
                <select
                  className="input"
                  value={techBranchFilter}
                  onChange={(e) => setTechBranchFilter(e.target.value)}
                  style={{ height: "36px", fontSize: "0.82rem", flex: isMobile ? 1 : "initial" }}
                >
                  <option value="">Tất cả khu vực</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                <input
                  type="search"
                  className="input"
                  placeholder="Tìm KTV..."
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  style={{ width: isMobile ? "50%" : "180px", height: "36px", fontSize: "0.84rem" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "580px", overflowY: "auto", paddingRight: "4px" }}>
              {filteredTechnicians.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: t.isActive ? "#ffffff" : "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: isMobile ? "flex-start" : "center",
                    justifyContent: "space-between",
                    flexDirection: isMobile ? "column" : "row",
                    gap: "12px",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.02)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "0.95rem", color: t.isActive ? "#0f172a" : "#94a3b8" }}>
                        {t.fullName}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          background: "#eff6ff",
                          color: "#2563eb",
                          padding: "1px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        📍 {t.branchName}
                      </span>
                      {t.isActive ? (
                        <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600 }}>● Sẵn sàng</span>
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>○ Tạm khóa</span>
                      )}
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      ✉️ {t.email}
                      {t.phoneNumber ? <span> • 📞 {t.phoneNumber}</span> : null}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignSelf: isMobile ? "flex-end" : "center", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTech(t)
                        setActiveTab("schedules")
                      }}
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        border: "1px solid #bfdbfe",
                        background: "#eff6ff",
                        color: "#2563eb",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      📅 Lịch trực
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => {
                        if (!token) return
                        void run(
                          () =>
                            updateTechnician(token, t.id, {
                              fullName: t.fullName,
                              phoneNumber: t.phoneNumber ?? "",
                              branchId: t.branchId,
                              isActive: !t.isActive,
                            }),
                          `Đã ${t.isActive ? "tạm khóa" : "kích hoạt"} KTV ${t.fullName}.`
                        )
                      }}
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        border: t.isActive ? "1px solid #cbd5e1" : "1px solid #86efac",
                        background: t.isActive ? "#ffffff" : "#f0fdf4",
                        color: t.isActive ? "#475569" : "#16a34a",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.isActive ? "Khóa" : "Kích hoạt"}
                    </button>
                  </div>
                </div>
              ))}

              {filteredTechnicians.length === 0 && (
                <p style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0" }}>
                  Không tìm thấy kỹ thuật viên nào phù hợp.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ================= TAB 3: SCHEDULES ================= */}
      {activeTab === "schedules" && (
        <section className="card" style={{ padding: "24px", maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>
                📅 Lịch làm việc trong tuần
              </h2>
              <p style={{ fontSize: "0.84rem", color: "#64748b", margin: 0 }}>
                Thiết lập ngày làm việc và khung giờ trực của kỹ thuật viên
              </p>
            </div>

            {/* SELECT TECHNICIAN DROPDOWN */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "#334155" }}>KTV:</span>
              <select
                className="input"
                value={selectedTech?.id || ""}
                onChange={(e) => {
                  const target = technicians.find((t) => String(t.id) === e.target.value)
                  if (target) setSelectedTech(target)
                }}
                style={{ height: "38px", fontSize: "0.88rem", fontWeight: 600 }}
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.branchName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedTech ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!token || !selectedTech) return
                void run(
                  () => saveSchedule(token, selectedTech.id, selectedTech.schedules),
                  `Đã lưu lịch làm việc cho kỹ thuật viên ${selectedTech.fullName}.`
                )
              }}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px", background: "#f8fafc" }}>
                {dayOrder.map((day: WeekDay) => {
                  const row = selectedTech.schedules.find((item) => item.dayOfWeek === day) ?? {
                    dayOfWeek: day,
                    isWorking: false,
                    startTime: "08:00",
                    endTime: "17:00",
                  }

                  const update = (partial: Partial<typeof row>) => {
                    setSelectedTech({
                      ...selectedTech,
                      schedules: dayOrder.map((item) => {
                        const current = selectedTech.schedules.find((schedule) => schedule.dayOfWeek === item) ?? {
                          dayOfWeek: item,
                          isWorking: false,
                          startTime: "08:00",
                          endTime: "17:00",
                        }
                        return item === day ? { ...current, ...partial } : current
                      }),
                    })
                  }

                  return (
                    <div
                      key={day}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: row.isWorking ? "#ffffff" : "transparent",
                        border: row.isWorking ? "1px solid #cbd5e1" : "1px dashed #cbd5e1",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", minWidth: "120px" }}>
                        <input
                          type="checkbox"
                          checked={row.isWorking}
                          onChange={(e) => update({ isWorking: e.target.checked })}
                          style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                        />
                        <strong style={{ fontSize: "0.9rem", color: row.isWorking ? "#0f172a" : "#94a3b8" }}>
                          {dayLabel[day]}
                        </strong>
                      </label>

                      {row.isWorking ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Từ</span>
                          <input
                            className="input"
                            type="time"
                            value={row.startTime}
                            onChange={(e) => update({ startTime: e.target.value })}
                            style={{ height: "34px", padding: "0 8px", fontSize: "0.85rem" }}
                          />
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Đến</span>
                          <input
                            className="input"
                            type="time"
                            value={row.endTime}
                            onChange={(e) => update({ endTime: e.target.value })}
                            style={{ height: "34px", padding: "0 8px", fontSize: "0.85rem" }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontStyle: "italic" }}>
                          Nghỉ trực
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button className="btn" type="submit" disabled={actionLoading} style={{ padding: "10px 24px" }}>
                  {actionLoading ? "Đang lưu lịch..." : `Lưu lịch cho ${selectedTech.fullName}`}
                </button>
              </div>
            </form>
          ) : (
            <p style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0" }}>
              Vui lòng chọn kỹ thuật viên để cấu hình lịch làm việc.
            </p>
          )}
        </section>
      )}
    </main>
  )
}
