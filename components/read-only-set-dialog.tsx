"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarClock, Clock, Dumbbell, Repeat, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { LoggedSet } from "@/lib/types"
import { formatPt } from "@/lib/time"
import {
  formatDurationSeconds,
  formatRestSeconds,
  getWorkoutFieldVisibility,
} from "@/lib/workout-config"
import { SetCard } from "@/components/set-card"

export function ReadOnlySetDialog({ set }: { set: LoggedSet }) {
  const [open, setOpen] = React.useState(false)
  const { showWeight, showReps, showDuration, showRest } =
    getWorkoutFieldVisibility(set.workoutType ?? null)

  return (
    <>
      <SetCard set={set} readOnly onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{set.workoutType ?? "Untitled set"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                Performed
              </div>
              <div>{formatPt(set.performedAtISO)}</div>
            </div>
            <Separator />
            <div className="grid gap-3">
              {showWeight ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Dumbbell className="h-4 w-4" />
                    Weight
                  </span>
                  <span>
                    {set.weightLb != null ? `${set.weightLb} lb` : "—"}
                  </span>
                </div>
              ) : null}
              {showReps ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Repeat className="h-4 w-4" />
                    Reps
                  </span>
                  <span>{set.reps != null ? set.reps : "—"}</span>
                </div>
              ) : null}
              {showDuration ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Duration
                  </span>
                  <span>
                    {set.durationSeconds != null
                      ? formatDurationSeconds(set.durationSeconds)
                      : "—"}
                  </span>
                </div>
              ) : null}
              {showRest ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    Rest
                  </span>
                  <span>
                    {set.restSeconds != null
                      ? formatRestSeconds(set.restSeconds)
                      : "—"}
                  </span>
                </div>
              ) : null}
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              Created {formatPt(set.createdAtISO)}
            </div>
            <Button asChild className="w-full">
              <Link href={`/?edit=${set.id}`}>Edit on Home</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
