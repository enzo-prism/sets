"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { endOfMonth, startOfMonth, subDays } from "date-fns"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ReadOnlySetDialog } from "@/components/read-only-set-dialog"
import { useSets } from "@/providers/sets-provider"
import { filterSetsByRange, sortSets } from "@/lib/stats"
import { formatPtDayLabel, nowPt } from "@/lib/time"

function getLast7Range(): DateRange {
  const end = nowPt()
  return { from: subDays(end, 6), to: end }
}

function getLast30Range(): DateRange {
  const end = nowPt()
  return { from: subDays(end, 29), to: end }
}

function getThisMonthRange(): DateRange {
  const now = nowPt()
  return { from: startOfMonth(now), to: endOfMonth(now) }
}

export default function CalendarPage() {
  const { sets } = useSets()
  const [range, setRange] = React.useState<DateRange | undefined>(
    getLast7Range()
  )

  const setsInRange = React.useMemo(() => {
    const filtered = filterSetsByRange(sets, range)
    return sortSets(filtered)
  }, [range, sets])

  const rangeLabel = React.useMemo(() => {
    if (!range?.from || !range?.to) {
      return range?.from ? formatPtDayLabel(range.from, "MMM d") : "Select a range"
    }
    return `${formatPtDayLabel(range.from, "MMM d")} - ${formatPtDayLabel(
      range.to,
      "MMM d"
    )}`
  }, [range])

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setRange(getLast7Range())}>
              Last 7 days
            </Button>
            <Button variant="secondary" onClick={() => setRange(getLast30Range())}>
              Last 30 days
            </Button>
            <Button variant="secondary" onClick={() => setRange(getThisMonthRange())}>
              This month
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">{rangeLabel}</div>
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
          />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Sets in range</h2>
          <span className="text-xs text-muted-foreground">
            {setsInRange.length} total
          </span>
        </div>
        {setsInRange.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
            No sets logged for this range.
          </div>
        ) : (
          <div className="space-y-3">
            {setsInRange.map((set) => (
              <ReadOnlySetDialog key={set.id} set={set} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
