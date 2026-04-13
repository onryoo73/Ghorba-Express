import { NextResponse, type NextRequest } from "next/server";
import { getAuthedProfile } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

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
