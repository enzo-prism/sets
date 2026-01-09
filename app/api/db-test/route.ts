import { NextResponse } from "next/server";
import { assertSupabaseEnv, supabase } from "@/lib/supabaseClient";

type DbTestResponse = {
  ok: boolean;
  error: string | null;
  hint: string | null;
  data: unknown[] | null;
};

function getHint(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("relation") && normalized.includes("does not exist")) {
    return "Connected to Supabase, but the table 'workouts' doesn't exist yet. Create it in Supabase (or change the table name).";
  }

  if (
    normalized.includes("permission denied") ||
    normalized.includes("row level security") ||
    normalized.includes("rls")
  ) {
    return "Connected to Supabase, but access is blocked (RLS/policies). Add a read policy or test from server with proper auth.";
  }

  return "Connected to Supabase, but the query failed. See error for details.";
}

export async function GET() {
  try {
    assertSupabaseEnv();

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .limit(1);

    if (error) {
      const response: DbTestResponse = {
        ok: false,
        error: error.message,
        hint: getHint(error.message),
        data: null,
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: DbTestResponse = {
      ok: true,
      error: null,
      hint: null,
      data: Array.isArray(data) ? data : [],
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    const response: DbTestResponse = {
      ok: false,
      error: message,
      hint: null,
      data: null,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
