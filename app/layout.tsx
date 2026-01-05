import { Toaster } from '@/components/ui/sonner';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'SwiftMind | Project Management',
  description:
    'Project Management Software'
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {


  return (
    <html lang="en" className="h-full bg-gray-50 dark">
      <body>
        {children}
        <Toaster />
      </body>
      <Analytics />

    </html>
  )
}
