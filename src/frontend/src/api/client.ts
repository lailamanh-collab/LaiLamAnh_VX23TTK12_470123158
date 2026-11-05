export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

function baseUrl() {
  return import.meta.env.VITE_API_URL.replace(/\/$/, "")
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl()}${path}`, { ...options, headers })
  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : "Không thực hiện được yêu cầu."
    throw new ApiError(message, response.status, data?.errors)
  }

  return data as T
}
