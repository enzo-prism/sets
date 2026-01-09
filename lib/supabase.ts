import { createClient } from "@supabase/supabase-js"
import { WORKOUT_TYPES } from "@/lib/constants"
import type { LoggedSet, WorkoutType } from "@/lib/types"

export type SupabaseSetRow = {
  id: string
  device_id: string
  workout_type: string | null
  weight_lb: number | null
  reps: number | null
  rest_seconds: number | null
  performed_at_iso: string | null
  created_at_iso: string
  updated_at_iso: string
}

export function getSupabaseServerClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return null
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function mapRowToSet(row: SupabaseSetRow): LoggedSet {
  const workoutType =
    row.workout_type && WORKOUT_TYPES.includes(row.workout_type as WorkoutType)
      ? (row.workout_type as WorkoutType)
      : null

  return {
    id: row.id,
    workoutType,
    weightLb: row.weight_lb,
    reps: row.reps,
    restSeconds: row.rest_seconds,
    performedAtISO: row.performed_at_iso,
    createdAtISO: row.created_at_iso,
    updatedAtISO: row.updated_at_iso,
  }
}

export function mapSetToRow(set: LoggedSet, deviceId: string): SupabaseSetRow {
  return {
    id: set.id,
    device_id: deviceId,
    workout_type: set.workoutType ?? null,
    weight_lb: set.weightLb ?? null,
    reps: set.reps ?? null,
    rest_seconds: set.restSeconds ?? null,
    performed_at_iso: set.performedAtISO ?? null,
    created_at_iso: set.createdAtISO,
    updated_at_iso: set.updatedAtISO,
  }
}
