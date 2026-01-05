import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { createPaymentRecord } from '@/lib/payment/service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Account Credits',
              description: `Add €${amount} to your DiffusionLab account`,
            },
            unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/billing?canceled=true`,
      customer_email: session.user.email!,
      invoice_creation: {
        enabled: true
      },
      metadata: {
        userId: session.user.id,
        amount: amount.toString(),
        type: 'credit_purchase',
      },
    });

    // Create pending payment record
    await createPaymentRecord({
      userId: session.user.id,
      stripeSessionId: stripeSession.id,
      amount: amount.toString(),
      currency: 'eur',
      status: 'pending',
      description: `Account credit purchase - €${amount}`,
    });

    return NextResponse.json({ 
      sessionId: stripeSession.id,
      url: stripeSession.url 
    });
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 