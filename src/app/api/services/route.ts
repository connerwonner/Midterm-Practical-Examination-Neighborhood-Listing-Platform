import { NextResponse } from "next/server";
import { serviceCreateSchema } from "@/schemas/service";
import { supabaseForRequest } from "@/lib/supabaseServer";

// GET: approved services only, public columns only.
export async function GET(req: Request) {
  const supabase = supabaseForRequest(req);
  const { data, error } = await supabase
    .from("services")
    .select("id, title, hourly_rate, duration_minutes, coverage_radius_miles")
    .eq("status", "approved");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST: validate, authenticate, insert as a draft owned by the caller.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = serviceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = supabaseForRequest(req);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("services")
    .insert({ ...parsed.data, provider_id: user.id, status: "draft" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
