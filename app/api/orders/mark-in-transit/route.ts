import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { orderId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const supabase = getServiceSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, traveler_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.traveler_id !== user.id) {
    return NextResponse.json({ error: "Only assigned traveler can update this order" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "in_transit" })
    .eq("id", orderId)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data });
}
