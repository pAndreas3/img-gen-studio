'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Receipt } from 'lucide-react';

import type { PaymentRecord } from '@/lib/payment/interfaces/payment-record';

interface PaymentsTableProps {
  payments: PaymentRecord[];
}

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short', 
    year: 'numeric'
  }).format(date);
}

function formatAmount(amount: number, currency: string): string {
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function getStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return 'Paid';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}

export default function PaymentsTable({ payments }: PaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No payment history found.
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 pb-2 text-sm font-medium text-muted-foreground border-b">
            <div>Date</div>
            <div>Status</div>
            <div>Amount</div>
            <div>Invoice</div>
          </div>
          
          {/* Payment rows */}
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="grid grid-cols-4 gap-4 py-3 text-sm items-center hover:bg-muted/50 rounded-md px-2 -mx-2"
            >
              <div className="text-foreground">
                {formatDate(payment.paidAt || payment.createdAt)}
              </div>
              
              <div>
                <Badge variant={getStatusColor(payment.status)} className={payment.status === 'completed' ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                  {getStatusText(payment.status)}
                </Badge>
              </div>
              
              <div className="font-medium">
                {formatAmount(payment.amount, payment.currency)}
              </div>
              
              <div>
                {payment.status === 'completed' && payment.receiptUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      window.open(payment.receiptUrl!, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
                {payment.status === 'completed' && !payment.receiptUrl && (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}