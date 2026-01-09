"use client"

import * as React from "react"
import { z } from "zod"
import { format } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { CalendarClock, CalendarIcon, Dumbbell, Gauge } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { WORKOUT_TYPES } from "@/lib/constants"
import type { LoggedSet, WorkoutType } from "@/lib/types"
import {
  formatPt,
  ptDateToISO,
  toPtDateFromInput,
  toPtDateFromParts,
  toPtDateInput,
  toPtTimeInput,
} from "@/lib/time"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  workoutType: z.string().nullable().optional(),
  weightLb: z.string().nullable().optional(),
  reps: z.string().nullable().optional(),
  restSeconds: z.string().nullable().optional(),
  performedDate: z.string().nullable().optional(),
  performedTime: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

export type SetFormPayload = {
  workoutType: WorkoutType | null
  weightLb: number | null
  reps: number | null
  restSeconds: number | null
  performedAtISO: string | null
}

type SetFormProps = {
  initialValues?: Partial<LoggedSet>
  submitLabel?: string
  onSubmit: (payload: SetFormPayload) => void
  stickyActions?: boolean
}

function toNumber(value?: string | null) {
  if (!value) {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function SetForm({
  initialValues,
  submitLabel,
  onSubmit,
  stickyActions = false,
}: SetFormProps) {
  const defaults = React.useMemo<FormValues>(
    () => ({
      workoutType: initialValues?.workoutType ?? "",
      weightLb:
        initialValues?.weightLb != null
          ? String(initialValues.weightLb)
          : "",
      reps: initialValues?.reps != null ? String(initialValues.reps) : "",
      restSeconds:
        initialValues?.restSeconds != null
          ? String(initialValues.restSeconds)
          : "",
      performedDate: initialValues?.performedAtISO
        ? toPtDateInput(initialValues.performedAtISO)
        : "",
      performedTime: initialValues?.performedAtISO
        ? toPtTimeInput(initialValues.performedAtISO)
        : "",
    }),
    [initialValues]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  })

  React.useEffect(() => {
    form.reset(defaults)
  }, [defaults, form])

  const onFormSubmit = (values: FormValues) => {
    const workoutValue =
      values.workoutType && values.workoutType !== "none"
        ? (values.workoutType as WorkoutType)
        : null
    const performedAtISO =
      values.performedDate && values.performedTime
        ? ptDateToISO(values.performedDate, values.performedTime)
        : null

    onSubmit({
      workoutType: workoutValue,
      weightLb: toNumber(values.weightLb),
      reps: toNumber(values.reps),
      restSeconds: toNumber(values.restSeconds),
      performedAtISO,
    })
  }

  const selectedDate = useWatch({
    control: form.control,
    name: "performedDate",
  })
  const selectedTime = useWatch({
    control: form.control,
    name: "performedTime",
  })
  const dateLabel = selectedDate
    ? format(toPtDateFromInput(selectedDate), "PPP")
    : "Pick date"
  const previewIso =
    selectedDate && selectedTime ? ptDateToISO(selectedDate, selectedTime) : null
  const footerSummary = previewIso
    ? `Saved as ${formatPt(previewIso)}`
    : "No performed time set."

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onFormSubmit)}
        className={cn("space-y-5 sm:space-y-6", stickyActions && "pb-4")}
        data-testid="set-form"
      >
        <Card
          data-testid="workout-section"
          className="border-muted/60 bg-card/80 py-5 shadow-sm sm:py-6"
        >
          <CardHeader className="px-4 pb-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              Workout
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Optional. Choose the movement or keep it open-ended.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            <FormField
              control={form.control}
              name="workoutType"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Workout type</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select workout" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {WORKOUT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card
          data-testid="stats-section"
          className="border-muted/60 bg-card/80 py-5 shadow-sm sm:py-6"
        >
          <CardHeader className="px-4 pb-3 sm:px-6">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                Stats
              </span>
              <Badge variant="secondary">Optional</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Leave any field blank if you are logging a simple set.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:px-6">
            <FormField
              control={form.control}
              name="weightLb"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>Weight (lb)</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="decimal"
                      placeholder="135"
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reps"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>Reps</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="8"
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restSeconds"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Rest (sec)</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="90"
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card
          data-testid="time-section"
          className="border-muted/60 bg-card/80 py-5 shadow-sm sm:py-6"
        >
          <CardHeader className="px-4 pb-3 sm:px-6">
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Performed time (PT)
              </span>
              <Badge variant="outline">
                {previewIso ? formatPt(previewIso) : "No performed time"}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Displayed in America/Los_Angeles. Leave blank to skip.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <FormField
                control={form.control}
                name="performedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="h-11 w-full justify-start gap-2 text-left font-normal"
                          >
                            <CalendarIcon className="h-4 w-4" />
                            {dateLabel}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value
                              ? toPtDateFromInput(field.value)
                              : undefined
                          }
                          onSelect={(date) => {
                            if (!date) {
                              field.onChange("")
                              return
                            }
                            const ptDate = toPtDateFromParts(date)
                            field.onChange(format(ptDate, "yyyy-MM-dd"))
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="performedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Saving with blanks is ok.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  form.setValue("performedDate", "")
                  form.setValue("performedTime", "")
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {stickyActions ? <Separator className="hidden sm:block" /> : <Separator />}

        <div
          className={cn(
            "grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center",
            stickyActions &&
              "sticky bottom-0 -mx-4 border-t border-muted/60 bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0"
          )}
          data-testid={stickyActions ? "set-form-footer" : undefined}
        >
          <p className="text-xs text-muted-foreground">{footerSummary}</p>
          <Button type="submit" className="h-11 w-full sm:w-auto">
            {submitLabel ?? "Save set"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
