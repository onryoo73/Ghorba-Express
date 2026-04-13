import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const threadId = request.nextUrl.searchParams.get("threadId");
  if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 });

  const supabase = getServiceSupabase();
  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id,buyer_id,traveler_id")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread || (thread.buyer_id !== user.id && thread.traveler_id !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id,thread_id,sender_id,message,created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { threadId, message } = await request.json();
  if (!threadId || !message) {
    return NextResponse.json({ error: "threadId and message are required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id,buyer_id,traveler_id")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread || (thread.buyer_id !== user.id && thread.traveler_id !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      message
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: data }, { status: 201 });
}
