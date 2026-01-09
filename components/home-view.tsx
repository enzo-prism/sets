"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Dumbbell, Plus, RefreshCw } from "lucide-react"

import { AddSetDialog } from "@/components/add-set-dialog"
import { DataError } from "@/components/data-error"
import { EditSetSheet } from "@/components/edit-set-sheet"
import { SetCard } from "@/components/set-card"
import { Button } from "@/components/ui/button"
import { useSets } from "@/providers/sets-provider"
import { sortSets } from "@/lib/stats"

export function HomeView() {
  const { sets, isLoaded, error, refresh } = useSets()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const sortedSets = React.useMemo(() => sortSets(sets), [sets])
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [editingId, setEditingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const id = searchParams.get("edit")
    if (id) {
      setEditingId(id)
    }
  }, [searchParams])

  React.useEffect(() => {
    if (!isLoaded || !editingId) {
      return
    }
    const exists = sets.some((set) => set.id === editingId)
    if (!exists) {
      setEditingId(null)
      router.replace(pathname)
    }
  }, [editingId, isLoaded, pathname, router, sets])

  const editingSet = sortedSets.find((set) => set.id === editingId) ?? null

  const openEdit = (id: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("edit", id)
    setEditingId(id)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleEditOpenChange = (open: boolean) => {
    if (open) {
      return
    }
    setEditingId(null)
    router.replace(pathname)
  }

  const handleRefresh = async () => {
    if (isRefreshing) {
      return
    }
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      {error ? <DataError message={error} /> : null}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={handleRefresh}
          aria-label="Refresh sets"
          disabled={isRefreshing}
        >
          <RefreshCw className={isRefreshing ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
        </Button>
        <AddSetDialog
          trigger={
            <Button size="icon" className="h-11 w-11 rounded-full shadow-sm">
              <Plus className="h-5 w-5" />
            </Button>
          }
        />
      </div>

      {!isLoaded && !error ? (
        <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          Loading sets...
        </div>
      ) : !error && sortedSets.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No sets yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start tracking a single set to build momentum.
          </p>
          <div className="mt-4 flex justify-center">
            <AddSetDialog trigger={<Button>Add your first set</Button>} />
          </div>
        </div>
      ) : sortedSets.length > 0 ? (
        <div className="space-y-3">
          {sortedSets.map((set) => (
            <SetCard key={set.id} set={set} onClick={() => openEdit(set.id)} />
          ))}
        </div>
      ) : null}

      <EditSetSheet
        set={editingSet}
        open={Boolean(editingId)}
        onOpenChange={handleEditOpenChange}
      />
    </div>
  )
}
