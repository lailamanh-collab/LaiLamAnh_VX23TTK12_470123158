import { api } from "./client"

export type UserProfile = {
  id: string
  fullName: string
  email: string
  phoneNumber: string | null
  role: "Admin" | "Technician" | "Customer" | string
}

export type AuthResponse = {
  accessToken: string
  expiresAt: string
  user: UserProfile
}

export type RegisterPayload = {
  fullName: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
}

export type UpdateProfilePayload = {
  fullName: string
  phoneNumber: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function login(email: string, password: string) {
  return api<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export function register(payload: RegisterPayload) {
  return api<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getProfile(token: string) {
  return api<UserProfile>("/api/account/profile", {}, token)
}

export function updateProfile(token: string, payload: UpdateProfilePayload) {
  return api<UserProfile>("/api/account/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token)
}

export function changePassword(token: string, payload: ChangePasswordPayload) {
  return api<void>("/api/account/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token)
}

export type ForgotPasswordPayload = {
  email: string
}

export type ForgotPasswordResponse = {
  message: string
  resetToken: string
  resetCode: string
  email: string
}

export type ResetPasswordPayload = {
  email: string
  token: string
  newPassword: string
  confirmPassword: string
}

export function forgotPassword(email: string) {
  return api<ForgotPasswordResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(payload: ResetPasswordPayload) {
  return api<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function homePathForRole(role: string) {
  if (role === "Admin") {
    return "/admin"
  }
  if (role === "Technician") {
    return "/technician"
  }
  return "/"
}
