import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { orderId, offerId } = await request.json();
  if (!orderId && !offerId) return NextResponse.json({ error: "orderId or offerId required" }, { status: 400 });

  const supabase = getServiceSupabase();
  
  // Handle post_offers release (new system)
  if (offerId) {
    // Get offer details first
    const { data: offer } = await supabase
      .from("post_offers")
      .select("id, traveler_id, amount_tnd, proposed_price_tnd, platform_fee_tnd, otp_verified")
      .eq("id", offerId)
      .single();
    
    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    if (!offer.otp_verified) return NextResponse.json({ error: "OTP not verified yet" }, { status: 400 });
    
    const agreedAmount = Number(offer.amount_tnd || offer.proposed_price_tnd || 0);
    const travelerEarnings = agreedAmount - (offer.platform_fee_tnd || 0);
    
    // Update offer - payment released
    const { data: updatedOffer, error: updateError } = await supabase
      .from("post_offers")
      .update({
        payment_released: true,
        payment_released_at: new Date().toISOString(),
        payment_status: "captured"
      })
      .eq("id", offerId)
      .select()
      .single();
    
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
    
    // Update traveler wallet
    try {
      const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', offer.traveler_id).single();
      const currentBalance = Number(profile?.wallet_balance || 0);
      await supabase.from('profiles').update({ wallet_balance: currentBalance + travelerEarnings }).eq('id', offer.traveler_id);
      
      // Log transaction
      await supabase.from("wallet_transactions").insert({
        user_id: offer.traveler_id,
        offer_id: offerId,
        amount: travelerEarnings,
        type: 'earning',
        description: `Earnings for delivery: ${offer.id.slice(0, 8)}...`
      });
    } catch (err) {
      console.error("Wallet update error:", err);
    }
    
    // Create payment record
    await supabase.from("payments").insert({
      offer_id: offerId,
      traveler_id: offer.traveler_id,
      amount_tnd: agreedAmount,
      platform_fee_tnd: offer.platform_fee_tnd || 0,
      traveler_earnings_tnd: travelerEarnings,
      status: "captured",
      captured_at: new Date().toISOString()
    });
    
    // Get traveler payment method for notification
    const { data: offerWithPayment } = await supabase
      .from("post_offers")
      .select("traveler_payment_method, traveler_payment_number")
      .eq("id", offerId)
      .single();
    
    // Notify traveler
    await supabase.from("notifications").insert({
      recipient_id: offer.traveler_id,
      sender_id: admin.id,
      type: "escrow_update",
      title: "Payment released!",
      message: `Payment released! Check your ${offerWithPayment?.traveler_payment_method?.toUpperCase()} account (${offerWithPayment?.traveler_payment_number}). You received ${travelerEarnings.toFixed(2)} TND.`,
      offer_id: offerId
    });
    
    return NextResponse.json({ offer: updatedOffer, earnings: travelerEarnings });
  }
  
  // Handle old orders system (legacy)
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
