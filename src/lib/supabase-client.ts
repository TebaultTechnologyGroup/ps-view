import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types"; // npx supabase gen types typescript --local > ./src/lib/database.types.ts

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// console.log(`credentials: ${supabaseUrl}, ${supabaseAnonKey}`);
// Provide the Database interface as a generic to createClient
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
