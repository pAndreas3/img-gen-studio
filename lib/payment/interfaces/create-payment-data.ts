export interface CreatePaymentData {
  userId: string;
  stripeSessionId?: string;
  amount: number; 
  currency?: string;
  status?: string;
  description?: string;
  receiptUrl?: string;
}