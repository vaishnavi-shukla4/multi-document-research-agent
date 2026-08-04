import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
    "Create frontend/.env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n" +
    "On Vercel, add them under Project Settings → Environment Variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
