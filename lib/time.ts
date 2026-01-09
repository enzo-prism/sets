import { TZDate } from "@date-fns/tz"
import { format } from "date-fns"

const LONG_OFFSET_TIMEZONE_NAME = "longOffset" as const

function supportsTimeZoneName(timeZoneName: string) {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
    return false
  }
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      timeZoneName: timeZoneName as Intl.DateTimeFormatOptions["timeZoneName"],
    }).format(new Date("2024-01-01T00:00:00.000Z"))
    return formatted.includes("GMT")
  } catch {
    return false
  }
}

// Safari lacks `timeZoneName: "longOffset"`, which TZDate relies on for offsets.
function ensureLongOffsetSupport() {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
    return
  }
  if (supportsTimeZoneName(LONG_OFFSET_TIMEZONE_NAME)) {
    return
  }

  const OriginalDateTimeFormat = Intl.DateTimeFormat
  const hasShortOffset = supportsTimeZoneName("shortOffset")
  const partsFormatterCache = new Map<string, Intl.DateTimeFormat>()

  const getPartsFormatter = (timeZone: string) => {
    const cached = partsFormatterCache.get(timeZone)
    if (cached) {
      return cached
    }
    const formatter = new OriginalDateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    partsFormatterCache.set(timeZone, formatter)
    return formatter
  }

  const formatOffset = (offsetMinutes: number) => {
    const sign = offsetMinutes >= 0 ? "+" : "-"
    const abs = Math.abs(offsetMinutes)
    const hours = Math.floor(abs / 60)
    const minutes = abs % 60
    return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`
  }

  const getOffsetMinutes = (date: Date, timeZone: string) => {
    const parts = getPartsFormatter(timeZone).formatToParts(date)
    const valueMap: Record<string, string> = {}
    for (const part of parts) {
      if (part.type !== "literal") {
        valueMap[part.type] = part.value
      }
    }

    let year = Number(valueMap.year)
    let month = Number(valueMap.month)
    let day = Number(valueMap.day)
    let hour = Number(valueMap.hour)
    const minute = Number(valueMap.minute)
    const second = Number(valueMap.second)

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      !Number.isFinite(hour) ||
      !Number.isFinite(minute) ||
      !Number.isFinite(second)
    ) {
      return 0
    }

    if (hour === 24) {
      hour = 0
      const adjusted = new Date(Date.UTC(year, month - 1, day))
      adjusted.setUTCDate(adjusted.getUTCDate() + 1)
      year = adjusted.getUTCFullYear()
      month = adjusted.getUTCMonth() + 1
      day = adjusted.getUTCDate()
    }

    const utcTime = Date.UTC(year, month - 1, day, hour, minute, second)
    return Math.round((utcTime - date.getTime()) / 60000)
  }

  const buildOffsetFormatter = (timeZone: string) => {
    const format = (value: Date | number) => {
      const date = value instanceof Date ? value : new Date(value)
      return `GMT${formatOffset(getOffsetMinutes(date, timeZone))}`
    }

    return {
      format,
      formatToParts: (value: Date | number) => [
        { type: "timeZoneName", value: format(value) },
      ],
      resolvedOptions: () => ({
        locale: "en-US",
        timeZone,
        timeZoneName: LONG_OFFSET_TIMEZONE_NAME,
      }),
    } as Intl.DateTimeFormat
  }

  const PatchedDateTimeFormat = function (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ) {
    const timeZoneName = options?.timeZoneName
    if (timeZoneName === "longOffset" || timeZoneName === "shortOffset") {
      if (hasShortOffset) {
        return new OriginalDateTimeFormat(locales, {
          ...options,
          timeZoneName: "shortOffset",
        })
      }
      return buildOffsetFormatter(options?.timeZone ?? "UTC")
    }
    return new OriginalDateTimeFormat(locales, options)
  } as typeof Intl.DateTimeFormat

  PatchedDateTimeFormat.supportedLocalesOf =
    OriginalDateTimeFormat.supportedLocalesOf.bind(OriginalDateTimeFormat)
  PatchedDateTimeFormat.prototype = OriginalDateTimeFormat.prototype

  Intl.DateTimeFormat = PatchedDateTimeFormat
}

ensureLongOffsetSupport()

export const PT_TIMEZONE = "America/Los_Angeles"

export function nowPt() {
  return new TZDate(Date.now(), PT_TIMEZONE)
}

export function isoToPtDate(iso?: string | null) {
  if (!iso) {
    return null
  }
  return new TZDate(iso, PT_TIMEZONE)
}

export function ptDateToISO(dateStr: string, timeStr: string) {
  if (!dateStr || !timeStr) {
    return ""
  }
  const timeParts = timeStr.split(":")
  if (timeParts.length < 2) {
    return ""
  }
  const normalizedTime = [
    timeParts[0].padStart(2, "0"),
    timeParts[1].padStart(2, "0"),
    (timeParts[2] ?? "00").padStart(2, "0"),
  ].join(":")
  const ptDate = new TZDate(`${dateStr}T${normalizedTime}`, PT_TIMEZONE)
  if (Number.isNaN(ptDate.getTime())) {
    return ""
  }
  return new Date(ptDate.getTime()).toISOString()
}

export function formatPt(iso?: string | null) {
  if (!iso) {
    return "No performed time"
  }
  const ptDate = new TZDate(iso, PT_TIMEZONE)
  return format(ptDate, "PPP · p 'PT'")
}

export function toPtDateInput(iso?: string | null) {
  if (!iso) {
    return ""
  }
  const ptDate = new TZDate(iso, PT_TIMEZONE)
  return format(ptDate, "yyyy-MM-dd")
}

export function toPtTimeInput(iso?: string | null) {
  if (!iso) {
    return ""
  }
  const ptDate = new TZDate(iso, PT_TIMEZONE)
  return format(ptDate, "HH:mm")
}

export function toPtDayKey(iso?: string | null) {
  if (!iso) {
    return null
  }
  const ptDate = new TZDate(iso, PT_TIMEZONE)
  return format(ptDate, "yyyy-MM-dd")
}

export function formatPtDayLabel(date: Date, pattern = "MMM d") {
  const ptDate = toPtDateFromParts(date)
  return format(ptDate, pattern)
}

export function toPtDate(date: Date) {
  return new TZDate(date, PT_TIMEZONE)
}

export function toPtDayKeyFromDate(date: Date) {
  return format(toPtDateFromParts(date), "yyyy-MM-dd")
}

export function toPtDateFromParts(date: Date) {
  return new TZDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    PT_TIMEZONE
  )
}

export function toPtDateFromInput(dateStr: string) {
  return new TZDate(`${dateStr}T00:00:00`, PT_TIMEZONE)
}
