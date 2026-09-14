import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { VisaFileDatabase } from "@/lib/supabase";

export async function authenticatedSupabase(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;

  const client = createClient<VisaFileDatabase>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dataClient = serviceRoleKey
    ? createClient<VisaFileDatabase>(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : client;
  return { client: dataClient, user: data.user };
}
