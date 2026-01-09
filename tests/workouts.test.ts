import { describe, expect, it } from "vitest"
import {
  getWorkoutGroupById,
  getWorkoutGroupIdForType,
  getWorkoutGroupIdForValue,
  workoutTypeToValue,
  workoutValueToType,
} from "@/lib/workouts"

describe("workout mappings", () => {
  it("maps canonical values for clean", () => {
    expect(workoutTypeToValue("clean")).toBe("clean-power")
    expect(workoutValueToType("clean-power")).toBe("clean")
  })

  it("maps workout groups from types and values", () => {
    expect(getWorkoutGroupIdForType("plank")).toBe("core")
    expect(getWorkoutGroupIdForValue("pull up")).toBe("bar")
    expect(getWorkoutGroupById("lower")?.label).toBe("Lower")
  })
})
