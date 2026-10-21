import React from 'react';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { SidebarProvider } from '@/components/chat/sidebar-context';
import { ChatFavicon } from '@/components/brand/chat-favicon';

export const metadata: Metadata = {
  title: 'CloseAI',
  icons: {
    icon: [
      { url: '/favicon-chat.ico', sizes: 'any' },
      { url: '/favicon-chat.svg', type: 'image/svg+xml' },
      { url: '/favicon-chat-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-chat-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon-chat.ico',
    apple: '/closeai-icon-white.png',
  },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const userAgent = headers().get('user-agent') || '';
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const cookieStore = cookies();
  const sidebarCookie = cookieStore.get('sidebar_open');
  const defaultOpen = isMobile
    ? false
    : sidebarCookie !== undefined
    ? sidebarCookie.value === 'true'
    : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <ChatFavicon />
      <div data-chat-page="true" className="chat-selection-theme selection:bg-secondary selection:text-foreground fixed inset-0 h-[100dvh] w-full overflow-hidden flex flex-col no-overscroll">
        {children}
      </div>
    </SidebarProvider>
  );
}
