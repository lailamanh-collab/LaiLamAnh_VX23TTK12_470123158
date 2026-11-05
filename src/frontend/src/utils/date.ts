/**
 * Date and time formatting utilities for Home Repair System.
 * Ensures timestamps stored in UTC on the server are accurately
 * converted and displayed in local Vietnam time (UTC+7).
 */

export function parseUtcToLocalDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null
  let s = String(dateStr).trim()
  if (!s) return null

  // If the string is in ISO format without explicit timezone offset ('Z', '+' or '-'),
  // append 'Z' so the browser's Date parser treats it as UTC rather than local time.
  // Examples: "2026-10-11T14:06:00", "2026-10-11 14:06:00.123"
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(s)) {
    s = s.replace(" ", "T") + "Z"
  }

  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Returns formatted date and time in Vietnam locale: "HH:mm dd/MM/yyyy" (e.g. "21:06 11/10/2026")
 */
export function formatDateTimeVi(dateStr?: string | null): string {
  if (!dateStr) return ""
  const d = parseUtcToLocalDate(dateStr)
  if (!d) return dateStr

  const hours = d.getHours().toString().padStart(2, "0")
  const minutes = d.getMinutes().toString().padStart(2, "0")
  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const year = d.getFullYear()

  return `${hours}:${minutes} ${day}/${month}/${year}`
}

/**
 * Returns compact formatted date and time for timeline steps: "HH:mm dd/MM" (e.g. "21:06 11/10")
 */
export function formatStepDateTime(dateStr?: string | null): string {
  if (!dateStr) return ""
  const d = parseUtcToLocalDate(dateStr)
  if (!d) return dateStr

  const hours = d.getHours().toString().padStart(2, "0")
  const minutes = d.getMinutes().toString().padStart(2, "0")
  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")

  return `${hours}:${minutes} ${day}/${month}`
}

/**
 * Returns time only: "HH:mm" (e.g. "21:06")
 */
export function formatTimeOnlyVi(dateStr?: string | null): string {
  if (!dateStr) return ""
  const d = parseUtcToLocalDate(dateStr)
  if (!d) return dateStr

  const hours = d.getHours().toString().padStart(2, "0")
  const minutes = d.getMinutes().toString().padStart(2, "0")

  return `${hours}:${minutes}`
}

/**
 * Returns date only: "dd/MM/yyyy" (e.g. "11/10/2026")
 */
export function formatDateOnlyVi(dateStr?: string | null): string {
  if (!dateStr) return ""
  const d = parseUtcToLocalDate(dateStr)
  if (!d) return dateStr

  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
}
