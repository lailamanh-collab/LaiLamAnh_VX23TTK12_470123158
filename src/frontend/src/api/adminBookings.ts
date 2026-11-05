import { api } from "./client"
import type { BookingLine, BookingSummary } from "./bookings"

export type AdminBooking = {
  id: number
  bookingCode: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  fullAddress?: string
  addressLine?: string
  ward?: string | null
  district?: string | null
  city?: string | null
  serviceCategoryName?: string
  primaryServiceName?: string
  serviceAreaId?: number
  serviceAreaName?: string
  phoneModelId?: number
  brandName?: string
  phoneModelName?: string
  branchId?: number
  branchName?: string
  appointmentDate: string
  slotStart: string
  slotEnd: string
  status: string
  problemDescription: string
  estimatedTotal: number
  actualCost: number | null
  technicianId: number | null
  technicianName: string | null
  technicianPhone?: string | null
  diagnosis: string | null
  repairNotes: string | null
  repairSolution: string | null
  onTheWayAt?: string | null
  inspectionStartedAt?: string | null
  repairStartedAt?: string | null
  completedAt?: string | null
  createdAt: string
  services: BookingLine[]
  timeline: { fromStatus: string | null; toStatus: string; note: string | null; changedAt: string }[]
}

export type AdminBookingFilter = {
  search?: string
  status?: string
  serviceAreaId?: number
  branchId?: number
  technicianId?: number
  date?: string
  fromDate?: string
  toDate?: string
}

export type CustomerSummary = {
  id: string
  fullName: string
  email: string
  phoneNumber: string | null
  isActive: boolean
  createdAt: string
  totalBookings: number
  completedBookings: number
}

export type CustomerDetail = CustomerSummary & {
  bookings: BookingSummary[]
}

export function adminGetBookings(token: string, filter: AdminBookingFilter = {}) {
  const params = new URLSearchParams()
  if (filter.search) params.set("search", filter.search)
  if (filter.status) params.set("status", filter.status)
  const areaId = filter.serviceAreaId ?? filter.branchId
  if (areaId) {
    params.set("serviceAreaId", String(areaId))
    params.set("branchId", String(areaId))
  }
  if (filter.technicianId) params.set("technicianId", String(filter.technicianId))
  if (filter.date) params.set("date", filter.date)
  if (filter.fromDate) params.set("fromDate", filter.fromDate)
  if (filter.toDate) params.set("toDate", filter.toDate)

  const query = params.toString() ? `?${params.toString()}` : ""
  return api<AdminBooking[]>(`/api/admin/bookings${query}`, {}, token)
}

export function adminGetBookingDetail(token: string, id: number) {
  return api<AdminBooking>(`/api/admin/bookings/${id}`, {}, token)
}

export function adminConfirmBooking(token: string, id: number, note?: string) {
  return api<void>(
    `/api/admin/bookings/${id}/confirm`,
    { method: "POST", body: JSON.stringify({ note }) },
    token
  )
}

export function adminAssignTechnician(token: string, id: number, technicianId: number, note?: string) {
  return api<void>(
    `/api/admin/bookings/${id}/assign`,
    { method: "POST", body: JSON.stringify({ technicianId, note }) },
    token
  )
}

export function adminCancelBooking(token: string, id: number, reason?: string) {
  return api<void>(
    `/api/admin/bookings/${id}/cancel`,
    { method: "POST", body: JSON.stringify({ reason }) },
    token
  )
}

export function adminGetCustomers(token: string, search = "") {
  const q = search ? `?search=${encodeURIComponent(search)}` : ""
  return api<CustomerSummary[]>(`/api/admin/customers${q}`, {}, token)
}

export function adminGetCustomerDetail(token: string, id: string) {
  return api<CustomerDetail>(`/api/admin/customers/${id}`, {}, token)
}

export function adminToggleCustomerStatus(token: string, id: string) {
  return api<void>(`/api/admin/customers/${id}/toggle-status`, { method: "POST" }, token)
}

export interface AdminSummary {
  id: string
  fullName: string
  email: string
  phoneNumber: string | null
  isActive: boolean
  createdAt: string
  role: string
}

export interface CreateAdminPayload {
  fullName: string
  email: string
  phoneNumber?: string
  password: string
}

export function adminGetAdmins(token: string, search = "") {
  const q = search ? `?search=${encodeURIComponent(search)}` : ""
  return api<AdminSummary[]>(`/api/admin/customers/admins${q}`, {}, token)
}

export function adminCreateAdmin(token: string, body: CreateAdminPayload) {
  return api<AdminSummary>("/api/admin/customers/admins", { method: "POST", body: JSON.stringify(body) }, token)
}

export function adminToggleAdminStatus(token: string, id: string) {
  return api<void>(`/api/admin/customers/admins/${id}/toggle-status`, { method: "POST" }, token)
}
