import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { proofId, offerId, approve } = await request.json();
  if (!proofId || !offerId) {
    return NextResponse.json({ error: "proofId and offerId required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  try {
    if (approve) {
      // 1. Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Fetch offer details to ensure financial fields are set
      const { data: offerData, error: fetchError } = await supabase
        .from("post_offers")
        .select("amount_tnd, platform_fee_tnd, total_paid_tnd, proposed_price_tnd")
        .eq("id", offerId)
        .single();

      if (fetchError || !offerData) {
        return NextResponse.json({ error: "Offer not found" }, { status: 404 });
      }

      // If financial fields are missing (unlikely, but safe), calculate them
      const amount = Number(offerData.amount_tnd || offerData.proposed_price_tnd || 0);
      const rate = amount > 800 ? 2 : amount > 500 ? 3 : 5;
      const fee = offerData.platform_fee_tnd || (amount * (rate / 100));
      const total = offerData.total_paid_tnd || (amount + fee);

      // 3. Update offer status to authorized and set OTP
      const { data: offer, error: offerError } = await supabase
        .from("post_offers")
        .update({
          payment_status: "authorized",
          amount_tnd: amount,
          platform_fee_tnd: fee,
          total_paid_tnd: total,
          delivery_otp: otp,
          otp_generated_at: new Date().toISOString(),
          delivery_status: "in_transit",
          updated_at: new Date().toISOString()
        })
        .eq("id", offerId)
        .select("buyer_id, traveler_id")
        .single();

      if (offerError) throw offerError;

      // Log manual payment as a deposit to the wallet (for tracking)
      await supabase.from("wallet_transactions").insert({
        user_id: offer.buyer_id,
        offer_id: offerId,
        amount: total,
        type: 'deposit',
        description: `Manual payment confirmed: ${offerId.slice(0, 8)}...`
      });

      // 4. Mark proof as verified (only for real proofs, not synthetic ones)
      if (!proofId.startsWith("synthetic_")) {
        const { error: proofError } = await supabase
          .from("payment_proofs")
          .update({ verified: true })
          .eq("id", proofId);

        if (proofError) throw proofError;
      }

      // 4. Notify buyer and traveler
      await supabase.from("notifications").insert([
        {
          recipient_id: offer.buyer_id,
          type: "escrow_update",
          title: "Payment Verified!",
          message: "Your manual payment has been verified by an admin. Your OTP is now active.",
          offer_id: offerId
        },
        {
          recipient_id: offer.traveler_id,
          type: "escrow_update",
          title: "Payment Received!",
          message: "The buyer's payment has been verified. You can now proceed with delivery.",
          offer_id: offerId
        }
      ]);

      return NextResponse.json({ success: true, message: "Payment approved and OTP generated" });
    } else {
      // Reject payment
      const { error: offerError } = await supabase
        .from("post_offers")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("id", offerId);

      if (offerError) throw offerError;

      // Notify buyer
      const { data: offer } = await supabase
        .from("post_offers")
        .select("buyer_id")
        .eq("id", offerId)
        .single();

      if (offer) {
        await supabase.from("notifications").insert({
          recipient_id: offer.buyer_id,
          type: "escrow_update",
          title: "Payment Rejected",
          message: "Your manual payment proof was rejected by an admin. Please check your details and try again.",
          offer_id: offerId
        });
      }

      return NextResponse.json({ success: true, message: "Payment rejected" });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 500 });
  }
}
