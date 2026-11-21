import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, title, messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const snippetId = (chatId || crypto.randomUUID()).replace(/^[mr]_/, '');

    // Format messages for consistency
    const formattedMessages = messages.map((m: any, idx: number) => ({
      id: m.id || `msg-${snippetId}-${idx}`,
      role: m.role || 'user',
      content: m.content || '',
      createdAt: m.createdAt || m.created_at || new Date().toISOString(),
      chatId: snippetId,
      metadata: m.metadata || null,
      files: m.files || (m.file_uploads && m.file_uploads.length > 0 ? m.file_uploads : []),
    }));

    const snippetTitle = (
      title ||
      messages.find((m: any) => m.role === 'user')?.content?.slice(0, 100) ||
      'Shared Chat'
    ).trim();

    const snippetData = {
      chat: {
        id: snippetId,
        title: snippetTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      messages: formattedMessages,
    };

    // Upload to 'shared' storage bucket
    let { error: uploadError } = await supabaseAdmin.storage
      .from('shared')
      .upload(`${snippetId}.json`, JSON.stringify(snippetData), {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError && (uploadError.message?.includes('not found') || (uploadError as any).statusCode === '404')) {
      await supabaseAdmin.storage.createBucket('shared', { public: true });
      const retry = await supabaseAdmin.storage
        .from('shared')
        .upload(`${snippetId}.json`, JSON.stringify(snippetData), {
          contentType: 'application/json',
          upsert: true,
        });
      uploadError = retry.error;
    }

    if (uploadError) {
      console.error('Error uploading snippet to storage:', uploadError);
      return NextResponse.json({ error: 'Failed to save share snippet' }, { status: 500 });
    }

    return NextResponse.json({
      id: snippetId,
      ok: true,
    });
  } catch (error: any) {
    console.error('Error in POST /api/share:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
