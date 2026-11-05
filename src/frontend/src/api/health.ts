import { api } from "./client"

export type HealthStatus = {
  status: string
  database: string
}

export function getHealth() {
  return api<HealthStatus>("/api/health")
}
