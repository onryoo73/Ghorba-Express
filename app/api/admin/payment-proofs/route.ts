import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = getServiceSupabase();
  
  // Fetch payment proofs with buyer names
  const { data, error } = await supabase
    .from("payment_proofs")
    .select(`
      *,
      buyer:profiles!buyer_id(full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ data: data ?? [] });
}
