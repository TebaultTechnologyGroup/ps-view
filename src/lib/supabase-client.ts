import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types' // npx supabase gen types typescript --local > database.types.ts

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Provide the Database interface as a generic to createClient
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)