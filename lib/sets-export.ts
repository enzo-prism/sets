import type { LoggedSet } from "@/lib/types"
import { PT_TIMEZONE, toPtDateInput, toPtTimeInput } from "@/lib/time"

type ExportedSet = {
  id: string
  workout_type: string | null
  weight_lb: number | null
  weight_is_bodyweight: boolean
  reps: number | null
  rest_seconds: number | null
  duration_seconds: number | null
  date_pt: string
  time_pt: string
  date_source: "performed" | "created"
  performed_iso: string | null
  created_iso: string
}

type SetsClipboardExport = {
  schema_version: "sets_export_v1"
  timezone: string
  date_format: "YYYY-MM-DD"
  time_format: "HH:mm"
  count: number
  sets: ExportedSet[]
}

export function formatSetsForClipboard(sets: LoggedSet[]) {
  const payload: SetsClipboardExport = {
    schema_version: "sets_export_v1",
    timezone: PT_TIMEZONE,
    date_format: "YYYY-MM-DD",
    time_format: "HH:mm",
    count: sets.length,
    sets: sets.map((set) => {
      const dateSource = set.performedAtISO ? "performed" : "created"
      const sourceIso = set.performedAtISO ?? set.createdAtISO

      return {
        id: set.id,
        workout_type: set.workoutType ?? null,
        weight_lb: set.weightIsBodyweight ? null : set.weightLb ?? null,
        weight_is_bodyweight: set.weightIsBodyweight ?? false,
        reps: set.reps ?? null,
        rest_seconds: set.restSeconds ?? null,
        duration_seconds: set.durationSeconds ?? null,
        date_pt: toPtDateInput(sourceIso),
        time_pt: toPtTimeInput(sourceIso),
        date_source: dateSource,
        performed_iso: set.performedAtISO ?? null,
        created_iso: set.createdAtISO,
      }
    }),
  }

  return JSON.stringify(payload)
}
