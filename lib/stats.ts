import { eachDayOfInterval } from "date-fns"
import { WORKOUT_TYPES } from "@/lib/constants"
import type { LoggedSet, WorkoutType } from "@/lib/types"
import {
  formatPtDayLabel,
  toPtDateFromParts,
  toPtDayKey,
  toPtDayKeyFromDate,
} from "@/lib/time"

export type DateRange = { from?: Date; to?: Date }

export function sortSets(sets: LoggedSet[]) {
  return [...sets].sort((a, b) => {
    const aIso = a.performedAtISO || a.createdAtISO
    const bIso = b.performedAtISO || b.createdAtISO
    return bIso.localeCompare(aIso)
  })
}

export function filterSetsByRange(sets: LoggedSet[], range?: DateRange) {
  const from = range?.from
  const to = range?.to ?? range?.from
  if (!from || !to) {
    return sets
  }
  const fromKey = toPtDayKeyFromDate(from)
  const toKey = toPtDayKeyFromDate(to)

  return sets.filter((set) => {
    const dayKey = toPtDayKey(set.performedAtISO)
    if (!dayKey) {
      return false
    }
    return dayKey >= fromKey && dayKey <= toKey
  })
}

export function buildDailyCounts(sets: LoggedSet[], range?: DateRange) {
  const from = range?.from
  const to = range?.to ?? range?.from
  if (!from || !to) {
    return []
  }
  const days = eachDayOfInterval({
    start: toPtDateFromParts(from),
    end: toPtDateFromParts(to),
  })
  const counts = new Map<string, number>()

  for (const set of sets) {
    const key = toPtDayKey(set.performedAtISO)
    if (!key) {
      continue
    }
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return days.map((day) => {
    const key = toPtDayKeyFromDate(day)
    return {
      date: formatPtDayLabel(day),
      dayKey: key,
      count: counts.get(key) ?? 0,
    }
  })
}

export function buildVolumeByWorkoutType(sets: LoggedSet[]) {
  const totals = new Map<WorkoutType, number>()
  for (const type of WORKOUT_TYPES) {
    totals.set(type, 0)
  }

  for (const set of sets) {
    if (!set.workoutType) {
      continue
    }
    if (set.weightIsBodyweight || set.weightLb == null || set.reps == null) {
      continue
    }
    const volume = set.weightLb * set.reps
    totals.set(set.workoutType, (totals.get(set.workoutType) ?? 0) + volume)
  }

  const entries = WORKOUT_TYPES.map((workoutType) => ({
    workoutType,
    volume: totals.get(workoutType) ?? 0,
  }))

  return entries.filter((entry) => entry.volume > 0)
}

export function buildMaxWeightTrend(
  sets: LoggedSet[],
  range: DateRange | undefined,
  workoutType: WorkoutType
) {
  const from = range?.from
  const to = range?.to ?? range?.from
  if (!from || !to) {
    return []
  }

  const days = eachDayOfInterval({
    start: toPtDateFromParts(from),
    end: toPtDateFromParts(to),
  })
  const maxByDay = new Map<string, number>()

  for (const set of sets) {
    if (set.workoutType !== workoutType) {
      continue
    }
    if (set.weightIsBodyweight || set.weightLb == null) {
      continue
    }
    const key = toPtDayKey(set.performedAtISO)
    if (!key) {
      continue
    }
    const current = maxByDay.get(key)
    if (current == null || set.weightLb > current) {
      maxByDay.set(key, set.weightLb)
    }
  }

  return days.map((day) => {
    const key = toPtDayKeyFromDate(day)
    return {
      date: formatPtDayLabel(day),
      dayKey: key,
      maxWeight: maxByDay.get(key) ?? null,
    }
  })
}

export function formatWorkoutLabel(value: string) {
  return value
    .split(" ")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ")
}
