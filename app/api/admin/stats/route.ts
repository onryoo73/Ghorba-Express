import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = getServiceSupabase();

  try {
    // Get total platform fees collected from captured offers
    const { data: capturedOffers, error: offersError } = await supabase
      .from("post_offers")
      .select("amount_tnd, platform_fee_tnd")
      .eq("payment_status", "captured");

    if (offersError) throw offersError;

    const totalFees = capturedOffers.reduce((sum, o) => sum + (Number(o.platform_fee_tnd) || 0), 0);
    const totalVolume = capturedOffers.reduce((sum, o) => sum + (Number(o.amount_tnd) || 0), 0);
    const totalTravelerEarnings = totalVolume - totalFees;

    // Get recent platform fee transactions from wallet_transactions
    // Note: We'll fallback to showing recent captured offers if wallet_transactions doesn't have platform_fee type yet
    const { data: recentTransactions, error: recentError } = await supabase
      .from("wallet_transactions")
      .select("*, offer:post_offers(buyer:profiles!buyer_id(full_name), traveler:profiles!traveler_id(full_name))")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      totalFees,
      totalTravelerEarnings,
      totalVolume,
      recentFees: recentTransactions || []
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
