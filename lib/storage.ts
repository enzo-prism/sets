import { STORAGE_KEY } from "@/lib/constants"
import type { LoggedSet } from "@/lib/types"

export function loadSets(): LoggedSet[] {
  if (typeof window === "undefined") {
    return []
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as LoggedSet[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSets(sets: LoggedSet[]) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
}
