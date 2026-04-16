import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceSupabase();

  try {
    // 1. Get available balance from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    // 2. Get locked balance from post_offers
    // Locked balance for buyer: any paid offer not yet completed
    // Locked balance for traveler: any paid offer not yet released
    
    // Sum of authorized/captured payments where I am the buyer
    const { data: buyerOffers, error: buyerError } = await supabase
      .from("post_offers")
      .select("total_paid_tnd")
      .eq("buyer_id", user.id)
      .in("payment_status", ["authorized", "captured"])
      .is("payment_released", false);

    if (buyerError) throw buyerError;

    // Sum of earnings for traveler (agreed amount) for in-transit/delivered items
    const { data: travelerOffers, error: travelerError } = await supabase
      .from("post_offers")
      .select("proposed_price_tnd")
      .eq("traveler_id", user.id)
      .in("payment_status", ["authorized", "captured"])
      .is("payment_released", false);

    if (travelerError) throw travelerError;

    const lockedBuyer = buyerOffers.reduce((sum, offer) => sum + (Number(offer.total_paid_tnd) || 0), 0);
    const lockedTraveler = travelerOffers.reduce((sum, offer) => sum + (Number(offer.proposed_price_tnd) || 0), 0);

    // 3. Get recent transactions
    const { data: transactions, error: transError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (transError) throw transError;

    return NextResponse.json({
      available: profile.wallet_balance || 0,
      locked: lockedBuyer + lockedTraveler,
      transactions: transactions || []
    });

  } catch (error) {
    console.error("Wallet stats error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet stats" }, { status: 500 });
  }
}
