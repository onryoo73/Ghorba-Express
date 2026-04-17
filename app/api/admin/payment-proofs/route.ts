import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = getServiceSupabase();
  
  // Fetch payment proofs with buyer names AND offer status
  const { data: proofs, error: proofsError } = await supabase
    .from("payment_proofs")
    .select(`
      *,
      buyer:profiles!buyer_id(full_name),
      offer:post_offers!offer_id(id, payment_released, payment_status, delivery_status, otp_verified, traveler_payment_method, traveler_payment_number, traveler_payment_name, traveler_id)
    `)
    .order("created_at", { ascending: false });

  if (proofsError) {
    console.error("[Payment Proofs] Proofs error:", proofsError);
    return NextResponse.json({ error: proofsError.message }, { status: 400 });
  }

  // Format proofs - flatten offer data
  const formattedProofs = (proofs || []).map((p: any) => {
    const offer = Array.isArray(p.offer) ? p.offer[0] : p.offer;
    return {
      ...p,
      offer_payment_released: offer?.payment_released || false,
      offer_payment_status: offer?.payment_status || null,
      offer_delivery_status: offer?.delivery_status || null,
      offer_otp_verified: offer?.otp_verified || false,
      offer_traveler_payment_method: offer?.traveler_payment_method || null,
      offer_traveler_payment_number: offer?.traveler_payment_number || null,
      offer_traveler_payment_name: offer?.traveler_payment_name || null,
      offer_traveler_id: offer?.traveler_id || null
    };
  });

  // Fetch ALL authorized offers from post_offers (for OTP-based payments that have no proof record)
  const { data: authorizedOffers, error: offersError } = await supabase
    .from("post_offers")
    .select(`
      id,
      offerer_id,
      traveler_id,
      buyer_id,
      amount_tnd,
      payment_status,
      delivery_status,
      traveler_payment_method,
      traveler_payment_number,
      traveler_payment_name,
      payment_released,
      otp_verified,
      payment_intent_id,
      created_at,
      updated_at,
      traveler:profiles!traveler_id(full_name),
      buyer:profiles!buyer_id(full_name)
    `)
    .eq("payment_status", "authorized")
    .or("payment_released.eq.false,payment_released.is.null")
    .order("created_at", { ascending: false });

  if (offersError) {
    console.error("[Payment Proofs] Offers error:", offersError);
  }

  // Format authorized offers as synthetic payment proofs
  const syntheticProofs = (authorizedOffers || []).map((o: any) => ({
    id: `synthetic_${o.id}`,
    offer_id: o.id,
    buyer_id: o.buyer_id,
    provider: "konnect",
    image_url: "",
    amount_tnd: o.amount_tnd || 0,
    transaction_id: o.payment_intent_id || "N/A",
    verified: true, // Auto-verified for Konnect payments
    created_at: o.created_at,
    updated_at: o.updated_at,
    buyer: Array.isArray(o.buyer) ? o.buyer[0] : o.buyer,
    // Offer status
    offer_payment_released: o.payment_released || false,
    offer_payment_status: o.payment_status,
    offer_delivery_status: o.delivery_status,
    offer_otp_verified: o.otp_verified || false,
    offer_traveler_payment_method: o.traveler_payment_method,
    offer_traveler_payment_number: o.traveler_payment_number,
    offer_traveler_payment_name: o.traveler_payment_name,
    offer_traveler_id: o.traveler_id
  }));

  // Merge real proofs with synthetic ones (avoid duplicates)
  const existingOfferIds = new Set(formattedProofs.map((p: any) => p.offer_id));
  const mergedProofs = [...formattedProofs, ...syntheticProofs.filter((s: any) => !existingOfferIds.has(s.offer_id))];

  // Fetch pending traveler payments (OTP verified, waiting for release)
  const { data: pendingPayments, error: pendingError } = await supabase
    .from("post_offers")
    .select(`
      id,
      offerer_id,
      traveler_id,
      buyer_id,
      amount_tnd,
      payment_status,
      delivery_status,
      traveler_payment_method,
      traveler_payment_number,
      traveler_payment_name,
      payment_released,
      otp_verified,
      created_at,
      traveler:profiles!traveler_id(full_name),
      buyer:profiles!buyer_id(full_name)
    `)
    .eq("payment_status", "authorized")
    .eq("delivery_status", "completed")
    .eq("otp_verified", true)
    .or("payment_released.eq.false,payment_released.is.null");

  if (pendingError) return NextResponse.json({ error: pendingError.message }, { status: 400 });
  
  // Format pending payments
  const formattedPending = (pendingPayments || []).map((p: any) => ({
    ...p,
    traveler: Array.isArray(p.traveler) ? p.traveler[0] : p.traveler,
    buyer: Array.isArray(p.buyer) ? p.buyer[0] : p.buyer
  }));
  
  return NextResponse.json({ 
    data: mergedProofs,
    pendingPayments: formattedPending
  });
}
