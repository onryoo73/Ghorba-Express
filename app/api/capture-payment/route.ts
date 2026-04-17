import { NextResponse } from "next/server";
import Stripe from "stripe";

// Lazy-initialize Stripe to avoid build-time errors
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia"
    });
  }
  return stripe;
};

export async function POST(request: Request) {
  try {
    const stripeClient = getStripe();
    if (!stripeClient) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const { paymentIntentId } = await request.json();

    // Capture the authorized payment (release funds to traveler)
    const paymentIntent = await stripeClient.paymentIntents.capture(paymentIntentId);

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
