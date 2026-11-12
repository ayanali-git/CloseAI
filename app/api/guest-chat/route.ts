import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const GC_ID = process.env.GC_ID;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId') || GC_ID;

    // Fetch messages for guest chat
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*, file_uploads(*)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching guest messages:', error);
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
        : (msg.metadata?.files || []),
    }));

    return NextResponse.json({
      chatId,
      messages: formattedMessages,
    });
  } catch (error: any) {
    console.error('Guest chat GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const chatId = body.chatId || GC_ID;

    if (chatId !== GC_ID) {
      return NextResponse.json({ error: 'Unauthorized to clear this chat' }, { status: 403 });
    }

    // Delete associated files
    const { data: msgs } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('chat_id', chatId);

    if (msgs && msgs.length > 0) {
      const msgIds = msgs.map((m: any) => m.id);
      await supabaseAdmin
        .from('file_uploads')
        .delete()
        .in('message_id', msgIds);
    }

    // Delete all messages in the guest chat
    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('chat_id', chatId);

    if (error) {
      console.error('Error deleting guest messages:', error);
      return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
    }

    // Reset chat's updated_at
    await supabaseAdmin
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Guest chat DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
