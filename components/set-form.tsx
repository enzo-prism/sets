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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
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

const WORKOUT_GROUPS = [
  {
    label: "Upper",
    items: [
      { value: "bench press", label: "Bench press" },
      { value: "should press", label: "Shoulder press" },
      { value: "pull up", label: "Pull up" },
      { value: "rear delt fly", label: "Rear delt fly" },
      { value: "cable face pull", label: "Cable face pull" },
    ],
  },
  {
    label: "Lower",
    items: [
      { value: "squat", label: "Squat" },
      { value: "clean-lower", label: "Clean", canonical: "clean" },
      { value: "single leg squat", label: "Single leg squat" },
    ],
  },
  {
    label: "Power",
    items: [
      { value: "hang clean", label: "Hang clean" },
      { value: "clean-power", label: "Clean", canonical: "clean" },
      { value: "hang snatch", label: "Hang snatch" },
      { value: "snatch", label: "Snatch" },
    ],
  },
] as const

const WORKOUT_VALUE_MAP = new Map<string, WorkoutType>([
  ["bench press", "bench press"],
  ["should press", "should press"],
  ["pull up", "pull up"],
  ["rear delt fly", "rear delt fly"],
  ["cable face pull", "cable face pull"],
  ["squat", "squat"],
  ["single leg squat", "single leg squat"],
  ["hang clean", "hang clean"],
  ["clean", "clean"],
  ["clean-lower", "clean"],
  ["clean-power", "clean"],
  ["hang snatch", "hang snatch"],
  ["snatch", "snatch"],
])

function toSelectValue(workoutType?: WorkoutType | null) {
  if (!workoutType) {
    return ""
  }
  if (workoutType === "clean") {
    return "clean-power"
  }
  return workoutType
}

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
  onSubmit: (payload: SetFormPayload) => Promise<void> | void
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
      workoutType: toSelectValue(initialValues?.workoutType),
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

  const onFormSubmit = async (values: FormValues) => {
    const workoutValue =
      values.workoutType && values.workoutType !== "none"
        ? WORKOUT_VALUE_MAP.get(values.workoutType) ?? null
        : null
    const performedAtISO =
      values.performedDate && values.performedTime
        ? ptDateToISO(values.performedDate, values.performedTime)
        : null

    await onSubmit({
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
                      <SelectSeparator />
                      {WORKOUT_GROUPS.map((group, index) => (
                        <React.Fragment key={group.label}>
                          <SelectGroup>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.items.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          {index < WORKOUT_GROUPS.length - 1 ? (
                            <SelectSeparator />
                          ) : null}
                        </React.Fragment>
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
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            </div>
            <FormField
              control={form.control}
              name="restSeconds"
              render={({ field }) => {
                const restValue =
                  field.value && field.value !== ""
                    ? Number(field.value)
                    : 0
                const restLabel = Number.isFinite(restValue)
                  ? `${restValue}s`
                  : "0s"

                return (
                  <FormItem className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel>Rest (sec)</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        {restLabel}
                      </span>
                    </div>
                    <FormControl>
                      <input
                        type="range"
                        min={0}
                        max={180}
                        step={30}
                        value={restValue}
                        onChange={(event) => field.onChange(event.target.value)}
                        className="h-2 w-full cursor-pointer accent-primary"
                      />
                    </FormControl>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>0s</span>
                      <span>3m</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }}
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
            <div className="flex items-center justify-end text-xs text-muted-foreground">
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
          <Button
            type="submit"
            className="h-11 w-full sm:w-auto"
            disabled={form.formState.isSubmitting}
          >
            {submitLabel ?? "Save set"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
