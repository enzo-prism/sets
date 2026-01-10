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
import {
  formatDurationSeconds,
  formatRestSeconds,
  getWorkoutFieldVisibility,
} from "@/lib/workout-config"
import {
  WORKOUT_GROUPS,
  getWorkoutGroupById,
  getWorkoutGroupIdForType,
  isRecoveryWorkout,
  workoutTypeToValue,
  workoutValueToType,
} from "@/lib/workouts"

const formSchema = z.object({
  workoutType: z.string().nullable().optional(),
  weightLb: z.string().nullable().optional(),
  weightIsBodyweight: z.boolean().optional(),
  reps: z.string().nullable().optional(),
  restSeconds: z.string().nullable().optional(),
  durationSeconds: z.string().nullable().optional(),
  performedDate: z.string().nullable().optional(),
  performedTime: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

export type SetFormPayload = {
  workoutType: WorkoutType | null
  weightLb: number | null
  weightIsBodyweight: boolean
  reps: number | null
  restSeconds: number | null
  durationSeconds: number | null
  performedAtISO: string | null
}

type SetFormProps = {
  initialValues?: Partial<LoggedSet>
  submitLabel?: string
  onSubmit: (payload: SetFormPayload) => Promise<void> | void
  stickyActions?: boolean
}

const RECOVERY_DURATION_MIN = 10 * 60
const RECOVERY_DURATION_MAX = 25 * 60
const RECOVERY_DURATION_STEP = 60

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function snapToStep(value: number, step: number) {
  return Math.round(value / step) * step
}

function coerceRecoveryDuration(value?: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return RECOVERY_DURATION_MIN
  }
  const snapped = snapToStep(value, RECOVERY_DURATION_STEP)
  return clampNumber(snapped, RECOVERY_DURATION_MIN, RECOVERY_DURATION_MAX)
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
      workoutType: workoutTypeToValue(initialValues?.workoutType),
      weightLb:
        initialValues?.weightLb != null
          ? String(initialValues.weightLb)
          : "",
      weightIsBodyweight: initialValues?.weightIsBodyweight ?? false,
      reps: initialValues?.reps != null ? String(initialValues.reps) : "",
      restSeconds:
        initialValues?.restSeconds != null
          ? String(initialValues.restSeconds)
          : "",
      durationSeconds:
        initialValues?.durationSeconds != null
          ? String(initialValues.durationSeconds)
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
    form.register("weightIsBodyweight")
  }, [form])

  React.useEffect(() => {
    form.reset(defaults)
  }, [defaults, form])

  const onFormSubmit = async (values: FormValues) => {
    const workoutValue = workoutValueToType(values.workoutType)
    const { showWeight, showReps, showDuration, showRest } =
      getWorkoutFieldVisibility(workoutValue)
    const weightIsBodyweight = showWeight && Boolean(values.weightIsBodyweight)
    const performedAtISO =
      values.performedDate && values.performedTime
        ? ptDateToISO(values.performedDate, values.performedTime)
        : null

    await onSubmit({
      workoutType: workoutValue,
      weightLb:
        showWeight && !weightIsBodyweight ? toNumber(values.weightLb) : null,
      weightIsBodyweight,
      reps: showReps ? toNumber(values.reps) : null,
      restSeconds: showRest ? toNumber(values.restSeconds) : null,
      durationSeconds: showDuration ? toNumber(values.durationSeconds) : null,
      performedAtISO,
    })
  }

  const selectedWorkout = useWatch({
    control: form.control,
    name: "workoutType",
  })
  const activeWorkoutType = React.useMemo(
    () => workoutValueToType(selectedWorkout),
    [selectedWorkout]
  )
  const { showWeight, showReps, showDuration, showRest } =
    getWorkoutFieldVisibility(activeWorkoutType)
  const isRecovery = isRecoveryWorkout(activeWorkoutType)
  const showDurationSlider = showDuration && isRecovery
  const showDurationInput = showDuration && !isRecovery
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    setSelectedCategory(
      getWorkoutGroupIdForType(initialValues?.workoutType ?? null)
    )
  }, [initialValues?.workoutType])

  React.useEffect(() => {
    if (!activeWorkoutType) {
      return
    }
    const groupId = getWorkoutGroupIdForType(activeWorkoutType)
    if (groupId) {
      setSelectedCategory(groupId)
    }
  }, [activeWorkoutType])

  const activeGroup = React.useMemo(
    () => getWorkoutGroupById(selectedCategory),
    [selectedCategory]
  )

  const selectedDate = useWatch({
    control: form.control,
    name: "performedDate",
  })
  const selectedTime = useWatch({
    control: form.control,
    name: "performedTime",
  })
  const selectedDuration = useWatch({
    control: form.control,
    name: "durationSeconds",
  })
  const weightIsBodyweight = useWatch({
    control: form.control,
    name: "weightIsBodyweight",
  })
  const isBodyweight = Boolean(weightIsBodyweight)

  React.useEffect(() => {
    if (!showDurationSlider) {
      return
    }
    const current = toNumber(selectedDuration)
    const clamped = coerceRecoveryDuration(current)
    const nextValue = String(clamped)
    if ((selectedDuration ?? "") !== nextValue) {
      form.setValue("durationSeconds", nextValue)
    }
  }, [form, selectedDuration, showDurationSlider])
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
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      Category
                    </div>
                    <div
                      className="flex flex-wrap gap-2 pb-1"
                      role="group"
                      aria-label="Workout category"
                    >
                      <Button
                        type="button"
                        variant={selectedCategory ? "outline" : "secondary"}
                        size="sm"
                        className="h-9 shrink-0 rounded-full px-4"
                        aria-pressed={!selectedCategory}
                        onClick={() => {
                          setSelectedCategory(null)
                          form.setValue("workoutType", "")
                        }}
                      >
                        None
                      </Button>
                      {WORKOUT_GROUPS.map((group) => (
                        <Button
                          key={group.id}
                          type="button"
                          variant={
                            selectedCategory === group.id
                              ? "secondary"
                              : "outline"
                          }
                          size="sm"
                          className="h-9 shrink-0 rounded-full px-4"
                          aria-pressed={selectedCategory === group.id}
                          onClick={() => {
                            setSelectedCategory(group.id)
                            const values = group.items.map((item) => item.value)
                            if (
                              selectedWorkout &&
                              !values.includes(selectedWorkout)
                            ) {
                              form.setValue("workoutType", "")
                            }
                          }}
                        >
                          <span className="text-sm leading-none" aria-hidden>
                            {group.emoji}
                          </span>
                          {group.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={!selectedCategory}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue
                          placeholder={
                            selectedCategory
                              ? "Select workout"
                              : "Select a category first"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeGroup ? (
                        <SelectGroup>
                          <SelectLabel>{activeGroup.label}</SelectLabel>
                          {activeGroup.items.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Choose a category to see workouts.
                        </div>
                      )}
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
              {showWeight ? (
                <FormField
                  control={form.control}
                  name="weightLb"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Weight</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            inputMode="decimal"
                            placeholder="135"
                            className="h-11"
                            {...field}
                            value={isBodyweight ? "BW" : (field.value ?? "")}
                            disabled={isBodyweight}
                          />
                        </FormControl>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant={isBodyweight ? "outline" : "secondary"}
                            size="sm"
                            className="h-11 px-3"
                            aria-pressed={!isBodyweight}
                            onClick={() =>
                              form.setValue("weightIsBodyweight", false, {
                                shouldDirty: true,
                              })
                            }
                          >
                            lb
                          </Button>
                          <Button
                            type="button"
                            variant={isBodyweight ? "secondary" : "outline"}
                            size="sm"
                            className="h-11 px-3"
                            aria-pressed={isBodyweight}
                            onClick={() =>
                              form.setValue("weightIsBodyweight", true, {
                                shouldDirty: true,
                              })
                            }
                          >
                            BW
                          </Button>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              {showReps ? (
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
              ) : null}
              {showDurationInput ? (
                <FormField
                  control={form.control}
                  name="durationSeconds"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          placeholder="60"
                          className="h-11"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
            {showDurationSlider ? (
              <FormField
                control={form.control}
                name="durationSeconds"
                render={({ field }) => {
                  const durationValue = coerceRecoveryDuration(
                    toNumber(field.value)
                  )
                  const durationLabel =
                    formatDurationSeconds(durationValue) || "10 min"

                  return (
                    <FormItem className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Duration</FormLabel>
                        <span className="text-xs text-muted-foreground">
                          {durationLabel}
                        </span>
                      </div>
                      <FormControl>
                        <input
                          type="range"
                          min={RECOVERY_DURATION_MIN}
                          max={RECOVERY_DURATION_MAX}
                          step={RECOVERY_DURATION_STEP}
                          value={durationValue}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                          className="h-2 w-full cursor-pointer accent-primary"
                        />
                      </FormControl>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {formatDurationSeconds(RECOVERY_DURATION_MIN)}
                        </span>
                        <span>
                          {formatDurationSeconds(RECOVERY_DURATION_MAX)}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            ) : null}
            {showRest ? (
              <FormField
                control={form.control}
                name="restSeconds"
                render={({ field }) => {
                  const restValue =
                    field.value && field.value !== ""
                      ? Number(field.value)
                      : 0
                  const restLabel =
                    Number.isFinite(restValue) && restValue >= 0
                      ? formatRestSeconds(restValue) || "0s"
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
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                          className="h-2 w-full cursor-pointer accent-primary"
                        />
                      </FormControl>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0s</span>
                        <span>3 min</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            ) : null}
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
