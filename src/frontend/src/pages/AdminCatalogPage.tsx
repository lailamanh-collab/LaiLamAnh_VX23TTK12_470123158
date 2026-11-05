import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  adminCategories,
  adminServices,
  saveCategory,
  deleteCategory,
  saveService,
  deleteService,
  formatPrice,
  type ServiceCategory,
  type RepairService,
  type PricingType,
} from "../api/catalog"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthContext"
import { useIsMobile } from "../utils/useMediaQuery"
import { getCategoryEmoji } from "../utils/category"

export function AdminCatalogPage() {
  const isMobile = useIsMobile(960)
  const { token } = useAuth()

  // Data states
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<RepairService[]>([])
  const [_loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Feedback messages
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Active tab: "categories" | "services"
  const [activeTab, setActiveTab] = useState<"categories" | "services">("categories")

  // Category Form
  const [catId, setCatId] = useState<number | undefined>(undefined)
  const [catName, setCatName] = useState("")
  const [catDesc, setCatDesc] = useState("")
  const [catIcon, setCatIcon] = useState("⚡")
  const [catIsActive, setCatIsActive] = useState(true)

  // Service Form
  const [svcId, setSvcId] = useState<number | undefined>(undefined)
  const [svcCategoryId, setSvcCategoryId] = useState<number | "">("")
  const [svcName, setSvcName] = useState("")
  const [svcDesc, setSvcDesc] = useState("")
  const [svcBasePrice, setSvcBasePrice] = useState<string>("")
  const [svcPricingType, setSvcPricingType] = useState<PricingType>("FixedPrice")
  const [svcDuration, setSvcDuration] = useState("30 - 60 phút")
  const [svcIsActive, setSvcIsActive] = useState(true)

  // Filters
  const [catSearch, setCatSearch] = useState("")
  const [svcSearch, setSvcSearch] = useState("")
  const [svcFilterCat, setSvcFilterCat] = useState<string>("all")

  async function reload() {
    if (!token) return
    setLoading(true)
    try {
      const [catRows, svcRows] = await Promise.all([
        adminCategories(token),
        adminServices(token),
      ])
      setCategories(catRows)
      setServices(svcRows)
      if (svcRows.length > 0 && svcCategoryId === "") {
        setSvcCategoryId(catRows[0]?.id ?? "")
      }
    } catch {
      setErrorMsg("Không thể tải danh mục dữ liệu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [token])

  async function run(action: () => Promise<unknown>, successText = "Đã lưu thành công.") {
    setErrorMsg("")
    setSuccessMsg("")
    setActionLoading(true)
    try {
      await action()
      await reload()
      setSuccessMsg(successText)
    } catch (error) {
      setErrorMsg(error instanceof ApiError ? error.message : "Thao tác không thành công.")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !catName.trim()) return

    void run(async () => {
      await saveCategory(
        token,
        {
          name: catName.trim(),
          description: catDesc.trim(),
          iconName: catIcon.trim() || "🛠️",
          isActive: catIsActive,
        },
        catId
      )
      // reset form
      setCatId(undefined)
      setCatName("")
      setCatDesc("")
      setCatIcon("⚡")
      setCatIsActive(true)
    }, catId ? `Đã cập nhật nhóm ${catName}.` : `Đã thêm nhóm ${catName}.`)
  }

  // Handle Edit Category
  const handleEditCategory = (c: ServiceCategory) => {
    setCatId(c.id)
    setCatName(c.name)
    setCatDesc(c.description || "")
    setCatIcon(getCategoryEmoji(c.iconName, c.slug, c.name))
    setCatIsActive(c.isActive)
  }

  // Handle Delete Category
  const handleDeleteCategory = (id: number, name: string) => {
    if (!token) return
    if (!window.confirm(`Bạn có chắc muốn xóa nhóm "${name}"?`)) return
    void run(() => deleteCategory(token, id), `Đã xóa nhóm "${name}".`)
  }

  // Handle Save Service
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !svcName.trim() || !svcCategoryId) return

    const priceNum = svcBasePrice ? Number(svcBasePrice) : null

    void run(async () => {
      await saveService(
        token,
        {
          serviceCategoryId: Number(svcCategoryId),
          name: svcName.trim(),
          description: svcDesc.trim(),
          basePrice: priceNum,
          pricingType: svcPricingType,
          estimatedDuration: svcDuration.trim(),
          isActive: svcIsActive,
        },
        svcId
      )
      // reset form
      setSvcId(undefined)
      setSvcName("")
      setSvcDesc("")
      setSvcBasePrice("")
      setSvcPricingType("FixedPrice")
      setSvcDuration("30 - 60 phút")
      setSvcIsActive(true)
    }, svcId ? `Đã cập nhật dịch vụ ${svcName}.` : `Đã thêm dịch vụ ${svcName}.`)
  }

  // Handle Edit Service
  const handleEditService = (s: RepairService) => {
    setSvcId(s.id)
    setSvcCategoryId(s.serviceCategoryId)
    setSvcName(s.name)
    setSvcDesc(s.description || "")
    setSvcBasePrice(s.basePrice != null ? String(s.basePrice) : "")
    setSvcPricingType(s.pricingType)
    setSvcDuration(s.estimatedDuration || "30 - 60 phút")
    setSvcIsActive(s.isActive)
  }

  // Handle Delete Service
  const handleDeleteService = (id: number, name: string) => {
    if (!token) return
    if (!window.confirm(`Bạn có chắc muốn xóa dịch vụ "${name}"?`)) return
    void run(() => deleteService(token, id), `Đã xóa dịch vụ "${name}".`)
  }

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (!catSearch.trim()) return true
      const lower = catSearch.toLowerCase()
      return c.name.toLowerCase().includes(lower) || (c.description && c.description.toLowerCase().includes(lower))
    })
  }, [categories, catSearch])

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (svcFilterCat !== "all" && String(s.serviceCategoryId) !== svcFilterCat) return false
      if (!svcSearch.trim()) return true
      const lower = svcSearch.toLowerCase()
      return (
        s.name.toLowerCase().includes(lower) ||
        (s.description && s.description.toLowerCase().includes(lower)) ||
        s.serviceCategoryName.toLowerCase().includes(lower)
      )
    })
  }, [services, svcFilterCat, svcSearch])

  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh", padding: "28px 20px 80px" }}>
      <div style={{ maxWidth: "1340px", margin: "0 auto" }}>
        {/* HEADER */}
        <section style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
            <Link to="/admin" style={{ color: "#64748b", textDecoration: "none" }}>Quản trị</Link>
            <span>/</span>
            <span style={{ color: "#0f172a", fontWeight: 700 }}>Danh mục & Dịch vụ</span>
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
            Quản lý Danh mục & Bảng giá sửa chữa nhà cửa
          </h1>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
            Quản lý các nhóm dịch vụ (Điện, Nước, Điều hòa, Gia dụng...), chi tiết dịch vụ sửa chữa và đơn giá niêm yết.
          </p>
        </section>

        {/* FEEDBACK TOASTS */}
        {successMsg && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "12px 18px", borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>✓ {successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
        )}
        {errorMsg && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 18px", borderRadius: "10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚠️ {errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg("")} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* MAIN TABS */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "24px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            style={{
              padding: "12px 24px",
              border: "none",
              borderBottom: activeTab === "categories" ? "3px solid #2563eb" : "3px solid transparent",
              background: "transparent",
              color: activeTab === "categories" ? "#2563eb" : "#64748b",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📁</span>
            <span>Nhóm dịch vụ ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("services")}
            style={{
              padding: "12px 24px",
              border: "none",
              borderBottom: activeTab === "services" ? "3px solid #2563eb" : "3px solid transparent",
              background: "transparent",
              color: activeTab === "services" ? "#2563eb" : "#64748b",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🛠️</span>
            <span>Dịch vụ & Bảng giá ({services.length})</span>
          </button>
        </div>

        {/* ================= TAB 1: NHÓM DỊCH VỤ ================= */}
        {activeTab === "categories" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "340px 1fr", gap: "24px" }}>
            {/* FORM CARD */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", height: "fit-content", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>
                {catId ? "✏️ Cập nhật nhóm dịch vụ" : "+ Thêm nhóm dịch vụ mới"}
              </h2>

              <form onSubmit={handleSaveCategory} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Tên nhóm dịch vụ *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="VD: Điện dân dụng, Hệ thống nước..."
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Biểu tượng Icon (Emoji hoặc ký tự)
                  </label>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                    {["⚡", "🚰", "❄️", "🧺", "🛠️", "🔧", "🚪", "💡"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCatIcon(emoji)}
                        style={{
                          padding: "4px 8px",
                          border: catIcon === emoji ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          borderRadius: "6px",
                          background: catIcon === emoji ? "#eff6ff" : "#ffffff",
                          cursor: "pointer",
                          fontSize: "1.1rem",
                          lineHeight: 1,
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    placeholder="VD: ⚡, 🚰, ❄️, 🧺, 🛠️"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Mô tả nhóm
                  </label>
                  <textarea
                    rows={3}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Mô tả phạm vi sửa chữa của nhóm này..."
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    id="catIsActive"
                    checked={catIsActive}
                    onChange={(e) => setCatIsActive(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor="catIsActive" style={{ fontSize: "0.85rem", color: "#334155", cursor: "pointer", fontWeight: 600 }}>
                    Kích hoạt hiển thị cho khách đặt lịch
                  </label>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {catId ? "Lưu thay đổi" : "Tạo nhóm dịch vụ"}
                  </button>
                  {catId && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatId(undefined)
                        setCatName("")
                        setCatDesc("")
                        setCatIcon("⚡")
                      }}
                      style={{
                        padding: "10px 14px",
                        background: "#f1f5f9",
                        color: "#64748b",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        cursor: "pointer",
                      }}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* TABLE CARD */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Tìm nhóm dịch vụ..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.86rem", width: isMobile ? "100%" : "auto", minWidth: isMobile ? "0" : "240px" }}
                />
                <span style={{ fontSize: "0.84rem", color: "#64748b" }}>
                  Tổng cộng: <strong>{filteredCategories.length} nhóm</strong>
                </span>
              </div>

              <div style={{ overflowX: "auto", width: "100%" }}>
                <table style={{ width: "100%", minWidth: "750px", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 16px", color: "#475569" }}>Icon</th>
                      <th style={{ padding: "12px 16px", color: "#475569" }}>Tên nhóm dịch vụ</th>
                      <th style={{ padding: "12px 16px", color: "#475569" }}>Mô tả</th>
                      <th style={{ padding: "12px 16px", color: "#475569" }}>Dịch vụ</th>
                      <th style={{ padding: "12px 16px", color: "#475569" }}>Trạng thái</th>
                      <th style={{ padding: "12px 16px", color: "#475569", textAlign: "right" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontSize: "1.3rem" }}>{getCategoryEmoji(c.iconName, c.slug, c.name)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <strong style={{ color: "#0f172a" }}>{c.name}</strong>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b", maxWidth: "280px" }}>
                          {c.description || "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "0.78rem" }}>
                            {c.servicesCount || 0} dịch vụ
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: "0.76rem", color: c.isActive ? "#16a34a" : "#ef4444", fontWeight: 700 }}>
                            {c.isActive ? "● Hoạt động" : "○ Tạm tắt"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => handleEditCategory(c)}
                            style={{ background: "#f1f5f9", border: "none", color: "#2563eb", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", marginRight: "6px" }}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.id, c.name)}
                            style={{ background: "#fee2e2", border: "none", color: "#dc2626", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DỊCH VỤ SỬA CHỮA & BẢNG GIÁ ================= */}
        {activeTab === "services" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "360px 1fr", gap: "24px" }}>
            {/* FORM CARD */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", height: "fit-content", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>
                {svcId ? "✏️ Cập nhật dịch vụ" : "+ Thêm dịch vụ sửa chữa"}
              </h2>

              <form onSubmit={handleSaveService} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Nhóm dịch vụ trực thuộc *
                  </label>
                  <select
                    required
                    value={svcCategoryId}
                    onChange={(e) => setSvcCategoryId(Number(e.target.value))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#ffffff", boxSizing: "border-box" }}
                  >
                    <option value="" disabled>-- Chọn nhóm dịch vụ --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Tên dịch vụ sửa chữa *
                  </label>
                  <input
                    type="text"
                    required
                    value={svcName}
                    onChange={(e) => setSvcName(e.target.value)}
                    placeholder="VD: Thay vòi sen tắm, Vệ sinh điều hòa..."
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Hình thức tính giá *
                  </label>
                  <select
                    value={svcPricingType}
                    onChange={(e) => setSvcPricingType(e.target.value as PricingType)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", background: "#ffffff", boxSizing: "border-box" }}
                  >
                    <option value="FixedPrice">Giá trọn gói cố định (FixedPrice)</option>
                    <option value="InspectionRequired">Khảo sát & Báo giá tại nhà (InspectionRequired)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    {svcPricingType === "FixedPrice" ? "Đơn giá niêm yết (VND) *" : "Đơn giá dự kiến tối thiểu (VND)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={svcBasePrice}
                    onChange={(e) => setSvcBasePrice(e.target.value)}
                    placeholder="VD: 250000"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Thời gian thi công ước tính
                  </label>
                  <input
                    type="text"
                    value={svcDuration}
                    onChange={(e) => setSvcDuration(e.target.value)}
                    placeholder="VD: 30 - 60 phút"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    Mô tả công việc & vật tư
                  </label>
                  <textarea
                    rows={3}
                    value={svcDesc}
                    onChange={(e) => setSvcDesc(e.target.value)}
                    placeholder="Chi tiết các hạng mục thợ sẽ thực hiện..."
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    id="svcIsActive"
                    checked={svcIsActive}
                    onChange={(e) => setSvcIsActive(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor="svcIsActive" style={{ fontSize: "0.85rem", color: "#334155", cursor: "pointer", fontWeight: 600 }}>
                    Kích hoạt hiển thị cho khách đặt lịch
                  </label>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {svcId ? "Lưu thay đổi" : "Tạo dịch vụ"}
                  </button>
                  {svcId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSvcId(undefined)
                        setSvcName("")
                        setSvcDesc("")
                        setSvcBasePrice("")
                      }}
                      style={{
                        padding: "10px 14px",
                        background: "#f1f5f9",
                        color: "#64748b",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        cursor: "pointer",
                      }}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* TABLE CARD */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Tìm tên dịch vụ..."
                    value={svcSearch}
                    onChange={(e) => setSvcSearch(e.target.value)}
                    style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.86rem", width: isMobile ? "100%" : "auto", minWidth: isMobile ? "0" : "200px" }}
                  />
                  <select
                    value={svcFilterCat}
                    onChange={(e) => setSvcFilterCat(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.86rem", background: "#ffffff" }}
                  >
                    <option value="all">Tất cả nhóm ({services.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <span style={{ fontSize: "0.84rem", color: "#64748b" }}>
                  Tổng cộng: <strong>{filteredServices.length} dịch vụ</strong>
                </span>
              </div>

              <div style={{ overflowX: "auto", width: "100%" }}>
                <table style={{ width: "100%", minWidth: "850px", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 14px", color: "#475569" }}>Dịch vụ</th>
                      <th style={{ padding: "12px 14px", color: "#475569" }}>Nhóm</th>
                      <th style={{ padding: "12px 14px", color: "#475569" }}>Hình thức</th>
                      <th style={{ padding: "12px 14px", color: "#475569" }}>Đơn giá</th>
                      <th style={{ padding: "12px 14px", color: "#475569" }}>Thời gian</th>
                      <th style={{ padding: "12px 14px", color: "#475569" }}>Trạng thái</th>
                      <th style={{ padding: "12px 14px", color: "#475569", textAlign: "right" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <strong style={{ display: "block", color: "#0f172a" }}>{s.name}</strong>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{s.description || "—"}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: "0.76rem", background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                            {s.serviceCategoryName}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: s.pricingType === "FixedPrice" ? "#16a34a" : "#ea580c" }}>
                            {s.pricingType === "FixedPrice" ? "Giá cố định" : "Khảo sát"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <strong style={{ color: "#2563eb" }}>
                            {formatPrice(s.basePrice, s.pricingType)}
                          </strong>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>
                          {s.estimatedDuration || "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: "0.76rem", color: s.isActive ? "#16a34a" : "#ef4444", fontWeight: 700 }}>
                            {s.isActive ? "● Hoạt động" : "○ Tạm tắt"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => handleEditService(s)}
                            style={{ background: "#f1f5f9", border: "none", color: "#2563eb", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", marginRight: "6px" }}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(s.id, s.name)}
                            style={{ background: "#fee2e2", border: "none", color: "#dc2626", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
