"use client"

import * as React from "react"
import type { LoggedSet } from "@/lib/types"
import { getDeviceId } from "@/lib/device"
import {
  loadPendingDeletes,
  loadPendingSync,
  loadSets,
  savePendingDeletes,
  savePendingSync,
  saveSets,
} from "@/lib/storage"

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

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function SetsProvider({ children }: { children: React.ReactNode }) {
  const [sets, setSets] = React.useState<LoggedSet[]>([])
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [deviceId, setDeviceId] = React.useState("")
  const setsRef = React.useRef<LoggedSet[]>([])
  const pendingSyncRef = React.useRef(false)
  const pendingDeletesRef = React.useRef<string[]>([])
  const syncSeqRef = React.useRef(0)

  React.useEffect(() => {
    const initialSets = loadSets()
    setsRef.current = initialSets
    setSets(initialSets)
    const pendingDeletes = loadPendingDeletes()
    const pendingSync =
      loadPendingSync() || pendingDeletes.length > 0 || initialSets.length > 0
    pendingDeletesRef.current = pendingDeletes
    pendingSyncRef.current = pendingSync
    savePendingSync(pendingSync)
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

  const markPendingSync = React.useCallback((pending: boolean) => {
    pendingSyncRef.current = pending
    savePendingSync(pending)
  }, [])

  const setPendingDeletes = React.useCallback((next: string[]) => {
    pendingDeletesRef.current = next
    savePendingDeletes(next)
  }, [])

  const syncSets = React.useCallback(
    async (nextSets?: LoggedSet[]) => {
      if (!deviceId) {
        return
      }

      const setsToSync = nextSets ?? setsRef.current
      const deletedIds = pendingDeletesRef.current

      if (!setsToSync.length && !deletedIds.length) {
        markPendingSync(false)
        return
      }

      const syncSeq = (syncSeqRef.current += 1)

      try {
        const response = await fetch("/api/sets", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          body: JSON.stringify({ sets: setsToSync, deletedIds }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          if (errorText) {
            console.warn("Supabase sync skipped:", errorText)
          }
          markPendingSync(true)
          return
        }

        const remoteSets = (await response.json()) as LoggedSet[]
        if (!Array.isArray(remoteSets)) {
          markPendingSync(true)
          return
        }

        if (syncSeqRef.current !== syncSeq) {
          return
        }

        setPendingDeletes([])
        markPendingSync(false)
        setsRef.current = remoteSets
        setSets(remoteSets)
      } catch (error) {
        console.error("Failed to sync sets with Supabase", error)
        markPendingSync(true)
      }
    },
    [deviceId, markPendingSync, setPendingDeletes]
  )

  React.useEffect(() => {
    if (!deviceId) {
      return
    }

    let isActive = true

    const loadRemote = async () => {
      const syncSeqAtStart = syncSeqRef.current
      if (pendingSyncRef.current) {
        await syncSets(setsRef.current)
        return
      }

      try {
        const response = await fetch("/api/sets", {
          headers: { "x-device-id": deviceId },
        })
        if (!response.ok) {
          const errorText = await response.text()
          if (errorText) {
            console.warn("Supabase sync skipped:", errorText)
          }
          return
        }
        const remoteSets = (await response.json()) as LoggedSet[]
        if (isActive && Array.isArray(remoteSets)) {
          if (
            pendingSyncRef.current ||
            syncSeqRef.current !== syncSeqAtStart
          ) {
            return
          }
          setsRef.current = remoteSets
          setSets(remoteSets)
          markPendingSync(false)
        }
      } catch (error) {
        console.error("Failed to load sets from Supabase", error)
      }
    }

    loadRemote()

    return () => {
      isActive = false
    }
  }, [deviceId, markPendingSync, syncSets])

  const addSet = React.useCallback<SetsContextValue["addSet"]>(
    (data) => {
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
      const nextSets = [nextSet, ...setsRef.current]
      setsRef.current = nextSets
      setSets(nextSets)
      markPendingSync(true)
      void syncSets(nextSets)
      return nextSet
    },
    [markPendingSync, syncSets]
  )

  const updateSet = React.useCallback<SetsContextValue["updateSet"]>(
    (id, updates) => {
      const nowIso = new Date().toISOString()
      const nextSets = setsRef.current.map((set) =>
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
              updatedAtISO: nowIso,
            }
          : set
      )
      setsRef.current = nextSets
      setSets(nextSets)
      markPendingSync(true)
      void syncSets(nextSets)
    },
    [markPendingSync, syncSets]
  )

  const deleteSet = React.useCallback<SetsContextValue["deleteSet"]>(
    (id) => {
      const nextSets = setsRef.current.filter((set) => set.id !== id)
      setsRef.current = nextSets
      setSets(nextSets)

      const pending = new Set(pendingDeletesRef.current)
      pending.add(id)
      setPendingDeletes(Array.from(pending))

      markPendingSync(true)
      void syncSets(nextSets)
    },
    [markPendingSync, setPendingDeletes, syncSets]
  )

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
