import { NextResponse, type NextRequest } from "next/server";
import { getAuthedProfile } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const authed = await getAuthedProfile(request);
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["traveler", "both"].includes(authed.profile.role)) {
    return NextResponse.json({ error: "Traveler role required" }, { status: 403 });
  }

  const { orderId, tripId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update({ traveler_id: authed.user.id, trip_id: tripId ?? null, status: "accepted" })
    .eq("id", orderId)
    .eq("status", "open")
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ order: data });
}
