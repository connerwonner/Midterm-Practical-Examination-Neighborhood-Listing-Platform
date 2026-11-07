import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing (server only, never NEXT_PUBLIC_)");
}

// Admin client: bypasses RLS. Server-only. Never import from client components.
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// Request-scoped client: RLS applies using the caller's JWT (or anon if none).
export function supabaseForRequest(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return createClient(url, anonKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    auth: { persistSession: false },
  });
}
