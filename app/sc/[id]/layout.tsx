import React from 'react';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-server';

export default async function SharedChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const chatId = params?.id;
  let estimatedWidth: number | null = null;

  if (chatId) {
    // 1. Check if client previously stored exact measured width cookie
    const cookieStore = cookies();
    const widthCookie = cookieStore.get(`st_w_${chatId}`);
    if (widthCookie) {
      const val = parseInt(widthCookie.value, 10);
      if (!isNaN(val) && val > 0) {
        estimatedWidth = val;
      }
    }

    // 2. If no cookie yet, fetch chat title directly on server to calculate exact dynamic width
    if (!estimatedWidth) {
      try {
        const { data: chat } = await supabaseAdmin
          .from('chats')
          .select('title')
          .eq('id', chatId)
          .single();

        if (chat?.title) {
          const clean = chat.title.replace(/(\.\.\.|\u2026)\s*$/, '').trim();
          // Dynamic width based on character count: ~8.5px per char, min 48px, max 516px
          estimatedWidth = Math.min(Math.max(48, Math.round(clean.length * 8.5)), 516);
        }
      } catch (e) {
        // Fallback gracefully
      }
    }
  }

  const initialWidth = estimatedWidth || 180;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `:root { --shared-title-w: ${initialWidth}px; }`,
        }}
      />
      <div data-chat-page="true" className="chat-selection-theme selection:bg-secondary selection:text-foreground fixed inset-0 h-[100dvh] w-full overflow-hidden flex flex-col no-overscroll">
        {children}
      </div>
    </>
  );
}