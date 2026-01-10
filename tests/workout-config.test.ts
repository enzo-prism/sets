import { describe, expect, it } from "vitest"
import {
  buildSetStats,
  formatDurationSeconds,
  formatRestSeconds,
  getWorkoutFieldVisibility,
} from "@/lib/workout-config"
import type { LoggedSet } from "@/lib/types"

describe("getWorkoutFieldVisibility", () => {
  it("hides weight and reps for duration workouts", () => {
    const visibility = getWorkoutFieldVisibility("plank")
    expect(visibility).toEqual({
      showWeight: false,
      showReps: false,
      showDuration: true,
      showRest: true,
    })
  })

  it("hides weight for weightless workouts", () => {
    const visibility = getWorkoutFieldVisibility("leg lifts")
    expect(visibility).toEqual({
      showWeight: false,
      showReps: true,
      showDuration: false,
      showRest: true,
    })
  })

  it("shows default fields when no workout type is selected", () => {
    const visibility = getWorkoutFieldVisibility(null)
    expect(visibility).toEqual({
      showWeight: true,
      showReps: true,
      showDuration: false,
      showRest: true,
    })
  })

  it("hides rest for recovery workouts", () => {
    const visibility = getWorkoutFieldVisibility("sauna")
    expect(visibility).toEqual({
      showWeight: false,
      showReps: false,
      showDuration: true,
      showRest: false,
    })
  })

  it("hides weight, reps, and rest for supplements", () => {
    const visibility = getWorkoutFieldVisibility("creatine")
    expect(visibility).toEqual({
      showWeight: false,
      showReps: false,
      showDuration: false,
      showRest: false,
    })
  })
})

describe("buildSetStats", () => {
  it("formats duration stats and skips hidden fields", () => {
    const set: LoggedSet = {
      id: "set-1",
      workoutType: "plank",
      weightLb: 135,
      reps: 8,
      restSeconds: 45,
      durationSeconds: 90,
      performedAtISO: "2026-01-08T20:35:00.000Z",
      createdAtISO: "2026-01-08T20:00:00.000Z",
      updatedAtISO: "2026-01-08T20:10:00.000Z",
    }

    expect(buildSetStats(set)).toEqual(["90s duration", "45s rest"])
  })

  it("uses BW for bodyweight sets", () => {
    const set: LoggedSet = {
      id: "set-2",
      workoutType: "pull up",
      weightLb: 35,
      weightIsBodyweight: true,
      reps: 8,
      restSeconds: 60,
      durationSeconds: null,
      performedAtISO: "2026-01-10T20:35:00.000Z",
      createdAtISO: "2026-01-10T20:00:00.000Z",
      updatedAtISO: "2026-01-10T20:10:00.000Z",
    }

    expect(buildSetStats(set)).toEqual(["BW", "8 reps", "1 min rest"])
  })
})

describe("formatRestSeconds", () => {
  it("formats common minute durations", () => {
    expect(formatRestSeconds(60)).toBe("1 min")
    expect(formatRestSeconds(120)).toBe("2 min")
    expect(formatRestSeconds(180)).toBe("3 min")
    expect(formatRestSeconds(45)).toBe("45s")
  })
})

describe("formatDurationSeconds", () => {
  it("formats minute-based durations", () => {
    expect(formatDurationSeconds(600)).toBe("10 min")
    expect(formatDurationSeconds(90)).toBe("90s")
  })
})
