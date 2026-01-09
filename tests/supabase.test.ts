import { describe, expect, it } from "vitest"
import { mapRowToSet, mapSetToRow, type SupabaseSetRow } from "@/lib/supabase"
import type { LoggedSet } from "@/lib/types"

const rowBase: SupabaseSetRow = {
  id: "row-1",
  device_id: "device-1",
  workout_type: "bench press",
  weight_lb: 185,
  reps: 5,
  rest_seconds: 120,
  duration_seconds: 45,
  performed_at_iso: "2025-01-01T02:00:00.000Z",
  created_at_iso: "2025-01-01T02:00:00.000Z",
  updated_at_iso: "2025-01-01T03:00:00.000Z",
}

describe("mapRowToSet", () => {
  it("maps valid workout types", () => {
    const set = mapRowToSet(rowBase)
    expect(set.workoutType).toBe("bench press")
    expect(set.weightLb).toBe(185)
    expect(set.durationSeconds).toBe(45)
  })

  it("drops unknown workout types", () => {
    const set = mapRowToSet({ ...rowBase, workout_type: "unknown" })
    expect(set.workoutType).toBeNull()
  })
})

describe("mapSetToRow", () => {
  it("maps a logged set to a supabase row", () => {
    const set: LoggedSet = {
      id: "set-1",
      workoutType: "squat",
      weightLb: 225,
      reps: 3,
      restSeconds: 180,
      durationSeconds: 90,
      performedAtISO: "2025-02-01T02:00:00.000Z",
      createdAtISO: "2025-02-01T02:00:00.000Z",
      updatedAtISO: "2025-02-01T02:00:00.000Z",
    }

    const row = mapSetToRow(set)

    expect(row.device_id).toBe("shared")
    expect(row.workout_type).toBe("squat")
    expect(row.weight_lb).toBe(225)
    expect(row.reps).toBe(3)
    expect(row.duration_seconds).toBe(90)
  })
})
