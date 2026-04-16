import { NextResponse } from "next/server";
import { createKonnectPayment, tndToMillimes } from "@/lib/konnect";
import { createMockPayment } from "@/lib/mock-konnect";

export async function POST(request: Request) {
  try {
    const { 
      amount, // in TND
      offerId, 
      buyerId, 
      travelerId,
      buyerEmail,
      buyerName,
      itemDescription 
    } = await request.json();

    // Check if Konnect is configured
    const hasKonnect = process.env.KONNECT_API_KEY && process.env.KONNECT_WALLET_ID;

    if (hasKonnect) {
      // Use real Konnect
      const amountInMillimes = tndToMillimes(amount);
      
      const payment = await createKonnectPayment({
        receiverWalletId: process.env.KONNECT_WALLET_ID!,
        token: "TND",
        amount: amountInMillimes,
        type: "immediate",
        description: itemDescription || "Ghorba Express delivery payment",
        acceptedPaymentMethods: ["bank_card", "e-DINAR", "wallet"],
        lifespan: 60,
        checkoutForm: true,
        addPaymentFeesToAmount: false,
        firstName: buyerName?.split(" ")[0] || "",
        lastName: buyerName?.split(" ").slice(1).join(" ") || "",
        email: buyerEmail || "",
        orderId: offerId,
        webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/konnect-webhook`,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/messages?payment=success`,
        failUrl: `${process.env.NEXT_PUBLIC_APP_URL}/messages?payment=failed`,
        theme: "dark"
      });

      return NextResponse.json({ 
        payUrl: payment.payUrl,
        paymentRef: payment.paymentRef,
        mockMode: false
      });
    } else {
      // Use mock payment for testing
      console.log("Using mock payment - Konnect not configured or sandbox down");
      
      const payment = await createMockPayment({
        amount,
        offerId,
        buyerId,
        travelerId,
        itemDescription: itemDescription || "Ghorba Express delivery"
      });

      return NextResponse.json({ 
        payUrl: payment.payUrl,
        paymentRef: payment.paymentRef,
        mockMode: true
      });
    }
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment" },
      { status: 500 }
    );
  }
}
