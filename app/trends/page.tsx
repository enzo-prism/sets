"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { endOfMonth, startOfMonth, subDays } from "date-fns"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  BarChart3,
  CalendarDays,
  CalendarRange,
  History,
  LineChart as LineChartIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useSets } from "@/providers/sets-provider"
import { WORKOUT_TYPES } from "@/lib/constants"
import type { WorkoutType } from "@/lib/types"
import {
  buildDailyCounts,
  buildMaxWeightTrend,
  buildVolumeByWorkoutType,
  filterSetsByRange,
  formatWorkoutLabel,
} from "@/lib/stats"
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

const dailyChartConfig = {
  count: {
    label: "Sets",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const volumeChartConfig = {
  volume: {
    label: "Total Volume",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const maxWeightChartConfig = {
  maxWeight: {
    label: "Max Weight",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export default function TrendsPage() {
  const { sets } = useSets()
  const [range, setRange] = React.useState<DateRange | undefined>(
    getLast7Range()
  )
  const [selectedType, setSelectedType] = React.useState<WorkoutType>(
    WORKOUT_TYPES[0]
  )

  const setsInRange = React.useMemo(
    () => filterSetsByRange(sets, range),
    [sets, range]
  )

  const dailyCounts = React.useMemo(
    () => buildDailyCounts(setsInRange, range),
    [setsInRange, range]
  )

  const volumeByType = React.useMemo(
    () => buildVolumeByWorkoutType(setsInRange),
    [setsInRange]
  )

  const maxWeightTrend = React.useMemo(
    () => buildMaxWeightTrend(setsInRange, range, selectedType),
    [setsInRange, range, selectedType]
  )

  const rangeLabel = React.useMemo(() => {
    if (!range?.from || !range?.to) {
      return range?.from ? formatPtDayLabel(range.from, "MMM d") : "Select a range"
    }
    return `${formatPtDayLabel(range.from, "MMM d")} - ${formatPtDayLabel(
      range.to,
      "MMM d"
    )}`
  }, [range])

  const hasData = setsInRange.length > 0
  const hasMaxWeight = maxWeightTrend.some((entry) => entry.maxWeight != null)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setRange(getLast7Range())}
            >
              <History className="h-4 w-4 text-muted-foreground" />
              Last 7 days
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setRange(getLast30Range())}
            >
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              Last 30 days
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setRange(getThisMonthRange())}
            >
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              This month
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">{rangeLabel}</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={range} onSelect={setRange} />
              </PopoverContent>
            </Popover>
            <div className="text-xs text-muted-foreground">
              Range uses Pacific Time.
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasData ? (
        <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          No performed sets in this range yet. Log a set to see trends.
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Sets per day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={dailyChartConfig}
                className="h-[220px] w-full aspect-auto"
              >
                <LineChart data={dailyCounts} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="count"
                    type="monotone"
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Total volume by workout
              </CardTitle>
            </CardHeader>
            <CardContent>
              {volumeByType.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Add weight and reps to see volume totals.
                </div>
              ) : (
                <ChartContainer
                  config={volumeChartConfig}
                  className="h-[260px] w-full aspect-auto"
                >
                  <BarChart data={volumeByType} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="workoutType"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      width={90}
                      tickFormatter={formatWorkoutLabel}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="volume" fill="var(--color-volume)" radius={[6, 6, 6, 6]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                Max weight over time
              </CardTitle>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as WorkoutType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose workout" />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {!hasMaxWeight ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Add weight entries for this workout to see progress.
                </div>
              ) : (
                <ChartContainer
                  config={maxWeightChartConfig}
                  className="h-[220px] w-full aspect-auto"
                >
                  <LineChart data={maxWeightTrend} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      dataKey="maxWeight"
                      type="monotone"
                      stroke="var(--color-maxWeight)"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
