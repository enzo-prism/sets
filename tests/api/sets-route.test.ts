import { describe, expect, it, vi } from "vitest"
import { GET, POST } from "@/app/api/sets/route"
import { getSupabaseServerClient } from "@/lib/supabase"

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(),
  mapRowToSet: (row: unknown) => row,
  mapSetToRow: (set: unknown) => set,
}))

const mockGetSupabaseServerClient = vi.mocked(getSupabaseServerClient)

function createSupabaseStub(result: { data: unknown[] | null; error: unknown }) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(async () => result),
      insert: vi.fn(() => ({
        select: vi.fn(async () => result),
      })),
    })),
  }
}

describe("api/sets route", () => {
  it("returns 500 when supabase is not configured", async () => {
    mockGetSupabaseServerClient.mockReturnValue(null)

    const response = await GET()
    expect(response.status).toBe(500)

    const json = await response.json()
    expect(json.error).toMatch(/supabase is not configured/i)
  })

  it("returns data from GET when supabase responds", async () => {
    const supabase = createSupabaseStub({
      data: [{ id: "set-1" }],
      error: null,
    })
    mockGetSupabaseServerClient.mockReturnValue(supabase as never)

    const response = await GET()
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json).toEqual([{ id: "set-1" }])
  })

  it("returns 400 for invalid POST payloads", async () => {
    const supabase = createSupabaseStub({
      data: null,
      error: null,
    })
    mockGetSupabaseServerClient.mockReturnValue(supabase as never)

    const request = new Request("http://localhost/api/sets", {
      method: "POST",
      body: JSON.stringify({ reps: "invalid" }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toMatch(/invalid payload/i)
  })
})
