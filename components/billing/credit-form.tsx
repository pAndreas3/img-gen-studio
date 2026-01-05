'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap } from 'lucide-react';

interface CreditFormProps {
  onPayment?: (amount: string) => void;
}

export default function CreditForm({ onPayment }: CreditFormProps) {
  const [amount, setAmount] = useState('25');
  const [isLoading, setIsLoading] = useState(false);

  const handlePresetAmount = (preset: string) => {
    setAmount(preset);
  };

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        alert('Failed to create payment session. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        How much credit do you want to add to your account?
      </p>
      
      {/* Preset Amount Buttons */}
      <div className="flex gap-3 mb-4">
        <Button 
          variant="outline" 
          className="px-6"
          onClick={() => handlePresetAmount('25')}
          disabled={isLoading}
        >
          €25
        </Button>
        <Button 
          variant="outline" 
          className="px-6"
          onClick={() => handlePresetAmount('50')}
          disabled={isLoading}
        >
          €50
        </Button>
        <Button 
          variant="outline" 
          className="px-6"
          onClick={() => handlePresetAmount('100')}
          disabled={isLoading}
        >
          €100
        </Button>
      </div>

      {/* Custom Amount Input */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border rounded-md px-3 py-2 bg-background">
          <span className="text-muted-foreground mr-2">€</span>
          <Input
            type="number"
            placeholder="25"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max="1000"
            disabled={isLoading}
            className="border-0 shadow-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        
        <Button 
          className="bg-purple-600 hover:bg-purple-700 px-8 flex items-center gap-2"
          onClick={handlePayment}
          disabled={isLoading || !amount || parseFloat(amount) <= 0}
        >
          <Zap className="h-4 w-4" />
          {isLoading ? 'Processing...' : 'Pay with Card'}
        </Button>
      </div>
    </div>
  );
} 