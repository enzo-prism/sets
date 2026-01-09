import { NextResponse } from "next/server"
import { z } from "zod"
import { WORKOUT_TYPES } from "@/lib/constants"
import type { LoggedSet, WorkoutType } from "@/lib/types"
import {
  getSupabaseServerClient,
  mapRowToSet,
  mapSetToRow,
  type SupabaseSetRow,
} from "@/lib/supabase"

export const dynamic = "force-dynamic"

const setSchema = z.object({
  id: z.string().min(1),
  workoutType: z.string().nullable().optional(),
  weightLb: z.number().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  restSeconds: z.number().int().nullable().optional(),
  performedAtISO: z.string().nullable().optional(),
  createdAtISO: z.string().nullable().optional(),
  updatedAtISO: z.string().nullable().optional(),
})

const syncSchema = z.object({
  sets: z.array(setSchema).optional().default([]),
  deletedIds: z.array(z.string().min(1)).optional().default([]),
})

type SyncPayload = z.infer<typeof syncSchema>

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseServerClient>>

type SyncResult = {
  data: LoggedSet[] | null
  error: string | null
  status: number
}

function getDeviceId(request: Request) {
  const headerId = request.headers.get("x-device-id")
  if (headerId) {
    return headerId
  }
  const url = new URL(request.url)
  return url.searchParams.get("deviceId") ?? ""
}

function requireSupabase(): SupabaseClient {
  return getSupabaseServerClient()
}

function normalizeWorkoutType(
  value: string | null | undefined
): WorkoutType | null {
  if (!value) {
    return null
  }
  return WORKOUT_TYPES.includes(value as WorkoutType)
    ? (value as WorkoutType)
    : null
}

function normalizeSet(input: z.infer<typeof setSchema>, nowIso: string) {
  const workoutType = normalizeWorkoutType(input.workoutType)

  return {
    id: input.id,
    workoutType,
    weightLb: input.weightLb ?? null,
    reps: input.reps ?? null,
    restSeconds: input.restSeconds ?? null,
    performedAtISO: input.performedAtISO ?? null,
    createdAtISO: input.createdAtISO ?? nowIso,
    updatedAtISO: input.updatedAtISO ?? nowIso,
  } satisfies LoggedSet
}

async function loadSets(supabase: SupabaseClient, deviceId: string) {
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("device_id", deviceId)

  if (error) {
    return {
      data: null,
      error: error.message,
      status: 500,
    } satisfies SyncResult
  }

  const sets = (data ?? []).map((row) => mapRowToSet(row as SupabaseSetRow))
  return {
    data: sets,
    error: null,
    status: 200,
  } satisfies SyncResult
}

export async function GET(request: Request) {
  const deviceId = getDeviceId(request)
  if (!deviceId) {
    return NextResponse.json({ error: "Missing device id." }, { status: 400 })
  }

  const supabase = requireSupabase()
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 500 }
    )
  }

  const result = await loadSets(supabase, deviceId)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result.data)
}

export async function PUT(request: Request) {
  const deviceId = getDeviceId(request)
  if (!deviceId) {
    return NextResponse.json({ error: "Missing device id." }, { status: 400 })
  }

  const supabase = requireSupabase()
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 500 }
    )
  }

  let payload: SyncPayload
  try {
    const raw = await request.json()
    const parsed = syncSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    payload = parsed.data
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const { sets, deletedIds } = payload
  if (!sets.length && !deletedIds.length) {
    return NextResponse.json(
      { error: "No changes submitted." },
      { status: 400 }
    )
  }

  if (deletedIds.length) {
    const { error } = await supabase
      .from("sets")
      .delete()
      .eq("device_id", deviceId)
      .in("id", deletedIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  if (sets.length) {
    const nowIso = new Date().toISOString()
    const rows = sets.map((set) =>
      mapSetToRow(normalizeSet(set, nowIso), deviceId)
    )

    const { error } = await supabase
      .from("sets")
      .upsert(rows, { onConflict: "id" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const result = await loadSets(supabase, deviceId)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result.data)
}
