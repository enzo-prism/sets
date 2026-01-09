"use client"

import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LoggedSet } from "@/lib/types"
import { formatPt } from "@/lib/time"
import { cn } from "@/lib/utils"
import { buildSetStats } from "@/lib/workout-config"

type SetCardProps = {
  set: LoggedSet
  onClick?: () => void
  readOnly?: boolean
}

export function SetCard({ set, onClick, readOnly }: SetCardProps) {
  const stats = buildSetStats(set)

  return (
    <Button
      variant="ghost"
      type="button"
      onClick={onClick}
      className={cn(
        "h-auto w-full flex-col items-start gap-3 rounded-xl border bg-card px-5 py-4 text-left shadow-sm",
        onClick && "hover:bg-muted/50"
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">
            {set.workoutType ?? "Untitled set"}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatPt(set.performedAtISO)}
          </div>
        </div>
        {!readOnly && onClick ? (
          <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
        ) : null}
      </div>
      {stats.length ? (
        <div className="flex flex-wrap gap-2">
          {stats.map((stat) => (
            <Badge key={stat} variant="secondary">
              {stat}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="h-5 w-full" aria-hidden="true" />
      )}
    </Button>
  )
}
