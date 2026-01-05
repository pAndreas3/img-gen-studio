export interface PaymentRecord {
  id: string;
  amount: number; // stored in cents
  currency: string;
  status: string;
  description: string | null;
  receiptUrl: string | null;
  createdAt: Date | null;
  paidAt: Date | null;
  stripeSessionId: string | null;
}