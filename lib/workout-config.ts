import type { LoggedSet, WorkoutType } from "@/lib/types"
import { isRecoveryWorkout, isSupplementWorkout } from "@/lib/workouts"

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
    return {
      showWeight: true,
      showReps: true,
      showDuration: false,
      showRest: true,
    }
  }

  const showDuration = DURATION_WORKOUTS.has(workoutType)
  const isSupplement = isSupplementWorkout(workoutType)
  const showWeight =
    !isSupplement && !showDuration && !WEIGHTLESS_WORKOUTS.has(workoutType)
  const showReps = !isSupplement && !showDuration
  const showRest = !isSupplement && !isRecoveryWorkout(workoutType)

  return { showWeight, showReps, showDuration, showRest }
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

export function formatDurationSeconds(value?: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return ""
  }
  if (value >= 60 && value % 60 === 0) {
    const minutes = value / 60
    return minutes === 1 ? "1 min" : `${minutes} min`
  }
  return `${value}s`
}

export function formatWeightLabel(
  set: Pick<LoggedSet, "weightLb" | "weightIsBodyweight">
) {
  if (set.weightIsBodyweight) {
    return "BW"
  }
  if (set.weightLb == null || !Number.isFinite(set.weightLb)) {
    return ""
  }
  return `${set.weightLb} lb`
}

export function buildSetStats(set: LoggedSet) {
  const { showWeight, showReps, showDuration, showRest } =
    getWorkoutFieldVisibility(set.workoutType ?? null)
  const stats: string[] = []

  if (showWeight) {
    const weightLabel = formatWeightLabel(set)
    if (weightLabel) {
      stats.push(weightLabel)
    }
  }
  if (showReps && set.reps != null) {
    stats.push(`${set.reps} reps`)
  }
  if (showDuration && set.durationSeconds != null) {
    const durationLabel = formatDurationSeconds(set.durationSeconds)
    if (durationLabel) {
      stats.push(`${durationLabel} duration`)
    }
  }
  if (showRest && set.restSeconds != null) {
    const restLabel = formatRestSeconds(set.restSeconds)
    if (restLabel) {
      stats.push(`${restLabel} rest`)
    }
  }

  return stats
}
