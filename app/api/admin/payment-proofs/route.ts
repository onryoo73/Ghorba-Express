import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = getServiceSupabase();
  
  // Fetch payment proofs with buyer names
  const { data: proofs, error: proofsError } = await supabase
    .from("payment_proofs")
    .select(`
      *,
      buyer:profiles!buyer_id(full_name)
    `)
    .order("created_at", { ascending: false });

  if (proofsError) return NextResponse.json({ error: proofsError.message }, { status: 400 });

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
    data: proofs ?? [],
    pendingPayments: formattedPending
  });
}
