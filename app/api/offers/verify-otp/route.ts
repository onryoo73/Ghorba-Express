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

  // Update offer - OTP verified, payment released
  const { data, error } = await supabase
    .from("post_offers")
    .update({
      otp_verified: true,
      otp_verified_at: new Date().toISOString(),
      payment_released: true,
      payment_released_at: new Date().toISOString(),
      payment_status: "captured",
      delivery_status: "completed",
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", offerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Update traveler wallet balance and log transaction
  try {
    // 1. Increment traveler's wallet balance
    const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
      user_id: user.id,
      amount: travelerEarnings
    });

    if (walletError) {
      // If RPC fails, try manual update as fallback
      const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
      const currentBalance = Number(profile?.wallet_balance || 0);
      await supabase.from('profiles').update({ wallet_balance: currentBalance + travelerEarnings }).eq('id', user.id);
    }

    // 2. Log transaction
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      offer_id: offerId,
      amount: travelerEarnings,
      type: 'earning',
      description: `Earnings for delivery: ${offer.id.slice(0, 8)}...`
    });

    // 3. Log payment history for buyer (as a payment)
    await supabase.from("wallet_transactions").insert({
      user_id: offer.buyer_id,
      offer_id: offerId,
      amount: offer.amount_tnd || 0,
      type: 'payment',
      description: `Payment for item delivery: ${offer.id.slice(0, 8)}...`
    });
  } catch (err) {
    console.error("Wallet update error:", err);
  }

  // Create payment record
  await supabase.from("payments").insert({
    offer_id: offerId,
    buyer_id: offer.buyer_id,
    traveler_id: user.id,
    stripe_payment_intent_id: offer.delivery_otp!, // Using OTP as reference for mock
    amount_tnd: offer.amount_tnd || 0,
    platform_fee_tnd: offer.platform_fee_tnd || 0,
    traveler_earnings_tnd: travelerEarnings,
    status: "captured",
    captured_at: new Date().toISOString()
  });

  // Notify both parties
  await supabase.from("notifications").insert([
    {
      recipient_id: offer.buyer_id,
      sender_id: user.id,
      type: "escrow_update",
      title: "Delivery completed!",
      message: "Your item has been delivered and payment has been released to the traveler.",
      offer_id: offerId
    },
    {
      recipient_id: user.id,
      sender_id: offer.buyer_id,
      type: "escrow_update",
      title: "Payment released!",
      message: `You have received ${travelerEarnings.toFixed(2)} TND for the delivery.`,
      offer_id: offerId
    }
  ]);

  return NextResponse.json({ 
    offer: data,
    earnings: travelerEarnings,
    message: "Payment released successfully!"
  });
}
