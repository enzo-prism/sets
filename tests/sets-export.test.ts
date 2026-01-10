import { describe, expect, it } from "vitest"
import { formatSetsForClipboard } from "@/lib/sets-export"
import type { LoggedSet } from "@/lib/types"

describe("formatSetsForClipboard", () => {
  it("formats LLM-friendly JSON with PT date/time", () => {
    const sets: LoggedSet[] = [
      {
        id: "set-1",
        workoutType: "pull up",
        weightLb: null,
        weightIsBodyweight: true,
        reps: 10,
        restSeconds: 90,
        durationSeconds: null,
        performedAtISO: "2026-01-08T20:35:00.000Z",
        createdAtISO: "2026-01-08T20:00:00.000Z",
        updatedAtISO: "2026-01-08T20:10:00.000Z",
      },
      {
        id: "set-2",
        workoutType: "plank",
        weightLb: null,
        weightIsBodyweight: false,
        reps: null,
        restSeconds: 60,
        durationSeconds: 120,
        performedAtISO: null,
        createdAtISO: "2026-01-09T15:15:00.000Z",
        updatedAtISO: "2026-01-09T15:20:00.000Z",
      },
    ]

    const payload = JSON.parse(formatSetsForClipboard(sets))

    expect(payload.schema_version).toBe("sets_export_v1")
    expect(payload.timezone).toBe("America/Los_Angeles")
    expect(payload.count).toBe(2)
    expect(payload.sets).toHaveLength(2)

    expect(payload.sets[0]).toMatchObject({
      id: "set-1",
      workout_type: "pull up",
      weight_lb: null,
      weight_is_bodyweight: true,
      reps: 10,
      rest_seconds: 90,
      duration_seconds: null,
      date_pt: "2026-01-08",
      time_pt: "12:35",
      date_source: "performed",
      performed_iso: "2026-01-08T20:35:00.000Z",
      created_iso: "2026-01-08T20:00:00.000Z",
    })

    expect(payload.sets[1]).toMatchObject({
      id: "set-2",
      workout_type: "plank",
      weight_lb: null,
      weight_is_bodyweight: false,
      reps: null,
      rest_seconds: 60,
      duration_seconds: 120,
      date_pt: "2026-01-09",
      time_pt: "07:15",
      date_source: "created",
      performed_iso: null,
      created_iso: "2026-01-09T15:15:00.000Z",
    })
  })
})
