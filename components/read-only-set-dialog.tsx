"use client"

import * as React from "react"
import Link from "next/link"
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
import { SetCard } from "@/components/set-card"

export function ReadOnlySetDialog({ set }: { set: LoggedSet }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <SetCard set={set} readOnly onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{set.workoutType ?? "Untitled set"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div className="text-muted-foreground">Performed</div>
              <div>{formatPt(set.performedAtISO)}</div>
            </div>
            <Separator />
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Weight</span>
                <span>{set.weightLb != null ? `${set.weightLb} lb` : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reps</span>
                <span>{set.reps != null ? set.reps : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rest</span>
                <span>
                  {set.restSeconds != null ? `${set.restSeconds}s` : "—"}
                </span>
              </div>
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
