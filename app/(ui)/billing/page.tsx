import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserBalance } from '@/lib/user/service';
import { getUserPayments } from '@/lib/payment/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import CreditForm from '@/components/billing/credit-form';
import PaymentsTable from '@/components/billing/payments-table';

export default async function BillingPage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const balance = await getUserBalance(session.user.id);
  const payments = await getUserPayments(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Balance Information */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-gray-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-300">Balance:</span>
                <span className="text-2xl font-bold">€{balance}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Credits Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Add Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CreditForm />
          </CardContent>
        </Card>

        {/* Payment History */}
        <PaymentsTable payments={payments} />
      </div>
    </div>
  );
} 


