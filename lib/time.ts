import { TZDate } from "@date-fns/tz"
import { format } from "date-fns"

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
  const ptDate = new TZDate(`${dateStr}T${timeStr}:00`, PT_TIMEZONE)
  return ptDate.toISOString()
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
