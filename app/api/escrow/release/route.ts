import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { orderId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const supabase = getServiceSupabase();
  const { data: escrow, error } = await supabase
    .from("escrow_transactions")
    .update({ status: "released", released_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from("orders").update({ status: "completed" }).eq("id", orderId);
  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "escrow_release",
    entity_type: "order",
    entity_id: orderId,
    metadata: { escrow_id: escrow.id }
  });

  return NextResponse.json({ escrow });
}
