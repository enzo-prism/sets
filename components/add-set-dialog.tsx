"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

  const handleSubmit = (payload: SetFormPayload) => {
    addSet(payload)
    toast.success("Set added")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log a set</DialogTitle>
        </DialogHeader>
        <SetForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel="Add set"
        />
      </DialogContent>
    </Dialog>
  )
}
