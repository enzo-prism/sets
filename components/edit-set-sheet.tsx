"use client"

import * as React from "react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SetForm, SetFormPayload } from "@/components/set-form"
import type { LoggedSet } from "@/lib/types"
import { useSets } from "@/providers/sets-provider"

type EditSetSheetProps = {
  set: LoggedSet | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSetSheet({ set, open, onOpenChange }: EditSetSheetProps) {
  const { updateSet, deleteSet } = useSets()

  const handleSubmit = (payload: SetFormPayload) => {
    if (!set) {
      return
    }
    updateSet(set.id, payload)
    toast.success("Set updated")
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!set) {
      return
    }
    deleteSet(set.id)
    toast.success("Set deleted")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit set</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          {set ? (
            <div className="space-y-6 pb-6">
              <SetForm
                initialValues={set}
                onSubmit={handleSubmit}
                submitLabel="Update set"
              />
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
