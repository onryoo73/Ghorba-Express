import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { orderId, qrToken } = await request.json();
  if (!orderId || !qrToken) {
    return NextResponse.json({ error: "orderId and qrToken required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, delivery_qr_token")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Only buyer can confirm delivery" }, { status: 403 });
  }
  if (order.delivery_qr_token !== qrToken) {
    return NextResponse.json({ error: "Invalid QR token" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data });
}
