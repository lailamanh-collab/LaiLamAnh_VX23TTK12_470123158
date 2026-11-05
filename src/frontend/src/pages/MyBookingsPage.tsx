import { useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { myBookings, myBooking, type BookingSummary, type BookingDetail, statusLabel } from "../api/bookings"
import { updateProfile, changePassword } from "../api/auth"
import { submitReview, fetchMyReviews, type ReviewItem } from "../api/reviews"
import { useAuth } from "../auth/AuthContext"
import { getPhoneImage, getAvatarImage } from "../assets"
import { getCategoryTheme } from "../utils/category"
import { formatDateTimeVi, formatStepDateTime } from "../utils/date"
import { useIsMobile } from "../utils/useMediaQuery"

type PortalTabId = "overview" | "bookings" | "profile" | "password" | "devices" | "reviews" | "vouchers" | "notifications"

interface MockBookingItem {
  id: number
  bookingCode: string
  phoneModelName?: string
  brandName?: string
  serviceName?: string
  serviceCategoryName?: string
  serviceAreaName?: string
  customerAddress?: string
  status: "InProgress" | "Completed" | "Cancelled" | "Pending" | string
  statusLabel: string
  statusBg: string
  statusColor: string
  appointmentDate: string
  appointmentTime: string
  estimatedTotal: number
  branchName: string
  branchAddress: string
  image: string
  storage?: string
  color?: string
  serial?: string
  technicianName?: string | null
  technicianRole?: string | null
  technicianRating?: string | null
  technicianAvatar?: string | null
  services?: { id: number; name: string; price: number; quantity: number }[]
  timeline?: { time: string; title: string; desc: string; isDone: boolean; rawTime?: string }[]
  customerNote?: string | null
  technicianNote?: string | null
  createdAt?: string
  hasReview?: boolean
}

const BRANCH_ADDRESSES: Record<string, string> = {
  // TP. Hồ Chí Minh
  "Khu vực Quận 1": "12 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM",
  "Khu vực Quận 3": "368 Cách Mạng Tháng 8, Phường 10, Quận 3, TP.HCM",
  "Khu vực Quận 5": "145 Trần Hưng Đạo, Phường 6, Quận 5, TP.HCM",
  "Khu vực Quận 7": "45 Nguyễn Văn Linh, Tân Phong, Quận 7, TP.HCM",
  "Khu vực Quận 10": "285 Đường 3 Tháng 2, Phường 10, Quận 10, TP.HCM",
  "Khu vực Bình Thạnh": "207 Phan Đăng Lưu, Phường 1, Bình Thạnh, TP.HCM",
  "Khu vực Gò Vấp": "598 Quang Trung, Phường 11, Gò Vấp, TP.HCM",
  "Khu vực Tân Bình": "420 Cộng Hòa, Phường 13, Tân Bình, TP.HCM",
  "Khu vực Phú Nhuận": "184 Phan Xích Long, Phường 2, Phú Nhuận, TP.HCM",
  "Khu vực Thủ Đức": "216 Võ Văn Ngân, Bình Thọ, TP. Thủ Đức, TP.HCM",
  // Hà Nội
  "Khu vực Cầu Giấy": "123 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội",
  "Khu vực Đống Đa": "456 Xã Đàn, Nam Đồng, Đống Đa, Hà Nội",
  "Khu vực Hai Bà Trưng": "789 Phố Huế, Hàng Bài, Hai Bà Trưng, Hà Nội",
  "Khu vực Ba Đình": "88 Kim Mã, Kim Mã, Ba Đình, Hà Nội",
  "Khu vực Thanh Xuân": "312 Nguyễn Trãi, Thanh Xuân Trung, Thanh Xuân, Hà Nội",
  "Khu vực Long Biên": "154 Nguyễn Văn Cừ, Bồ Đề, Long Biên, Hà Nội",
  // Đà Nẵng
  "Khu vực Hải Châu": "102 Nguyễn Văn Linh, Nam Dương, Hải Châu, Đà Nẵng",
  "Khu vực Thanh Khê": "250 Điện Biên Phủ, Chính Gián, Thanh Khê, Đà Nẵng",
}

function getBranchAddress(branchName: string): string {
  if (!branchName) return "Trạm điều phối phục vụ tại nhà HomeFix"
  if (BRANCH_ADDRESSES[branchName]) return BRANCH_ADDRESSES[branchName]
  for (const [key, addr] of Object.entries(BRANCH_ADDRESSES)) {
    if (branchName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(branchName.toLowerCase())) {
      return addr
    }
  }
  return "Trạm điều phối phục vụ tại nhà HomeFix"
}

function getRealisticPhoneColor(brandName: string, modelName: string): string {
  const brand = (brandName || "").toLowerCase()
  const model = (modelName || "").toLowerCase()
  if (brand.includes("apple")) {
    if (model.includes("15") || model.includes("16")) return "Titan Tự Nhiên"
    if (model.includes("14")) return "Tím Ánh Kim"
    return "Xanh Midnight"
  }
  if (brand.includes("samsung")) {
    if (model.includes("ultra")) return "Titan Xám"
    return "Phantom Black"
  }
  if (brand.includes("xiaomi")) {
    if (model.includes("ultra")) return "Đen Da Sinh Học (Black)"
    return "Đen Nhám (Matte Black)"
  }
  if (brand.includes("oppo")) return "Bạc Ánh Sao"
  if (brand.includes("vivo")) return "Xanh Lục Bảo"
  return "Tiêu chuẩn chính hãng"
}

function formatVietnameseDate(dateStr: string): string {
  if (!dateStr) return ""
  if (dateStr.includes("Thứ") || dateStr.includes("Chủ nhật")) return dateStr
  try {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      const dayOfWeek = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][d.getDay()]
      return `${dayOfWeek}, ${parts[2]}/${parts[1]}/${parts[0]}`
    }
  } catch {}
  return dateStr
}

function parseCustomerProblem(problemDesc?: string) {
  if (!problemDesc) return { note: "", storage: null, color: null, condition: null }
  let note = problemDesc
  let storage: string | null = null
  let color: string | null = null
  let condition: string | null = null

  const match = problemDesc.match(/\[(.*?)\]/)
  if (match) {
    note = problemDesc.replace(/\[(.*?)\]/, "").trim()
    const inner = match[1]
    const storageMatch = inner.match(/Dung lượng:\s*([^|\]]+)/i)
    if (storageMatch) storage = storageMatch[1].trim()
    const colorMatch = inner.match(/Màu:\s*([^|\]]+)/i)
    if (colorMatch) color = colorMatch[1].trim()
    const conditionMatch = inner.match(/Tình trạng:\s*([^|\]]+)/i)
    if (conditionMatch) condition = conditionMatch[1].trim()
  }

  return { note: note || problemDesc, storage, color, condition }
}

function getBookingTrackerSteps(b: MockBookingItem) {
  const status = b.status
  const isCancelled = status === "Cancelled" || b.statusLabel === "Đã hủy"
  const isCompleted = status === "Completed" || b.statusLabel === "Hoàn thành"
  const timeline = b.timeline || []

  // 1. NẾU LỊCH HẸN BỊ HỦY: Dựng các bước thực tế đã diễn ra kết thúc bằng bước ĐÃ HỦY
  if (isCancelled) {
    const cancelItem = timeline.find((t) => t.title === "Đã hủy" || t.title?.toLowerCase().includes("hủy"))
    const cancelTime = cancelItem?.rawTime ? formatStepDateTime(cancelItem.rawTime) : (cancelItem?.time || "Đã hủy")
    const cancelReason = cancelItem?.desc || "Lịch hẹn đã bị hủy"

    const steps: {
      num: number
      title: string
      time: string
      done: boolean
      active: boolean
      isCancelledStep?: boolean
      reason?: string
    }[] = []

    // Bước 1: Đặt lịch (thời điểm khách tạo đơn thực tế)
    const createItem = timeline.find((t) => t.title === "Chờ xác nhận" || t.title?.toLowerCase().includes("tạo") || t.title?.toLowerCase().includes("đặt lịch"))
    const createRaw = createItem?.rawTime || b.createdAt
    const createTime = createRaw ? formatStepDateTime(createRaw) : (createItem ? createItem.time : "Đã tạo")
    steps.push({
      num: 1,
      title: "Đặt lịch",
      time: createTime,
      done: true,
      active: false,
    })

    // Bước 2: Đã xác nhận (nếu có trong timeline)
    const confirmItem = timeline.find((t) => t.title === "Đã xác nhận" || (t.title?.toLowerCase().includes("xác nhận") && t !== createItem && t !== cancelItem))
    if (confirmItem && confirmItem !== cancelItem) {
      steps.push({
        num: steps.length + 1,
        title: "Đã xác nhận",
        time: confirmItem.rawTime ? formatStepDateTime(confirmItem.rawTime) : confirmItem.time,
        done: true,
        active: false,
      })
    }

    // Bước: Đã tiếp nhận (nếu có)
    const receiveItem = timeline.find((t) => t.title === "Đã tiếp nhận tại nhà" || t.title?.toLowerCase().includes("tiếp nhận"))
    if (receiveItem && receiveItem !== cancelItem) {
      steps.push({
        num: steps.length + 1,
        title: "Đã tiếp nhận",
        time: receiveItem.rawTime ? formatStepDateTime(receiveItem.rawTime) : receiveItem.time,
        done: true,
        active: false,
      })
    }

    // Bước: Đang kiểm tra (nếu có)
    const inspectItem = timeline.find((t) => t.title === "Đang kiểm tra" || t.title?.toLowerCase().includes("kiểm tra"))
    if (inspectItem && inspectItem !== cancelItem) {
      steps.push({
        num: steps.length + 1,
        title: "Đang kiểm tra",
        time: inspectItem.rawTime ? formatStepDateTime(inspectItem.rawTime) : inspectItem.time,
        done: true,
        active: false,
      })
    }

    // Bước kết thúc: ĐÃ HỦY
    steps.push({
      num: steps.length + 1,
      title: "Đã hủy",
      time: cancelTime,
      done: false,
      active: true,
      isCancelledStep: true,
      reason: cancelReason,
    })

    return steps
  }

  // 2. NẾU LỊCH HẸN BÌNH THƯỜNG (KHÔNG HỦY): 6 bước quy chuẩn tuần tự
  const isRepairing = status === "InProgress" || b.statusLabel === "Đang sửa chữa" || b.statusLabel === "Đang sửa"
  const isInspecting = b.statusLabel === "Đang kiểm tra"
  const isReceived = b.statusLabel === "Đang di chuyển" || b.statusLabel === "Đã phân công" || b.statusLabel === "Đã tiếp nhận"
  const isConfirmed = b.statusLabel === "Đã xác nhận"

  let activeStepNum = 1
  if (isCompleted) activeStepNum = 6
  else if (isRepairing) activeStepNum = 5
  else if (isInspecting) activeStepNum = 4
  else if (isReceived) activeStepNum = 3
  else if (isConfirmed) activeStepNum = 2

  const findTimelineItem = (keys: string[]) => {
    return timeline.find((t) => keys.some((k) => t.title?.toLowerCase().includes(k.toLowerCase())))
  }

  const createItem = findTimelineItem(["chờ xác nhận", "tạo lịch", "đặt lịch"])
  const createRaw = createItem?.rawTime || b.createdAt
  const createTime = createRaw ? formatStepDateTime(createRaw) : (createItem ? createItem.time : "Đã tạo")

  const confirmItem = findTimelineItem(["đã xác nhận"])
  const confirmTime = confirmItem ? (confirmItem.rawTime ? formatStepDateTime(confirmItem.rawTime) : confirmItem.time) : (activeStepNum >= 2 ? "Đã duyệt" : "- - : - -")

  const receiveItem = findTimelineItem(["di chuyển", "đang đến", "phân công", "tiếp nhận"])
  const receiveTime = receiveItem ? (receiveItem.rawTime ? formatStepDateTime(receiveItem.rawTime) : receiveItem.time) : (activeStepNum >= 3 ? "Đang di chuyển" : "- - : - -")

  const inspectItem = findTimelineItem(["kiểm tra"])
  const inspectTime = inspectItem ? (inspectItem.rawTime ? formatStepDateTime(inspectItem.rawTime) : inspectItem.time) : (activeStepNum >= 4 ? "Đang xử lý" : "- - : - -")

  const repairItem = findTimelineItem(["đang sửa", "sửa chữa"])
  const repairTime = repairItem ? (repairItem.rawTime ? formatStepDateTime(repairItem.rawTime) : repairItem.time) : (activeStepNum >= 5 ? "Đang sửa" : "- - : - -")

  const completeItem = findTimelineItem(["hoàn thành"])
  const completeTime = completeItem ? (completeItem.rawTime ? formatStepDateTime(completeItem.rawTime) : completeItem.time) : (isCompleted ? "Hoàn tất" : "- - : - -")

  return [
    {
      num: 1,
      title: "Đặt lịch",
      time: createTime,
      done: activeStepNum > 1 || isCompleted,
      active: activeStepNum === 1,
    },
    {
      num: 2,
      title: "Xác nhận",
      time: confirmTime,
      done: activeStepNum > 2 || isCompleted,
      active: activeStepNum === 2,
    },
    {
      num: 3,
      title: "Đang đến nhà",
      time: receiveTime,
      done: activeStepNum > 3 || isCompleted,
      active: activeStepNum === 3,
    },
    {
      num: 4,
      title: "Đang kiểm tra",
      time: inspectTime,
      done: activeStepNum > 4 || isCompleted,
      active: activeStepNum === 4,
    },
    {
      num: 5,
      title: "Đang sửa chữa",
      time: repairTime,
      done: activeStepNum > 5 || isCompleted,
      active: activeStepNum === 5,
    },
    {
      num: 6,
      title: "Hoàn thành",
      time: completeTime,
      done: isCompleted,
      active: isCompleted,
    },
  ]
}

const MOCKUP_BOOKINGS: MockBookingItem[] = [
  {
    id: 1,
    bookingCode: "HRB-20241015-001",
    phoneModelName: "Sửa chập điện âm tường & Thay ổ cắm",
    brandName: "Hệ thống Điện",
    status: "InProgress",
    statusLabel: "Đang sửa chữa",
    statusBg: "#e0f2fe",
    statusColor: "#0284c7",
    appointmentDate: "Thứ 3, 15/10/2024",
    appointmentTime: "14:30 - 15:00",
    estimatedTotal: 500000,
    branchName: "Khu vực Cầu Giấy",
    branchAddress: "123 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội",
    image: "/images/service-electrical.svg",
    storage: "Phòng khách",
    color: "Ổ cắm Panasonic",
    serial: "ELEC-2024-001",
    technicianName: "Trần Minh Đức",
    technicianRole: "Thợ điện dân dụng",
    technicianRating: "4.9 (128 đánh giá)",
    technicianAvatar: getAvatarImage("Trần Minh Đức", true),
    services: [
      { id: 1, name: "Xử lý chập điện & nhảy CB", price: 350000, quantity: 1 },
      { id: 2, name: "Thay ổ cắm âm tường", price: 150000, quantity: 1 },
    ],
    timeline: [
      { time: "15/10/2024 15:20", title: "Đang kiểm tra & đo tải", desc: "Thợ đang dùng đồng hồ đo điện kiểm tra dây âm tường.", isDone: true },
      { time: "15/10/2024 14:40", title: "Kỹ thuật viên đã đến nhà", desc: "Thợ đã có mặt tại địa chỉ của khách hàng.", isDone: true },
      { time: "15/10/2024 10:35", title: "Đã phân công kỹ thuật viên", desc: "HomeFix đã điều phối thợ khu vực Cầu Giấy tiếp nhận.", isDone: true },
      { time: "15/10/2024 10:20", title: "Đặt lịch thành công", desc: "Bạn đã đặt lịch sửa chữa nhà tại HomeFix thành công.", isDone: true },
    ],
    customerNote: "Ổ cắm sau tivi có mùi khét và nhảy aptomat liên tục khi cắm điện.",
    technicianNote: "Phát hiện chập dây nguồn âm tường sau tivi. Đang tiến hành thay dây chống cháy.",
  },
  {
    id: 2,
    bookingCode: "HRB-20241001-002",
    phoneModelName: "Vệ sinh & Nạp gas Điều hòa Inverter",
    brandName: "Điện lạnh",
    status: "Completed",
    statusLabel: "Hoàn thành",
    statusBg: "#dcfce7",
    statusColor: "#16a34a",
    appointmentDate: "Thứ 3, 01/10/2024",
    appointmentTime: "10:00 - 10:30",
    estimatedTotal: 450000,
    branchName: "Khu vực Đống Đa",
    branchAddress: "456 Xã Đàn, Nam Đồng, Đống Đa, Hà Nội",
    image: "/images/service-ac.svg",
    storage: "Phòng ngủ tầng 2",
    color: "Daikin 1.5 HP",
    serial: "AC-DAIKIN-2024",
    technicianName: "Lê Văn Hùng",
    technicianRole: "Chuyên viên điện lạnh",
    technicianRating: "4.8 (95 đánh giá)",
    technicianAvatar: getAvatarImage("Lê Văn Hùng", true),
    services: [
      { id: 1, name: "Vệ sinh & bổ sung gas điều hòa R32", price: 450000, quantity: 1 },
    ],
    timeline: [
      { time: "01/10/2024 11:30", title: "Hoàn thành sửa chữa", desc: "Bàn giao thiết bị hoạt động mát lạnh, khách hàng nghiệm thu.", isDone: true },
    ],
    customerNote: "Điều hòa mở 16 độ nhưng chỉ ra gió thoảng, không lạnh sâu.",
    technicianNote: "Xịt rửa lưới lọc, nạp bổ sung 25 PSI gas R32, test hồi lạnh đạt 18 độ C.",
  },
  {
    id: 3,
    bookingCode: "HRB-20240915-003",
    phoneModelName: "Thông tắc đường ống thoát chậu rửa",
    brandName: "Đường nước",
    status: "Completed",
    statusLabel: "Hoàn thành",
    statusBg: "#dcfce7",
    statusColor: "#16a34a",
    appointmentDate: "Chủ nhật, 15/09/2024",
    appointmentTime: "09:00 - 09:30",
    estimatedTotal: 350000,
    branchName: "Khu vực Hai Bà Trưng",
    branchAddress: "789 Phố Huế, Hàng Bài, Hai Bà Trưng, Hà Nội",
    image: "/images/service-plumbing.svg",
    storage: "Bếp gia đình",
    color: "Ống PVC D60",
    serial: "PLUMB-2024",
    technicianName: "Nguyễn Tuấn Kiệt",
    technicianRole: "Thợ điện nước chuyên nghiệp",
    technicianRating: "5.0 (210 đánh giá)",
    technicianAvatar: getAvatarImage("Nguyễn Tuấn Kiệt", true),
    services: [
      { id: 1, name: "Thông tắc bồn rửa & khử mùi", price: 350000, quantity: 1 },
    ],
    timeline: [
      { time: "15/09/2024 11:30", title: "Nghiệm thu hoàn tất", desc: "Thoát nước nhanh, không còn hiện tượng rò rỉ.", isDone: true },
    ],
    customerNote: "Nước rửa bát bị ứ đọng và trào ngược dưới sàn bếp.",
    technicianNote: "Dùng máy xoắn lò xo phá cặn mỡ nghẹt 3 mét, thay xi-phông mới.",
  },
  {
    id: 4,
    bookingCode: "HRB-20240901-004",
    phoneModelName: "Sửa máy giặt kêu to & không vắt",
    brandName: "Thiết bị gia dụng",
    status: "Cancelled",
    statusLabel: "Đã hủy",
    statusBg: "#fee2e2",
    statusColor: "#ef4444",
    appointmentDate: "Chủ nhật, 01/09/2024",
    appointmentTime: "16:00 - 16:30",
    estimatedTotal: 0,
    branchName: "Khu vực Cầu Giấy",
    branchAddress: "123 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội",
    image: "/images/service-appliance.svg",
    storage: "Sân phơi tầng 4",
    color: "Electrolux 9kg",
    serial: "WM-ELEC-09",
    services: [],
    timeline: [
      { time: "01/09/2024 14:00", title: "Lịch hẹn đã bị hủy", desc: "Khách hàng bận việc đột xuất và đã hủy lịch hẹn.", isDone: true },
    ],
    customerNote: "Bận việc gia đình xin phép hủy lịch.",
  },
  {
    id: 5,
    bookingCode: "HRB-20240820-005",
    phoneModelName: "Sửa bình nóng lạnh không nóng",
    brandName: "Điện & Nước",
    status: "Completed",
    statusLabel: "Hoàn thành",
    statusBg: "#dcfce7",
    statusColor: "#16a34a",
    appointmentDate: "Thứ 3, 20/08/2024",
    appointmentTime: "11:30 - 12:00",
    estimatedTotal: 400000,
    branchName: "Khu vực Đống Đa",
    branchAddress: "456 Xã Đàn, Nam Đồng, Đống Đa, Hà Nội",
    image: "/images/service-electrical.svg",
    storage: "Nhà tắm tầng 1",
    color: "Ariston 30L",
    serial: "WH-ARIS-30",
    technicianName: "Lê Văn Hùng",
    technicianRole: "Chuyên viên điện lạnh & nước",
    technicianRating: "4.8 (95 đánh giá)",
    technicianAvatar: getAvatarImage("Lê Văn Hùng", true),
    services: [
      { id: 1, name: "Thay rơ-le nhiệt & xúc xả cặn bình", price: 400000, quantity: 1 },
    ],
    timeline: [
      { time: "20/08/2024 13:00", title: "Hoàn thành sửa chữa", desc: "Bình đun sôi bình thường, chống giật an toàn tuyệt đối.", isDone: true },
    ],
    customerNote: "Đèn bình nóng lạnh vẫn sáng nhưng nước chỉ âm ấm không nóng.",
    technicianNote: "Thanh đốt bị bám cặn vôi hóa dày, đã xúc rửa và thay rơ-le nhiệt ngắt sớm.",
  },
  {
    id: 6,
    bookingCode: "HRB-20240805-006",
    phoneModelName: "Sửa van nước & Thay vòi sen tắm",
    brandName: "Đường nước",
    status: "Completed",
    statusLabel: "Hoàn thành",
    statusBg: "#dcfce7",
    statusColor: "#16a34a",
    appointmentDate: "Thứ 2, 05/08/2024",
    appointmentTime: "15:00 - 15:30",
    estimatedTotal: 300000,
    branchName: "Khu vực Hai Bà Trưng",
    branchAddress: "789 Phố Huế, Hàng Bài, Hai Bà Trưng, Hà Nội",
    image: "/images/service-plumbing.svg",
    storage: "Nhà tắm tầng 2",
    color: "Inox 304",
    serial: "PLUMB-VALVE-06",
    technicianName: "Nguyễn Tuấn Kiệt",
    technicianRole: "Thợ điện nước chuyên nghiệp",
    technicianRating: "5.0 (210 đánh giá)",
    technicianAvatar: getAvatarImage("Nguyễn Tuấn Kiệt", true),
    services: [
      { id: 1, name: "Thay củ sen tắm nóng lạnh", price: 300000, quantity: 1 },
    ],
    timeline: [
      { time: "05/08/2024 16:30", title: "Hoàn thành sửa chữa", desc: "Đã thay củ sen mới, kiểm tra áp lực nước mạnh đều.", isDone: true },
    ],
    customerNote: "Củ sen tắm bị rỉ nước liên tục gây lãng phí nước.",
    technicianNote: "Thay lõi van gốm củ sen và quấn băng tan chống rỉ ren ống.",
  },
]

interface UserDeviceItem {
  id: string
  modelName: string
  brandName: string
  storage: string
  color: string
  serial: string
  status: "good" | "needs_service"
  lastServiceDate?: string
}

const INITIAL_DEVICES: UserDeviceItem[] = [
  {
    id: "dev-1",
    modelName: "Điều hòa Daikin Inverter 1.5 HP",
    brandName: "Điện Lạnh Daikin",
    storage: "Phòng khách tầng 1",
    color: "Màu trắng trang nhã",
    serial: "DK-FTKC35-2023",
    status: "needs_service",
    lastServiceDate: "15/10/2024",
  },
  {
    id: "dev-2",
    modelName: "Bình nóng lạnh Ariston 30L",
    brandName: "Thiết bị Nước Ariston",
    storage: "Phòng tắm tầng 2",
    color: "Bạc titanium chống giật ELCB",
    serial: "AR-ANDRIS30-99",
    status: "good",
    lastServiceDate: "01/10/2024",
  },
  {
    id: "dev-3",
    modelName: "Tủ điện Aptomat RCBO chống rò",
    brandName: "Hệ thống Điện Panasonic",
    storage: "Hành lang tầng trệt",
    color: "Vỏ kim loại sơn tĩnh điện",
    serial: "PANA-RCBO-40A",
    status: "good",
    lastServiceDate: "20/08/2024",
  },
]

interface VoucherItem {
  id: string
  code: string
  title: string
  discount: string
  desc: string
  minOrder: string
  expiry: string
  icon: string
  color: string
  bg: string
}

const VOUCHERS_LIST: VoucherItem[] = [
  {
    id: "v-1",
    code: "WELCOME50",
    title: "Ưu đãi khách hàng mới",
    discount: "Giảm 50.000đ",
    desc: "Áp dụng cho mọi dịch vụ sửa chữa nhà cửa đầu tiên",
    minOrder: "Đơn từ 200.000đ",
    expiry: "Còn 30 ngày",
    icon: "🎟️",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    id: "v-2",
    code: "ACCARE15",
    title: "Vệ sinh & Bảo dưỡng điều hòa",
    discount: "Giảm 15%",
    desc: "Bảo dưỡng xịt rửa điều hòa, kiểm tra gas chuẩn hãng",
    minOrder: "Dịch vụ Điện lạnh",
    expiry: "Còn 45 ngày",
    icon: "❄️",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    id: "v-3",
    code: "PLUMB100",
    title: "Sửa chữa hệ thống cấp thoát nước",
    discount: "Giảm 100.000đ",
    desc: "Áp dụng xử lý rò rỉ van vòi, thay ống nước, thông tắc",
    minOrder: "Đơn từ 500.000đ",
    expiry: "Còn 60 ngày",
    icon: "🚰",
    color: "#9333ea",
    bg: "#faf5ff",
  },
  {
    id: "v-4",
    code: "HOMESAFE",
    title: "Kiểm tra an toàn điện gia đình",
    discount: "Miễn phí 100%",
    desc: "Khảo sát và đo điện áp, kiểm tra chống rò rỉ điện",
    minOrder: "Áp dụng kèm dịch vụ bất kỳ",
    expiry: "Còn 90 ngày",
    icon: "⚡",
    color: "#0891b2",
    bg: "#ecfeff",
  },
]

interface NotificationItem {
  id: string
  title: string
  desc: string
  time: string
  isRead: boolean
  type: "booking" | "tech" | "promo" | "done"
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "Lịch hẹn PRB-20241015-001 đã được xác nhận",
    desc: "Chi nhánh Cầu Giấy đã xác nhận lịch hẹn của bạn lúc 14:30. Kỹ thuật viên sẵn sàng phục vụ.",
    time: "10 phút trước",
    isRead: false,
    type: "booking",
  },
  {
    id: "n-2",
    title: "Kỹ thuật viên đang khảo sát sự cố",
    desc: "Kỹ thuật viên Trần Minh Đức đang tiến hành kiểm tra tổng thể hệ thống điện điều hòa tại nhà bạn.",
    time: "2 giờ trước",
    isRead: false,
    type: "tech",
  },
  {
    id: "n-3",
    title: "Tặng bạn voucher giảm 10% Vệ sinh điều hòa",
    desc: "Mã AIR10PRO đã được thêm vào kho ưu đãi của bạn. Hạn dùng 45 ngày.",
    time: "1 ngày trước",
    isRead: false,
    type: "promo",
  },
  {
    id: "n-4",
    title: "Đơn sửa chữa HRB-20261015-002 đã hoàn tất",
    desc: "Bình nóng lạnh Ariston 30L đã hoàn thành bảo dưỡng và được nghiệm thu tại nhà.",
    time: "3 ngày trước",
    isRead: true,
    type: "done",
  },
  {
    id: "n-5",
    title: "Nhắc hẹn trước 24h",
    desc: "Bạn có lịch hẹn sửa chữa vào ngày mai lúc 14:30 tại 123 Cầu Giấy, Hà Nội.",
    time: "4 ngày trước",
    isRead: true,
    type: "booking",
  },
]

export function MyBookingsPage() {
  const { token, user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  // Portal active tab
  const portalTab = (searchParams.get("tab") as PortalTabId) || "bookings"

  const handleSelectPortalTab = (tabId: PortalTabId) => {
    setSearchParams({ tab: tabId })
  }

  // Responsive mobile state
  const isMobile = useIsMobile(768)
  const [mobileBookingView, setMobileBookingView] = useState<"list" | "detail">(id ? "detail" : "list")

  // Bookings list state
  const [activeTab, setActiveTab] = useState<"all" | "inprogress" | "completed" | "cancelled">("all")
  const [selectedBookingId, setSelectedBookingId] = useState<number>(id ? Number(id) : 1)
  const [newNoteText, setNewNoteText] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [bookingsList, setBookingsList] = useState<MockBookingItem[]>(MOCKUP_BOOKINGS)

  // Profile edit state
  const [profileFullName, setProfileFullName] = useState(user?.fullName || "")
  const [profilePhone, setProfilePhone] = useState(user?.phoneNumber || "")
  const [profileAddress, setProfileAddress] = useState("Hà Nội, Việt Nam")
  const [profileMessage, setProfileMessage] = useState("")
  const [profileSaving, setProfileSaving] = useState(false)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Devices state
  const [devicesList, setDevicesList] = useState<UserDeviceItem[]>(INITIAL_DEVICES)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newDevBrand, setNewDevBrand] = useState("Apple")
  const [newDevModel, setNewDevModel] = useState("")
  const [newDevStorage, setNewDevStorage] = useState("128GB")
  const [newDevColor, setNewDevColor] = useState("")
  const [newDevSerial, setNewDevSerial] = useState("")

  // Reviews state (100% REAL data from backend)
  const [myReviews, setMyReviews] = useState<ReviewItem[]>([])
  const [reviewsTab, setReviewsTab] = useState<"pending" | "reviewed">("pending")
  const [reviewRatings, setReviewRatings] = useState<Record<number, number>>({})
  const [reviewComments, setReviewComments] = useState<Record<number, string>>({})
  const [reviewSuccess, setReviewSuccess] = useState("")
  const [submittingReviewId, setSubmittingReviewId] = useState<number | null>(null)

  // Vouchers state
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null)

  // Notifications state
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)

  // Sync profile fields when user loads
  useEffect(() => {
    if (user) {
      if (!profileFullName && user.fullName) setProfileFullName(user.fullName)
      if (!profilePhone && user.phoneNumber) setProfilePhone(user.phoneNumber)
    }
  }, [user])

  // Try to load user bookings & reviews from API if token exists
  useEffect(() => {
    if (!token) return
    myBookings(token)
      .then((apiRows: BookingSummary[]) => {
        if (apiRows && apiRows.length > 0) {
          const merged: MockBookingItem[] = apiRows.map((r) => {
            const isCompleted = r.status === "Completed"
            const isCancelled = r.status === "Cancelled"
            const branchAddr = r.fullAddress || getBranchAddress(r.branchName || "")
            const phoneImg = getPhoneImage(r.phoneModelName || r.primaryServiceName || r.serviceCategoryName || "")
            const phoneColor = getRealisticPhoneColor(r.brandName || "", r.phoneModelName || "")
            const aptDate = r.appointmentDate
            const aptTime = r.slotStart
            const techName = r.technicianName || "Trần Minh Đức"
            return {
              id: r.id,
              bookingCode: r.bookingCode,
              phoneModelName: r.phoneModelName || r.primaryServiceName || "Dịch vụ sửa chữa tại nhà",
              brandName: r.brandName || r.serviceCategoryName || "Sửa chữa gia đình",
              serviceName: r.primaryServiceName,
              serviceCategoryName: r.serviceCategoryName,
              serviceAreaName: r.serviceAreaName,
              customerAddress: r.fullAddress,
              status: isCompleted ? "Completed" : isCancelled ? "Cancelled" : "InProgress",
              statusLabel: statusLabel[r.status] || (isCompleted ? "Hoàn thành" : isCancelled ? "Đã hủy" : "Đang thực hiện"),
              statusBg: isCompleted ? "#dcfce7" : isCancelled ? "#fee2e2" : "#e0f2fe",
              statusColor: isCompleted ? "#16a34a" : isCancelled ? "#ef4444" : "#0284c7",
              appointmentDate: aptDate,
              appointmentTime: aptTime,
              estimatedTotal: r.estimatedTotal,
              branchName: r.serviceAreaName || r.branchName || "Khu vực phục vụ",
              branchAddress: branchAddr,
              image: phoneImg,
              storage: "Tiêu chuẩn",
              color: phoneColor,
              serial: `SN-${r.bookingCode.replace(/\D/g, "").slice(-8) || "88392104"}`,
              technicianName: techName,
              technicianRole: "Kỹ thuật viên chuyên nghiệp",
              technicianRating: "4.9 (128 đánh giá)",
              technicianAvatar: getAvatarImage(techName, true),
              createdAt: r.createdAt,
              hasReview: r.hasReview ?? false,
              services: [
                {
                  id: 1,
                  name: "Dịch vụ sửa chữa theo lịch hẹn",
                  price: r.estimatedTotal,
                  quantity: 1,
                },
              ],
              timeline: [
                {
                  time: formatDateTimeVi(r.createdAt),
                  rawTime: r.createdAt,
                  title: "Chờ xác nhận",
                  desc: "Bạn đã đăng ký lịch hẹn sửa chữa trực tuyến trên hệ thống.",
                  isDone: true,
                },
              ],
              customerNote: "Khách yêu cầu kiểm tra và xử lý thiết bị theo lịch hẹn.",
              technicianNote: "Kỹ thuật viên chuẩn bị sẵn sàng linh kiện và thiết bị kiểm tra.",
            }
          })
          setBookingsList(merged)
          if (!id || !apiRows.some((b) => b.id === Number(id))) {
            setSelectedBookingId(apiRows[0].id)
          }
        }
      })
      .catch(() => {})

    fetchMyReviews(token)
      .then((revs) => setMyReviews(revs))
      .catch(() => {})
  }, [token, id])

  // Fetch full details of selected booking when available
  useEffect(() => {
    if (!token || !selectedBookingId) return
    myBooking(token, selectedBookingId)
      .then((detail: BookingDetail) => {
        if (!detail) return
        setBookingsList((prev) =>
          prev.map((b) => {
            if (b.id !== detail.id) return b
            const isCompleted = detail.status === "Completed"
            const isCancelled = detail.status === "Cancelled"
            const realServices = detail.services && detail.services.length > 0
              ? detail.services.map((s, idx) => ({
                  id: s.repairServiceId || idx + 1,
                  name: s.serviceName,
                  price: s.unitPrice != null && s.unitPrice > 0
                    ? s.unitPrice
                    : detail.services.length === 1
                    ? detail.estimatedTotal
                    : Math.round(detail.estimatedTotal / detail.services.length),
                  quantity: 1,
                }))
              : [{ id: 1, name: "Kiểm tra & Sửa chữa thiết bị", price: detail.estimatedTotal, quantity: 1 }]
            
            const realTimeline = detail.timeline && detail.timeline.length > 0
              ? detail.timeline.map((h) => ({
                  time: formatDateTimeVi(h.changedAt),
                  rawTime: h.changedAt,
                  title: statusLabel[h.toStatus] || h.toStatus,
                  desc: h.note || `Trạng thái cập nhật: ${statusLabel[h.toStatus] || h.toStatus}`,
                  isDone: true,
                }))
              : [
                  {
                    time: formatDateTimeVi(detail.createdAt),
                    rawTime: detail.createdAt,
                    title: "Chờ xác nhận",
                    desc: "Bạn đã đăng ký lịch hẹn sửa chữa trên hệ thống.",
                    isDone: true,
                  },
                ]

            const parsedDesc = parseCustomerProblem(detail.problemDescription)

            return {
              ...b,
              bookingCode: detail.bookingCode,
              phoneModelName: detail.phoneModelName || detail.primaryServiceName || "Dịch vụ sửa chữa tại nhà",
              brandName: detail.brandName || detail.serviceCategoryName || "Sửa chữa gia đình",
              serviceName: detail.primaryServiceName,
              serviceCategoryName: detail.serviceCategoryName,
              serviceAreaName: detail.serviceAreaName,
              customerAddress: detail.fullAddress,
              status: isCompleted ? "Completed" : isCancelled ? "Cancelled" : "InProgress",
              statusLabel: statusLabel[detail.status] || b.statusLabel,
              statusBg: isCancelled ? "#fee2e2" : isCompleted ? "#dcfce7" : "#e0f2fe",
              statusColor: isCancelled ? "#dc2626" : isCompleted ? "#16a34a" : "#0284c7",
              appointmentDate: detail.appointmentDate,
              appointmentTime: detail.slotEnd ? `${detail.slotStart} - ${detail.slotEnd}` : detail.slotStart,
              estimatedTotal: detail.estimatedTotal,
              branchName: detail.serviceAreaName || detail.branchName || "Khu vực phục vụ",
              branchAddress: detail.fullAddress || detail.branchAddress || getBranchAddress(detail.branchName || ""),
              image: getPhoneImage(detail.phoneModelName || detail.primaryServiceName || detail.serviceCategoryName || ""),
              storage: parsedDesc.storage || b.storage || "Tiêu chuẩn",
              color: parsedDesc.color || getRealisticPhoneColor(detail.brandName || "", detail.phoneModelName || ""),
              serial: b.serial || "SN-" + detail.id.toString().padStart(6, "0"),
              services: realServices,
              customerNote: detail.problemDescription || "Khách yêu cầu kiểm tra và sửa chữa tại nhà.",
              technicianNote: detail.repairNotes || detail.diagnosis || null,
              technicianName: detail.technicianName || null,
              technicianRole: detail.technicianName ? (b.technicianRole || "Kỹ thuật viên chuyên nghiệp") : null,
              technicianRating: detail.technicianName ? (b.technicianRating || "4.9 (128 đánh giá)") : null,
              technicianAvatar: detail.technicianName ? (b.technicianAvatar || getAvatarImage(detail.technicianName, true)) : null,
              createdAt: detail.createdAt,
              timeline: realTimeline,
            }
          })
        )
      })
      .catch(() => {})
  }, [token, selectedBookingId])

  // Filter bookings based on active tab
  const filteredBookings = bookingsList.filter((b) => {
    if (activeTab === "inprogress") return b.status === "InProgress"
    if (activeTab === "completed") return b.status === "Completed"
    if (activeTab === "cancelled") return b.status === "Cancelled"
    return true
  })

  // Selected booking detail
  const selectedBooking = bookingsList.find((b) => b.id === selectedBookingId) || bookingsList[0]

  const formatVnd = (price: number) => {
    if (price === 0) return "-"
    return price.toLocaleString("vi-VN") + "đ"
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard?.writeText(code)
    setCopiedVoucher(code)
    setTimeout(() => setCopiedVoucher(null), 2000)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setProfileSaving(true)
    setProfileMessage("")
    try {
      const updated = await updateProfile(token, {
        fullName: profileFullName.trim(),
        phoneNumber: profilePhone.trim(),
      })
      setUser(updated)
      setProfileMessage("Cập nhật thông tin cá nhân thành công!")
      setTimeout(() => setProfileMessage(""), 3500)
    } catch {
      setProfileMessage("Không thể cập nhật hồ sơ. Vui lòng thử lại.")
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setPasswordError("")
    setPasswordMessage("")
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("Mật khẩu mới phải có tối thiểu 8 ký tự.")
      return
    }

    setPasswordSaving(true)
    try {
      await changePassword(token, {
        currentPassword,
        newPassword,
        confirmPassword,
      })
      setPasswordMessage("Đổi mật khẩu thành công!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordMessage(""), 3500)
    } catch {
      setPasswordError("Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.")
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDevModel.trim()) return
    const newDev: UserDeviceItem = {
      id: `dev-${Date.now()}`,
      modelName: newDevModel.trim(),
      brandName: newDevBrand,
      storage: newDevStorage,
      color: newDevColor.trim() || "Tiêu chuẩn",
      serial: newDevSerial.trim() || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "good",
      lastServiceDate: "Chưa sửa chữa",
    }
    setDevicesList((prev) => [newDev, ...prev])
    setNewDevModel("")
    setNewDevColor("")
    setNewDevSerial("")
    setShowAddDevice(false)
  }

  const handleDeleteDevice = (id: string) => {
    setDevicesList((prev) => prev.filter((d) => d.id !== id))
  }

  const handleSubmitReview = async (bookingId: number) => {
    const rating = reviewRatings[bookingId] || 5
    const comment = (reviewComments[bookingId] || "").trim()
    setSubmittingReviewId(bookingId)
    try {
      if (token) {
        await submitReview(token, bookingId, {
          rating,
          comment: comment || undefined,
        })
        const updatedReviews = await fetchMyReviews(token)
        setMyReviews(updatedReviews)
      }
      setBookingsList((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, hasReview: true } : b))
      )
      setReviewComments((prev) => ({ ...prev, [bookingId]: "" }))
      setReviewSuccess("Cảm ơn bạn đã gửi đánh giá dịch vụ thành công!")
      setTimeout(() => {
        setReviewSuccess("")
        setReviewsTab("reviewed")
      }, 1500)
    } catch (err: any) {
      alert(err?.message || "Không gửi được đánh giá. Vui lòng thử lại.")
    } finally {
      setSubmittingReviewId(null)
    }
  }

  const handleMarkAllRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleDeleteNotification = (id: string) => {
    setNotificationsList((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadNotifCount = notificationsList.filter((n) => !n.isRead).length
  const reviewedBookingIds = new Set(myReviews.map((r) => r.bookingId))
  const pendingReviewsCount = bookingsList.filter((b) => {
    const isCompleted = b.status === "Completed" || b.statusLabel === "Hoàn thành"
    return isCompleted && !b.hasReview && !reviewedBookingIds.has(b.id)
  }).length
  const inProgressCount = bookingsList.filter((b) => b.status === "InProgress").length
  const completedCount = bookingsList.filter((b) => b.status === "Completed").length

  // ================= RENDER SIDEBAR COLUMN =================
  const renderSidebar = () => {
    const navItems: { id: PortalTabId; label: string; icon: string; badge?: number }[] = [
      { id: "overview", label: "Tổng quan", icon: "🏠" },
      { id: "bookings", label: "Lịch hẹn của tôi", icon: "🗓️" },
      { id: "profile", label: "Thông tin cá nhân", icon: "👤" },
      { id: "password", label: "Đổi mật khẩu", icon: "🔑" },
      { id: "devices", label: "Thiết bị của tôi", icon: "📱" },
      { id: "reviews", label: "Đánh giá dịch vụ", icon: "⭐", badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined },
      { id: "vouchers", label: "Ưu đãi của tôi", icon: "🎁" },
      { id: "notifications", label: "Thông báo", icon: "🔔", badge: unreadNotifCount > 0 ? unreadNotifCount : undefined },
    ]

    return (
      <aside
        className="portal-desktop-sidebar"
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
          {navItems.map((item) => {
            const isActive = portalTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPortalTab(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.86rem",
                  color: isActive ? "#2563eb" : "#475569",
                  background: isActive ? "#eff6ff" : "transparent",
                  fontWeight: isActive ? 700 : 500,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      borderRadius: "999px",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "1px 6px",
                      lineHeight: "1.2",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}

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
              marginTop: "8px",
            }}
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </nav>

        {/* CẦN HỖ TRỢ CARD */}
        <div
          style={{
            marginTop: "30px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px 14px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              marginBottom: "8px",
            }}
          >
            🎧
          </div>
          <strong style={{ fontSize: "0.88rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>
            Cần hỗ trợ?
          </strong>
          <p style={{ fontSize: "0.76rem", color: "#64748b", margin: "0 0 12px", lineHeight: 1.4 }}>
            Liên hệ đội ngũ chăm sóc khách hàng của chúng tôi
          </p>
          <Link
            to="/support"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: "0.78rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <span>Liên hệ ngay</span>
            <span>&gt;</span>
          </Link>
        </div>
      </aside>
    )
  }

  // ================= RENDER MOBILE CATEGORY PILLS =================
  const renderMobileTabPills = () => {
    const navItems: { id: PortalTabId; label: string; icon: string; badge?: number }[] = [
      { id: "overview", label: "Tổng quan", icon: "🏠" },
      { id: "bookings", label: "Lịch hẹn", icon: "🗓️" },
      { id: "profile", label: "Hồ sơ", icon: "👤" },
      { id: "password", label: "Đổi MK", icon: "🔑" },
      { id: "devices", label: "Thiết bị", icon: "📱" },
      { id: "reviews", label: "Đánh giá", icon: "⭐", badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined },
      { id: "vouchers", label: "Ưu đãi", icon: "🎁" },
      { id: "notifications", label: "Thông báo", icon: "🔔", badge: unreadNotifCount > 0 ? unreadNotifCount : undefined },
    ]

    return (
      <div className="portal-mobile-tab-pills">
        {navItems.map((item) => {
          const isActive = portalTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                handleSelectPortalTab(item.id)
                if (item.id === "bookings") setMobileBookingView("list")
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "999px",
                fontSize: "0.82rem",
                fontWeight: isActive ? 700 : 600,
                border: isActive ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                background: isActive ? "#2563eb" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: isActive ? "0 2px 8px rgba(37,99,235,0.22)" : "none",
                flexShrink: 0,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  style={{
                    background: isActive ? "rgba(255,255,255,0.3)" : "#ef4444",
                    color: "#ffffff",
                    borderRadius: "999px",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    padding: "1px 6px",
                    lineHeight: "1.2",
                    marginLeft: "2px",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // ================= TAB: OVERVIEW =================
  const renderOverviewTab = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
        {/* WELCOME BANNER */}
        <div
          className="overview-banner-flex"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
            borderRadius: "20px",
            padding: "26px 30px",
            color: "#ffffff",
            boxShadow: "0 4px 18px rgba(37,99,235,0.22)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <img
              src={getAvatarImage(user?.fullName || "Khách hàng")}
              alt="Avatar"
              style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.8)", objectFit: "cover" }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
                  Xin chào, {user?.fullName || "Khách hàng"}!
                </h1>
                <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
                  ⭐ Khách hàng thân thiết
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", opacity: 0.9, margin: 0 }}>
                {user?.email} • SĐT: {user?.phoneNumber || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <Link
            to="/booking"
            style={{
              background: "#ffffff",
              color: "#2563eb",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.85rem",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>+ Đặt lịch sửa ngay</span>
          </Link>
        </div>

        {/* 4 STAT CARDS */}
        <div className="overview-stats-grid">
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
            <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block", marginBottom: "6px" }}>Tổng lịch hẹn</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a" }}>{bookingsList.length}</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>lịch hẹn</span>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
            <span style={{ fontSize: "0.78rem", color: "#0284c7", display: "block", marginBottom: "6px" }}>Đang xử lý</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0284c7" }}>{inProgressCount}</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>đơn hẹn</span>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
            <span style={{ fontSize: "0.78rem", color: "#16a34a", display: "block", marginBottom: "6px" }}>Đã hoàn thành</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "1.8rem", fontWeight: 900, color: "#16a34a" }}>{completedCount}</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>đơn sửa</span>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
            <span style={{ fontSize: "0.78rem", color: "#9333ea", display: "block", marginBottom: "6px" }}>Thiết bị đã lưu</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "1.8rem", fontWeight: 900, color: "#9333ea" }}>{devicesList.length}</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>máy</span>
            </div>
          </div>
        </div>

        {/* LATEST APPOINTMENT PREVIEW */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "22px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>📍</span>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Lịch hẹn gần nhất
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleSelectPortalTab("bookings")}
              style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
            >
              Xem tất cả lịch hẹn →
            </button>
          </div>

          {selectedBooking ? (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {(() => {
                  const catTheme = getCategoryTheme(selectedBooking.phoneModelName, selectedBooking.serviceCategoryName || selectedBooking.brandName)
                  return (
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: catTheme.bg,
                        border: `1.5px solid ${catTheme.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={catTheme.image}
                        alt={catTheme.label}
                        style={{ width: "26px", height: "26px", objectFit: "contain" }}
                        onError={(e) => {
                          const img = e.currentTarget
                          img.style.display = "none"
                          const parent = img.parentElement
                          if (parent) {
                            parent.innerHTML = `<span style="font-size: 22px;">${catTheme.emoji}</span>`
                          }
                        }}
                      />
                    </div>
                  )
                })()}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{selectedBooking.phoneModelName}</strong>
                    <span style={{ background: selectedBooking.statusBg, color: selectedBooking.statusColor, fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" }}>
                      {selectedBooking.statusLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Mã: <strong>{selectedBooking.bookingCode}</strong> • Ngày hẹn: <strong>{selectedBooking.appointmentDate} ({selectedBooking.appointmentTime})</strong>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                    Khu vực phục vụ: {selectedBooking.branchName}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPortalTab("bookings")}
                style={{ background: "#2563eb", color: "#ffffff", padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
              >
                Chi tiết tiến độ
              </button>
            </div>
          ) : (
            <p style={{ color: "#94a3b8", fontStyle: "italic", margin: 0 }}>Bạn chưa có lịch hẹn nào.</p>
          )}
        </div>

        {/* QUICK SHORTCUTS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? "10px" : "16px" }}>
          <Link to="/booking" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", textDecoration: "none", transition: "transform 0.15s ease" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🔧</div>
            <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>Đặt lịch sửa</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Chủ động chọn giờ, có mặt sửa ngay</span>
          </Link>

          <Link to="/pricing" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", textDecoration: "none", transition: "transform 0.15s ease" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>💰</div>
            <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>Bảng giá dịch vụ</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Bảng giá dịch vụ sửa nhà minh bạch</span>
          </Link>

          <Link to="/branches" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", textDecoration: "none", transition: "transform 0.15s ease" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📍</div>
            <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>Khu vực phục vụ</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Mạng lưới thợ phủ khắp các quận huyện</span>
          </Link>

          <button
            type="button"
            onClick={() => handleSelectPortalTab("vouchers")}
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", textAlign: "left", cursor: "pointer" }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🎁</div>
            <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>Kho voucher</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>4 mã ưu đãi sẵn sàng sử dụng</span>
          </button>
        </div>
      </div>
    )
  }

  // ================= TAB: PROFILE =================
  const renderProfileTab = () => {
    return (
      <div style={{ maxWidth: "720px" }}>
        {/* CARD 1: EDIT PROFILE */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "28px 32px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Thông tin cá nhân
            </h3>
            <span style={{ fontSize: "0.76rem", background: "#eff6ff", color: "#2563eb", padding: "3px 10px", borderRadius: "999px", fontWeight: 700 }}>
              Hồ sơ khách hàng
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 22px" }}>
            Cập nhật họ tên, số điện thoại và địa chỉ nhận dịch vụ của bạn
          </p>

          {profileMessage && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "16px", fontWeight: 600 }}>
              ✓ {profileMessage}
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Họ và tên
              </label>
              <input
                type="text"
                value={profileFullName}
                onChange={(e) => setProfileFullName(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Số điện thoại
              </label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Email đăng nhập
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "0.88rem", boxSizing: "border-box", cursor: "not-allowed" }}
              />
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                Email tài khoản được dùng để nhận xác nhận lịch hẹn.
              </span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Địa chỉ mặc định
              </label>
              <input
                type="text"
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={profileSaving}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "11px 22px",
                  borderRadius: "8px",
                  fontSize: "0.86rem",
                  fontWeight: 700,
                  cursor: profileSaving ? "wait" : "pointer",
                  boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
                }}
              >
                {profileSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ================= TAB: PASSWORD =================
  const renderPasswordTab = () => {
    return (
      <div style={{ maxWidth: "640px" }}>
        {/* CARD 2: CHANGE PASSWORD */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "28px 32px", boxShadow: "0 2px 8px rgba(15,23,42,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Đổi mật khẩu
            </h3>
            <span style={{ fontSize: "0.76rem", background: "#fef3c7", color: "#b45309", padding: "3px 10px", borderRadius: "999px", fontWeight: 700 }}>
              Bảo mật tài khoản
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 22px" }}>
            Đảm bảo tài khoản được an toàn với mật khẩu mạnh tối thiểu 8 ký tự
          </p>

          {passwordMessage && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "16px", fontWeight: 600 }}>
              ✓ {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "16px", fontWeight: 600 }}>
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
              <span style={{ fontSize: "0.74rem", color: "#64748b", lineHeight: 1.4, display: "block" }}>
                🔒 <strong>Yêu cầu độ mạnh:</strong> Tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.
              </span>
            </div>

            <div>
              <button
                type="submit"
                disabled={passwordSaving}
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  padding: "11px 22px",
                  borderRadius: "8px",
                  fontSize: "0.86rem",
                  fontWeight: 700,
                  cursor: passwordSaving ? "wait" : "pointer",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.2)",
                }}
              >
                {passwordSaving ? "Đang đổi..." : "Cập nhật mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ================= TAB: DEVICES =================
  const renderDevicesTab = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "12px" : "16px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
              Thiết bị trong nhà của tôi
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
              Quản lý các thiết bị điện máy, điện lạnh trong nhà để đặt lịch bảo trì, sửa chữa nhanh chóng.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddDevice((prev) => !prev)}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: isMobile ? "10px 16px" : "8px 16px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
              width: isMobile ? "100%" : "auto",
            }}
          >
            {showAddDevice ? "Đóng form" : "+ Thêm thiết bị gia đình"}
          </button>
        </div>

        {/* ADD DEVICE FORM */}
        {showAddDevice && (
          <form
            onSubmit={handleAddDevice}
            style={{
              background: "#ffffff",
              border: "1.5px dashed #2563eb",
              borderRadius: "14px",
              padding: isMobile ? "16px" : "20px",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: "14px",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>Nhóm thiết bị</label>
              <select
                value={newDevBrand}
                onChange={(e) => setNewDevBrand(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              >
                {["Điện dân dụng", "Điện lạnh & Điều hòa", "Đường ống nước", "Thiết bị gia dụng", "Bảo trì nhà cửa"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>Tên thiết bị / Thương hiệu</label>
              <input
                type="text"
                placeholder="VD: Điều hòa Daikin Inverter, Máy giặt LG..."
                value={newDevModel}
                onChange={(e) => setNewDevModel(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>Vị trí lắp đặt trong nhà</label>
              <select
                value={newDevStorage}
                onChange={(e) => setNewDevStorage(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              >
                {["Phòng khách", "Phòng ngủ Master", "Phòng ngủ nhỏ", "Gian bếp", "Nhà tắm / WC", "Sân thượng / Ban công"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>Đặc điểm / Màu sắc</label>
              <input
                type="text"
                placeholder="VD: Trắng Inverter, Cửa trước 9kg..."
                value={newDevColor}
                onChange={(e) => setNewDevColor(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>Mã model / Ghi chú</label>
              <input
                type="text"
                placeholder="VD: FTKC35UAVMV (Tùy chọn)"
                value={newDevSerial}
                onChange={(e) => setNewDevSerial(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
              <button
                type="submit"
                style={{ flex: 1, background: "#2563eb", color: "#ffffff", border: "none", padding: "9px", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
              >
                Lưu thiết bị
              </button>
              <button
                type="button"
                onClick={() => setShowAddDevice(false)}
                style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "0.85rem", cursor: "pointer" }}
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {/* DEVICES GRID */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px" }}>
          {devicesList.map((dev) => (
            <div
              key={dev.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "18px",
                boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "2rem" }}>
                    {dev.brandName?.includes("Lạnh") || dev.modelName?.includes("hòa") ? "❄️" : dev.brandName?.includes("Điện") ? "⚡" : dev.brandName?.includes("Nước") ? "🚰" : "🏠"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDevice(dev.id)}
                    title="Xóa thiết bị"
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem" }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{dev.modelName}</strong>
                  <span style={{ fontSize: "0.68rem", background: "#f1f5f9", color: "#475569", padding: "1px 6px", borderRadius: "4px" }}>
                    {dev.brandName}
                  </span>
                </div>

                <div style={{ fontSize: "0.78rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "2px", margin: "8px 0" }}>
                  <div>Vị trí: <strong style={{ color: "#334155" }}>{dev.storage}</strong></div>
                  <div>Đặc điểm: <strong style={{ color: "#334155" }}>{dev.color}</strong></div>
                  <div>Mã hiệu: <span style={{ fontFamily: "monospace", color: "#64748b" }}>{dev.serial}</span></div>
                  <div>Lần bảo trì gần nhất: <span>{dev.lastServiceDate}</span></div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", marginTop: "8px" }}>
                <Link
                  to="/booking"
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    textDecoration: "none",
                  }}
                >
                  🔧 Đặt lịch sửa thiết bị này
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ================= TAB: REVIEWS =================
  const renderReviewsTab = () => {
    const reviewedBookingIds = new Set(myReviews.map((r) => r.bookingId))

    // RULE 11 & User Requirement: ONLY bookings that are COMPLETED and NOT yet reviewed!
    const pendingReviews = bookingsList.filter((b) => {
      const isCompleted = b.status === "Completed" || b.statusLabel === "Hoàn thành"
      if (!isCompleted) return false
      if (b.hasReview) return false
      if (reviewedBookingIds.has(b.id)) return false
      return true
    })

    const submittedReviews = myReviews

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "12px" : "16px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
              Đánh giá dịch vụ
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
              Nhận xét của bạn sau khi hoàn thành sửa chữa giúp chúng tôi ngày một hoàn thiện.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
            <button
              type="button"
              onClick={() => setReviewsTab("pending")}
              style={{
                flex: isMobile ? 1 : "initial",
                padding: "8px 14px",
                borderRadius: "8px",
                border: reviewsTab === "pending" ? "1px solid #2563eb" : "1px solid #e2e8f0",
                background: reviewsTab === "pending" ? "#eff6ff" : "#ffffff",
                color: reviewsTab === "pending" ? "#2563eb" : "#64748b",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              Chờ đánh giá ({pendingReviews.length})
            </button>
            <button
              type="button"
              onClick={() => setReviewsTab("reviewed")}
              style={{
                flex: isMobile ? 1 : "initial",
                padding: "8px 14px",
                borderRadius: "8px",
                border: reviewsTab === "reviewed" ? "1px solid #2563eb" : "1px solid #e2e8f0",
                background: reviewsTab === "reviewed" ? "#eff6ff" : "#ffffff",
                color: reviewsTab === "reviewed" ? "#2563eb" : "#64748b",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              Đã đánh giá ({submittedReviews.length})
            </button>
          </div>
        </div>

        {reviewSuccess && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "12px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600 }}>
            ✓ {reviewSuccess}
          </div>
        )}

        {/* REVIEWS CONTENT */}
        {reviewsTab === "pending" ? (
          pendingReviews.length === 0 ? (
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "40px", textAlign: "center", color: "#64748b" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}>🎉</span>
              <strong style={{ fontSize: "1rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                Bạn không có ca sửa nào đang chờ đánh giá!
              </strong>
              <p style={{ fontSize: "0.82rem", margin: 0, color: "#64748b" }}>
                Chỉ những đơn sửa chữa đã hoàn thành (Completed) mới có thể gửi đánh giá dịch vụ.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {pendingReviews.map((item) => {
                const currentRating = reviewRatings[item.id] || 5
                const currentComment = reviewComments[item.id] || ""
                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "20px",
                      boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                          {item.brandName ? `${item.brandName} ` : ""}{item.phoneModelName}
                        </strong>
                        <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "10px" }}>
                          {item.services?.map((s) => s.name).join(", ") || "Sửa chữa theo lịch hẹn"}
                        </span>
                        {item.technicianName && (
                          <span style={{ fontSize: "0.76rem", color: "#2563eb", marginLeft: "10px", background: "#eff6ff", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                            👨‍🔧 KTV: {item.technicianName}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 700 }}>
                        Mã: {item.bookingCode}
                      </span>
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", display: "block", marginBottom: "6px" }}>
                        Mức độ hài lòng của bạn:
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRatings((prev) => ({ ...prev, [item.id]: star }))}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: "1.6rem",
                              cursor: "pointer",
                              padding: "0 2px",
                              filter: star <= currentRating ? "none" : "grayscale(100%) opacity(30%)",
                              transition: "transform 0.15s ease",
                            }}
                          >
                            ⭐
                          </button>
                        ))}
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#d97706", marginLeft: "8px" }}>
                          {currentRating}/5 sao
                        </span>
                      </div>
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <textarea
                        rows={3}
                        placeholder="Chia sẻ nhận xét của bạn về kỹ thuật viên và chất lượng sửa chữa..."
                        value={currentComment}
                        onChange={(e) => setReviewComments((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.86rem", resize: "vertical", boxSizing: "border-box" }}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={submittingReviewId === item.id}
                      onClick={() => handleSubmitReview(item.id)}
                      style={{
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 20px",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: submittingReviewId === item.id ? "wait" : "pointer",
                        boxShadow: "0 2px 6px rgba(37,99,235,0.2)",
                      }}
                    >
                      {submittingReviewId === item.id ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          submittedReviews.length === 0 ? (
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "40px", textAlign: "center", color: "#64748b" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}>⭐</span>
              <strong style={{ fontSize: "1rem", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                Chưa có đánh giá nào đã gửi
              </strong>
              <p style={{ fontSize: "0.82rem", margin: 0, color: "#64748b" }}>
                Các đánh giá bạn gửi sau khi hoàn thành dịch vụ sẽ được lưu trữ tại đây.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {submittedReviews.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                        {item.brandName ? `${item.brandName} ` : ""}{item.phoneModelName}
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "#2563eb", marginLeft: "10px", fontWeight: 700 }}>
                        Mã: {item.bookingCode}
                      </span>
                      {item.technicianName && (
                        <span style={{ fontSize: "0.78rem", color: "#475569", marginLeft: "10px" }}>
                          · KTV: {item.technicianName}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                    {"⭐".repeat(item.rating)}
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#d97706", marginLeft: "4px" }}>
                      {item.rating}/5 sao
                    </span>
                    {item.branchName && (
                      <span style={{ fontSize: "0.76rem", color: "#64748b", marginLeft: "10px" }}>
                        📍 {item.branchName}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: "0.86rem", color: "#334155", margin: 0, lineHeight: 1.5 }}>
                    "{item.comment || "Đánh giá 5 sao hài lòng về dịch vụ."}"
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    )
  }

  // ================= TAB: VOUCHERS =================
  const renderVouchersTab = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            Ưu đãi của tôi
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
            Danh sách voucher & mã giảm giá độc quyền dành riêng cho khách hàng HomeFix.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "16px" }}>
          {VOUCHERS_LIST.map((v) => {
            const isCopied = copiedVoucher === v.code
            return (
              <div
                key={v.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  gap: "16px",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: v.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    flexShrink: 0,
                  }}
                >
                  {v.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "0.98rem", color: "#0f172a" }}>{v.title}</strong>
                    <span style={{ fontSize: "0.95rem", fontWeight: 900, color: v.color }}>{v.discount}</span>
                  </div>

                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 8px", lineHeight: 1.4 }}>
                    {v.desc}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.74rem", color: "#94a3b8", marginBottom: "12px" }}>
                    <span>{v.minOrder}</span>
                    <span>⏳ {v.expiry}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleCopyVoucher(v.code)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px dashed #2563eb",
                        background: "#eff6ff",
                        color: "#2563eb",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {isCopied ? "✓ Đã chép mã" : `Mã: ${v.code} 📋`}
                    </button>

                    <Link
                      to="/booking"
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        background: "#2563eb",
                        color: "#ffffff",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Dùng ngay
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ================= TAB: NOTIFICATIONS =================
  const renderNotificationsTab = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
              Thông báo
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
              Cập nhật trạng thái đơn hẹn, tiến độ sửa chữa và các ưu đãi mới nhất.
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
          >
            Đánh dấu đã đọc tất cả
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {notificationsList.map((notif) => (
            <div
              key={notif.id}
              style={{
                background: notif.isRead ? "#ffffff" : "#f0f7ff",
                border: notif.isRead ? "1px solid #e2e8f0" : "1.5px solid #bfdbfe",
                borderRadius: "14px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "14px",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
                <span style={{ fontSize: "1.3rem", marginTop: "2px" }}>
                  {notif.type === "booking" ? "📅" : notif.type === "tech" ? "🔧" : notif.type === "promo" ? "🎁" : "✅"}
                </span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{notif.title}</strong>
                    {!notif.isRead && (
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
                    )}
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 6px", lineHeight: 1.45 }}>
                    {notif.desc}
                  </p>
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{notif.time}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteNotification(notif.id)}
                title="Xóa thông báo"
                style={{ background: "none", border: "none", color: "#cbd5e1", fontSize: "1.1rem", cursor: "pointer", padding: "0 4px" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ================= MAIN RENDER =================
  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh", padding: "26px 20px 60px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {renderMobileTabPills()}

        {portalTab === "bookings" ? (
          /* 3-COLUMN BOOKINGS LAYOUT MATCHING MOCKUP */
          <div className="bookings-master-detail-layout">
            {/* COLUMN 1: SIDEBAR */}
            {renderSidebar()}

            {/* COLUMN 2: BOOKINGS LIST */}
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                display: isMobile && mobileBookingView === "detail" ? "none" : "block",
              }}
            >
              {/* HEADER & NEW BOOKING BUTTON */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                    Lịch hẹn của tôi
                  </h2>
                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
                    Theo dõi tình trạng sửa chữa các thiết bị của bạn
                  </p>
                </div>

                <Link
                  to="/booking"
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
                  }}
                >
                  + Đặt lịch mới
                </Link>
              </div>

              {/* TABS FILTER PILLS */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
                {[
                  { key: "all", label: `Tất cả (${bookingsList.length})` },
                  { key: "inprogress", label: `Đang xử lý (${bookingsList.filter((b) => b.status === "InProgress").length})` },
                  { key: "completed", label: `Hoàn thành (${bookingsList.filter((b) => b.status === "Completed").length})` },
                  { key: "cancelled", label: `Đã hủy (${bookingsList.filter((b) => b.status === "Cancelled").length})` },
                ].map((tab) => {
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key as any)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "8px",
                        border: isActive ? "1px solid #2563eb" : "1px solid #e2e8f0",
                        background: isActive ? "#ffffff" : "#f8fafc",
                        color: isActive ? "#2563eb" : "#64748b",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: isActive ? "0 2px 4px rgba(37,99,235,0.12)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* LIST OF BOOKING CARDS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filteredBookings.map((b) => {
                  const isSelected = selectedBookingId === b.id
                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBookingId(b.id)
                        if (isMobile) {
                          setMobileBookingView("detail")
                        }
                      }}
                      style={{
                        background: isSelected ? "#f0f7ff" : "#ffffff",
                        border: isSelected ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "14px 16px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.08)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {(() => {
                            const catTheme = getCategoryTheme(b.phoneModelName, b.serviceCategoryName || b.brandName)
                            return (
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "12px",
                                  background: catTheme.bg,
                                  border: `1.5px solid ${catTheme.border}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                                }}
                              >
                                <img
                                  src={catTheme.image}
                                  alt={catTheme.label}
                                  style={{ width: "24px", height: "24px", objectFit: "contain" }}
                                  onError={(e) => {
                                    const img = e.currentTarget
                                    img.style.display = "none"
                                    const parent = img.parentElement
                                    if (parent) {
                                      parent.innerHTML = `<span style="font-size: 20px;">${catTheme.emoji}</span>`
                                    }
                                  }}
                                />
                              </div>
                            )
                          })()}
                          <div>
                            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1e40af", display: "block" }}>
                              {b.bookingCode}
                            </span>
                            <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>
                              {b.phoneModelName}
                            </strong>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              background: b.statusBg,
                              color: b.statusColor,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "999px",
                              display: "inline-block",
                              marginBottom: "4px",
                            }}
                          >
                            {b.statusLabel}
                          </span>
                          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>
                            {formatVnd(b.estimatedTotal)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.74rem", color: "#64748b", borderTop: "1px dashed #f1f5f9", paddingTop: "8px", marginTop: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>📅</span>
                          <span>{b.appointmentDate} • {b.appointmentTime}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>📍</span>
                          <span>{b.branchName}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ fontSize: "0.74rem", color: "#94a3b8", textAlign: "center", marginTop: "16px" }}>
                Hiển thị 1 - {filteredBookings.length} của {filteredBookings.length} lịch hẹn
              </div>
            </section>

            {/* COLUMN 3: BOOKING DETAIL VIEW */}
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(15,23,42,0.02)",
                display: isMobile && mobileBookingView === "list" ? "none" : "block",
              }}
            >
              {/* TOP BAR: BACK & ACTIONS */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (isMobile) {
                      setMobileBookingView("list")
                    } else {
                      navigate("/my-bookings")
                    }
                  }}
                  style={{
                    background: isMobile ? "#eff6ff" : "none",
                    border: isMobile ? "1px solid #bfdbfe" : "none",
                    color: "#2563eb",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: isMobile ? "6px 12px" : 0,
                    borderRadius: "8px",
                  }}
                >
                  <span>←</span>
                  <span>{isMobile ? "Quay lại danh sách lịch hẹn" : "Quay lại danh sách"}</span>
                </button>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>📥</span>
                    <span>Tải phiếu</span>
                  </button>
                  <Link
                    to="/support"
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>💬</span>
                    <span>Hỗ trợ</span>
                  </Link>
                </div>
              </div>

              {/* HEADER & STATUS BADGE */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                    Chi tiết lịch hẹn
                  </h1>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
                    Theo dõi tình trạng sửa chữa và thông tin chi tiết của lịch hẹn
                  </p>
                </div>

                <span
                  style={{
                    background: selectedBooking.statusBg,
                    color: selectedBooking.statusColor,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    padding: "5px 12px",
                    borderRadius: "999px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{selectedBooking.status === "Cancelled" ? "✕" : selectedBooking.status === "Completed" ? "✓" : "⚙️"}</span>
                  <span>{selectedBooking.statusLabel}</span>
                </span>
              </div>

              {/* 3 TOP SUMMARY CARDS */}
              <div className="booking-summary-cards-grid">
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 14px" }}>
                  <span style={{ fontSize: "0.74rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Mã lịch hẹn</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#1d4ed8" }}>{selectedBooking.bookingCode}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(selectedBooking.bookingCode)}
                      title="Sao chép mã"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: 0 }}
                    >
                      {copiedCode ? "✓" : "📋"}
                    </button>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 14px" }}>
                  <span style={{ fontSize: "0.74rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Lịch hẹn tại chi nhánh</span>
                  <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block" }}>{formatVietnameseDate(selectedBooking.appointmentDate)}</strong>
                  <span style={{ fontSize: "0.74rem", color: "#2563eb", fontWeight: 700 }}>Khung giờ: {selectedBooking.appointmentTime}</span>
                  {selectedBooking.createdAt ? (
                    <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "3px", display: "block" }}>
                      Tạo lúc: <strong>{formatDateTimeVi(selectedBooking.createdAt)}</strong>
                    </span>
                  ) : null}
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 14px" }}>
                  <span style={{ fontSize: "0.74rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Chi nhánh</span>
                  <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block" }}>{selectedBooking.branchName}</strong>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }} title={selectedBooking.branchAddress}>
                    📍 {selectedBooking.branchAddress}
                  </span>
                </div>
              </div>

              {/* PROGRESS TRACKER (DYNAMICALLY COMPUTED FROM REAL BOOKING STATUS & TIME) */}
              {(() => {
                const trackerSteps = getBookingTrackerSteps(selectedBooking)
                const isCancelled = selectedBooking.status === "Cancelled" || selectedBooking.statusLabel === "Đã hủy"
                const cancelItem = selectedBooking.timeline?.find((t) => t.title === "Đã hủy" || t.title?.toLowerCase().includes("hủy"))
                const cancelReason = cancelItem?.desc || "Lịch hẹn đã bị hủy"

                return (
                  <div style={{ marginBottom: "28px" }}>
                    {/* NẾU ĐƠN BỊ HỦY: HIỂN THỊ BANNER CẢNH BÁO RÕ RÀNG */}
                    {isCancelled && (
                      <div
                        style={{
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: "12px",
                          padding: "12px 16px",
                          marginBottom: "18px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: "#fee2e2",
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.1rem",
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          ✕
                        </div>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: "0.9rem", color: "#991b1b", display: "block", marginBottom: "2px" }}>
                            Lịch hẹn đã bị hủy lúc {cancelItem?.rawTime ? formatDateTimeVi(cancelItem.rawTime) : (cancelItem?.time || "Đã hủy")}
                          </strong>
                          <span style={{ fontSize: "0.78rem", color: "#b91c1c" }}>
                            Lý do: <strong>{cancelReason}</strong>. Quý khách không phải trả bất kỳ khoản phí nào cho lịch hẹn này.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* VẼ TIẾN TRÌNH THỰC TẾ (DESKTOP HORIZONTAL STEPPER) */}
                    <div className="booking-stepper-desktop">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", width: "100%" }}>
                        {trackerSteps.map((step, idx) => {
                          const isStepDone = step.done
                          const isStepActive = step.active
                          const isStepCancelled = step.isCancelledStep || (isCancelled && idx === trackerSteps.length - 1)

                          return (
                            <div key={step.num} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, flex: 1 }}>
                              <div
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  borderRadius: "50%",
                                  background: isStepCancelled
                                    ? "#ef4444"
                                    : isStepDone
                                    ? "#2563eb"
                                    : isStepActive
                                    ? "#3b82f6"
                                    : "#e2e8f0",
                                  color: isStepCancelled || isStepDone || isStepActive ? "#ffffff" : "#94a3b8",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.82rem",
                                  fontWeight: 800,
                                  marginBottom: "6px",
                                  boxShadow: isStepCancelled
                                    ? "0 0 0 4px rgba(239,68,68,0.2)"
                                    : isStepActive
                                    ? "0 0 0 4px rgba(37,99,235,0.2)"
                                    : "none",
                                }}
                              >
                                {isStepCancelled ? "✕" : isStepDone ? "✓" : step.num}
                              </div>
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: isStepCancelled || isStepActive || isStepDone ? 700 : 500,
                                  color: isStepCancelled
                                    ? "#ef4444"
                                    : isStepActive
                                    ? "#2563eb"
                                    : isStepDone
                                    ? "#0f172a"
                                    : "#94a3b8",
                                  textAlign: "center",
                                }}
                              >
                                {step.title}
                              </span>
                              <span style={{ fontSize: "0.7rem", color: isStepCancelled ? "#ef4444" : "#94a3b8", marginTop: "2px", fontWeight: isStepCancelled ? 600 : 400 }}>
                                {step.time}
                              </span>
                            </div>
                          )
                        })}

                        {/* CONNECTING PROGRESS LINE */}
                        <div
                          style={{
                            position: "absolute",
                            top: "15px",
                            left: `${100 / (trackerSteps.length * 2)}%`,
                            right: `${100 / (trackerSteps.length * 2)}%`,
                            height: "2px",
                            background: "#e2e8f0",
                            zIndex: 1,
                          }}
                        >
                          {isCancelled ? (
                            <div
                              style={{
                                height: "100%",
                                width: "100%",
                                background: trackerSteps.length > 2
                                  ? "linear-gradient(to right, #2563eb 50%, #ef4444 100%)"
                                  : "#ef4444",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                height: "100%",
                                width: `${
                                  selectedBooking.status === "Completed" || selectedBooking.statusLabel === "Hoàn thành"
                                    ? 100
                                    : Math.max(15, Math.min(100, Math.round(((trackerSteps.filter((s) => s.done).length) / Math.max(1, trackerSteps.length - 1)) * 100)))
                                }%`,
                                background: "#2563eb",
                                transition: "width 0.3s ease",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* TIẾN TRÌNH MOBILE (VERTICAL STEPPER CHUẨN NATIVE) */}
                    <div className="booking-stepper-mobile">
                      {trackerSteps.map((step, idx) => {
                        const isStepDone = step.done
                        const isStepActive = step.active
                        const isStepCancelled = step.isCancelledStep || (isCancelled && idx === trackerSteps.length - 1)
                        const isLast = idx === trackerSteps.length - 1

                        return (
                          <div key={step.num} className="booking-stepper-mobile-item">
                            {!isLast && <div className="booking-stepper-mobile-line" />}
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                background: isStepCancelled
                                  ? "#ef4444"
                                  : isStepDone
                                  ? "#2563eb"
                                  : isStepActive
                                  ? "#3b82f6"
                                  : "#e2e8f0",
                                color: isStepCancelled || isStepDone || isStepActive ? "#ffffff" : "#94a3b8",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.8rem",
                                fontWeight: 800,
                                flexShrink: 0,
                                zIndex: 2,
                                boxShadow: isStepCancelled
                                  ? "0 0 0 3px rgba(239,68,68,0.2)"
                                  : isStepActive
                                  ? "0 0 0 3px rgba(37,99,235,0.2)"
                                  : "none",
                              }}
                            >
                              {isStepCancelled ? "✕" : isStepDone ? "✓" : step.num}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, paddingTop: "3px" }}>
                              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                                <strong
                                  style={{
                                    fontSize: "0.86rem",
                                    color: isStepCancelled ? "#ef4444" : isStepActive ? "#2563eb" : isStepDone ? "#0f172a" : "#64748b",
                                  }}
                                >
                                  {step.title}
                                </strong>
                                <span style={{ fontSize: "0.72rem", color: isStepCancelled ? "#ef4444" : "#94a3b8", whiteSpace: "nowrap" }}>
                                  {step.time}
                                </span>
                              </div>
                              {step.reason && (
                                <p style={{ fontSize: "0.76rem", color: "#64748b", margin: "2px 0 0", lineHeight: 1.4 }}>
                                  {step.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* 2-COLUMN SPLIT: SERVICE INFO & TECHNICIAN */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Hạng mục sửa chữa</span>
                    <button type="button" onClick={() => navigate("/booking")} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                      Đặt lịch mới
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    {(() => {
                      const catTheme = getCategoryTheme(selectedBooking.phoneModelName, selectedBooking.serviceCategoryName || selectedBooking.brandName)
                      return (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: catTheme.bg,
                            border: `1.5px solid ${catTheme.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={catTheme.image}
                            alt={catTheme.label}
                            style={{ width: "28px", height: "28px", objectFit: "contain" }}
                            onError={(e) => {
                              const img = e.currentTarget
                              img.style.display = "none"
                              const parent = img.parentElement
                              if (parent) {
                                parent.innerHTML = `<span style="font-size: 22px;">${catTheme.emoji}</span>`
                              }
                            }}
                          />
                        </div>
                      )
                    })()}
                    <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{selectedBooking.phoneModelName}</strong>
                      <span>Nhóm dịch vụ: <strong style={{ color: "#334155" }}>{selectedBooking.serviceCategoryName || selectedBooking.brandName || "Sửa chữa gia đình"}</strong></span>
                      <span>Hình thức: <strong style={{ color: "#334155" }}>Sửa chữa & Khảo sát tại nhà</strong></span>
                      <span>Khu vực hỗ trợ: <span style={{ color: "#1e40af", fontWeight: 600 }}>{selectedBooking.branchName || "Tận nơi"}</span></span>
                    </div>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", display: "block", marginBottom: "12px" }}>
                    Kỹ thuật viên phụ trách
                  </span>
                  {selectedBooking.technicianName ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <img
                        src={selectedBooking.technicianAvatar || getAvatarImage(selectedBooking.technicianName, true)}
                        alt={selectedBooking.technicianName}
                        style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>
                          {selectedBooking.technicianName}
                        </strong>
                        <span style={{ fontSize: "0.76rem", color: "#64748b", display: "block" }}>
                          {selectedBooking.technicianRole || "Kỹ thuật viên chuyên nghiệp"}
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "#f59e0b", fontWeight: 700 }}>
                          ★ {selectedBooking.technicianRating || "4.9 (128 đánh giá)"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: selectedBooking.status === "Cancelled" ? "#fee2e2" : "#f1f5f9",
                          border: selectedBooking.status === "Cancelled" ? "1px dashed #f87171" : "1px dashed #cbd5e1",
                          color: selectedBooking.status === "Cancelled" ? "#ef4444" : "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.2rem",
                        }}
                      >
                        {selectedBooking.status === "Cancelled" ? "✕" : "⏳"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: "0.92rem", color: selectedBooking.status === "Cancelled" ? "#dc2626" : "#475569", display: "block" }}>
                          {selectedBooking.status === "Cancelled" ? "Không có kỹ thuật viên (Đã hủy lịch)" : "Chưa phân công kỹ thuật viên"}
                        </strong>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginTop: "2px" }}>
                          {selectedBooking.status === "Cancelled"
                            ? "Lịch hẹn đã bị hủy trước khi tiếp nhận kỹ thuật"
                            : "Hệ thống sẽ điều phối kỹ thuật viên khu vực trước giờ hẹn"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SERVICES TABLE & PRICING (COLUMN LAYOUT FOR FULL SPACE & CLEAN ALIGNMENT) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                {/* 1. BẢNG DỊCH VỤ SỬA CHỮA (FULL WIDTH) */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                      Dịch vụ sửa chữa ({selectedBooking.services?.length || 0})
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      Báo giá tiêu chuẩn HomeFix
                    </span>
                  </div>

                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#ffffff" }}>
                    <div style={{ minWidth: "480px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 140px 90px 140px", background: "#f8fafc", padding: "10px 14px", fontWeight: 700, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                        <span style={{ textAlign: "center" }}>#</span>
                        <span>Dịch vụ</span>
                        <span style={{ textAlign: "right" }}>Đơn giá</span>
                        <span style={{ textAlign: "center" }}>Số lượng</span>
                        <span style={{ textAlign: "right" }}>Thành tiền</span>
                      </div>
                      {selectedBooking.services && selectedBooking.services.length > 0 ? (
                        selectedBooking.services.map((s, idx) => (
                          <div key={s.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr 140px 90px 140px", padding: "12px 14px", borderBottom: idx < selectedBooking.services!.length - 1 ? "1px dashed #f1f5f9" : "none", alignItems: "center" }}>
                            <span style={{ color: "#94a3b8", textAlign: "center" }}>{idx + 1}</span>
                            <strong style={{ color: "#0f172a" }}>{s.name}</strong>
                            <span style={{ textAlign: "right", color: "#64748b" }}>{formatVnd(s.price)}</span>
                            <span style={{ textAlign: "center", color: "#64748b" }}>{s.quantity}</span>
                            <strong style={{ textAlign: "right", color: "#0f172a" }}>{formatVnd(s.price * s.quantity)}</strong>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "16px", color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>
                          Chưa có dịch vụ nào
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. KHỐI TỔNG KẾT CHI PHÍ (FULL WIDTH) */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                      Chi phí thanh toán
                    </span>
                    {selectedBooking.status === "Cancelled" && (
                      <span style={{ fontSize: "0.76rem", color: "#dc2626", background: "#fee2e2", border: "1px solid #fecaca", padding: "3px 10px", borderRadius: "999px", fontWeight: 700 }}>
                        ✕ Đã hủy lịch - Không phát sinh chi phí
                      </span>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", paddingBottom: "12px", borderBottom: "1px dashed #e2e8f0", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", color: "#64748b" }}>
                      <span>Tạm tính linh kiện & công sửa:</span>
                      <strong style={{ color: "#334155" }}>{formatVnd(selectedBooking.estimatedTotal)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", color: "#64748b" }}>
                      <span>Khuyến mãi / Giảm giá:</span>
                      <strong style={{ color: "#16a34a" }}>0đ</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>
                        Tổng chi phí (dự kiến)
                      </strong>
                      {selectedBooking.status === "Cancelled" ? (
                        <span style={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 600 }}>
                          (Đã hủy lịch hẹn - Miễn phí hoàn toàn)
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          Quý khách thanh toán trực tiếp tại chi nhánh sau khi nghiệm thu thiết bị
                        </span>
                      )}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <strong
                        style={{
                          fontSize: "1.35rem",
                          color: selectedBooking.status === "Cancelled" ? "#94a3b8" : "#2563eb",
                          fontWeight: 900,
                          textDecoration: selectedBooking.status === "Cancelled" ? "line-through" : "none",
                        }}
                      >
                        {formatVnd(selectedBooking.estimatedTotal)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIMELINE & NOTES */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", display: "block", marginBottom: "10px" }}>
                    Lịch sử cập nhật
                  </span>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
                    {selectedBooking.timeline?.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                        <span style={{ color: "#2563eb", fontSize: "0.9rem" }}>✓</span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "0.82rem", color: "#0f172a" }}>{item.title}</strong>
                            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{item.time}</span>
                          </div>
                          <p style={{ fontSize: "0.76rem", color: "#64748b", margin: "2px 0 0" }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", display: "block", marginBottom: "10px" }}>
                    Ghi chú
                  </span>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedBooking.customerNote && (
                      <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "0.8rem" }}>
                        <strong style={{ color: "#0f172a", display: "block", marginBottom: "2px" }}>Yêu cầu của bạn:</strong>
                        <span style={{ color: "#64748b" }}>{selectedBooking.customerNote}</span>
                      </div>
                    )}
                    {selectedBooking.technicianNote ? (
                      <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "8px", fontSize: "0.8rem" }}>
                        <strong style={{ color: "#1d4ed8", display: "block", marginBottom: "2px" }}>Ghi chú từ kỹ thuật viên:</strong>
                        <span style={{ color: "#334155" }}>{selectedBooking.technicianNote}</span>
                      </div>
                    ) : selectedBooking.status === "Cancelled" ? (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px", borderRadius: "8px", fontSize: "0.8rem" }}>
                        <strong style={{ color: "#dc2626", display: "block", marginBottom: "2px" }}>Thông báo xử lý:</strong>
                        <span style={{ color: "#991b1b" }}>
                          Lịch hẹn đã bị hủy: {selectedBooking.timeline?.find((t) => t.title === "Đã hủy" || t.title?.includes("hủy"))?.desc || "Không tiếp tục quy trình sửa chữa."}
                        </span>
                      </div>
                    ) : null}

                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <input
                        type="text"
                        placeholder="Thêm ghi chú hoặc câu hỏi cho kỹ thuật viên..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newNoteText.trim()) {
                            alert("Đã gửi ghi chú đến kỹ thuật viên!")
                            setNewNoteText("")
                          }
                        }}
                        style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0 12px", cursor: "pointer" }}
                      >
                        ➤
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOOKING REVIEW SECTION (FOR COMPLETED BOOKINGS) */}
              {(() => {
                const isCompleted = selectedBooking.status === "Completed" || selectedBooking.statusLabel === "Hoàn thành"
                const existingReview = myReviews.find((r) => r.bookingId === selectedBooking.id)

                if (isCompleted) {
                  if (existingReview) {
                    return (
                      <div style={{ marginTop: "20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                          <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>⭐ Đánh giá của bạn về dịch vụ:</strong>
                          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                            {new Date(existingReview.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                          <span style={{ color: "#eab308", fontSize: "1.1rem" }}>
                            {"★".repeat(existingReview.rating)}{"☆".repeat(5 - existingReview.rating)}
                          </span>
                          <strong style={{ fontSize: "0.85rem", color: "#d97706" }}>{existingReview.rating}/5 sao</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.86rem", color: "#334155", lineHeight: 1.5 }}>
                          "{existingReview.comment || "Đánh giá 5 sao hài lòng về dịch vụ."}"
                        </p>
                      </div>
                    )
                  }

                  const currentRating = reviewRatings[selectedBooking.id] || 5
                  const currentComment = reviewComments[selectedBooking.id] || ""
                  return (
                    <div style={{ marginTop: "20px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "14px", padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <strong style={{ fontSize: "0.98rem", color: "#166534" }}>
                          ⭐ Đánh giá chất lượng sửa chữa
                        </strong>
                        <span style={{ fontSize: "0.74rem", background: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: "999px", fontWeight: 700 }}>
                          Hoàn tất sửa chữa
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#475569", margin: "0 0 14px" }}>
                        Thiết bị của bạn đã được sửa chữa xong! Hãy chia sẻ cảm nhận về dịch vụ và kỹ thuật viên {selectedBooking.technicianName ? `(${selectedBooking.technicianName})` : ""}.
                      </p>

                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRatings((prev) => ({ ...prev, [selectedBooking.id]: star }))}
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: "1.6rem",
                                cursor: "pointer",
                                padding: "0 2px",
                                filter: star <= currentRating ? "none" : "grayscale(100%) opacity(30%)",
                                transition: "transform 0.15s ease",
                              }}
                            >
                              ⭐
                            </button>
                          ))}
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#16a34a", marginLeft: "8px" }}>
                            {currentRating}/5 sao
                          </span>
                        </div>
                      </div>

                      <div style={{ marginBottom: "12px" }}>
                        <textarea
                          rows={2}
                          placeholder="Nhận xét của bạn về kỹ thuật viên, linh kiện và độ mượt của máy..."
                          value={currentComment}
                          onChange={(e) => setReviewComments((prev) => ({ ...prev, [selectedBooking.id]: e.target.value }))}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.84rem", resize: "vertical", boxSizing: "border-box" }}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={submittingReviewId === selectedBooking.id}
                        onClick={() => handleSubmitReview(selectedBooking.id)}
                        style={{
                          background: "#16a34a",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: submittingReviewId === selectedBooking.id ? "wait" : "pointer",
                        }}
                      >
                        {submittingReviewId === selectedBooking.id ? "Đang gửi..." : "Gửi đánh giá ngay"}
                      </button>
                    </div>
                  )
                }

                return null
              })()}
            </section>
          </div>
        ) : (
          /* 2-COLUMN UNIFIED PORTAL LAYOUT */
          <div className="portal-layout-container">
            {/* COLUMN 1: SIDEBAR */}
            {renderSidebar()}

            {/* COLUMN 2: ACTIVE TAB CONTENT */}
            <section style={{ minWidth: 0 }}>
              {portalTab === "overview" && renderOverviewTab()}
              {portalTab === "profile" && renderProfileTab()}
              {portalTab === "password" && renderPasswordTab()}
              {portalTab === "devices" && renderDevicesTab()}
              {portalTab === "reviews" && renderReviewsTab()}
              {portalTab === "vouchers" && renderVouchersTab()}
              {portalTab === "notifications" && renderNotificationsTab()}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
