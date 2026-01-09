import { describe, expect, it } from "vitest"
import { mergeSets } from "@/lib/sync"
import type { LoggedSet } from "@/lib/types"

const baseSet = (overrides: Partial<LoggedSet>): LoggedSet => ({
  id: "set-1",
  workoutType: "bench press",
  weightLb: 135,
  reps: 8,
  restSeconds: 90,
  performedAtISO: "2025-01-01T02:00:00.000Z",
  createdAtISO: "2025-01-01T02:00:00.000Z",
  updatedAtISO: "2025-01-01T02:00:00.000Z",
  ...overrides,
})

describe("mergeSets", () => {
  it("prefers the most recently updated record", () => {
    const local = [baseSet({ updatedAtISO: "2025-01-01T02:00:00.000Z" })]
    const remote = [baseSet({ updatedAtISO: "2025-01-05T02:00:00.000Z", weightLb: 155 })]

    const merged = mergeSets(local, remote)

    expect(merged).toHaveLength(1)
    expect(merged[0].weightLb).toBe(155)
  })

  it("keeps local-only sets", () => {
    const local = [baseSet({ id: "local-only" })]
    const remote: LoggedSet[] = []

    const merged = mergeSets(local, remote)

    expect(merged).toHaveLength(1)
    expect(merged[0].id).toBe("local-only")
  })

  it("keeps remote-only sets", () => {
    const local: LoggedSet[] = []
    const remote = [baseSet({ id: "remote-only" })]

    const merged = mergeSets(local, remote)

    expect(merged).toHaveLength(1)
    expect(merged[0].id).toBe("remote-only")
  })
})
