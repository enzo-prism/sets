"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SetForm, SetFormPayload } from "@/components/set-form"
import { formatPt } from "@/lib/time"
import type { LoggedSet } from "@/lib/types"
import { buildSetStats } from "@/lib/workout-config"
import { useSets } from "@/providers/sets-provider"
import { CalendarClock, Dumbbell } from "lucide-react"

type EditSetSheetProps = {
  set: LoggedSet | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSetSheet({ set, open, onOpenChange }: EditSetSheetProps) {
  const { updateSet, deleteSet } = useSets()

  const handleSubmit = async (payload: SetFormPayload) => {
    if (!set) {
      return
    }
    try {
      await updateSet(set.id, payload)
      toast.success("Set updated")
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update set."
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    if (!set) {
      return
    }
    try {
      await deleteSet(set.id)
      toast.success("Set deleted")
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete set."
      toast.error(message)
    }
  }

  const summaryStats = set ? buildSetStats(set) : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="max-h-[100dvh] w-full overflow-hidden sm:max-w-md"
        data-testid="edit-sheet"
      >
        <SheetHeader>
          <SheetTitle>Edit set</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
          {set ? (
            <div className="space-y-6 pb-6">
              <Card className="border-muted/60 bg-card/80 shadow-sm">
                <CardHeader className="space-y-2 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    {set.workoutType ?? "Untitled set"}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    {formatPt(set.performedAtISO)}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {summaryStats.length ? (
                    summaryStats.map((stat) => (
                      <Badge key={stat} variant="secondary">
                        {stat}
                      </Badge>
                    ))
                  ) : (
                    <div className="h-5 w-full" aria-hidden="true" />
                  )}
                </CardContent>
              </Card>

              <SetForm
                initialValues={set}
                onSubmit={handleSubmit}
                submitLabel="Update set"
              />
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Delete set
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this set?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="py-8 text-sm text-muted-foreground">
              Select a set to edit.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
