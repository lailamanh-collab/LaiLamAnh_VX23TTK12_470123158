import { api } from "./client"

export type PricingType = "FixedPrice" | "InspectionRequired"

export type ServiceCategory = {
  id: number
  name: string
  slug: string
  description: string | null
  iconName: string | null
  imageUrl: string | null
  isActive: boolean
  servicesCount: number
  modelCount?: number
}

export type RepairService = {
  id: number
  serviceCategoryId: number
  serviceCategoryName: string
  name: string
  slug: string
  description: string | null
  basePrice: number | null
  pricingType: PricingType
  estimatedDuration: string | null
  imageUrl: string | null
  isActive: boolean
}

export type CatalogSearchItem = {
  id: number
  name: string
  slug: string
  serviceCategoryId: number
  serviceCategoryName: string
  basePrice: number | null
  pricingType: PricingType
  description: string | null
}

// Backward-compat aliases for legacy page components
export type Brand = ServiceCategory
export type PhoneModel = RepairService & {
  brandId: number
  brandName: string
  releaseYear: number | null
}
export type ServicePrice = {
  id: number
  phoneModelId: number
  phoneModelName: string
  brandName: string
  repairServiceId: number
  repairServiceName: string
  pricingType: PricingType
  price: number | null
  isActive: boolean
}

export function formatPrice(arg1: PricingType | number | null, arg2?: number | null | PricingType): string {
  let pricingType: PricingType = "FixedPrice"
  let price: number | null = null

  if (typeof arg1 === "string") {
    pricingType = arg1 as PricingType
    price = typeof arg2 === "number" ? arg2 : null
  } else {
    price = arg1
    pricingType = typeof arg2 === "string" ? (arg2 as PricingType) : "FixedPrice"
  }

  if (pricingType === "InspectionRequired" || price === null || price === 0) {
    return "Kiểm tra & báo giá tại nhà"
  }
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price)
}

export function pricingLabel(pricingType: PricingType) {
  return pricingType === "FixedPrice" ? "Giá cố định" : "Khảo sát báo giá"
}

export const getCategories = (search = "") =>
  api<ServiceCategory[]>(`/api/catalog/categories?search=${encodeURIComponent(search)}`)

export const getBrands = getCategories

export const getServices = (search = "", pricingType = "", categoryId?: number) => {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (pricingType) params.set("pricingType", pricingType)
  if (categoryId) params.set("categoryId", String(categoryId))
  return api<RepairService[]>(`/api/catalog/services?${params.toString()}`)
}

export const getModels = async (brandId?: number, search = ""): Promise<PhoneModel[]> => {
  const services = await getServices(search, "", brandId)
  return services.map(s => ({
    ...s,
    brandId: s.serviceCategoryId,
    brandName: s.serviceCategoryName,
    releaseYear: 2024
  }))
}

export const getPrices = async (_modelId?: number, _serviceId?: number): Promise<ServicePrice[]> => {
  const services = await getServices()
  return services.map(s => ({
    id: s.id,
    phoneModelId: s.id,
    phoneModelName: s.name,
    brandName: s.serviceCategoryName,
    repairServiceId: s.id,
    repairServiceName: s.name,
    pricingType: s.pricingType,
    price: s.basePrice,
    isActive: s.isActive
  }))
}

export const searchCatalog = (q: string, categoryId?: number, pricingType?: string) => {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (categoryId) params.set("categoryId", String(categoryId))
  if (pricingType) params.set("pricingType", pricingType)
  return api<CatalogSearchItem[]>(`/api/catalog/search?${params.toString()}`)
}

// ADMIN API
export const adminCategories = (token: string) => api<ServiceCategory[]>("/api/admin/catalog/categories", {}, token)
export const adminBrands = adminCategories

export const adminServices = (token: string) => api<RepairService[]>("/api/admin/catalog/services", {}, token)
export const adminModels = async (token: string): Promise<PhoneModel[]> => {
  const services = await adminServices(token)
  return services.map(s => ({
    ...s,
    brandId: s.serviceCategoryId,
    brandName: s.serviceCategoryName,
    releaseYear: 2024
  }))
}
export const adminPrices = async (token: string): Promise<ServicePrice[]> => {
  const services = await adminServices(token)
  return services.map(s => ({
    id: s.id,
    phoneModelId: s.id,
    phoneModelName: s.name,
    brandName: s.serviceCategoryName,
    repairServiceId: s.id,
    repairServiceName: s.name,
    pricingType: s.pricingType,
    price: s.basePrice,
    isActive: s.isActive
  }))
}

export function saveCategory(token: string, body: { name: string; description?: string; iconName?: string; imageUrl?: string; isActive: boolean }, id?: number) {
  return api<ServiceCategory>(`/api/admin/catalog/categories${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(body),
  }, token)
}

export function deleteCategory(token: string, id: number) {
  return api<void>(`/api/admin/catalog/categories/${id}`, {
    method: "DELETE",
  }, token)
}

export const saveBrand = (token: string, body: { name: string; description: string; isActive: boolean }, id?: number) =>
  saveCategory(token, body, id)

export function saveService(token: string, body: {
  serviceCategoryId: number
  name: string
  description?: string
  basePrice?: number | null
  pricingType: PricingType
  estimatedDuration?: string
  imageUrl?: string
  isActive: boolean
}, id?: number) {
  return api<RepairService>(`/api/admin/catalog/services${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(body),
  }, token)
}

export function deleteService(token: string, id: number) {
  return api<void>(`/api/admin/catalog/services/${id}`, {
    method: "DELETE",
  }, token)
}

export const saveModel = (_token: string, _body: object, _id?: number) => Promise.resolve({} as PhoneModel)
export const savePrice = (_token: string, _body: object, _id?: number) => Promise.resolve({} as ServicePrice)
