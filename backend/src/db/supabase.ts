import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY env vars");
}

// Secret key: server-side only, bypasses RLS. Never expose to frontend.
export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
});