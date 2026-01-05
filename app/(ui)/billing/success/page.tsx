import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default async function SuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ session_id?: string }> 
}) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment has been processed successfully. Credits will be added to your account shortly.
          </p>
          {sessionId && (
            <p className="text-sm text-muted-foreground">
              Session ID: {sessionId}
            </p>
          )}
          <div className="pt-4">
            <Link href="/billing">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Return to Billing
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 