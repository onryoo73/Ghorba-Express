import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { offerId, paymentMethod, paymentNumber, paymentName } = await request.json();
  
  if (!offerId || !paymentMethod || !paymentNumber) {
    return NextResponse.json({ error: "offerId, paymentMethod, and paymentNumber required" }, { status: 400 });
  }

  if (!["d17", "flouci", "bank_transfer"].includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  if (paymentMethod === "flouci" && !paymentName?.trim()) {
    return NextResponse.json({ error: "Payment name required for Flouci" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Verify the user is the traveler for this offer
  const { data: offer } = await supabase
    .from("post_offers")
    .select("id, traveler_id, otp_verified")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  if (offer.traveler_id !== user.id) {
    return NextResponse.json({ error: "Only the traveler can update payment info" }, { status: 403 });
  }

  // Update traveler payment info
  const { data, error } = await supabase
    .from("post_offers")
    .update({
      traveler_payment_method: paymentMethod,
      traveler_payment_number: paymentNumber.trim(),
      traveler_payment_name: paymentName?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", offerId)
    .select()
    .single();

  if (error) {
    console.error("[Traveler Payment] Update error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ 
    success: true, 
    offer: data,
    message: "Payment info saved. Admin will release payment shortly."
  });
}
