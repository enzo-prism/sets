"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SetForm, SetFormPayload } from "@/components/set-form"
import { useSets } from "@/providers/sets-provider"
import { nowPt } from "@/lib/time"
import { toast } from "sonner"

type AddSetDialogProps = {
  trigger: React.ReactNode
}

export function AddSetDialog({ trigger }: AddSetDialogProps) {
  const { addSet } = useSets()
  const [open, setOpen] = React.useState(false)
  const [initialValues, setInitialValues] = React.useState(() => ({
    performedAtISO: nowPt().toISOString(),
  }))

  React.useEffect(() => {
    if (open) {
      setInitialValues({ performedAtISO: nowPt().toISOString() })
    }
  }, [open])

  const handleSubmit = async (payload: SetFormPayload) => {
    try {
      await addSet(payload)
      toast.success("Set added")
      setOpen(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add set."
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        data-testid="log-set-dialog"
        className="top-0 right-0 bottom-0 left-0 flex h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:top-[50%] sm:right-auto sm:bottom-auto sm:left-[50%] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-6"
      >
        <DialogHeader className="border-b border-muted/60 px-4 pb-3 pt-4 pr-12 text-left sm:border-0 sm:px-0 sm:pb-2 sm:pt-0 sm:pr-0">
          <DialogTitle className="text-xl sm:text-lg">Log a set</DialogTitle>
          <DialogDescription>
            Capture the essentials now. Add more details whenever you want.
          </DialogDescription>
        </DialogHeader>
        <div
          className="flex-1 overflow-y-auto px-4 pb-4 sm:overflow-visible sm:px-0 sm:pb-0"
          data-testid="log-set-body"
        >
          <SetForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel="Add set"
            stickyActions
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
