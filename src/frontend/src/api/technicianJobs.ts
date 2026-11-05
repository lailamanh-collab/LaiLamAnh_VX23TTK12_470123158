import { api } from "./client"

export interface TechnicianDashboardData {
  technicianId: number
  technicianName: string
  serviceAreaId?: number
  serviceAreaName?: string
  branchId: number
  branchName: string
  jobsToday: number
  confirmedJobs: number
  assignedJobs?: number
  onTheWayJobs?: number
  receivedJobs: number
  inspectingJobs: number
  repairingJobs: number
  completedJobs: number
  completedTodayJobs: number
  totalActiveJobs: number
}

export interface TechnicianJobSummary {
  id: number
  bookingCode: string
  customerName: string
  customerPhone?: string | null
  fullAddress?: string
  serviceCategoryName?: string
  primaryServiceName?: string
  serviceAreaName?: string
  brandName: string
  phoneModelName: string
  branchName: string
  appointmentDate: string
  slotStart: string
  slotEnd: string
  status: string
  problemDescription: string
  estimatedTotal: number
  actualCost?: number | null
  createdAt: string
  onTheWayAt?: string | null
  receivedAt?: string | null
  inspectionStartedAt?: string | null
  repairStartedAt?: string | null
  completedAt?: string | null
}

export interface BookingServiceLineItem {
  repairServiceId: number
  serviceName: string
  pricingType: "FixedPrice" | "InspectionRequired"
  unitPrice?: number | null
}

export interface BookingTimelineItem {
  fromStatus?: string | null
  toStatus: string
  note?: string | null
  changedAt: string
}

export interface TechnicianJobDetail {
  id: number
  bookingCode: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  fullAddress?: string
  addressLine?: string
  ward?: string | null
  district?: string | null
  city?: string | null
  serviceCategoryName?: string
  primaryServiceName?: string
  serviceAreaId?: number
  serviceAreaName?: string
  serviceAreaPhone?: string
  phoneModelId: number
  brandName: string
  phoneModelName: string
  branchId: number
  branchName: string
  branchAddress: string
  appointmentDate: string
  slotStart: string
  slotEnd: string
  status: string
  problemDescription: string
  estimatedTotal: number
  actualCost?: number | null
  diagnosis?: string | null
  repairNotes?: string | null
  repairSolution?: string | null
  createdAt: string
  onTheWayAt?: string | null
  receivedAt?: string | null
  inspectionStartedAt?: string | null
  repairStartedAt?: string | null
  completedAt?: string | null
  services: BookingServiceLineItem[]
  timeline: BookingTimelineItem[]
}

export async function fetchTechnicianDashboard(token: string): Promise<TechnicianDashboardData> {
  const data = await api<TechnicianDashboardData>("/api/technician/dashboard", {}, token)
  return {
    ...data,
    branchId: data.serviceAreaId ?? data.branchId,
    branchName: data.serviceAreaName ?? data.branchName,
    receivedJobs: data.onTheWayJobs ?? data.receivedJobs
  }
}

export async function fetchTechnicianJobs(
  token: string,
  filter?: { status?: string; search?: string },
): Promise<TechnicianJobSummary[]> {
  const params = new URLSearchParams()
  if (filter?.status) params.set("status", filter.status)
  if (filter?.search) params.set("search", filter.search)
  const qs = params.toString() ? `?${params.toString()}` : ""
  return api<TechnicianJobSummary[]>(`/api/technician/jobs${qs}`, {}, token)
}

export async function fetchTechnicianJobDetail(token: string, id: number): Promise<TechnicianJobDetail> {
  return api<TechnicianJobDetail>(`/api/technician/jobs/${id}`, {}, token)
}

export async function startTravel(
  token: string,
  id: number,
  note?: string,
): Promise<TechnicianJobDetail> {
  return api<TechnicianJobDetail>(
    `/api/technician/jobs/${id}/start-travel`,
    {
      method: "POST",
      body: JSON.stringify({ note: note || null }),
    },
    token,
  )
}

export async function receiveJob(
  token: string,
  id: number,
  receiveNote?: string,
): Promise<TechnicianJobDetail> {
  return startTravel(token, id, receiveNote)
}

export async function startInspection(
  token: string,
  id: number,
  data: { diagnosis?: string; repairNotes?: string; actualCost?: number | null },
): Promise<TechnicianJobDetail> {
  return api<TechnicianJobDetail>(
    `/api/technician/jobs/${id}/inspect`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  )
}

export async function startRepair(
  token: string,
  id: number,
  data: { repairSolution?: string; repairNotes?: string; actualCost?: number | null },
): Promise<TechnicianJobDetail> {
  return api<TechnicianJobDetail>(
    `/api/technician/jobs/${id}/start-repair`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  )
}

export async function updateRepairInfo(
  token: string,
  id: number,
  data: {
    diagnosis?: string
    repairSolution?: string
    repairNotes?: string
    actualCost?: number | null
    progressNote?: string
  },
): Promise<TechnicianJobDetail> {
  return api<TechnicianJobDetail>(
    `/api/technician/jobs/${id}/repair-info`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    token,
  )
}

export async function completeRepair(
  token: string,
  id: number,
  data: { repairResult?: string; repairNotes?: string; actualCost?: number | null },
): Promise<TechnicianJobDetail> {
  return api<TechnicianJobDetail>(
    `/api/technician/jobs/${id}/complete`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  )
}
