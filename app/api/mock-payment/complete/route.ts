import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Complete mock payment and generate OTP (simulates Konnect webhook)
export async function POST(request: Request) {
  try {
    const { paymentRef, offerId } = await request.json();
    
    if (!paymentRef || !offerId) {
      return NextResponse.json(
        { error: "paymentRef and offerId required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("[Mock Payment] Generated OTP:", otp, "for offer:", offerId);

    // Update offer with OTP and payment status
    const { data: offer, error } = await supabase
      .from("post_offers")
      .update({
        payment_status: "authorized",
        payment_intent_id: paymentRef,
        status: "accepted",
        delivery_otp: otp,
        otp_generated_at: new Date().toISOString(),
        delivery_status: "in_transit",
        updated_at: new Date().toISOString()
      })
      .eq("id", offerId)
      .select("traveler_id, buyer_id, delivery_otp")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create notification for traveler
    if (offer) {
      await supabase.from("notifications").insert({
        recipient_id: offer.traveler_id,
        sender_id: offer.buyer_id,
        type: "escrow_update",
        title: "Payment received!",
        message: "Buyer has paid and funds are in escrow. Deliver the item and ask buyer for the OTP to release payment."
      });
    }

    return NextResponse.json({ 
      success: true,
      message: "Mock payment completed and OTP generated"
    });
  } catch (error) {
    console.error("Mock payment completion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete mock payment" },
      { status: 500 }
    );
  }
}
