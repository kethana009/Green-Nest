import { createClient as _createSupabase } from '@supabase/supabase-js'

// Singleton — one instance per browser context
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = _createSupabase(supabaseUrl, supabaseKey)

// Alias so pages that call createClient() also get the singleton
export function createClient() { return supabase }
export default supabase