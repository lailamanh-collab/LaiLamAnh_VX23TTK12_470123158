import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import { getAvatarImage } from "../../assets"

export function SiteHeader() {
  const { user, logout, openAuthModal } = useAuth()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const searchBtnRef = useRef<HTMLButtonElement>(null)
  const searchBoxRef = useRef<HTMLDivElement>(null)

  const closeMenu = () => {
    setMobileOpen(false)
    setProfileDropdownOpen(false)
    setNotifDropdownOpen(false)
    setShowSearchModal(false)
  }

  // Close dropdowns and search modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifDropdownOpen(false)
      }
      if (
        showSearchModal &&
        searchBoxRef.current &&
        !searchBoxRef.current.contains(target) &&
        searchBtnRef.current &&
        !searchBtnRef.current.contains(target)
      ) {
        setShowSearchModal(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSearchModal(false)
        setProfileDropdownOpen(false)
        setNotifDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [showSearchModal])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSearchModal(false)
      navigate(`/services?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const formatUserDisplay = (fullName?: string, role?: string) => {
    if (!fullName) {
      return {
        displayName: "Người dùng",
        subtitle: role === "Admin" ? "Quản trị viên" : role === "Technician" ? "Kỹ thuật viên" : "Khách hàng",
      }
    }

    // Match patterns like "Trần Đình Quang (KTV Điện Lạnh)" -> name: "Trần Đình Quang", subtitle: "KTV Điện Lạnh"
    const match = fullName.match(/^(.*?)\s*[\(\[]\s*(.*?)\s*[\)\]]$/)
    if (match) {
      return {
        displayName: match[1].trim(),
        subtitle: match[2].trim(),
      }
    }

    return {
      displayName: fullName.trim(),
      subtitle: role === "Admin" ? "Quản trị viên" : role === "Technician" ? "Kỹ thuật viên" : "Khách hàng",
    }
  }

  const userDisplay = formatUserDisplay(user?.fullName, user?.role)


  const getRoleBadge = (role?: string) => {
    if (role === "Admin") {
      return (
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "6px",
            background: "#fef3c7",
            color: "#b45309",
            border: "1px solid #fde68a",
            whiteSpace: "nowrap",
            flexShrink: 0,
            lineHeight: 1.4,
          }}
        >
          Admin
        </span>
      )
    }
    if (role === "Technician") {
      return (
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "6px",
            background: "#f3e8ff",
            color: "#7e22ce",
            border: "1px solid #e9d5ff",
            whiteSpace: "nowrap",
            flexShrink: 0,
            lineHeight: 1.4,
          }}
        >
          KTV
        </span>
      )
    }
    return (
      <span
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: "6px",
          background: "#ecfdf5",
          color: "#059669",
          border: "1px solid #a7f3d0",
          whiteSpace: "nowrap",
          flexShrink: 0,
          lineHeight: 1.4,
        }}
      >
        Khách hàng
      </span>
    )
  }

  return (
    <header className="site-header" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
      <div
        className="site-header-inner"
        style={{
          maxWidth: "1340px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "70px",
          flexWrap: "nowrap",
          gap: "20px",
        }}
      >
        {/* 1. BRAND LOGO (LEFT) */}
        <NavLink to="/" onClick={closeMenu} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(37,99,235,0.28)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.35rem", letterSpacing: "-0.03em", color: "#0f172a" }}>
            Home<span style={{ color: "#2563eb" }}>Fix</span>
          </span>
        </NavLink>

        {/* 2. NAVIGATION LINKS (CENTER) */}
        <nav
          className="desktop-nav"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "26px",
            whiteSpace: "nowrap",
          }}
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
            style={{ textDecoration: "none", fontWeight: 600, fontSize: "0.92rem" }}
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/services"
            className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
            style={{ textDecoration: "none", fontWeight: 600, fontSize: "0.92rem" }}
          >
            Dịch vụ sửa chữa
          </NavLink>
          <NavLink
            to="/pricing"
            className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
            style={{ textDecoration: "none", fontWeight: 600, fontSize: "0.92rem" }}
          >
            Bảng giá
          </NavLink>
          <NavLink
            to="/branches"
            className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
            style={{ textDecoration: "none", fontWeight: 600, fontSize: "0.92rem" }}
          >
            Khu vực phục vụ
          </NavLink>
          <NavLink
            to="/support"
            className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
            style={{ textDecoration: "none", fontWeight: 600, fontSize: "0.92rem" }}
          >
            Hỗ trợ
          </NavLink>
        </nav>

        {/* 3. ACTIONS & USER PROFILE (RIGHT) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          {/* SEARCH BUTTON (COMPACT ICON ONLY) */}
          <button
            ref={searchBtnRef}
            type="button"
            onClick={() => setShowSearchModal((prev) => !prev)}
            title="Tìm kiếm dịch vụ sửa chữa nhà cửa"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: showSearchModal ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
              background: showSearchModal ? "#eff6ff" : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: showSearchModal ? "#2563eb" : "#64748b",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* WHEN LOGGED IN */}
          {user ? (
            <>
              {/* NOTIFICATION BELL WITH BADGE */}
              <div ref={notifRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  title="Thông báo"
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    border: "1px solid #e2e8f0",
                    background: notifDropdownOpen ? "#eff6ff" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: "pointer",
                    color: notifDropdownOpen ? "#2563eb" : "#64748b",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {/* RED UNREAD BADGE */}
                  <span
                    style={{
                      position: "absolute",
                      top: "7px",
                      right: "7px",
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "#ef4444",
                      border: "1.5px solid #ffffff",
                    }}
                  />
                </button>

                {/* NOTIFICATIONS POPOVER */}
                {notifDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "48px",
                      right: 0,
                      width: "320px",
                      background: "#ffffff",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
                      zIndex: 150,
                      padding: "14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
                      <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>Thông báo</strong>
                      <span style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>Đánh dấu đã đọc</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <Link
                        to="/my-bookings"
                        onClick={closeMenu}
                        style={{
                          textDecoration: "none",
                          padding: "8px",
                          borderRadius: "8px",
                          background: "#eff6ff",
                          border: "1px solid #dbeafe",
                          display: "block",
                        }}
                      >
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e40af", marginBottom: "2px" }}>
                          Lịch hẹn PRB-20241015-001
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "#475569" }}>
                          Kỹ thuật viên đang kiểm tra thiết bị của bạn.
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "4px" }}>
                          10 phút trước
                        </div>
                      </Link>

                      <Link
                        to="/my-bookings"
                        onClick={closeMenu}
                        style={{
                          textDecoration: "none",
                          padding: "8px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px solid #f1f5f9",
                          display: "block",
                        }}
                      >
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
                          Đặt lịch thành công
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "#475569" }}>
                          Bạn đã đặt lịch sửa chữa tại Khu vực Quận 1.
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "4px" }}>
                          1 giờ trước
                        </div>
                      </Link>
                    </div>

                    <div style={{ marginTop: "10px", textAlign: "center", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                      <Link to="/my-bookings" onClick={closeMenu} style={{ fontSize: "0.76rem", color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
                        Xem tất cả lịch hẹn →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* USER PROFILE PILL WITH DROPDOWN (MATCHING MOCKUP) */}
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <div
                  className="site-header-profile-pill"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "3px 10px 3px 4px",
                    borderRadius: "999px",
                    background: profileDropdownOpen ? "#f1f5f9" : "#f8fafc",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <img
                    src={getAvatarImage(user.fullName, user.role === "Technician")}
                    alt={userDisplay.displayName}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <div className="site-header-profile-text" style={{ flexDirection: "column", lineHeight: 1.25, textAlign: "left" }}>
                    <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                      {userDisplay.displayName}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", whiteSpace: "nowrap" }}>
                      {userDisplay.subtitle}
                    </span>
                  </div>
                  <span
                    className="site-header-profile-arrow"
                    style={{
                      fontSize: "0.68rem",
                      color: "#64748b",
                      marginLeft: "2px",
                      transform: profileDropdownOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    ▼
                  </span>
                </div>

                {/* USER DROPDOWN MENU */}
                {profileDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "48px",
                      right: 0,
                      width: "260px",
                      background: "#ffffff",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
                      zIndex: 150,
                      padding: "8px 0",
                    }}
                  >
                    {/* USER HEADER INFO */}
                    <div style={{ padding: "10px 16px 12px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "3px" }}>
                        <strong
                          style={{
                            fontSize: "0.88rem",
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {userDisplay.displayName}
                        </strong>
                        {getRoleBadge(user.role)}
                      </div>
                      <div
                        style={{
                          fontSize: "0.74rem",
                          color: user.role === "Technician" ? "#7e22ce" : user.role === "Admin" ? "#b45309" : "#64748b",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        {userDisplay.subtitle}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#64748b", wordBreak: "break-all" }}>
                        {user.email}
                      </div>
                    </div>

                    {/* MENU LINKS */}
                    <div style={{ padding: "6px 0" }}>
                      <Link
                        to="/my-bookings"
                        onClick={closeMenu}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 16px",
                          fontSize: "0.84rem",
                          color: "#334155",
                          textDecoration: "none",
                          fontWeight: 600,
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span>📋</span>
                        <span>Lịch hẹn của tôi</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={closeMenu}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 16px",
                          fontSize: "0.84rem",
                          color: "#334155",
                          textDecoration: "none",
                          fontWeight: 600,
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span>👤</span>
                        <span>Thông tin cá nhân</span>
                      </Link>

                      {/* ROLE SHORTCUTS */}
                      {user.role === "Admin" && (
                        <>
                          <Link
                            to="/admin/dashboard"
                            onClick={closeMenu}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 16px",
                              fontSize: "0.84rem",
                              color: "#2563eb",
                              textDecoration: "none",
                              fontWeight: 700,
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span>📊</span>
                            <span>Trang quản trị (Admin)</span>
                          </Link>
                          <Link
                            to="/admin/bookings"
                            onClick={closeMenu}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 16px",
                              fontSize: "0.84rem",
                              color: "#334155",
                              textDecoration: "none",
                              fontWeight: 600,
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span>🗓️</span>
                            <span>Quản lý lịch hẹn</span>
                          </Link>
                        </>
                      )}

                      {user.role === "Technician" && (
                        <Link
                          to="/technician"
                          onClick={closeMenu}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 16px",
                            fontSize: "0.84rem",
                            color: "#7e22ce",
                            textDecoration: "none",
                            fontWeight: 700,
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f3ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span>🔧</span>
                          <span>Bàn làm việc KTV</span>
                        </Link>
                      )}
                    </div>

                    {/* DIVIDER & LOGOUT */}
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "4px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu()
                          logout()
                          navigate("/")
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 16px",
                          fontSize: "0.84rem",
                          color: "#ef4444",
                          background: "none",
                          border: "none",
                          fontWeight: 700,
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
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* NOT LOGGED IN */
            <>
              {/* DESKTOP 3 BUTTONS (HIDDEN ON RESPONSIVE) */}
              <div className="site-header-guest-desktop" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link
                  to="/booking"
                  className="site-header-book-btn"
                  style={{
                    height: "38px",
                    padding: "0 18px",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.86rem",
                    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Đặt lịch ngay
                </Link>
                <button
                  type="button"
                  className="site-header-login-btn"
                  onClick={() => openAuthModal("login")}
                  style={{
                    height: "38px",
                    padding: "0 16px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#0f172a",
                    fontWeight: 700,
                    fontSize: "0.86rem",
                    alignItems: "center",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className="site-header-register-btn"
                  onClick={() => openAuthModal("register")}
                  style={{
                    height: "38px",
                    padding: "0 16px",
                    borderRadius: "8px",
                    background: "transparent",
                    color: "#2563eb",
                    fontWeight: 700,
                    fontSize: "0.86rem",
                    alignItems: "center",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    border: "1.5px solid #bfdbfe",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Đăng ký
                </button>
              </div>

              {/* RESPONSIVE: REPLACE 3 BUTTONS WITH SINGLE USER ICON BUTTON */}
              <button
                type="button"
                className="site-header-mobile-user-btn"
                onClick={() => openAuthModal("login")}
                title="Tài khoản / Đăng nhập"
                aria-label="Tài khoản người dùng"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0f172a",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </>
          )}

          {/* MOBILE MENU TOGGLE BUTTON */}
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label="Mở trình đơn"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div
          style={{
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            padding: "16px 20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <NavLink to="/" end className="nav-link" onClick={closeMenu} style={{ padding: "8px 12px", textDecoration: "none", fontWeight: 600 }}>
            Trang chủ
          </NavLink>
          <NavLink to="/services" className="nav-link" onClick={closeMenu} style={{ padding: "8px 12px", textDecoration: "none", fontWeight: 600 }}>
            Dịch vụ
          </NavLink>
          <NavLink to="/pricing" className="nav-link" onClick={closeMenu} style={{ padding: "8px 12px", textDecoration: "none", fontWeight: 600 }}>
            Bảng giá
          </NavLink>
          <NavLink to="/branches" className="nav-link" onClick={closeMenu} style={{ padding: "8px 12px", textDecoration: "none", fontWeight: 600 }}>
            Khu vực phục vụ
          </NavLink>
          <NavLink to="/support" className="nav-link" onClick={closeMenu} style={{ padding: "8px 12px", textDecoration: "none", fontWeight: 600 }}>
            Hỗ trợ
          </NavLink>

          {user && (
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 12px 10px", borderBottom: "1px dashed #e2e8f0", marginBottom: "4px" }}>
                <img
                  src={getAvatarImage(user.fullName, user.role === "Technician")}
                  alt={userDisplay.displayName}
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <strong style={{ fontSize: "0.88rem", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {userDisplay.displayName}
                    </strong>
                    {getRoleBadge(user.role)}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: user.role === "Technician" ? "#7e22ce" : user.role === "Admin" ? "#b45309" : "#64748b", fontWeight: 600 }}>
                    {userDisplay.subtitle}
                  </span>
                </div>
              </div>
              <Link to="/my-bookings" onClick={closeMenu} style={{ padding: "8px 12px", textDecoration: "none", fontWeight: 600, color: "#2563eb" }}>
                📋 Lịch hẹn của tôi
              </Link>
              <Link to="/profile" onClick={closeMenu} style={{ padding: "8px 12px", textDecoration: "none", fontWeight: 600, color: "#334155" }}>
                👤 Thông tin cá nhân
              </Link>
              {user.role === "Admin" && (
                <Link to="/admin/dashboard" onClick={closeMenu} style={{ padding: "8px 12px", textDecoration: "none", fontWeight: 700, color: "#2563eb" }}>
                  📊 Trang quản trị (Admin)
                </Link>
              )}
              {user.role === "Technician" && (
                <Link to="/technician" onClick={closeMenu} style={{ padding: "8px 12px", textDecoration: "none", fontWeight: 700, color: "#7e22ce" }}>
                  🔧 Bàn làm việc KTV
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  logout()
                  navigate("/")
                }}
                style={{
                  padding: "8px 12px",
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                🚪 Đăng xuất
              </button>
            </div>
          )}

          {!user && (
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                to="/booking"
                onClick={closeMenu}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 700,
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Đặt lịch ngay
              </Link>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    openAuthModal("login")
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#0f172a",
                    fontWeight: 700,
                    textAlign: "center",
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    openAuthModal("register")
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    fontWeight: 700,
                    textAlign: "center",
                    border: "1px solid #bfdbfe",
                    cursor: "pointer",
                  }}
                >
                  Đăng ký
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUICK SEARCH POPUP MODAL (PORTAL TO BODY TO BREAK OUT OF HEADER BACKDROP-FILTER) */}
      {showSearchModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: "90px",
              paddingLeft: "16px",
              paddingRight: "16px",
            }}
            onClick={() => setShowSearchModal(false)}
          >
            <div
              ref={searchBoxRef}
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                padding: "20px",
                width: "100%",
                maxWidth: "560px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🔍</span>
                  <span>Tìm kiếm dịch vụ sửa chữa</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  style={{
                    border: "none",
                    background: "#f1f5f9",
                    color: "#64748b",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                  title="Đóng (Escape)"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  autoFocus
                  placeholder="Tìm kiếm dịch vụ (màn hình, pin, camera, loa...)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    height: "46px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    padding: "0 16px",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    padding: "0 22px",
                    borderRadius: "12px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Tìm
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
    </header>
  )
}
