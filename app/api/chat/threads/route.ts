import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const supabase = getServiceSupabase();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,buyer_id,traveler_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order || !order.traveler_id) {
    return NextResponse.json({ error: "Order not found or traveler not assigned yet." }, { status: 400 });
  }
  if (user.id !== order.buyer_id && user.id !== order.traveler_id) {
    return NextResponse.json({ error: "Only order participants can create chat." }, { status: 403 });
  }

  const { data: existingThread } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existingThread) {
    return NextResponse.json({ thread: existingThread });
  }

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({
      order_id: orderId,
      buyer_id: order.buyer_id,
      traveler_id: order.traveler_id
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ thread: data }, { status: 201 });
}
