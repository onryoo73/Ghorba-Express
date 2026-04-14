// Konnect Payment Integration for Tunisia
// Docs: https://docs.konnect.network

const KONNECT_API_URL = process.env.KONNECT_SANDBOX === "true" 
  ? "https://api.sandbox.konnect.network/api/v2"
  : "https://api.konnect.network/api/v2";

export interface KonnectPaymentRequest {
  receiverWalletId: string;
  token: "TND" | "EUR" | "USD";
  amount: number; // in millimes (1 TND = 1000 millimes)
  type: "immediate" | "partial";
  description: string;
  acceptedPaymentMethods: ("wallet" | "bank_card" | "e-DINAR")[];
  lifespan?: number; // in minutes
  checkoutForm?: boolean;
  addPaymentFeesToAmount?: boolean;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  orderId?: string;
  webhook?: string;
  successUrl?: string;
  failUrl?: string;
  theme?: "light" | "dark";
}

export interface KonnectPaymentResponse {
  payUrl: string;
  paymentRef: string;
}

export interface KonnectPaymentStatus {
  paymentRef: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  amount: number;
  netAmount: number;
  fees: number;
  createdAt: string;
  completedAt?: string;
}

export async function createKonnectPayment(
  data: KonnectPaymentRequest
): Promise<KonnectPaymentResponse> {
  const apiKey = process.env.KONNECT_API_KEY;
  
  if (!apiKey) {
    throw new Error("KONNECT_API_KEY not configured");
  }

  const response = await fetch(`${KONNECT_API_URL}/payments/init-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Konnect payment failed: ${error}`);
  }

  return response.json();
}

export async function getPaymentStatus(
  paymentRef: string
): Promise<KonnectPaymentStatus> {
  const apiKey = process.env.KONNECT_API_KEY;
  
  if (!apiKey) {
    throw new Error("KONNECT_API_KEY not configured");
  }

  const response = await fetch(
    `${KONNECT_API_URL}/payments/${paymentRef}`,
    {
      headers: {
        "x-api-key": apiKey
      }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get payment status");
  }

  return response.json();
}

// Convert TND to millimes (Konnect uses millimes)
export function tndToMillimes(amountTND: number): number {
  return Math.round(amountTND * 1000);
}

// Convert millimes to TND
export function millimesToTND(amountMillimes: number): number {
  return amountMillimes / 1000;
}
