"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Copy, Dumbbell, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { AddSetDialog } from "@/components/add-set-dialog"
import { DataError } from "@/components/data-error"
import { EditSetSheet } from "@/components/edit-set-sheet"
import { SetCard } from "@/components/set-card"
import { Button } from "@/components/ui/button"
import { useSets } from "@/providers/sets-provider"
import { formatSetsForClipboard } from "@/lib/sets-export"
import { sortSets } from "@/lib/stats"
import { formatPtDayLabel, toPtDateFromInput, toPtDayKey } from "@/lib/time"
import type { LoggedSet } from "@/lib/types"

async function copyTextToClipboard(text: string) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "0"
  textarea.style.left = "0"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  const ok = document.execCommand("copy")
  document.body.removeChild(textarea)

  if (!ok) {
    throw new Error("Copy failed")
  }
}

export function HomeView() {
  const { sets, isLoaded, error, refresh } = useSets()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const sortedSets = React.useMemo(() => sortSets(sets), [sets])
  const groupedSets = React.useMemo(() => {
    const groups: Array<{ dayKey: string; label: string; items: LoggedSet[] }> =
      []
    let activeGroup: (typeof groups)[number] | null = null

    for (const set of sortedSets) {
      const sourceIso = set.performedAtISO ?? set.createdAtISO
      const dayKey = toPtDayKey(sourceIso) ?? "unknown"
      if (!activeGroup || activeGroup.dayKey !== dayKey) {
        const label =
          dayKey === "unknown"
            ? "Unknown date"
            : formatPtDayLabel(toPtDateFromInput(dayKey), "EEE, MMM d")
        activeGroup = { dayKey, label, items: [] }
        groups.push(activeGroup)
      }
      activeGroup.items.push(set)
    }

    return groups
  }, [sortedSets])
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

  const handleCopySets = async () => {
    const payload = formatSetsForClipboard(sortedSets)
    const count = sortedSets.length
    try {
      await copyTextToClipboard(payload)
      toast.success(`Copied ${count === 1 ? "1 set" : `${count} sets`}`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to copy sets."
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      {error ? <DataError message={error} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          className="h-11 gap-2"
          onClick={handleCopySets}
        >
          <Copy className="h-4 w-4" />
          Copy sets
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={handleRefresh}
            aria-label="Refresh sets"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={isRefreshing ? "h-5 w-5 animate-spin" : "h-5 w-5"}
            />
          </Button>
          <AddSetDialog
            trigger={
              <Button size="icon" className="h-11 w-11 rounded-full shadow-sm">
                <Plus className="h-5 w-5" />
              </Button>
            }
          />
        </div>
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
        <div className="space-y-5">
          {groupedSets.map((group) => (
            <div key={group.dayKey} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-muted/60" />
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                  {group.label}
                </div>
                <div className="h-px flex-1 bg-muted/60" />
              </div>
              <div className="space-y-3">
                {group.items.map((set) => (
                  <SetCard
                    key={set.id}
                    set={set}
                    onClick={() => openEdit(set.id)}
                  />
                ))}
              </div>
            </div>
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
