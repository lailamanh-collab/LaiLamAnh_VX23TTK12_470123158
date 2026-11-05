import { api } from "./client"

export type WeekDay = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"

export type OpeningHour = {
  dayOfWeek: WeekDay
  isOpen: boolean
  openTime: string
  closeTime: string
}

export type ServiceArea = {
  id: number
  name: string
  city: string
  address: string
  phone: string
  capacityPerSlot: number
  slotMinutes: number
  isActive: boolean
  openingHours: OpeningHour[]
  description?: string
}

// Backward-compat alias for Branch
export type Branch = ServiceArea

export type ScheduleDay = {
  dayOfWeek: WeekDay
  isWorking: boolean
  startTime: string
  endTime: string
}

export type Technician = {
  id: number
  fullName: string
  email: string
  phoneNumber: string | null
  serviceAreaId: number
  serviceAreaName: string
  branchId?: number
  branchName?: string
  specialty?: string | null
  isActive: boolean
  schedules: ScheduleDay[]
}

export const dayOrder: WeekDay[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export const dayLabel: Record<WeekDay, string> = {
  Monday: "Thứ hai",
  Tuesday: "Thứ ba",
  Wednesday: "Thứ tư",
  Thursday: "Thứ năm",
  Friday: "Thứ sáu",
  Saturday: "Thứ bảy",
  Sunday: "Chủ nhật",
}

export const defaultHours = (): OpeningHour[] => dayOrder.map((day) => ({
  dayOfWeek: day,
  isOpen: day !== "Sunday",
  openTime: "08:00",
  closeTime: "18:00",
}))

export const getServiceAreas = () => api<ServiceArea[]>("/api/service-areas")
export const getBranches = getServiceAreas

export const adminServiceAreas = (token: string) => api<ServiceArea[]>("/api/admin/service-areas", {}, token)
export const adminBranches = adminServiceAreas

export const adminTechnicians = async (token: string): Promise<Technician[]> => {
  const techs = await api<Technician[]>("/api/admin/technicians", {}, token)
  return techs.map(t => ({
    ...t,
    branchId: t.serviceAreaId,
    branchName: t.serviceAreaName
  }))
}

export const myTechnicianProfile = async (token: string): Promise<Technician> => {
  const t = await api<Technician>("/api/technician/me", {}, token)
  return {
    ...t,
    branchId: t.serviceAreaId,
    branchName: t.serviceAreaName
  }
}

export function saveServiceArea(token: string, body: object, id?: number) {
  return api<ServiceArea>(`/api/admin/service-areas${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(body),
  }, token)
}

export const saveBranch = saveServiceArea

export function createTechnician(token: string, body: object) {
  return api<Technician>("/api/admin/technicians", { method: "POST", body: JSON.stringify(body) }, token)
}

export function updateTechnician(token: string, id: number, body: object) {
  return api<Technician>(`/api/admin/technicians/${id}`, { method: "PUT", body: JSON.stringify(body) }, token)
}

export function saveSchedule(token: string, id: number, schedules: ScheduleDay[]) {
  return api<Technician>(`/api/admin/technicians/${id}/schedule`, {
    method: "PUT",
    body: JSON.stringify({ schedules }),
  }, token)
}
