// Mock Konnect for testing when sandbox is down
// Simulates payments without real money

export interface MockPaymentRequest {
  amount: number; // in TND
  offerId: string;
  buyerId: string;
  travelerId: string;
  itemDescription: string;
}

export interface MockPaymentResponse {
  payUrl: string;
  paymentRef: string;
  mockMode: boolean;
}

// Simulate creating a payment
export async function createMockPayment(
  data: MockPaymentRequest
): Promise<MockPaymentResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Generate mock payment reference
  const paymentRef = `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Return mock payment URL (opens a local simulation page)
  const payUrl = `/mock-payment?ref=${paymentRef}&amount=${data.amount}&desc=${encodeURIComponent(data.itemDescription)}`;
  
  return {
    payUrl,
    paymentRef,
    mockMode: true
  };
}

// Simulate checking payment status
export async function getMockPaymentStatus(
  paymentRef: string
): Promise<{
  paymentRef: string;
  status: "pending" | "completed" | "failed";
  amount: number;
  completedAt?: string;
}> {
  // In real app, check database
  // For now, assume completed if ref starts with MOCK_
  const isCompleted = paymentRef.startsWith("MOCK_");
  
  return {
    paymentRef,
    status: isCompleted ? "completed" : "pending",
    amount: 0,
    completedAt: isCompleted ? new Date().toISOString() : undefined
  };
}

// Store mock payment status (in-memory for now)
const mockPayments = new Map<string, {
  status: "pending" | "completed" | "failed";
  completedAt?: string;
}>();

export function completeMockPayment(paymentRef: string): void {
  mockPayments.set(paymentRef, {
    status: "completed",
    completedAt: new Date().toISOString()
  });
}

export function failMockPayment(paymentRef: string): void {
  mockPayments.set(paymentRef, {
    status: "failed"
  });
}
