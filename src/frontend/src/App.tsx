import { Navigate, Route, Routes, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { getHealth } from "./api/health"
import { AuthProvider } from "./auth/AuthContext"
import { RequireAuth } from "./components/auth/RequireAuth"
import { SiteFooter } from "./components/layout/SiteFooter"
import { SiteHeader } from "./components/layout/SiteHeader"
import { AuthModal } from "./components/auth/AuthModal"
import { AdminBookingsPage } from "./pages/AdminBookingsPage"
import { AdminCatalogPage } from "./pages/AdminCatalogPage"
import { AdminCustomersPage } from "./pages/AdminCustomersPage"
import { AdminDashboardPage } from "./pages/AdminDashboardPage"
import { AdminOperationsPage } from "./pages/AdminOperationsPage"
import { AdminReportsPage } from "./pages/AdminReportsPage"
import { AdminReviewsPage } from "./pages/AdminReviewsPage"
import { BookingDetailPage } from "./pages/BookingDetailPage"
import { BookingSuccessPage } from "./pages/BookingSuccessPage"
import { BookingWizardPage } from "./pages/BookingWizardPage"
import { BrandsPage } from "./pages/BrandsPage"
import { BranchesPage } from "./pages/BranchesPage"
import { HomePage } from "./pages/HomePage"
import { ModelsPage } from "./pages/ModelsPage"
import { MyBookingsPage } from "./pages/MyBookingsPage"
import { PricingPage } from "./pages/PricingPage"
import { ProfilePage } from "./pages/ProfilePage"

import { RoleHomePage } from "./pages/RoleHomePage"
import { ServicesPage } from "./pages/ServicesPage"
import { SupportPage } from "./pages/SupportPage"
import { TechnicianHomePage } from "./pages/TechnicianHomePage"

function LegacyBookingDetailRedirect() {
  const { id } = useParams()
  return <Navigate to={`/my-bookings/${id}`} replace />
}

function Shell() {
  const [databaseConnected, setDatabaseConnected] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    getHealth()
      .then((health) => {
        if (active) {
          setDatabaseConnected(health.database === "connected")
        }
      })
      .catch(() => {
        if (active) {
          setDatabaseConnected(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <SiteHeader />
      <AuthModal />
      <Routes>
        {/* PUBLIC ENGLISH ROUTES MATCHING SCREENSHOTS */}
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/services/:id" element={<PricingPage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/booking" element={<BookingWizardPage />} />
        <Route path="/booking/success" element={<BookingSuccessPage />} />

        {/* CUSTOMER PORTAL */}
        <Route path="/my-bookings" element={<RequireAuth role="Customer"><MyBookingsPage /></RequireAuth>} />
        <Route path="/my-bookings/:id" element={<RequireAuth role="Customer"><BookingDetailPage /></RequireAuth>} />

        {/* AUTH ROUTES */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />

        {/* TECHNICIAN PORTAL */}
        <Route
          path="/technician"
          element={
            <RequireAuth role="Technician">
              <TechnicianHomePage />
            </RequireAuth>
          }
        />

        {/* ADMIN PORTALS */}
        <Route
          path="/admin"
          element={
            <RequireAuth role="Admin">
              <RoleHomePage
                title="Khu vực quản trị"
                description="Quản lý toàn bộ lịch hẹn, phân công kỹ thuật viên, danh mục và khách hàng."
              />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/dashboard"
          element={<RequireAuth role="Admin"><AdminDashboardPage /></RequireAuth>}
        />
        <Route
          path="/admin/bookings"
          element={<RequireAuth role="Admin"><AdminBookingsPage /></RequireAuth>}
        />
        <Route
          path="/admin/reports"
          element={<RequireAuth role="Admin"><AdminReportsPage /></RequireAuth>}
        />
        <Route
          path="/admin/customers"
          element={<RequireAuth role="Admin"><AdminCustomersPage /></RequireAuth>}
        />
        <Route
          path="/admin/accounts"
          element={<RequireAuth role="Admin"><AdminCustomersPage /></RequireAuth>}
        />
        <Route
          path="/admin/operations"
          element={<RequireAuth role="Admin"><AdminOperationsPage /></RequireAuth>}
        />
        <Route
          path="/admin/catalog"
          element={<RequireAuth role="Admin"><AdminCatalogPage /></RequireAuth>}
        />
        <Route
          path="/admin/reviews"
          element={<RequireAuth role="Admin"><AdminReviewsPage /></RequireAuth>}
        />

        {/* LEGACY VIETNAMESE ROUTE REDIRECTS FOR FULL BACKWARD COMPATIBILITY */}
        <Route path="/dich-vu" element={<Navigate to="/services" replace />} />
        <Route path="/chi-nhanh" element={<Navigate to="/branches" replace />} />
        <Route path="/hang" element={<Navigate to="/brands" replace />} />
        <Route path="/dong-may" element={<Navigate to="/models" replace />} />
        <Route path="/ho-tro" element={<Navigate to="/support" replace />} />
        <Route path="/dat-lich" element={<Navigate to="/booking" replace />} />
        <Route path="/dang-nhap" element={<Navigate to="/" replace />} />
        <Route path="/dang-ky" element={<Navigate to="/" replace />} />
        <Route path="/ho-so" element={<Navigate to="/profile" replace />} />
        <Route path="/tai-khoan" element={<Navigate to="/profile" replace />} />
        <Route path="/lich-cua-toi" element={<Navigate to="/my-bookings" replace />} />
        <Route path="/lich-cua-toi/:id" element={<LegacyBookingDetailRedirect />} />
        <Route path="/ky-thuat-vien" element={<Navigate to="/technician" replace />} />
        <Route path="/quan-tri" element={<Navigate to="/admin" replace />} />
        <Route path="/quan-tri/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/quan-tri/lich-hen" element={<Navigate to="/admin/bookings" replace />} />
        <Route path="/quan-tri/bao-cao" element={<Navigate to="/admin/reports" replace />} />
        <Route path="/quan-tri/khach-hang" element={<Navigate to="/admin/customers" replace />} />
        <Route path="/quan-tri/tai-khoan" element={<Navigate to="/admin/customers" replace />} />
        <Route path="/quan-tri/cua-hang" element={<Navigate to="/admin/operations" replace />} />
        <Route path="/quan-tri/danh-muc" element={<Navigate to="/admin/catalog" replace />} />
        <Route path="/quan-tri/danh-gia" element={<Navigate to="/admin/reviews" replace />} />
      </Routes>
      <SiteFooter databaseConnected={databaseConnected} />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
