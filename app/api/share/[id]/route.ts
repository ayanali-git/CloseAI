import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params.id;
    if (!rawId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }
    const chatId = rawId.replace(/^[mr]_/, '');

    // 1. Fetch Chat metadata using admin client (bypasses RLS for public read)
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .select('id, title, created_at, updated_at')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Shared chat not found' }, { status: 404 });
    }

    // 2. Fetch Messages for this chat
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('*, file_uploads(*)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
    }

    const formattedMessages = (messages || []).map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.created_at,
      chatId: msg.chat_id,
      metadata: msg.metadata || null,
      files: (msg.file_uploads && msg.file_uploads.length > 0)
        ? msg.file_uploads
        : (msg.metadata?.files || [])
    }));

    return NextResponse.json({
      chat: {
        id: chat.id,
        title: chat.title,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
      },
      messages: formattedMessages,
    });
  } catch (error: any) {
    console.error('Error fetching public shared chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
