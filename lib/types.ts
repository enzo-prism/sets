import { WORKOUT_TYPES } from "@/lib/constants"

export type WorkoutType = (typeof WORKOUT_TYPES)[number]

export type LoggedSet = {
  id: string
  workoutType?: WorkoutType | null
  weightLb?: number | null
  reps?: number | null
  restSeconds?: number | null
  durationSeconds?: number | null
  performedAtISO?: string | null
  createdAtISO: string
  updatedAtISO: string
}
