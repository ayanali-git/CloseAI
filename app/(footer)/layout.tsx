'use client';

import { ReactNode } from 'react';
import { MarketingHeader } from '@/components/marketing/header';
import { Footer } from '@/components/marketing/footer';
import { useAuth } from '@/hooks/use-auth';

export default function FooterPagesLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div
      data-marketing-guest={!user}
      className="min-h-screen bg-background flex flex-col overflow-x-clip"
    >
      <MarketingHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 pt-4 sm:pt-6 lg:pt-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
