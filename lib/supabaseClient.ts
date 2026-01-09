import { createClient } from "@supabase/supabase-js"

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Add it to .env.local (or your hosting env) before using Supabase.`
    )
  }
  return value
}

export function assertSupabaseEnv() {
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL")
const supabaseAnonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
