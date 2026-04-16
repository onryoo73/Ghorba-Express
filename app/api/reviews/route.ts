import { NextResponse, type NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/server/auth";
import { getServiceSupabase } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { offerId, targetId, rating, comment } = await request.json();

  if (!offerId || !targetId || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  try {
    // 1. Check if review already exists for this offer from this user
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("offer_id", offerId) // Using offer_id as the primary link now
      .eq("reviewer_id", user.id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this transaction" }, { status: 400 });
    }

    // 2. Insert the review
    const { error: insertError } = await supabase
      .from("reviews")
      .insert({
        offer_id: offerId,
        reviewer_id: user.id,
        reviewee_id: targetId,
        rating: rating,
        comment: comment || null
      });

    if (insertError) throw insertError;

    // 3. Recalculate and update target user's average rating
    const { data: allReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", targetId);

    if (reviewsError) throw reviewsError;

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          rating: Number(avgRating.toFixed(1)),
          total_deliveries: allReviews.length // This is an approximation of deliveries based on reviews
        })
        .eq("id", targetId);

      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true, message: "Review submitted successfully" });

  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
