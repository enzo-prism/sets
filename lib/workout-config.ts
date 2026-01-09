import type { LoggedSet, WorkoutType } from "@/lib/types"

const DURATION_WORKOUTS = new Set<WorkoutType>(["plank", "sauna"])
const WEIGHTLESS_WORKOUTS = new Set<WorkoutType>([
  "leg lifts",
  "toe touches",
  "bicycles",
  "true bubka",
  "wipers",
  "down pressure",
])

export function getWorkoutFieldVisibility(workoutType?: WorkoutType | null) {
  if (!workoutType) {
    return { showWeight: true, showReps: true, showDuration: false }
  }

  const showDuration = DURATION_WORKOUTS.has(workoutType)
  const showWeight = !showDuration && !WEIGHTLESS_WORKOUTS.has(workoutType)
  const showReps = !showDuration

  return { showWeight, showReps, showDuration }
}

export function formatRestSeconds(value?: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return ""
  }
  if (value >= 60 && value % 60 === 0) {
    const minutes = value / 60
    return minutes === 1 ? "1 min" : `${minutes} min`
  }
  return `${value}s`
}

export function buildSetStats(set: LoggedSet) {
  const { showWeight, showReps, showDuration } = getWorkoutFieldVisibility(
    set.workoutType ?? null
  )
  const stats: string[] = []

  if (showWeight && set.weightLb != null) {
    stats.push(`${set.weightLb} lb`)
  }
  if (showReps && set.reps != null) {
    stats.push(`${set.reps} reps`)
  }
  if (showDuration && set.durationSeconds != null) {
    stats.push(`${set.durationSeconds}s duration`)
  }
  if (set.restSeconds != null) {
    const restLabel = formatRestSeconds(set.restSeconds)
    if (restLabel) {
      stats.push(`${restLabel} rest`)
    }
  }

  return stats
}
