import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { z } from "zod"
import { changePassword, updateProfile } from "../api/auth"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthContext"
import { getAvatarImage } from "../assets"
import { useIsMobile } from "../utils/useMediaQuery"

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên.").max(100),
  phoneNumber: z.string().regex(/^[0-9+\s]{8,15}$/, "Số điện thoại không hợp lệ (8 - 15 chữ số)."),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    newPassword: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự.")
      .regex(/[A-Z]/, "Mật khẩu cần ít nhất một chữ hoa.")
      .regex(/[a-z]/, "Mật khẩu cần ít nhất một chữ thường.")
      .regex(/[0-9]/, "Mật khẩu cần ít nhất một chữ số."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Mật khẩu nhập lại chưa khớp.",
    path: ["confirmPassword"],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const isMobile = useIsMobile(1024)
  const { token, user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Customer has their dedicated tabs inside MyBookingsPage
  if (user?.role === "Customer") {
    const tabParam = searchParams.get("tab") === "password" ? "password" : "profile"
    return <Navigate to={`/my-bookings?tab=${tabParam}`} replace />
  }

  const activeTab = (searchParams.get("tab") as "profile" | "password") || "profile"
  const setActiveTab = (tab: "profile" | "password") => {
    setSearchParams({ tab }, { replace: true })
  }

  const [profileMessage, setProfileMessage] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.fullName ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  })

  async function onSaveProfile(values: ProfileValues) {
    if (!token) return
    setProfileMessage("")
    try {
      const updated = await updateProfile(token, values)
      setUser(updated)
      setProfileMessage("Cập nhật thông tin cá nhân thành công!")
      setTimeout(() => setProfileMessage(""), 4000)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không lưu được hồ sơ. Vui lòng thử lại."
      profileForm.setError("root", { message })
    }
  }

  async function onChangePassword(values: PasswordValues) {
    if (!token) return
    setPasswordMessage("")
    try {
      await changePassword(token, values)
      passwordForm.reset()
      setPasswordMessage("Đổi mật khẩu thành công! Hãy lưu lại mật khẩu mới.")
      setTimeout(() => setPasswordMessage(""), 4000)
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        for (const [field, messages] of Object.entries(error.errors)) {
          passwordForm.setError(field as keyof PasswordValues, { message: messages[0] })
        }
        return
      }
      const message = error instanceof ApiError ? error.message : "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại."
      passwordForm.setError("root", { message })
    }
  }

  const isAdmin = user?.role === "Admin"
  const isTechnician = user?.role === "Technician"

  const roleTitle = isAdmin ? "Quản trị viên hệ thống" : isTechnician ? "Kỹ thuật viên sửa chữa" : "Khách hàng"
  const roleBadge = isAdmin ? "👑 Quản trị viên" : isTechnician ? "🔧 Kỹ thuật viên cao cấp" : "⭐ Khách hàng"

  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh", padding: "26px 20px 60px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* 2-COLUMN UNIFIED PORTAL LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "240px 1fr", gap: "24px", alignItems: "flex-start" }}>
          {/* ================= COLUMN 1: SIDEBAR ================= */}
          <aside
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "20px 14px",
              boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
            }}
          >
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 10px" }}>
              Tài khoản của tôi
            </h2>

            <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* TAB 1: THÔNG TIN CÁ NHÂN */}
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.86rem",
                  color: activeTab === "profile" ? "#2563eb" : "#475569",
                  background: activeTab === "profile" ? "#eff6ff" : "transparent",
                  fontWeight: activeTab === "profile" ? 700 : 500,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "profile") {
                    e.currentTarget.style.background = "#f1f5f9"
                    e.currentTarget.style.color = "#0f172a"
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "profile") {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = "#475569"
                  }
                }}
              >
                <span>👤</span>
                <span>Thông tin cá nhân</span>
              </button>

              {/* TAB 2: ĐỔI MẬT KHẨU */}
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.86rem",
                  color: activeTab === "password" ? "#2563eb" : "#475569",
                  background: activeTab === "password" ? "#eff6ff" : "transparent",
                  fontWeight: activeTab === "password" ? 700 : 500,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "password") {
                    e.currentTarget.style.background = "#f1f5f9"
                    e.currentTarget.style.color = "#0f172a"
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "password") {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = "#475569"
                  }
                }}
              >
                <span>🔑</span>
                <span>Đổi mật khẩu</span>
              </button>

              {/* ROLE SPECIFIC SHORTCUTS */}
              {isAdmin && (
                <>
                  <div style={{ height: "1px", background: "#f1f5f9", margin: "6px 0" }} />
                  <Link
                    to="/admin/dashboard"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "0.86rem",
                      color: "#475569",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f1f5f9"
                      e.currentTarget.style.color = "#0f172a"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = "#475569"
                    }}
                  >
                    <span>📊</span>
                    <span>Bảng điều khiển</span>
                  </Link>

                  <Link
                    to="/admin/bookings"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "0.86rem",
                      color: "#475569",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f1f5f9"
                      e.currentTarget.style.color = "#0f172a"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = "#475569"
                    }}
                  >
                    <span>🗓️</span>
                    <span>Quản lý đặt lịch</span>
                  </Link>

                  <Link
                    to="/admin/catalog"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "0.86rem",
                      color: "#475569",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f1f5f9"
                      e.currentTarget.style.color = "#0f172a"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = "#475569"
                    }}
                  >
                    <span>🛠️</span>
                    <span>Dịch vụ & Bảng giá</span>
                  </Link>

                  <Link
                    to="/admin/customers"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "0.86rem",
                      color: "#475569",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f1f5f9"
                      e.currentTarget.style.color = "#0f172a"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = "#475569"
                    }}
                  >
                    <span>👥</span>
                    <span>Khách hàng</span>
                  </Link>

                  <Link
                    to="/admin/reports"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "0.86rem",
                      color: "#475569",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f1f5f9"
                      e.currentTarget.style.color = "#0f172a"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = "#475569"
                    }}
                  >
                    <span>📈</span>
                    <span>Báo cáo & Thống kê</span>
                  </Link>
                </>
              )}

              {isTechnician && (
                <>
                  <div style={{ height: "1px", background: "#f1f5f9", margin: "6px 0" }} />
                  {/* DUY NHẤT 1 LIÊN KẾT ĐẾN BÀN KỸ THUẬT */}
                  <Link
                    to="/technician"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "0.86rem",
                      color: "#475569",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f1f5f9"
                      e.currentTarget.style.color = "#0f172a"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = "#475569"
                    }}
                  >
                    <span>🔧</span>
                    <span>Bàn làm việc kỹ thuật</span>
                  </Link>
                </>
              )}

              {/* LOGOUT BUTTON */}
              <div style={{ height: "1px", background: "#f1f5f9", margin: "6px 0" }} />
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate("/")
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.86rem",
                  color: "#ef4444",
                  background: "none",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>🚪</span>
                <span>Đăng xuất</span>
              </button>
            </nav>
          </aside>

          {/* ================= COLUMN 2: MAIN CONTENT ================= */}
          <section style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "22px" }}>
            {/* WELCOME BANNER */}
            <div
              style={{
                background: isAdmin
                  ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)"
                  : "linear-gradient(135deg, #0f766e 0%, #0284c7 100%)",
                borderRadius: "20px",
                padding: "26px 30px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 4px 18px rgba(37,99,235,0.22)",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                <img
                  src={getAvatarImage(user?.fullName || "Người dùng", isTechnician)}
                  alt="Avatar"
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    border: "3px solid rgba(255,255,255,0.85)",
                    objectFit: "cover",
                    background: "#ffffff",
                  }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                      Xin chào, {user?.fullName || "Người dùng"}!
                    </h1>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        background: "rgba(255,255,255,0.22)",
                        color: "#ffffff",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontWeight: 700,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {roleBadge}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", opacity: 0.92, margin: 0 }}>
                    {user?.email} • SĐT: <strong>{user?.phoneNumber || "Chưa cập nhật"}</strong>
                  </p>
                </div>
              </div>

              {/* HUY HIỆU TRẠNG THÁI CA TRỰC / HỆ THỐNG */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.18)",
                  backdropFilter: "blur(8px)",
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{isAdmin ? "🛡️" : "⚡"}</span>
                <div>
                  <span style={{ fontSize: "0.72rem", opacity: 0.9, display: "block" }}>
                    {isAdmin ? "Hệ thống Quản trị" : "Trạng thái Kỹ thuật viên"}
                  </span>
                  <strong style={{ fontSize: "0.86rem" }}>
                    {isAdmin ? "Toàn quyền điều hành hệ thống" : "Sẵn sàng tiếp nhận ca sửa"}
                  </strong>
                </div>
              </div>
            </div>

            {/* 3 STAT INFO PILLS */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px" }}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    fontSize: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🛡️
                </div>
                <div>
                  <span style={{ fontSize: "0.74rem", color: "#64748b", display: "block" }}>Phân quyền tài khoản</span>
                  <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{roleTitle}</strong>
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#f0fdf4",
                    color: "#16a34a",
                    fontSize: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🟢
                </div>
                <div>
                  <span style={{ fontSize: "0.74rem", color: "#64748b", display: "block" }}>Trạng thái hoạt động</span>
                  <strong style={{ fontSize: "0.92rem", color: "#16a34a" }}>Đang hoạt động</strong>
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#faf5ff",
                    color: "#9333ea",
                    fontSize: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🔒
                </div>
                <div>
                  <span style={{ fontSize: "0.74rem", color: "#64748b", display: "block" }}>Bảo mật đăng nhập</span>
                  <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>Phiên JWT bảo vệ 24/7</strong>
                </div>
              </div>
            </div>

            {/* TAB CONTENT: THÔNG TIN CÁ NHÂN */}
            {activeTab === "profile" && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "28px 32px",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                  maxWidth: "760px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Thông tin cá nhân
                  </h3>
                  <span
                    style={{
                      fontSize: "0.76rem",
                      background: "#eff6ff",
                      color: "#2563eb",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontWeight: 700,
                    }}
                  >
                    Hồ sơ tài khoản
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 22px" }}>
                  Cập nhật họ tên và số điện thoại liên lạc của bạn trong hệ thống HomeFix
                </p>

                {profileMessage && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#16a34a",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      marginBottom: "16px",
                      fontWeight: 600,
                    }}
                  >
                    ✓ {profileMessage}
                  </div>
                )}

                {profileForm.formState.errors.root && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      marginBottom: "16px",
                      fontWeight: 600,
                    }}
                  >
                    {profileForm.formState.errors.root.message}
                  </div>
                )}

                <form onSubmit={profileForm.handleSubmit(onSaveProfile)} style={{ display: "flex", flexDirection: "column", gap: "16px" }} noValidate>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      autoComplete="name"
                      {...profileForm.register("fullName")}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: profileForm.formState.errors.fullName ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                        fontSize: "0.88rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {profileForm.formState.errors.fullName && (
                      <span style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "4px", display: "block" }}>
                        {profileForm.formState.errors.fullName.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      autoComplete="tel"
                      {...profileForm.register("phoneNumber")}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: profileForm.formState.errors.phoneNumber ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                        fontSize: "0.88rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {profileForm.formState.errors.phoneNumber && (
                      <span style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "4px", display: "block" }}>
                        {profileForm.formState.errors.phoneNumber.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                      Email đăng nhập
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        color: "#64748b",
                        fontSize: "0.88rem",
                        boxSizing: "border-box",
                        cursor: "not-allowed",
                      }}
                    />
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                      Email tài khoản được dùng để định danh và phân quyền trong hệ thống.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                      Vai trò hệ thống
                    </label>
                    <div
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        color: "#1e293b",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>{roleBadge}</span>
                      <span style={{ color: "#64748b", fontWeight: 400, fontSize: "0.8rem" }}>
                        ({user?.role})
                      </span>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                      style={{
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        padding: "11px 22px",
                        borderRadius: "8px",
                        fontSize: "0.86rem",
                        fontWeight: 700,
                        cursor: profileForm.formState.isSubmitting ? "wait" : "pointer",
                        boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
                        transition: "opacity 0.15s ease",
                      }}
                    >
                      {profileForm.formState.isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: ĐỔI MẬT KHẨU */}
            {activeTab === "password" && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "28px 32px",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                  maxWidth: "680px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Đổi mật khẩu
                  </h3>
                  <span
                    style={{
                      fontSize: "0.76rem",
                      background: "#fef3c7",
                      color: "#b45309",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontWeight: 700,
                    }}
                  >
                    Bảo mật tài khoản
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 22px" }}>
                  Đảm bảo tài khoản được an toàn với mật khẩu mạnh tối thiểu 8 ký tự
                </p>

                {passwordMessage && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#16a34a",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      marginBottom: "16px",
                      fontWeight: 600,
                    }}
                  >
                    ✓ {passwordMessage}
                  </div>
                )}

                {passwordForm.formState.errors.root && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      marginBottom: "16px",
                      fontWeight: 600,
                    }}
                  >
                    {passwordForm.formState.errors.root.message}
                  </div>
                )}

                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} style={{ display: "flex", flexDirection: "column", gap: "16px" }} noValidate>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      {...passwordForm.register("currentPassword")}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: passwordForm.formState.errors.currentPassword ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                        fontSize: "0.88rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <span style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "4px", display: "block" }}>
                        {passwordForm.formState.errors.currentPassword.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      {...passwordForm.register("newPassword")}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: passwordForm.formState.errors.newPassword ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                        fontSize: "0.88rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <span style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "4px", display: "block" }}>
                        {passwordForm.formState.errors.newPassword.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      {...passwordForm.register("confirmPassword")}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: passwordForm.formState.errors.confirmPassword ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                        fontSize: "0.88rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <span style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "4px", display: "block" }}>
                        {passwordForm.formState.errors.confirmPassword.message}
                      </span>
                    )}
                  </div>

                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
                    <span style={{ fontSize: "0.74rem", color: "#64748b", lineHeight: 1.4, display: "block" }}>
                      🔒 <strong>Yêu cầu độ mạnh:</strong> Tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.
                    </span>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={passwordForm.formState.isSubmitting}
                      style={{
                        background: "#0f172a",
                        color: "#ffffff",
                        border: "none",
                        padding: "11px 22px",
                        borderRadius: "8px",
                        fontSize: "0.86rem",
                        fontWeight: 700,
                        cursor: passwordForm.formState.isSubmitting ? "wait" : "pointer",
                        boxShadow: "0 2px 6px rgba(15,23,42,0.2)",
                        transition: "opacity 0.15s ease",
                      }}
                    >
                      {passwordForm.formState.isSubmitting ? "Đang đổi..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
