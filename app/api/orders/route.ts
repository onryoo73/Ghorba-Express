import { NextResponse, type NextRequest } from "next/server";
import { getAuthedProfile } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const authed = await getAuthedProfile(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = request.nextUrl.searchParams.get("scope") ?? "mine";
  const supabase = getServiceSupabase();
  let query = supabase
    .from("orders")
    .select("id,buyer_id,traveler_id,type,reward_tnd,origin,destination,status,delivery_qr_token,created_at")
    .order("created_at", { ascending: false });

  if (scope === "open") {
    query = query.eq("status", "open");
  } else if (scope === "assigned") {
    query = query.eq("traveler_id", authed.user.id);
  } else {
    query = query.eq("buyer_id", authed.user.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(request: NextRequest) {
  const authed = await getAuthedProfile(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    type,
    productPriceTnd,
    rewardTnd,
    itemDescription,
    itemWeightKg,
    origin,
    destination
  } = body;

  if (!type || !rewardTnd || !itemDescription || !origin || !destination) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: authed.user.id,
      type,
      product_price_tnd: productPriceTnd ?? null,
      reward_tnd: rewardTnd,
      item_description: itemDescription,
      item_weight_kg: itemWeightKg ?? null,
      origin,
      destination
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ order: data }, { status: 201 });
}
