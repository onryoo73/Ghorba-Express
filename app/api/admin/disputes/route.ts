import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ disputes: data ?? [] });
  } catch (err) {
    console.error("[Admin Disputes] Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { disputeId, status, resolution } = await request.json();
  if (!disputeId || !status) {
    return NextResponse.json({ error: "disputeId and status required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("disputes")
    .update({
      status,
      assigned_admin_id: admin.id,
      resolution: resolution ?? null
    })
    .eq("id", disputeId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ dispute: data });
}
