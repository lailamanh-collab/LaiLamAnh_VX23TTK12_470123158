import { api } from "./client"
import type { PricingType } from "./catalog"
import type { ReviewItem } from "./reviews"

export type Slot = {
  start: string
  end: string
  capacity: number
  booked: number
  isFull: boolean
}

export type BookingLine = {
  repairServiceId: number
  serviceName: string
  pricingType: PricingType
  unitPrice: number | null
}

export type BookingSummary = {
  id: number
  bookingCode: string
  customerName?: string
  customerPhone?: string
  serviceCategoryName?: string
  primaryServiceName?: string
  serviceAreaName?: string
  fullAddress?: string
  brandName?: string
  phoneModelName?: string
  branchName?: string
  appointmentDate: string
  slotStart: string
  status: string
  estimatedTotal: number
  actualCost: number | null
  technicianName: string | null
  createdAt: string
  hasReview?: boolean
}

export type BookingDetail = BookingSummary & {
  addressLine?: string
  ward?: string | null
  district?: string | null
  city?: string | null
  serviceAreaPhone?: string
  branchAddress?: string
  slotEnd: string
  problemDescription: string
  diagnosis: string | null
  repairNotes: string | null
  repairSolution: string | null
  onTheWayAt?: string | null
  inspectionStartedAt?: string | null
  repairStartedAt?: string | null
  completedAt?: string | null
  services: BookingLine[]
  timeline: { fromStatus: string | null; toStatus: string; note: string | null; changedAt: string }[]
  review?: ReviewItem | null
}

export const statusLabel: Record<string, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Assigned: "Đã phân công",
  OnTheWay: "Đang di chuyển",
  Received: "Đang di chuyển", // legacy fallback
  Inspecting: "Đang kiểm tra",
  Repairing: "Đang sửa chữa",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
}

export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  Pending: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
  Confirmed: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  Assigned: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  OnTheWay: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  Received: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  Inspecting: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  Repairing: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  Completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  Cancelled: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
}

export function getSlots(serviceAreaId: number, date: string) {
  return api<Slot[]>(`/api/bookings/slots?serviceAreaId=${serviceAreaId}&branchId=${serviceAreaId}&date=${date}`)
}

export function createBooking(token: string, body: {
  serviceAreaId: number
  repairServiceIds: number[]
  customerName: string
  customerPhone: string
  addressLine: string
  ward?: string
  district?: string
  city?: string
  appointmentDate: string
  slotStart: string
  problemDescription: string
  branchId?: number
  phoneModelId?: number
}) {
  return api<BookingDetail>("/api/bookings", { method: "POST", body: JSON.stringify(body) }, token)
}

export function myBookings(token: string, filter = "") {
  return api<BookingSummary[]>(`/api/bookings/mine?filter=${filter}`, {}, token)
}

export function myBooking(token: string, id: number) {
  return api<BookingDetail>(`/api/bookings/mine/${id}`, {}, token)
}

export function cancelBooking(token: string, id: number, reason = "Khách hủy lịch hẹn.") {
  return api<void>(`/api/bookings/mine/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }, token)
}
