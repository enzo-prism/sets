import { DEVICE_ID_KEY } from "@/lib/constants"

export function getDeviceId() {
  if (typeof window === "undefined") {
    return ""
  }

  const existing = window.localStorage.getItem(DEVICE_ID_KEY)
  if (existing) {
    return existing
  }

  const nextId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  window.localStorage.setItem(DEVICE_ID_KEY, nextId)
  return nextId
}
