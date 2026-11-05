import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { getCategories, getServices, type RepairService, type ServiceCategory, formatPrice } from "../api/catalog"
import { getServiceAreas, type ServiceArea } from "../api/branches"
import { createBooking, getSlots, type Slot } from "../api/bookings"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthContext"
import { BookingSuccessPage, type BookingSuccessState } from "./BookingSuccessPage"
import { useIsMobile } from "../utils/useMediaQuery"
import { getCategoryEmoji } from "../utils/category"

export function BookingWizardPage() {
  const [params] = useSearchParams()
  const { user, token } = useAuth()
  const isMobile = useIsMobile(900)

  // URL query pre-fills
  const preCategory = params.get("category") || params.get("categoryId")
  const preService = params.get("serviceId")
  const preArea = params.get("serviceAreaId") || params.get("branchId")

  // Data states
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [allServices, setAllServices] = useState<RepairService[]>([])
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([])
  const [_loadingData, setLoadingData] = useState(true)

  // Wizard Step (1 to 5)
  const [step, setStep] = useState<number>(1)

  // Step 1: Services
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([])

  // Step 2: Problem Description
  const [problemDescription, setProblemDescription] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  // Step 3: Address & Contact
  const [customerName, setCustomerName] = useState<string>(user?.fullName || "")
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phoneNumber || "")
  const [serviceAreaId, setServiceAreaId] = useState<number | null>(null)
  const [city, setCity] = useState<string>("TP. Hồ Chí Minh")
  const [district, setDistrict] = useState<string>("Quận 1")
  const [ward, setWard] = useState<string>("Phường Bến Nghé")
  const [addressLine, setAddressLine] = useState<string>("")

  // Step 4: Date & Slot
  const todayStr = new Date().toISOString().split("T")[0]
  const [appointmentDate, setAppointmentDate] = useState<string>(todayStr)
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>("")

  // Submission & Error states
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdBooking, setCreatedBooking] = useState<BookingSuccessState | null>(null)

  // Initial data load
  useEffect(() => {
    Promise.all([getCategories(), getServices(), getServiceAreas()])
      .then(([cats, svcs, areas]) => {
        const activeCats = cats.filter((c) => c.isActive)
        const activeSvcs = svcs.filter((s) => s.isActive)
        const activeAreas = areas.filter((a) => a.isActive)

        setCategories(activeCats)
        setAllServices(activeSvcs)
        setServiceAreas(activeAreas)

        // Pre-fill Category
        if (preCategory) {
          const cat = activeCats.find((c) => String(c.id) === preCategory || c.slug === preCategory)
          if (cat) setSelectedCategoryId(cat.id)
        } else if (activeCats.length > 0) {
          setSelectedCategoryId(activeCats[0].id)
        }

        // Pre-fill Service
        if (preService) {
          const svc = activeSvcs.find((s) => String(s.id) === preService)
          if (svc) {
            setSelectedServiceIds([svc.id])
            setSelectedCategoryId(svc.serviceCategoryId)
          }
        }

        // Pre-fill Area
        if (preArea) {
          const area = activeAreas.find((a) => String(a.id) === preArea)
          if (area) {
            setServiceAreaId(area.id)
            if (area.name.includes("Hà Nội")) setCity("Hà Nội")
            else if (area.name.includes("Đà Nẵng")) setCity("Đà Nẵng")
          }
        } else if (activeAreas.length > 0) {
          setServiceAreaId(activeAreas[0].id)
        }
      })
      .catch((err) => {
        console.error("Failed to load catalog data", err)
      })
      .finally(() => setLoadingData(false))
  }, [preCategory, preService, preArea])

  // Update slots whenever serviceAreaId or appointmentDate changes
  useEffect(() => {
    if (!serviceAreaId || !appointmentDate) return

    setSlotsLoading(true)
    getSlots(serviceAreaId, appointmentDate)
      .then((data) => {
        setSlots(data)
        const available = data.find((s) => !s.isFull)
        if (available) {
          setSelectedSlot(available.start)
        } else {
          setSelectedSlot("")
        }
      })
      .catch(() => {
        // Fallback default slots if API empty
        const defaultSlots: Slot[] = [
          { start: "08:00", end: "09:00", capacity: 4, booked: 1, isFull: false },
          { start: "09:30", end: "10:30", capacity: 4, booked: 0, isFull: false },
          { start: "11:00", end: "12:00", capacity: 4, booked: 2, isFull: false },
          { start: "13:30", end: "14:30", capacity: 4, booked: 1, isFull: false },
          { start: "15:00", end: "16:00", capacity: 4, booked: 0, isFull: false },
          { start: "16:30", end: "17:30", capacity: 4, booked: 4, isFull: true },
          { start: "18:00", end: "19:00", capacity: 4, booked: 2, isFull: false },
        ]
        setSlots(defaultSlots)
        setSelectedSlot("08:00")
      })
      .finally(() => setSlotsLoading(false))
  }, [serviceAreaId, appointmentDate])

  // Services in currently active category
  const servicesInCategory = useMemo(() => {
    if (!selectedCategoryId) return allServices
    return allServices.filter((s) => s.serviceCategoryId === selectedCategoryId)
  }, [allServices, selectedCategoryId])

  // Selected services objects
  const selectedServices = useMemo(() => {
    return allServices.filter((s) => selectedServiceIds.includes(s.id))
  }, [allServices, selectedServiceIds])

  // Total estimated price
  const estimatedPriceTotal = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (s.basePrice || 0), 0)
  }, [selectedServices])

  // Service toggle handler
  const handleToggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Handle Submit Booking
  const handleConfirmBooking = async () => {
    if (!token) {
      alert("Vui lòng đăng nhập tài khoản Khách hàng để hoàn tất đặt lịch.")
      return
    }

    if (selectedServiceIds.length === 0) {
      setErrorMessage("Vui lòng chọn ít nhất 1 dịch vụ cần sửa chữa.")
      setStep(1)
      return
    }

    if (!addressLine.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ cụ thể để kỹ thuật viên đến sửa chữa.")
      setStep(3)
      return
    }

    if (!selectedSlot) {
      setErrorMessage("Vui lòng chọn khung giờ hẹn còn khả dụng.")
      setStep(4)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = {
        serviceAreaId: serviceAreaId || (serviceAreas[0]?.id ?? 1),
        repairServiceIds: selectedServiceIds,
        customerName: customerName.trim() || user?.fullName || "Khách hàng HomeFix",
        customerPhone: customerPhone.trim() || user?.phoneNumber || "0901234567",
        addressLine: addressLine.trim(),
        ward: ward.trim(),
        district: district.trim(),
        city: city.trim(),
        appointmentDate,
        slotStart: selectedSlot,
        problemDescription: problemDescription.trim() || "Cần kiểm tra và sửa chữa tại nhà",
      }

      const res = await createBooking(token, payload)

      const successState: BookingSuccessState = {
        booking: res,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        addressLine: payload.addressLine,
        ward: payload.ward,
        district: payload.district,
        city: payload.city,
        fullAddress: `${payload.addressLine}, ${payload.ward}, ${payload.district}, ${payload.city}`,
        serviceAreaName: serviceAreas.find((a) => a.id === payload.serviceAreaId)?.name,
        appointmentDate: payload.appointmentDate,
        slotTime: payload.slotStart,
        problemDescription: payload.problemDescription,
        services: selectedServices.map((s) => ({
          name: s.name,
          price: s.basePrice,
          pricingType: s.pricingType,
          desc: s.description || undefined,
        })),
        totalAmount: estimatedPriceTotal,
      }

      setCreatedBooking(successState)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || "Không thể tạo lịch đặt. Vui lòng thử lại.")
      } else {
        setErrorMessage("Đã xảy ra lỗi khi kết nối máy chủ.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  // If successfully created, render BookingSuccessPage directly
  if (createdBooking) {
    return <BookingSuccessPage initialData={createdBooking} />
  }

  const stepsList = [
    { num: 1, label: "Chọn dịch vụ", icon: "🛠️" },
    { num: 2, label: "Mô tả sự cố", icon: "📝" },
    { num: 3, label: "Địa chỉ tại nhà", icon: "📍" },
    { num: 4, label: "Ngày & Giờ", icon: "📅" },
    { num: 5, label: "Xác nhận", icon: "✓" },
  ]

  return (
    <main
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        padding: isMobile ? "20px 12px 64px" : "32px 20px 80px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
        {/* HEADER */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: isMobile ? "20px" : "32px",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: isMobile ? "0.74rem" : "0.82rem",
              fontWeight: 700,
              color: "#2563eb",
              background: "#eff6ff",
              padding: "4px 14px",
              borderRadius: "999px",
              display: "inline-block",
              marginBottom: "8px",
            }}
          >
            ĐẶT LỊCH SỬA CHỮA TẠI NHÀ
          </span>
          <h1
            style={{
              fontSize: isMobile ? "1.5rem" : "2rem",
              fontWeight: 900,
              color: "#0f172a",
              margin: "0 auto 8px",
              textAlign: "center",
              width: "100%",
              maxWidth: "800px",
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
            }}
          >
            Yêu cầu kỹ thuật viên đến tận nơi
          </h1>
          <p
            style={{
              fontSize: isMobile ? "0.86rem" : "0.95rem",
              color: "#64748b",
              margin: "0 auto",
              maxWidth: "600px",
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            Chỉ với vài thao tác đơn giản để thợ kỹ thuật có mặt đúng hẹn, khảo sát và sửa chữa tận nhà.
          </p>
        </section>

        {/* STEP PROGRESS BAR */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: isMobile ? "14px 16px" : "18px 24px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
          {isMobile ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2563eb" }}>
                  Bước {step}/5: {stepsList[step - 1].label}
                </span>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>
                  {Math.round((step / 5) * 100)}%
                </span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", marginBottom: "12px" }}>
                <div style={{ width: `${(step / 5) * 100}%`, height: "100%", background: "#2563eb", borderRadius: "999px", transition: "width 0.3s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}>
                {stepsList.map((s) => {
                  const isPassed = step > s.num
                  const isCurrent = step === s.num
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => {
                        if (isPassed) setStep(s.num)
                      }}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        borderRadius: "8px",
                        border: isCurrent ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        background: isCurrent ? "#eff6ff" : isPassed ? "#f0fdf4" : "#ffffff",
                        color: isCurrent ? "#2563eb" : isPassed ? "#16a34a" : "#94a3b8",
                        fontWeight: 700,
                        fontSize: "0.76rem",
                        cursor: isPassed ? "pointer" : "default",
                        textAlign: "center",
                      }}
                    >
                      {isPassed ? `✓ ${s.num}` : `${s.icon} ${s.num}`}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
              {stepsList.map((s) => {
                const isPassed = step > s.num
                const isCurrent = step === s.num
                return (
                  <div
                    key={s.num}
                    onClick={() => {
                      if (isPassed) setStep(s.num)
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: isPassed ? "pointer" : "default",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: isCurrent ? "#2563eb" : isPassed ? "#16a34a" : "#f1f5f9",
                        color: isCurrent || isPassed ? "#ffffff" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        boxShadow: isCurrent ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {isPassed ? "✓" : s.num}
                    </div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? "#2563eb" : isPassed ? "#0f172a" : "#94a3b8",
                        marginTop: "6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ERROR MESSAGE DISPLAY */}
        {errorMessage && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "14px 18px", color: "#dc2626", fontSize: "0.88rem", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* WIZARD CONTENT BOX */}
        <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: isMobile ? "20px 16px" : "32px 28px", boxShadow: "0 4px 14px rgba(15,23,42,0.03)" }}>
          {/* ==================== STEP 1: CHỌN DỊCH VỤ ==================== */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                  Bước 1: Chọn dịch vụ cần sửa chữa
                </h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  Chọn nhóm danh mục bên dưới, sau đó đánh dấu vào một hoặc nhiều dịch vụ cần hỗ trợ.
                </p>
              </div>

              {/* CATEGORY TABS */}
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "24px" }}>
                {categories.map((cat) => {
                  const isCatActive = selectedCategoryId === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: isCatActive ? "#2563eb" : "#e2e8f0",
                        background: isCatActive ? "#eff6ff" : "#ffffff",
                        color: isCatActive ? "#2563eb" : "#334155",
                        fontWeight: isCatActive ? 700 : 500,
                        fontSize: "0.88rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{getCategoryEmoji(cat.iconName, cat.slug, cat.name)}</span>
                      <span>{cat.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* SERVICES LIST IN CATEGORY */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "14px", marginBottom: "28px" }}>
                {servicesInCategory.map((svc) => {
                  const isChecked = selectedServiceIds.includes(svc.id)
                  return (
                    <div
                      key={svc.id}
                      onClick={() => handleToggleService(svc.id)}
                      style={{
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: isChecked ? "#2563eb" : "#e2e8f0",
                        background: isChecked ? "#f0f7ff" : "#ffffff",
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ marginTop: "4px", width: "18px", height: "18px", cursor: "pointer", accentColor: "#2563eb" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "0.95rem", color: isChecked ? "#1d4ed8" : "#0f172a" }}>
                            {svc.name}
                          </strong>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2563eb" }}>
                            {formatPrice(svc.basePrice, svc.pricingType)}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "#64748b", lineHeight: 1.4 }}>
                          {svc.description || "Dịch vụ kỹ thuật chuyên nghiệp, thợ đến tận nhà."}
                        </p>
                        <div style={{ display: "flex", gap: "10px", fontSize: "0.72rem", color: "#64748b" }}>
                          <span>⏱️ {svc.estimatedDuration || "30-60 phút"}</span>
                          <span>•</span>
                          <span>{svc.pricingType === "FixedPrice" ? "Giá cố định" : "Khảo sát báo giá"}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* SUMMARY OF SELECTED */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "14px",
                  padding: isMobile ? "14px 16px" : "16px 20px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexDirection: isMobile ? "column" : "row",
                  gap: "14px",
                }}
              >
                <div style={{ width: isMobile ? "100%" : "auto", textAlign: isMobile ? "center" : "left" }}>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Đã chọn: <strong style={{ color: "#0f172a" }}>{selectedServiceIds.length} dịch vụ</strong>
                  </span>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#2563eb", marginTop: "2px" }}>
                    Tạm tính: {estimatedPriceTotal.toLocaleString("vi-VN")}đ
                  </div>
                </div>

                <button
                  type="button"
                  disabled={selectedServiceIds.length === 0}
                  onClick={() => {
                    if (selectedServiceIds.length > 0) setStep(2)
                  }}
                  style={{
                    width: isMobile ? "100%" : "auto",
                    background: selectedServiceIds.length > 0 ? "#2563eb" : "#cbd5e1",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px 28px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: selectedServiceIds.length > 0 ? "pointer" : "not-allowed",
                    boxShadow: selectedServiceIds.length > 0 ? "0 4px 12px rgba(37,99,235,0.25)" : "none",
                    textAlign: "center",
                  }}
                >
                  Tiếp tục: Mô tả sự cố →
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 2: MÔ TẢ SỰ CỐ ==================== */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                  Bước 2: Mô tả chi tiết sự cố tại nhà
                </h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  Giúp kỹ thuật viên chuẩn bị sẵn công cụ, linh kiện và phụ tùng thay thế phù hợp trước khi đến.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "28px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                    Hiện tượng và tình trạng sự cố <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="Ví dụ: Ổ cắm điện ở phòng khách bị chập tóe lửa, aptomat nhảy liên tục khi cắm bình siêu tốc..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                    Lưu ý thêm cho kỹ thuật viên (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ví dụ: Nhà chung cư tầng 15 cần báo bảo vệ gửi thang máy, có sẵn thang chữ A..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexDirection: isMobile ? "column-reverse" : "row" }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ width: isMobile ? "100%" : "auto", background: "#f1f5f9", color: "#334155", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", textAlign: "center" }}
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  style={{ width: isMobile ? "100%" : "auto", background: "#2563eb", color: "#ffffff", border: "none", padding: "12px 28px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.25)", textAlign: "center" }}
                >
                  Tiếp tục: Địa chỉ tại nhà →
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 3: ĐỊA CHỈ SỬA CHỮA ==================== */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                  Bước 3: Địa chỉ sửa chữa tại nhà & Người liên hệ
                </h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  Kỹ thuật viên sẽ di chuyển đến đúng vị trí này để thực hiện công việc.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Họ và tên người liên hệ <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Số điện thoại liên hệ <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0901 234 567"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Khu vực đội thợ phụ trách <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={serviceAreaId || ""}
                    onChange={(e) => setServiceAreaId(Number(e.target.value))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "#ffffff", boxSizing: "border-box" }}
                  >
                    {serviceAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Tỉnh / Thành phố
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="TP. Hồ Chí Minh"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Quận 1"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Phường / Xã
                  </label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="Phường Bến Nghé"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                    Số nhà, tên đường, số căn hộ/phòng <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Số 45/12 đường Nguyễn Huệ, Tòa nhà Sky City, Căn hộ 12B"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexDirection: isMobile ? "column-reverse" : "row" }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{ width: isMobile ? "100%" : "auto", background: "#f1f5f9", color: "#334155", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", textAlign: "center" }}
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!addressLine.trim()) {
                      alert("Vui lòng nhập số nhà và tên đường.")
                      return
                    }
                    setStep(4)
                  }}
                  style={{ width: isMobile ? "100%" : "auto", background: "#2563eb", color: "#ffffff", border: "none", padding: "12px 28px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.25)", textAlign: "center" }}
                >
                  Tiếp tục: Ngày & Giờ hẹn →
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 4: NGÀY & KHUNG GIỜ ==================== */}
          {step === 4 && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                  Bước 4: Chọn ngày và khung giờ kỹ thuật viên có mặt
                </h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  Hệ thống kiểm tra công suất phục vụ thực tế của đội thợ khu vực để đảm bảo không bị quá tải.
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                  Chọn ngày hẹn sửa chữa:
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
                  Khung giờ khả dụng trong ngày ({slots.length} khung giờ):
                </label>

                {slotsLoading ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                    Đang kiểm tra lịch trống của thợ...
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
                    {slots.map((s) => {
                      const isSelected = selectedSlot === s.start
                      const isFull = s.isFull
                      return (
                        <button
                          key={s.start}
                          type="button"
                          disabled={isFull}
                          onClick={() => setSelectedSlot(s.start)}
                          style={{
                            padding: "14px 10px",
                            borderRadius: "10px",
                            border: "1px solid",
                            borderColor: isSelected ? "#2563eb" : isFull ? "#e2e8f0" : "#cbd5e1",
                            background: isSelected ? "#2563eb" : isFull ? "#f8fafc" : "#ffffff",
                            color: isSelected ? "#ffffff" : isFull ? "#94a3b8" : "#0f172a",
                            cursor: isFull ? "not-allowed" : "pointer",
                            textAlign: "center",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <strong style={{ display: "block", fontSize: "0.95rem", marginBottom: "4px" }}>
                            {s.start} - {s.end}
                          </strong>
                          <span style={{ fontSize: "0.72rem", color: isSelected ? "rgba(255,255,255,0.85)" : isFull ? "#ef4444" : "#16a34a" }}>
                            {isFull ? "Đã kín lịch" : `Còn chỗ (${s.capacity - s.booked})`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* BUTTONS */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexDirection: isMobile ? "column-reverse" : "row" }}>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  style={{ width: isMobile ? "100%" : "auto", background: "#f1f5f9", color: "#334155", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", textAlign: "center" }}
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => {
                    if (selectedSlot) setStep(5)
                  }}
                  style={{
                    width: isMobile ? "100%" : "auto",
                    background: selectedSlot ? "#2563eb" : "#cbd5e1",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 28px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: selectedSlot ? "pointer" : "not-allowed",
                    boxShadow: selectedSlot ? "0 4px 12px rgba(37,99,235,0.25)" : "none",
                    textAlign: "center",
                  }}
                >
                  Tiếp tục: Xác nhận đơn →
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 5: XÁC NHẬN & HOÀN TẤT ==================== */}
          {step === 5 && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                  Bước 5: Xác nhận thông tin đặt lịch
                </h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  Kiểm tra lại toàn bộ thông tin trước khi gửi yêu cầu tới đội ngũ kỹ thuật HomeFix.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: "24px", marginBottom: "32px" }}>
                {/* SUMMARY DETAILS */}
                <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "20px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                    📍 Địa chỉ phục vụ & thời gian
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.86rem" }}>
                    <div>
                      <span style={{ color: "#64748b" }}>Người liên hệ: </span>
                      <strong>{customerName}</strong> ({customerPhone})
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Khu vực phụ trách: </span>
                      <strong>{serviceAreas.find((a) => a.id === serviceAreaId)?.name}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Địa chỉ nhà: </span>
                      <strong>{addressLine}, {ward}, {district}, {city}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Thời gian thợ đến: </span>
                      <strong style={{ color: "#2563eb" }}>{appointmentDate} ({selectedSlot})</strong>
                    </div>
                    {problemDescription && (
                      <div>
                        <span style={{ color: "#64748b" }}>Mô tả sự cố: </span>
                        <span>{problemDescription}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SERVICES & COSTS */}
                <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "20px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                      🛠️ Dịch vụ đã chọn
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                      {selectedServices.map((svc) => (
                        <div key={svc.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                          <span style={{ color: "#334155" }}>• {svc.name}</span>
                          <strong style={{ color: "#2563eb" }}>
                            {formatPrice(svc.basePrice, svc.pricingType)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>Tổng tạm tính:</span>
                      <strong style={{ fontSize: "1.25rem", color: "#2563eb", fontWeight: 900 }}>
                        {estimatedPriceTotal.toLocaleString("vi-VN")}đ
                      </strong>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginTop: "4px" }}>
                      * Báo giá chính xác được kỹ thuật viên khảo sát và thống nhất trực tiếp tại nhà trước khi sửa chữa.
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexDirection: isMobile ? "column-reverse" : "row" }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep(4)}
                  style={{ width: isMobile ? "100%" : "auto", background: "#f1f5f9", color: "#334155", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", textAlign: "center" }}
                >
                  ← Chỉnh sửa ngày giờ
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmBooking}
                  style={{
                    width: isMobile ? "100%" : "auto",
                    background: submitting ? "#93c5fd" : "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    padding: "14px 36px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
                    textAlign: "center",
                  }}
                >
                  {submitting ? "Đang gửi yêu cầu..." : "✓ Xác nhận đặt lịch thợ"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
