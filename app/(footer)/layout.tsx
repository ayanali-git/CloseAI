'use client';

import { ReactNode } from 'react';
import { MarketingHeader } from '@/components/marketing/header';
import { Footer } from '@/components/marketing/footer';

export default function FooterPagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-clip">
      <MarketingHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
