import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

// Traveler verifies OTP to release payment
export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { offerId, otp } = await request.json();
  if (!offerId || !otp) {
    return NextResponse.json({ error: "offerId and otp required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  
  // Get offer and verify traveler
  const { data: offer } = await supabase
    .from("post_offers")
    .select("id, buyer_id, traveler_id, delivery_otp, buyer_confirmed_receipt, amount_tnd, platform_fee_tnd, proposed_price_tnd")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  if (offer.traveler_id !== user.id) {
    return NextResponse.json({ error: "Only traveler can verify OTP" }, { status: 403 });
  }

  if (!offer.buyer_confirmed_receipt) {
    return NextResponse.json({ error: "Buyer has not confirmed receipt yet" }, { status: 400 });
  }

  // Verify OTP
  if (offer.delivery_otp !== otp) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  // Calculate traveler earnings
  // Use proposed_price_tnd as fallback if amount_tnd is 0
  const agreedAmount = Number(offer.amount_tnd || offer.proposed_price_tnd || 0);
  const travelerEarnings = agreedAmount - (offer.platform_fee_tnd || 0);

  // Update offer - OTP verified, but payment NOT released yet (wait for admin)
  const { data, error } = await supabase
    .from("post_offers")
    .update({
      otp_verified: true,
      otp_verified_at: new Date().toISOString(),
      delivery_status: "completed",
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
      // Note: payment_released is still false - admin will release after seeing payment info
    })
    .eq("id", offerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Note: Wallet update and payment release happens when admin clicks "Release Payment"
  // after seeing the traveler's D17/Flouci payment info

  // Notify both parties - payment pending admin release
  await supabase.from("notifications").insert([
    {
      recipient_id: offer.buyer_id,
      sender_id: user.id,
      type: "escrow_update",
      title: "Delivery completed!",
      message: "Your item has been delivered. Admin will release payment to the traveler shortly.",
      offer_id: offerId
    },
    {
      recipient_id: user.id,
      sender_id: offer.buyer_id,
      type: "escrow_update",
      title: "Delivery verified!",
      message: `Great! Please provide your payment details. You will receive ${travelerEarnings.toFixed(2)} TND once admin releases the payment.`,
      offer_id: offerId
    }
  ]);

  return NextResponse.json({ 
    offer: data,
    earnings: travelerEarnings,
    message: "OTP verified! Please provide your payment details."
  });
}
