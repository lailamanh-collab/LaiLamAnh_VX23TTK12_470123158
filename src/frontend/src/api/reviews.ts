import { api } from "./client"

export interface ReviewItem {
  id: number
  bookingId: number
  bookingCode: string
  customerId: string
  customerName: string
  rating: number
  comment?: string | null
  isVisible: boolean
  createdAt: string
  updatedAt?: string | null
  serviceName?: string
  categoryName?: string
  serviceCategoryName?: string
  serviceAreaName?: string
  phoneModelName: string
  brandName: string
  branchName: string
  technicianName?: string | null
}

export interface ReviewStats {
  totalReviews: number
  averageRating: number
  fiveStarCount: number
  fourStarCount: number
  threeStarCount: number
  twoStarCount: number
  oneStarCount: number
  hiddenCount: number
}

function normalizeReview(r: ReviewItem): ReviewItem {
  return {
    ...r,
    phoneModelName: r.serviceName || r.phoneModelName || "Dịch vụ sửa chữa",
    brandName: r.categoryName || r.brandName || "Sửa chữa nhà cửa",
    branchName: r.serviceAreaName || r.branchName || "Khu vực phục vụ"
  }
}

export async function submitReview(
  token: string,
  bookingId: number,
  data: { rating: number; comment?: string },
): Promise<ReviewItem> {
  const r = await api<ReviewItem>(
    `/api/reviews/bookings/${bookingId}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  )
  return normalizeReview(r)
}

export async function fetchBookingReview(token: string, bookingId: number): Promise<ReviewItem | null> {
  try {
    const r = await api<ReviewItem>(`/api/reviews/bookings/${bookingId}`, {}, token)
    return normalizeReview(r)
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
      return null
    }
    throw err
  }
}

export async function fetchMyReviews(token: string): Promise<ReviewItem[]> {
  const list = await api<ReviewItem[]>("/api/reviews/mine", {}, token)
  return list.map(normalizeReview)
}

export async function fetchPublicReviews(limit?: number): Promise<ReviewItem[]> {
  const qs = limit ? `?limit=${limit}` : ""
  const list = await api<ReviewItem[]>(`/api/reviews/public${qs}`)
  return list.map(normalizeReview)
}

export async function fetchAdminReviews(
  token: string,
  filter?: {
    rating?: number
    serviceAreaId?: number
    branchId?: number
    technicianId?: number
    isVisible?: boolean
    search?: string
  },
): Promise<ReviewItem[]> {
  const params = new URLSearchParams()
  if (filter?.rating) params.set("rating", String(filter.rating))
  const areaId = filter?.serviceAreaId ?? filter?.branchId
  if (areaId) {
    params.set("serviceAreaId", String(areaId))
    params.set("branchId", String(areaId))
  }
  if (filter?.technicianId) params.set("technicianId", String(filter.technicianId))
  if (filter?.isVisible !== undefined) params.set("isVisible", String(filter.isVisible))
  if (filter?.search) params.set("search", filter.search)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const list = await api<ReviewItem[]>(`/api/admin/reviews${qs}`, {}, token)
  return list.map(normalizeReview)
}

export async function fetchAdminReviewStats(token: string): Promise<ReviewStats> {
  return api<ReviewStats>("/api/admin/reviews/stats", {}, token)
}

export async function updateReviewVisibility(
  token: string,
  id: number,
  isVisible: boolean,
): Promise<{ message: string }> {
  return api<{ message: string }>(
    `/api/admin/reviews/${id}/visibility`,
    {
      method: "PUT",
      body: JSON.stringify({ isVisible }),
    },
    token,
  )
}

export async function deleteReview(token: string, id: number): Promise<{ message: string }> {
  return api<{ message: string }>(
    `/api/admin/reviews/${id}`,
    {
      method: "DELETE",
    },
    token,
  )
}
