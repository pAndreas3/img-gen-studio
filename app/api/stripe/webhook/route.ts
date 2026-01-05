import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateUserBalance, getUserBalanceInCents, dollarsTocents } from '@/lib/user/service';
import { updatePaymentStatus } from '@/lib/payment/service';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId;
      const amount = session.metadata?.amount;

      if (!userId || !amount) {
        console.error('Missing userId or amount in session metadata');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Get invoice URL if available
      let invoiceUrl = null;
      if (session.invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(session.invoice as string);
          invoiceUrl = invoice.hosted_invoice_url;
        } catch (error) {
          console.error('Error retrieving invoice:', error);
        }
      }

      // Update payment record to completed
      await updatePaymentStatus({
        sessionId: session.id,
        status: 'completed',
        paidAt: new Date(),
        paymentIntentId: session.payment_intent as string,
        receiptUrl: invoiceUrl || undefined
      });

      // Get current balance in cents
      const currentBalanceInCents = await getUserBalanceInCents(userId);
      const amountToAddInCents = dollarsTocents(parseFloat(amount));
      const newBalanceInCents = currentBalanceInCents + amountToAddInCents;

      // Update user balance
      await updateUserBalance(userId, newBalanceInCents);

      console.log(`Successfully added €${amount} to user ${userId}. New balance: €${(newBalanceInCents / 100).toFixed(2)}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 