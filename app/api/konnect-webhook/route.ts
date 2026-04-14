import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Webhook handler for Konnect payment notifications
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Konnect sends payment status updates
    const { 
      paymentRef, 
      status, // "completed", "failed", "cancelled"
      orderId, // This is our offerId
      amount,
      netAmount,
      fees
    } = payload;

    // Verify webhook signature (in production, add signature verification)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (status === "completed") {
      // Payment successful - update offer
      await supabase
        .from("post_offers")
        .update({ 
          payment_status: "authorized",
          payment_intent_id: paymentRef,
          status: "accepted",
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      // Create notification for traveler
      const { data: offer } = await supabase
        .from("post_offers")
        .select("traveler_id, buyer_id")
        .eq("id", orderId)
        .single();

      if (offer) {
        await supabase.from("notifications").insert({
          recipient_id: offer.traveler_id,
          sender_id: offer.buyer_id,
          type: "escrow_update",
          title: "Payment received!",
          message: "Buyer has paid. Deliver the item and scan QR to get paid."
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
