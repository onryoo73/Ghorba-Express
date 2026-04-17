import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  console.log("[Admin Orders] Starting...");
  const admin = await requireAdmin(request);
  console.log("[Admin Orders] Admin check result:", admin ? "allowed" : "denied");
  if (!admin) {
    console.log("[Admin Orders] Access denied - returning 403");
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const supabase = getServiceSupabase();

  try {
    // First, let's see what statuses exist in post_offers
    const { data: statusCheck, error: statusError } = await supabase
      .from("post_offers")
      .select("status")
      .limit(5);
    
    console.log("[Admin Orders] Status check:", statusCheck, statusError);
    
    // Fetch all post_offers regardless of status for now
    const { data: offers, error } = await supabase
      .from("post_offers")
      .select(`
        id,
        status,
        created_at,
        post:posts(origin, destination, author:profiles(full_name))
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[Admin Orders] post_offers error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[Admin Orders] Raw offers:", offers);

    // Also check old orders table for any legacy orders
    const { data: legacyOrders } = await supabase
      .from("orders")
      .select("id, status, origin, destination, delivery_qr_token, created_at")
      .in("status", ["pending", "in_progress", "completed"])
      .order("created_at", { ascending: false })
      .limit(10);

    // Combine them - prefer post_offers data
    const formattedOffers = (offers || []).map((o: any) => ({
      id: o.id,
      status: o.status,
      origin: o.post?.origin || "N/A",
      destination: o.post?.destination || "N/A",
      buyer_name: o.post?.author?.full_name || "N/A",
      traveler_name: "N/A",
      created_at: o.created_at
    }));

    console.log("[Admin Orders] Found offers:", formattedOffers.length);
    return NextResponse.json({ 
      orders: formattedOffers,
      legacyOrders: legacyOrders || []
    });
  } catch (err) {
    console.error("[Admin Orders] Catch error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}