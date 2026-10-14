/// <reference types="node" />
// Vercel function: creates/removes Supabase auth users. This needs the service
// role key, so it can never run in the browser.
//
// Env (server only, NOT prefixed with VITE_):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from "@supabase/supabase-js";

const admin = () =>
  createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

const json = (body: unknown, status = 200) => Response.json(body, { status });

// Returns the caller's id if the bearer token belongs to an active CAMUNDA user.
async function requireCamunda(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");

  if (!token) return null;

  const db = admin();
  const { data } = await db.auth.getUser(token);
  if (!data.user) return null;

  const { data: profile } = await db
    .from("users")
    .select("role, active, deleted")
    .eq("id", data.user.id)
    .maybeSingle();

  const ok =
    profile?.role === "CAMUNDA" && profile.active !== false && !profile.deleted;
  return ok ? data.user.id : null;
}

export async function POST(request: Request) {
  const callerId = await requireCamunda(request);
  if (!callerId) return json({ error: "Forbidden" }, 403);

  const body = await request.json();
  const { email, password, role, ...profile } = body ?? {};
  if (!email || !password)
    return json({ error: "Email and password are required" }, 400);
  if (role !== "CAMUNDA" && role !== "CUSTOMER")
    return json({ error: "Invalid role" }, 400);
  if (role === "CUSTOMER" && !profile.customer_id)
    return json({ error: "Customer users need a customer" }, 400);

  const db = admin();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user)
    return json({ error: error?.message ?? "Create failed" }, 400);

  // The on_auth_user_created trigger has already inserted public.users (id, email).
  const { error: updateError } = await db
    .from("users")
    .update({ ...profile, role, created_by: callerId, updated_by: callerId })
    .eq("id", data.user.id);

  if (updateError) {
    await db.auth.admin.deleteUser(data.user.id); // roll back
    return json({ error: updateError.message }, 400);
  }
  return json({ id: data.user.id }, 201);
}
