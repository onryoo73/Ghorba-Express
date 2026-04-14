import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia"
});

export async function POST(request: Request) {
  try {
    const { paymentIntentId } = await request.json();

    // Capture the authorized payment (release funds to traveler)
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    return NextResponse.json({ 
      status: paymentIntent.status,
      captured: true
    });
  } catch (error) {
    console.error("Capture error:", error);
    return NextResponse.json(
      { error: "Failed to capture payment" },
      { status: 500 }
    );
  }
}
