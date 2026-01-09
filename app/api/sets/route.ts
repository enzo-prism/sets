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

const setInputSchema = z.object({
  workoutType: z.string().nullable().optional(),
  weightLb: z.number().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  restSeconds: z.number().int().nullable().optional(),
  durationSeconds: z.number().int().nullable().optional(),
  performedAtISO: z.string().nullable().optional(),
})

const createSchema = setInputSchema
const updateSchema = setInputSchema.extend({ id: z.string().min(1) })
const deleteSchema = z.object({ id: z.string().min(1) })

type CreatePayload = z.infer<typeof createSchema>
type UpdatePayload = z.infer<typeof updateSchema>
type DeletePayload = z.infer<typeof deleteSchema>

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseServerClient>>
type SupabaseOrError = {
  supabase: SupabaseClient | null
  error: string | null
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
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

function buildSet(input: CreatePayload, nowIso: string): LoggedSet {
  return {
    id: createId(),
    workoutType: normalizeWorkoutType(input.workoutType),
    weightLb: input.weightLb ?? null,
    reps: input.reps ?? null,
    restSeconds: input.restSeconds ?? null,
    durationSeconds: input.durationSeconds ?? null,
    performedAtISO: input.performedAtISO ?? null,
    createdAtISO: nowIso,
    updatedAtISO: nowIso,
  }
}

function buildUpdateRow(input: UpdatePayload, nowIso: string) {
  return {
    workout_type: normalizeWorkoutType(input.workoutType),
    weight_lb: input.weightLb ?? null,
    reps: input.reps ?? null,
    rest_seconds: input.restSeconds ?? null,
    duration_seconds: input.durationSeconds ?? null,
    performed_at_iso: input.performedAtISO ?? null,
    updated_at_iso: nowIso,
  }
}

function getSupabaseOrError(): SupabaseOrError {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    return {
      supabase: null,
      error:
        "Supabase is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    }
  }
  return { supabase, error: null }
}

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: unknown }

async function parseJson<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<ParseResult<T>> {
  try {
    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return {
        ok: false,
        error: "Invalid payload.",
        details: parsed.error.flatten(),
      }
    }
    return { ok: true, data: parsed.data }
  } catch {
    return { ok: false, error: "Invalid JSON." }
  }
}

export async function GET() {
  const { supabase, error } = getSupabaseOrError()
  if (!supabase) {
    return NextResponse.json({ error }, { status: 500 })
  }

  const { data, error: queryError } = await supabase
    .from("sets")
    .select("*")

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 })
  }

  const sets = (data ?? []).map((row) => mapRowToSet(row as SupabaseSetRow))
  return NextResponse.json(sets)
}

export async function POST(request: Request) {
  const { supabase, error } = getSupabaseOrError()
  if (!supabase) {
    return NextResponse.json({ error }, { status: 500 })
  }

  const parsed = await parseJson<CreatePayload>(request, createSchema)
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, details: parsed.details },
      { status: 400 }
    )
  }

  const nowIso = new Date().toISOString()
  const nextSet = buildSet(parsed.data, nowIso)

  const { data, error: insertError } = await supabase
    .from("sets")
    .insert(mapSetToRow(nextSet))
    .select("*")

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const insertedRow = data?.[0]
  if (!insertedRow) {
    return NextResponse.json({ error: "Insert failed." }, { status: 500 })
  }

  return NextResponse.json(mapRowToSet(insertedRow as SupabaseSetRow), {
    status: 201,
  })
}

export async function PATCH(request: Request) {
  const { supabase, error } = getSupabaseOrError()
  if (!supabase) {
    return NextResponse.json({ error }, { status: 500 })
  }

  const parsed = await parseJson<UpdatePayload>(request, updateSchema)
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, details: parsed.details },
      { status: 400 }
    )
  }

  const nowIso = new Date().toISOString()
  const { id } = parsed.data

  const { data, error: updateError } = await supabase
    .from("sets")
    .update(buildUpdateRow(parsed.data, nowIso))
    .eq("id", id)
    .select("*")

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const updatedRow = data?.[0]
  if (!updatedRow) {
    return NextResponse.json({ error: "Set not found." }, { status: 404 })
  }

  return NextResponse.json(mapRowToSet(updatedRow as SupabaseSetRow))
}

export async function DELETE(request: Request) {
  const { supabase, error } = getSupabaseOrError()
  if (!supabase) {
    return NextResponse.json({ error }, { status: 500 })
  }

  const parsed = await parseJson<DeletePayload>(request, deleteSchema)
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, details: parsed.details },
      { status: 400 }
    )
  }

  const { error: deleteError } = await supabase
    .from("sets")
    .delete()
    .eq("id", parsed.data.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
