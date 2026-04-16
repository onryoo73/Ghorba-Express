import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

// Buyer confirms they received the item and reveals OTP
export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { offerId } = await request.json();
  if (!offerId) {
    return NextResponse.json({ error: "offerId required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  
  // Get offer and verify buyer
  const { data: offer } = await supabase
    .from("post_offers")
    .select("id, buyer_id, traveler_id, delivery_otp, traveler_confirmed_delivery")
    .eq("id", offerId)
    .maybeSingle();

  console.log("[Confirm Receipt] Offer:", offer?.id, "OTP:", offer?.delivery_otp);

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  if (offer.buyer_id !== user.id) {
    return NextResponse.json({ error: "Only buyer can confirm receipt" }, { status: 403 });
  }

  if (!offer.traveler_confirmed_delivery) {
    return NextResponse.json({ error: "Traveler has not confirmed delivery yet" }, { status: 400 });
  }

  // Update offer - buyer confirms receipt
  const { data, error } = await supabase
    .from("post_offers")
    .update({
      buyer_confirmed_receipt: true,
      buyer_confirmed_at: new Date().toISOString(),
      delivery_status: "buyer_confirmed",
      updated_at: new Date().toISOString()
    })
    .eq("id", offerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Notify traveler that OTP is now available
  await supabase.from("notifications").insert({
    recipient_id: offer.traveler_id,
    sender_id: user.id,
    type: "delivery_update",
    title: "Buyer confirmed receipt!",
    message: "The buyer has confirmed receipt. The OTP is now available for you to collect payment.",
    offer_id: offerId
  });

  return NextResponse.json({ 
    offer: data,
    otp: offer.delivery_otp // Reveal OTP to buyer to show to traveler
  });
}
