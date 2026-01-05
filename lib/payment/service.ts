import { db } from '@/lib/db';
import { payments } from './schema';
import { eq, desc } from 'drizzle-orm';
import type { PaymentRecord} from './interfaces/payment-record';
import type { CreatePaymentData } from './interfaces/create-payment-data';
import type { UpdatePaymentStatusParams } from './interfaces/update-payment';


export type { PaymentRecord, UpdatePaymentStatusParams, CreatePaymentData };

export async function getUserPayments(userId: string): Promise<PaymentRecord[]> {
  const result = await db.select().from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
  
  return result;
}

export async function createPaymentRecord(data: CreatePaymentData) {
  // Convert amount to cents if it's provided as a string (dollars)
  const amountInCents = typeof data.amount === 'string' 
    ? Math.round(parseFloat(data.amount) * 100) 
    : data.amount;
    
  return await db.insert(payments).values({
    userId: data.userId,
    stripeSessionId: data.stripeSessionId,
    amount: amountInCents,
    currency: data.currency || 'eur',
    status: data.status || 'pending',
    description: data.description,
    receiptUrl: data.receiptUrl,
  }).returning();
}

export async function updatePaymentStatus(params: UpdatePaymentStatusParams) {
  const { sessionId, status, paidAt, paymentIntentId, receiptUrl } = params;
  
  const updateData: any = { 
    status,
    paidAt: paidAt || new Date()
  };
  
  if (paymentIntentId) {
    updateData.stripePaymentIntentId = paymentIntentId;
  }
  
  if (receiptUrl) {
    updateData.receiptUrl = receiptUrl;
  }
  
  return await db.update(payments)
    .set(updateData)
    .where(eq(payments.stripeSessionId, sessionId))
    .returning();
}

