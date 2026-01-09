"use client"

import * as React from "react"
import type { LoggedSet } from "@/lib/types"
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

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function SetsProvider({ children }: { children: React.ReactNode }) {
  const [sets, setSets] = React.useState<LoggedSet[]>([])
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    setSets(loadSets())
    setIsLoaded(true)
  }, [])

  React.useEffect(() => {
    if (!isLoaded) {
      return
    }
    saveSets(sets)
  }, [sets, isLoaded])

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
    return nextSet
  }, [])

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
    },
    []
  )

  const deleteSet = React.useCallback<SetsContextValue["deleteSet"]>((id) => {
    setSets((prev) => prev.filter((set) => set.id !== id))
  }, [])

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
