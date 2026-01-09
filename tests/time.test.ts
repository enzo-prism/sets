import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const OriginalDateTimeFormat = Intl.DateTimeFormat

function buildBrokenDateTimeFormat(
  Original: typeof Intl.DateTimeFormat
): typeof Intl.DateTimeFormat {
  const Broken = function (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ) {
    if (options?.timeZoneName === "longOffset" || options?.timeZoneName === "shortOffset") {
      throw new RangeError("Unsupported timeZoneName")
    }
    return new Original(locales, options)
  } as typeof Intl.DateTimeFormat

  Broken.supportedLocalesOf = Original.supportedLocalesOf.bind(Original)
  Broken.prototype = Original.prototype

  return Broken
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  Intl.DateTimeFormat = OriginalDateTimeFormat
})

describe("ptDateToISO", () => {
  it("normalizes time values with seconds", async () => {
    const { ptDateToISO } = await import("@/lib/time")
    expect(ptDateToISO("2026-01-08", "12:35:30")).toBe(
      "2026-01-08T20:35:30.000Z"
    )
  })
})

describe("time zone fallback", () => {
  it("keeps PT helpers working without longOffset support", async () => {
    Intl.DateTimeFormat = buildBrokenDateTimeFormat(OriginalDateTimeFormat)
    const { formatPt, ptDateToISO, toPtDateInput } = await import("@/lib/time")

    expect(ptDateToISO("2026-01-08", "12:35")).toBe(
      "2026-01-08T20:35:00.000Z"
    )
    expect(toPtDateInput("2026-01-08T20:35:00.000Z")).toBe("2026-01-08")
    expect(formatPt("2026-01-08T20:35:00.000Z")).toMatch(/PT$/)
  })
})
