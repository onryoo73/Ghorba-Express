import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = getServiceSupabase();

  try {
    // Get total platform fees collected
    const { data: feeTransactions, error: feeError } = await supabase
      .from("wallet_transactions")
      .select("amount")
      .eq("type", "platform_fee");

    if (feeError) throw feeError;

    const totalFees = feeTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Get total payments released to travelers
    const { data: earningTransactions, error: earningError } = await supabase
      .from("wallet_transactions")
      .select("amount")
      .eq("type", "earning");

    if (earningError) throw earningError;

    const totalTravelerEarnings = earningTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Get total gross volume
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount_tnd");

    if (paymentsError) throw paymentsError;

    const totalVolume = payments.reduce((sum, p) => sum + (Number(p.amount_tnd) || 0), 0);

    // Get recent platform fee transactions
    const { data: recentFees, error: recentError } = await supabase
      .from("wallet_transactions")
      .select("*, offer:post_offers(buyer:profiles(full_name), traveler:profiles(full_name))")
      .eq("type", "platform_fee")
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    return NextResponse.json({
      totalFees,
      totalTravelerEarnings,
      totalVolume,
      recentFees: recentFees || []
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
