import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Offer ID required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  
  const { data: offer, error } = await supabase
    .from("post_offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  // Only buyer or traveler can view the offer
  if (offer.buyer_id !== user.id && offer.traveler_id !== user.id) {
    return NextResponse.json({ error: "Not authorized to view this offer" }, { status: 403 });
  }

  return NextResponse.json({ offer });
}
