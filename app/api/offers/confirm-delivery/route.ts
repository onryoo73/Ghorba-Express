import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

// Traveler confirms they have delivered the item
export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { offerId } = await request.json();
  if (!offerId) {
    return NextResponse.json({ error: "offerId required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  
  // Get offer and verify traveler
  const { data: offer } = await supabase
    .from("post_offers")
    .select("id, traveler_id, buyer_id, delivery_status, payment_status")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  if (offer.traveler_id !== user.id) {
    return NextResponse.json({ error: "Only traveler can confirm delivery" }, { status: 403 });
  }

  if (offer.payment_status !== "authorized") {
    return NextResponse.json({ error: "Payment not authorized" }, { status: 400 });
  }

  // Update offer - traveler confirms delivery
  const { data, error } = await supabase
    .from("post_offers")
    .update({
      traveler_confirmed_delivery: true,
      traveler_confirmed_at: new Date().toISOString(),
      delivery_status: "delivered",
      updated_at: new Date().toISOString()
    })
    .eq("id", offerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Notify buyer to confirm receipt
  await supabase.from("notifications").insert({
    recipient_id: offer.buyer_id,
    sender_id: user.id,
    type: "delivery_update",
    title: "Delivery confirmed by traveler",
    message: "The traveler has marked the item as delivered. Please confirm receipt to release your OTP.",
    offer_id: offerId
  });

  return NextResponse.json({ offer: data });
}
