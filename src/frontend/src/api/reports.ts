import { api } from "./client"

export interface StatCardsData {
  bookingsToday: number
  pendingBookings: number
  confirmedBookings: number
  repairingBookings: number
  completedToday: number
  totalCustomers: number
  totalTechnicians: number
  totalRepairValue: number
  completedBookingsAllTime: number
}

export interface ChartDateItem {
  date: string
  count: number
  revenue: number
}

export interface ChartStatusItem {
  status: string
  statusLabel: string
  count: number
}

export interface ChartServiceItem {
  serviceName: string
  count: number
  revenue: number
}

export interface ChartCategoryItem {
  categoryName: string
  brandName?: string
  count: number
  revenue: number
}

export type ChartBrandItem = ChartCategoryItem

export interface ChartModelItem {
  modelName: string
  brandName: string
  count: number
}

export interface ChartAreaItem {
  areaName: string
  branchName?: string
  count: number
  revenue: number
}

export type ChartBranchItem = ChartAreaItem

export interface ChartMonthItem {
  month: string
  revenue: number
  count: number
}

export interface AdminDashboardData {
  stats: StatCardsData
  bookingsByDate: ChartDateItem[]
  bookingsByStatus: ChartStatusItem[]
  popularServices: ChartServiceItem[]
  popularCategories?: ChartCategoryItem[]
  repairedBrands: ChartBrandItem[]
  repairedModels: ChartModelItem[]
  bookingsByArea?: ChartAreaItem[]
  bookingsByBranch: ChartBranchItem[]
  revenueByMonth: ChartMonthItem[]
}

export interface ReportFilterParams {
  fromDate?: string
  toDate?: string
  serviceAreaId?: number
  branchId?: number
  technicianId?: number
  repairServiceId?: number
  serviceCategoryId?: number
  brandId?: number
  phoneModelId?: number
  status?: string
}

export interface ReportSummaryData {
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  averageBookingValue: number
}

export interface TechnicianPerformanceItem {
  technicianId: number
  technicianName: string
  serviceAreaName?: string
  branchName: string
  totalAssigned: number
  completedJobs: number
  totalRevenue: number
  averageRating: number
  totalReviews: number
}

export interface AreaPerformanceItem {
  serviceAreaId: number
  serviceAreaName: string
  branchId?: number
  branchName: string
  totalBookings: number
  completedBookings: number
  revenue: number
}

export type BranchPerformanceItem = AreaPerformanceItem

export interface ServicePerformanceItem {
  serviceId: number
  serviceName: string
  count: number
  totalRevenue: number
}

export interface CategoryPerformanceItem {
  categoryName: string
  brandName?: string
  count: number
  revenue: number
}

export type BrandPerformanceItem = CategoryPerformanceItem

export interface ReportResultData {
  summary: ReportSummaryData
  technicianPerformance: TechnicianPerformanceItem[]
  areaPerformance?: AreaPerformanceItem[]
  branchPerformance: BranchPerformanceItem[]
  servicePerformance: ServicePerformanceItem[]
  categoryPerformance?: CategoryPerformanceItem[]
  brandPerformance: BrandPerformanceItem[]
}

export async function fetchAdminDashboard(token: string): Promise<AdminDashboardData> {
  const data = await api<AdminDashboardData>("/api/admin/reports/dashboard", {}, token)
  return {
    ...data,
    repairedBrands: (data.popularCategories || data.repairedBrands || []).map(c => ({
      ...c,
      brandName: c.categoryName || c.brandName || "Nhóm dịch vụ"
    })),
    bookingsByBranch: (data.bookingsByArea || data.bookingsByBranch || []).map(a => ({
      ...a,
      branchName: a.areaName || a.branchName || "Khu vực"
    }))
  }
}

export async function fetchAdminReports(
  token: string,
  filter?: ReportFilterParams,
): Promise<ReportResultData> {
  const params = new URLSearchParams()
  if (filter?.fromDate) params.set("fromDate", filter.fromDate)
  if (filter?.toDate) params.set("toDate", filter.toDate)
  const areaId = filter?.serviceAreaId ?? filter?.branchId
  if (areaId) {
    params.set("serviceAreaId", String(areaId))
    params.set("branchId", String(areaId))
  }
  if (filter?.technicianId) params.set("technicianId", String(filter.technicianId))
  if (filter?.repairServiceId) params.set("repairServiceId", String(filter.repairServiceId))
  const catId = filter?.serviceCategoryId ?? filter?.brandId
  if (catId) {
    params.set("serviceCategoryId", String(catId))
    params.set("brandId", String(catId))
  }
  if (filter?.status) params.set("status", filter.status)

  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await api<ReportResultData>(`/api/admin/reports${qs}`, {}, token)

  return {
    ...data,
    branchPerformance: (data.areaPerformance || data.branchPerformance || []).map(a => ({
      ...a,
      branchName: a.serviceAreaName || a.branchName
    })),
    brandPerformance: (data.categoryPerformance || data.brandPerformance || []).map(c => ({
      ...c,
      brandName: c.categoryName || c.brandName
    }))
  }
}
