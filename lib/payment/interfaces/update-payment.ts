export interface UpdatePaymentStatusParams {
    sessionId: string;
    status: string;
    paidAt?: Date;
    paymentIntentId?: string;
    receiptUrl?: string;
  }