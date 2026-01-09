"use client"

import * as React from "react"
import type { LoggedSet } from "@/lib/types"

type SetsContextValue = {
  sets: LoggedSet[]
  isLoaded: boolean
  error: string | null
  refresh: () => Promise<void>
  addSet: (
    data: Omit<LoggedSet, "id" | "createdAtISO" | "updatedAtISO">
  ) => Promise<LoggedSet>
  updateSet: (
    id: string,
    updates: Omit<LoggedSet, "id" | "createdAtISO" | "updatedAtISO">
  ) => Promise<LoggedSet>
  deleteSet: (id: string) => Promise<void>
}

const SetsContext = React.createContext<SetsContextValue | null>(null)

type ApiErrorShape = {
  error?: string
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function requestJson<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  const text = await response.text()
  const payload = text ? safeJsonParse(text) : null

  if (!response.ok) {
    const message =
      (payload as ApiErrorShape | null)?.error ||
      response.statusText ||
      "Request failed."
    throw new Error(message)
  }

  return payload as T
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return "Unknown error"
}

export function SetsProvider({ children }: { children: React.ReactNode }) {
  const [sets, setSets] = React.useState<LoggedSet[]>([])
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setError(null)
    try {
      const data = await requestJson<LoggedSet[]>("/api/sets")
      setSets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoaded(true)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const addSet = React.useCallback<SetsContextValue["addSet"]>(
    async (data) => {
      setError(null)
      try {
        const created = await requestJson<LoggedSet>("/api/sets", {
          method: "POST",
          body: JSON.stringify(data),
        })
        setSets((prev) => [created, ...prev])
        return created
      } catch (err) {
        setError(getErrorMessage(err))
        throw err
      }
    },
    []
  )

  const updateSet = React.useCallback<SetsContextValue["updateSet"]>(
    async (id, updates) => {
      setError(null)
      try {
        const updated = await requestJson<LoggedSet>("/api/sets", {
          method: "PATCH",
          body: JSON.stringify({ id, ...updates }),
        })
        setSets((prev) =>
          prev.map((set) => (set.id === id ? updated : set))
        )
        return updated
      } catch (err) {
        setError(getErrorMessage(err))
        throw err
      }
    },
    []
  )

  const deleteSet = React.useCallback<SetsContextValue["deleteSet"]>(
    async (id) => {
      setError(null)
      try {
        await requestJson<{ ok: boolean }>("/api/sets", {
          method: "DELETE",
          body: JSON.stringify({ id }),
        })
        setSets((prev) => prev.filter((set) => set.id !== id))
      } catch (err) {
        setError(getErrorMessage(err))
        throw err
      }
    },
    []
  )

  const value = React.useMemo(
    () => ({ sets, isLoaded, error, refresh, addSet, updateSet, deleteSet }),
    [sets, isLoaded, error, refresh, addSet, updateSet, deleteSet]
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
