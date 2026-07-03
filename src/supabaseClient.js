import { createClient } from '@supabase/supabase-js'

// These are public values. The anon/publishable key is safe to ship in client
// code — the database is protected by Row Level Security policies in Supabase.
// You can override them at build time with VITE_SUPABASE_URL / VITE_SUPABASE_KEY.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://maamzqwvrcsfidcujuuz.supabase.co'
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_RBU3Y1pwXYGGHaH3kTuBSw_plyIqor1'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
