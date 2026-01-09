"use client"

import * as React from "react"
import type { LoggedSet } from "@/lib/types"
import { getDeviceId } from "@/lib/device"
import { loadSets, saveSets } from "@/lib/storage"

type SetsContextValue = {
  sets: LoggedSet[]
  isLoaded: boolean
  addSet: (data: Omit<LoggedSet, "id" | "createdAtISO" | "updatedAtISO">) =>
    | LoggedSet
    | null
  updateSet: (
    id: string,
    updates: Omit<LoggedSet, "id" | "createdAtISO" | "updatedAtISO">
  ) => void
  deleteSet: (id: string) => void
}

const SetsContext = React.createContext<SetsContextValue | null>(null)

const isSupabaseEnabled = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function mergeSets(localSets: LoggedSet[], remoteSets: LoggedSet[]) {
  const merged = new Map<string, LoggedSet>()

  for (const set of localSets) {
    merged.set(set.id, set)
  }

  for (const set of remoteSets) {
    const existing = merged.get(set.id)
    if (!existing) {
      merged.set(set.id, set)
      continue
    }
    const existingUpdated = existing.updatedAtISO || existing.createdAtISO
    const incomingUpdated = set.updatedAtISO || set.createdAtISO
    if (incomingUpdated > existingUpdated) {
      merged.set(set.id, set)
    }
  }

  return Array.from(merged.values())
}

export function SetsProvider({ children }: { children: React.ReactNode }) {
  const [sets, setSets] = React.useState<LoggedSet[]>([])
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [deviceId, setDeviceId] = React.useState("")
  const setsRef = React.useRef<LoggedSet[]>([])

  React.useEffect(() => {
    setSets(loadSets())
    setDeviceId(getDeviceId())
    setIsLoaded(true)
  }, [])

  React.useEffect(() => {
    if (!isLoaded) {
      return
    }
    saveSets(sets)
  }, [sets, isLoaded])

  React.useEffect(() => {
    setsRef.current = sets
  }, [sets])

  React.useEffect(() => {
    if (!isSupabaseEnabled || !deviceId) {
      return
    }
    let isActive = true

    const loadRemote = async () => {
      try {
        const response = await fetch("/api/sets", {
          headers: { "x-device-id": deviceId },
        })
        if (!response.ok) {
          return
        }
        const remoteSets = (await response.json()) as LoggedSet[]
        if (isActive && Array.isArray(remoteSets)) {
          const localSets = setsRef.current
          const mergedSets = mergeSets(localSets, remoteSets)
          setSets(mergedSets)

          const remoteIds = new Set(remoteSets.map((set) => set.id))
          const missingSets = localSets.filter((set) => !remoteIds.has(set.id))
          if (missingSets.length) {
            await Promise.all(
              missingSets.map((set) =>
                fetch("/api/sets", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-device-id": deviceId,
                  },
                  body: JSON.stringify({ set }),
                })
              )
            )
          }
        }
      } catch (error) {
        console.error("Failed to load sets from Supabase", error)
      }
    }

    loadRemote()

    return () => {
      isActive = false
    }
  }, [deviceId])

  const syncAdd = React.useCallback(
    async (nextSet: LoggedSet) => {
      if (!isSupabaseEnabled || !deviceId) {
        return
      }
      try {
        await fetch("/api/sets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          body: JSON.stringify({ set: nextSet }),
        })
      } catch (error) {
        console.error("Failed to create set in Supabase", error)
      }
    },
    [deviceId]
  )

  const syncUpdate = React.useCallback(
    async (
      id: string,
      updates: Omit<LoggedSet, "id" | "createdAtISO" | "updatedAtISO">
    ) => {
      if (!isSupabaseEnabled || !deviceId) {
        return
      }
      try {
        await fetch("/api/sets", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          body: JSON.stringify({ id, updates }),
        })
      } catch (error) {
        console.error("Failed to update set in Supabase", error)
      }
    },
    [deviceId]
  )

  const syncDelete = React.useCallback(
    async (id: string) => {
      if (!isSupabaseEnabled || !deviceId) {
        return
      }
      try {
        await fetch("/api/sets", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          body: JSON.stringify({ id }),
        })
      } catch (error) {
        console.error("Failed to delete set in Supabase", error)
      }
    },
    [deviceId]
  )

  const addSet = React.useCallback<SetsContextValue["addSet"]>((data) => {
    const nowIso = new Date().toISOString()
    const nextSet: LoggedSet = {
      id: createId(),
      workoutType: data.workoutType ?? null,
      weightLb: data.weightLb ?? null,
      reps: data.reps ?? null,
      restSeconds: data.restSeconds ?? null,
      performedAtISO: data.performedAtISO ?? null,
      createdAtISO: nowIso,
      updatedAtISO: nowIso,
    }
    setSets((prev) => [nextSet, ...prev])
    void syncAdd(nextSet)
    return nextSet
  }, [syncAdd])

  const updateSet = React.useCallback<SetsContextValue["updateSet"]>(
    (id, updates) => {
      setSets((prev) =>
        prev.map((set) =>
          set.id === id
            ? {
                ...set,
                workoutType:
                  updates.workoutType !== undefined
                    ? updates.workoutType
                    : set.workoutType,
                weightLb:
                  updates.weightLb !== undefined
                    ? updates.weightLb
                    : set.weightLb,
                reps: updates.reps !== undefined ? updates.reps : set.reps,
                restSeconds:
                  updates.restSeconds !== undefined
                    ? updates.restSeconds
                    : set.restSeconds,
                performedAtISO:
                  updates.performedAtISO !== undefined
                    ? updates.performedAtISO
                    : set.performedAtISO,
                updatedAtISO: new Date().toISOString(),
              }
            : set
        )
      )
      void syncUpdate(id, updates)
    },
    [syncUpdate]
  )

  const deleteSet = React.useCallback<SetsContextValue["deleteSet"]>((id) => {
    setSets((prev) => prev.filter((set) => set.id !== id))
    void syncDelete(id)
  }, [syncDelete])

  const value = React.useMemo(
    () => ({ sets, isLoaded, addSet, updateSet, deleteSet }),
    [sets, isLoaded, addSet, updateSet, deleteSet]
  )

  return <SetsContext.Provider value={value}>{children}</SetsContext.Provider>
}

export function useSets() {
  const context = React.useContext(SetsContext)
  if (!context) {
    throw new Error("useSets must be used within SetsProvider")
  }
  return context
}
