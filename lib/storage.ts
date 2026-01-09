import {
  PENDING_DELETE_KEY,
  PENDING_SYNC_KEY,
  STORAGE_KEY,
} from "@/lib/constants"
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

export function loadPendingSync() {
  if (typeof window === "undefined") {
    return false
  }
  try {
    return window.localStorage.getItem(PENDING_SYNC_KEY) === "1"
  } catch {
    return false
  }
}

export function savePendingSync(pending: boolean) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(PENDING_SYNC_KEY, pending ? "1" : "0")
}

export function loadPendingDeletes(): string[] {
  if (typeof window === "undefined") {
    return []
  }
  try {
    const raw = window.localStorage.getItem(PENDING_DELETE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePendingDeletes(ids: string[]) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(PENDING_DELETE_KEY, JSON.stringify(ids))
}
