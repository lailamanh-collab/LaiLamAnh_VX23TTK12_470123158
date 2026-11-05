import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { forgotPassword, homePathForRole, login, register, resetPassword } from "../../api/auth"
import { ApiError } from "../../api/client"
import { useAuth } from "../../auth/AuthContext"

type ModalTab = "login" | "register" | "forgot" | "reset" | "resetSuccess"

export function AuthModal() {
  const navigate = useNavigate()
  const { isAuthModalOpen, closeAuthModal, authModalTab, setSession } = useAuth()

  const [activeTab, setActiveTab] = useState<ModalTab>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // Register form state
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPhone, setRegisterPhone] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)

  // Reset password state
  const [resetToken, setResetToken] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  // Synchronize initial tab from context when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setActiveTab(authModalTab || "login")
      setLoginError(null)
      setForgotError(null)
      setResetError(null)
      setRegisterError(null)
    }
  }, [isAuthModalOpen, authModalTab])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthModalOpen) {
        closeAuthModal()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isAuthModalOpen, closeAuthModal])

  if (!isAuthModalOpen) {
    return null
  }

  // Quick fill demo account
  const handleSelectDemo = (email: string, pass: string) => {
    setLoginEmail(email)
    setLoginPassword(pass)
    setLoginError(null)
  }

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail.trim()) {
      setLoginError("Vui lòng nhập email hoặc số điện thoại.")
      return
    }
    if (!loginPassword) {
      setLoginError("Vui lòng nhập mật khẩu.")
      return
    }

    setLoginLoading(true)
    setLoginError(null)

    try {
      const result = await login(loginEmail.trim(), loginPassword)
      setSession(result.accessToken, result.user)
      closeAuthModal()

      // If logging in as Admin or Tech, redirect to dashboard; if customer, stay on current page
      if (result.user.role === "Admin" || result.user.role === "Technician") {
        navigate(homePathForRole(result.user.role))
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Email hoặc mật khẩu không chính xác."
      setLoginError(msg)
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError(null)

    if (!registerName.trim()) {
      setRegisterError("Vui lòng nhập họ và tên.")
      return
    }
    if (!registerEmail.trim()) {
      setRegisterError("Vui lòng nhập địa chỉ email.")
      return
    }
    if (!registerPhone.trim()) {
      setRegisterError("Vui lòng nhập số điện thoại.")
      return
    }
    if (registerPassword.length < 6) {
      setRegisterError("Mật khẩu phải có tối thiểu 6 ký tự.")
      return
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Mật khẩu xác nhận không khớp.")
      return
    }

    setRegisterLoading(true)
    try {
      const result = await register({
        fullName: registerName.trim(),
        email: registerEmail.trim(),
        phoneNumber: registerPhone.trim(),
        password: registerPassword,
        confirmPassword: registerConfirmPassword,
      })
      setSession(result.accessToken, result.user)
      closeAuthModal()
      setRegisterName("")
      setRegisterEmail("")
      setRegisterPhone("")
      setRegisterPassword("")
      setRegisterConfirmPassword("")
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const firstErr = Object.values(err.errors).flat()[0]
        setRegisterError(firstErr || err.message)
      } else {
        setRegisterError(err instanceof ApiError ? err.message : "Đăng ký thất bại. Vui lòng thử lại.")
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  // Handle Request Forgot Password OTP
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      setForgotError("Vui lòng nhập địa chỉ email của bạn.")
      return
    }

    setForgotLoading(true)
    setForgotError(null)

    try {
      const res = await forgotPassword(forgotEmail.trim())
      setResetToken(res.resetToken)
      setResetCode(res.resetCode)
      setActiveTab("reset")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Không tìm thấy tài khoản với email này."
      setForgotError(msg)
    } finally {
      setForgotLoading(false)
    }
  }

  // Handle Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      setResetError("Vui lòng nhập mật khẩu mới.")
      return
    }
    if (newPassword.length < 8) {
      setResetError("Mật khẩu mới tối thiểu 8 ký tự.")
      return
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setResetError("Mật khẩu cần ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.")
      return
    }
    if (newPassword !== confirmPassword) {
      setResetError("Mật khẩu nhập lại không khớp.")
      return
    }

    setResetLoading(true)
    setResetError(null)

    try {
      await resetPassword({
        email: forgotEmail.trim(),
        token: resetToken,
        newPassword,
        confirmPassword,
      })
      setActiveTab("resetSuccess")
      setLoginEmail(forgotEmail.trim())
      setLoginPassword("")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Không thể đặt lại mật khẩu. Vui lòng thử lại."
      setResetError(msg)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "min(16px, 3vw)",
        overflowY: "auto",
        animation: "fadeInModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeAuthModal()
        }
      }}
    >
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)",
          position: "relative",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP ACCENT LINE */}
        <div style={{ height: "4px", background: "linear-gradient(90deg, #2563eb 0%, #38bdf8 50%, #6366f1 100%)" }} />

        {/* CLOSE BUTTON ✕ */}
        <button
          type="button"
          onClick={closeAuthModal}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#f1f5f9",
            border: "none",
            color: "#64748b",
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#e2e8f0"
            e.currentTarget.style.color = "#0f172a"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f1f5f9"
            e.currentTarget.style.color = "#64748b"
          }}
          title="Đóng (Esc)"
        >
          ✕
        </button>

        {/* SEGMENTED TAB SWITCHER FOR LOGIN & REGISTER */}
        {(activeTab === "login" || activeTab === "register") && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              background: "#f1f5f9",
              borderRadius: "14px",
              padding: "4px",
              margin: "20px min(24px, 5vw) 0",
              gap: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab("login")
                setLoginError(null)
                setRegisterError(null)
              }}
              style={{
                padding: "9px 0",
                borderRadius: "10px",
                border: "none",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "login" ? "#ffffff" : "transparent",
                color: activeTab === "login" ? "#2563eb" : "#64748b",
                boxShadow: activeTab === "login" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register")
                setLoginError(null)
                setRegisterError(null)
              }}
              style={{
                padding: "9px 0",
                borderRadius: "10px",
                border: "none",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "register" ? "#ffffff" : "transparent",
                color: activeTab === "register" ? "#2563eb" : "#64748b",
                boxShadow: activeTab === "register" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Đăng ký tài khoản
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 1: ĐĂNG NHẬP (LOGIN) */}
        {/* ============================================================= */}
        {activeTab === "login" && (
          <div style={{ padding: "20px min(24px, 5vw) 28px" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "6px 14px",
                  background: "#eff6ff",
                  borderRadius: "20px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "0.85rem",
                  }}
                >
                  🏠
                </div>
                <strong style={{ fontSize: "0.95rem", color: "#1e40af", letterSpacing: "-0.02em" }}>
                  HomeFix Booking
                </strong>
              </div>

              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                Đăng nhập tài khoản
              </h2>
              <p style={{ fontSize: "0.86rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Đăng nhập để quản lý lịch hẹn sửa chữa nhà cửa và theo dõi tiến độ kỹ thuật viên.
              </p>
            </div>

            {/* QUICK DEMO SELECTOR */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "10px 14px",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "8px" }}>
                ⚡ CHỌN NHANH TÀI KHOẢN MẪU:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={{
                    padding: "5px 10px",
                    fontSize: "0.78rem",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                  onClick={() => handleSelectDemo("customer@homerepair.local", "Customer@12345")}
                >
                  👤 Khách hàng
                </button>
                <button
                  type="button"
                  style={{
                    padding: "5px 10px",
                    fontSize: "0.78rem",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                  onClick={() => handleSelectDemo("technician@homerepair.local", "Tech@12345")}
                  title="Nguyễn Văn Nam - KTV Điện Nước"
                >
                  🔧 KTV Nam (Điện Nước)
                </button>
                <button
                  type="button"
                  style={{
                    padding: "5px 10px",
                    fontSize: "0.78rem",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                  onClick={() => handleSelectDemo("technician2@homerepair.local", "Tech2@12345")}
                  title="Trần Đình Quang - KTV Điện Lạnh"
                >
                  ❄️ KTV Quang (Điện Lạnh)
                </button>
                <button
                  type="button"
                  style={{
                    padding: "5px 10px",
                    fontSize: "0.78rem",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                  onClick={() => handleSelectDemo("admin@homerepair.local", "Admin@12345")}
                >
                  👑 Quản trị viên
                </button>
              </div>
            </div>

            {loginError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  color: "#b91c1c",
                  fontSize: "0.84rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚠️</span>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} noValidate>
              {/* EMAIL */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Email hoặc số điện thoại
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "14px", color: "#94a3b8", fontSize: "1rem" }}>✉️</span>
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ví dụ: customer@homerepair.local"
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 40px",
                      borderRadius: "12px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.92rem",
                      color: "#0f172a",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />
                </div>
              </div>

              {/* MẬT KHẨU */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Mật khẩu
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "14px", color: "#94a3b8", fontSize: "1rem" }}>🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    style={{
                      width: "100%",
                      padding: "11px 42px 11px 40px",
                      borderRadius: "12px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.92rem",
                      color: "#0f172a",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1rem",
                      color: "#94a3b8",
                      padding: "4px",
                    }}
                    title="Hiện/ẩn mật khẩu"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* GHI NHỚ & QUÊN MẬT KHẨU */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail)
                    setActiveTab("forgot")
                    setForgotError(null)
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* NÚT SUBMIT */}
              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: loginLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {loginLoading ? (
                  <>
                    <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid #ffffff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>Đăng nhập ngay →</>
                )}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "20px 0 16px",
                color: "#94a3b8",
                fontSize: "0.76rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              <span style={{ padding: "0 10px" }}>Hoặc</span>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            </div>

            <div style={{ textAlign: "center", fontSize: "0.85rem", color: "#64748b" }}>
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register")
                  setLoginError(null)
                  setRegisterError(null)
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "inherit",
                }}
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 1.5: ĐĂNG KÝ (REGISTER) */}
        {/* ============================================================= */}
        {activeTab === "register" && (
          <div style={{ padding: "20px min(24px, 5vw) 28px" }}>
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                Tạo tài khoản HomeFix
              </h2>
              <p style={{ fontSize: "0.84rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Đăng ký để quản lý lịch hẹn sửa chữa nhà và nhận ưu đãi dịch vụ.
              </p>
            </div>

            {registerError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  fontSize: "0.84rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚠️</span>
                <span>{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Họ và tên *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                    👤
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 12px 0 38px",
                      borderRadius: "12px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.92rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Địa chỉ Email *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                    ✉️
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 12px 0 38px",
                      borderRadius: "12px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.92rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Số điện thoại *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                    📞
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="0901234567"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 12px 0 38px",
                      borderRadius: "12px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.92rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Mật khẩu *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 34px 0 12px",
                        borderRadius: "12px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.88rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "4px",
                        fontSize: "0.9rem",
                      }}
                    >
                      {showRegisterPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Xác nhận mật khẩu *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Nhập lại mật khẩu"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 34px 0 12px",
                        borderRadius: "12px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.88rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "4px",
                        fontSize: "0.9rem",
                      }}
                    >
                      {showRegisterConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: registerLoading ? "not-allowed" : "pointer",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                }}
              >
                {registerLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản ngay →"}
              </button>
            </form>

            <div style={{ textAlign: "center", fontSize: "0.85rem", color: "#64748b", marginTop: "16px" }}>
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login")
                  setLoginError(null)
                  setRegisterError(null)
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "inherit",
                }}
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: QUÊN MẬT KHẨU (FORGOT PASSWORD - BƯỚC 1) */}
        {/* ============================================================= */}
        {activeTab === "forgot" && (
          <div style={{ padding: "28px min(24px, 5vw)" }}>
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "16px",
                padding: "4px 0",
              }}
            >
              ← Quay lại đăng nhập
            </button>

            <div style={{ textAlign: "center", marginBottom: "22px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  fontSize: "1.6rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                🔑
              </div>
              <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                Khôi phục mật khẩu
              </h2>
              <p style={{ fontSize: "0.86rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Nhập địa chỉ email đăng ký tài khoản của bạn. Hệ thống sẽ tạo mã xác thực để đặt lại mật khẩu mới.
              </p>
            </div>

            {/* QUICK SUGGESTIONS */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px 14px", marginBottom: "18px" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px" }}>
                GỢI Ý EMAIL MẪU:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={{ padding: "4px 8px", fontSize: "0.76rem", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", color: "#1e40af" }}
                  onClick={() => setForgotEmail("customer@homerepair.local")}
                >
                  customer@homerepair.local
                </button>
                <button
                  type="button"
                  style={{ padding: "4px 8px", fontSize: "0.76rem", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", color: "#1e40af" }}
                  onClick={() => setForgotEmail("technician@homerepair.local")}
                >
                  technician@homerepair.local
                </button>
              </div>
            </div>

            {forgotError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  color: "#b91c1c",
                  fontSize: "0.84rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚠️</span>
                <span>{forgotError}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} noValidate>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Email đã đăng ký
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "14px", color: "#94a3b8", fontSize: "1rem" }}>✉️</span>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 40px",
                      borderRadius: "12px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.92rem",
                      color: "#0f172a",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: forgotLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                }}
              >
                {forgotLoading ? "Đang gửi mã..." : "Gửi mã xác thực →"}
              </button>
            </form>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: NHẬP MÃ XÁC THỰC & MẬT KHẨU MỚI (RESET PASSWORD - BƯỚC 2) */}
        {/* ============================================================= */}
        {activeTab === "reset" && (
          <div style={{ padding: "28px min(24px, 5vw)" }}>
            <button
              type="button"
              onClick={() => setActiveTab("forgot")}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "16px",
                padding: "4px 0",
              }}
            >
              ← Thay đổi email
            </button>

            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "16px",
                  background: "#f0fdf4",
                  color: "#16a34a",
                  fontSize: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                🛡️
              </div>
              <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                Thiết lập mật khẩu mới
              </h2>
              <p style={{ fontSize: "0.84rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Đang khôi phục cho tài khoản: <strong style={{ color: "#0f172a" }}>{forgotEmail}</strong>
              </p>
            </div>

            {/* OTP DEMO BANNER */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "12px 14px",
                marginBottom: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#166534" }}>
                  ✅ MÃ XÁC THỰC ĐÃ SẴN SÀNG:
                </span>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#15803d", letterSpacing: "2px" }}>
                  {resetCode || "688699"}
                </span>
              </div>
              <p style={{ fontSize: "0.74rem", color: "#15803d", margin: 0 }}>
                Hệ thống đã tự động gán mã xác thực an toàn. Bạn có thể tiến hành đặt lại mật khẩu ngay bên dưới.
              </p>
            </div>

            {resetError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  color: "#b91c1c",
                  fontSize: "0.84rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚠️</span>
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} noValidate>
              {/* MÃ XÁC THỰC */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Mã OTP xác thực
                </label>
                <input
                  type="text"
                  value={resetCode || "688699"}
                  onChange={(e) => setResetCode(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    background: "#f8fafc",
                    fontWeight: 700,
                    letterSpacing: "1px",
                  }}
                />
              </div>

              {/* MẬT KHẨU MỚI */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Mật khẩu mới
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự (chữ hoa, thường, số)"
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.9rem",
                      color: "#0f172a",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1rem",
                      color: "#94a3b8",
                    }}
                  >
                    {showNewPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* XÁC NHẬN MẬT KHẨU MỚI */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Nhập lại mật khẩu mới
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại chính xác mật khẩu mới"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: resetLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(22, 163, 74, 0.35)",
                }}
              >
                {resetLoading ? "Đang cập nhật..." : "Xác nhận đặt lại mật khẩu →"}
              </button>
            </form>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: THÀNH CÔNG (RESET SUCCESS) */}
        {/* ============================================================= */}
        {activeTab === "resetSuccess" && (
          <div style={{ padding: "36px min(24px, 5vw)", textAlign: "center" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "#f0fdf4",
                color: "#16a34a",
                fontSize: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                border: "3px solid #bbf7d0",
              }}
            >
              🎉
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
              Đặt lại mật khẩu thành công!
            </h2>
            <p style={{ fontSize: "0.88rem", color: "#64748b", margin: "0 auto 24px", maxWidth: "340px", lineHeight: 1.5 }}>
              Mật khẩu mới của bạn đã được cập nhật an toàn vào hệ thống. Bây giờ bạn có thể đăng nhập ngay để sử dụng dịch vụ.
            </p>

            <button
              type="button"
              onClick={() => {
                setActiveTab("login")
                setLoginPassword("")
                setLoginError(null)
              }}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
              }}
            >
              Đăng nhập ngay →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
