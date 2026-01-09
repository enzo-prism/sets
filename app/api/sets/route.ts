import { NextResponse } from "next/server"
import type { LoggedSet } from "@/lib/types"
import {
  getSupabaseServerClient,
  mapRowToSet,
  mapSetToRow,
  type SupabaseSetRow,
} from "@/lib/supabase"

export const dynamic = "force-dynamic"

function getDeviceId(request: Request) {
  const headerId = request.headers.get("x-device-id")
  if (headerId) {
    return headerId
  }
  const url = new URL(request.url)
  return url.searchParams.get("deviceId") ?? ""
}

function requireSupabase() {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    return null
  }
  return supabase
}

function buildUpdateRow(updates: Partial<LoggedSet>): Partial<SupabaseSetRow> {
  const row: Partial<SupabaseSetRow> = {}

  if ("workoutType" in updates) {
    row.workout_type = updates.workoutType ?? null
  }
  if ("weightLb" in updates) {
    row.weight_lb = updates.weightLb ?? null
  }
  if ("reps" in updates) {
    row.reps = updates.reps ?? null
  }
  if ("restSeconds" in updates) {
    row.rest_seconds = updates.restSeconds ?? null
  }
  if ("performedAtISO" in updates) {
    row.performed_at_iso = updates.performedAtISO ?? null
  }
  if ("updatedAtISO" in updates && updates.updatedAtISO) {
    row.updated_at_iso = updates.updatedAtISO
  } else {
    row.updated_at_iso = new Date().toISOString()
  }

  return row
}

export async function GET(request: Request) {
  const deviceId = getDeviceId(request)
  if (!deviceId) {
    return NextResponse.json(
      { error: "Missing device id." },
      { status: 400 }
    )
  }

  const supabase = requireSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("device_id", deviceId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const sets = (data ?? []).map((row) => mapRowToSet(row as SupabaseSetRow))
  return NextResponse.json(sets)
}

export async function POST(request: Request) {
  const deviceId = getDeviceId(request)
  if (!deviceId) {
    return NextResponse.json(
      { error: "Missing device id." },
      { status: 400 }
    )
  }

  const supabase = requireSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    )
  }

  const body = (await request.json()) as { set?: LoggedSet }
  if (!body?.set?.id) {
    return NextResponse.json({ error: "Missing set." }, { status: 400 })
  }

  const row = mapSetToRow(body.set, deviceId)
  const { data, error } = await supabase
    .from("sets")
    .insert(row)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(mapRowToSet(data as SupabaseSetRow))
}

export async function PATCH(request: Request) {
  const deviceId = getDeviceId(request)
  if (!deviceId) {
    return NextResponse.json(
      { error: "Missing device id." },
      { status: 400 }
    )
  }

  const supabase = requireSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    )
  }

  const body = (await request.json()) as {
    id?: string
    updates?: Partial<LoggedSet>
  }

  if (!body?.id || !body?.updates) {
    return NextResponse.json({ error: "Missing update." }, { status: 400 })
  }

  const updateRow = buildUpdateRow(body.updates)
  const { data, error } = await supabase
    .from("sets")
    .update(updateRow)
    .eq("id", body.id)
    .eq("device_id", deviceId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(mapRowToSet(data as SupabaseSetRow))
}

export async function DELETE(request: Request) {
  const deviceId = getDeviceId(request)
  if (!deviceId) {
    return NextResponse.json(
      { error: "Missing device id." },
      { status: 400 }
    )
  }

  const supabase = requireSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    )
  }

  const body = (await request.json()) as { id?: string }
  if (!body?.id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 })
  }

  const { error } = await supabase
    .from("sets")
    .delete()
    .eq("id", body.id)
    .eq("device_id", deviceId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
