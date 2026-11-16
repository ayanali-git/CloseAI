import { SupabaseClient } from '@supabase/supabase-js';
import { getTemporaryChatIds } from './temporary-chat';

export interface Chat {
  id: string;
  title: string;
  starred: boolean;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  chatId: string;
  files?: any[];
  metadata?: any;
}

export const chatService = {
  // Fetch chats WITHOUT messages for the sidebar list to be lightweight
  async getUserChats(supabase: SupabaseClient, userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    let cookieArchivedSet = new Set<string>();
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )archived_chats=([^;]*)/);
      if (match && match[1]) {
        match[1].split(',').filter(Boolean).forEach(id => cookieArchivedSet.add(id));
      }
    }

    const tempChatIds = getTemporaryChatIds();

    return data
      .filter((chat: any) => !tempChatIds.has(chat.id))
      .map((chat: any) => ({
      id: chat.id,
      title: chat.title,
      starred: chat.starred || false,
      archived: chat.archived === true || cookieArchivedSet.has(chat.id),
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
      userId: chat.user_id,
      messages: [] // Empty messages for list view
    }));
  },

  // Fetch full details (messages) for a single chat
  async getChatDetails(supabase: SupabaseClient, chatId: string): Promise<Chat | null> {
    // 1. Get Chat Metadata
    let { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (chatError) {
      // Fallback for public shared chats opened at /c/[id]
      try {
        const res = await fetch(`/api/share/${chatId}`);
        if (res.ok) {
          const sharedData = await res.json();
          return {
            id: sharedData.chat.id,
            title: sharedData.chat.title,
            starred: false,
            createdAt: sharedData.chat.createdAt,
            updatedAt: sharedData.chat.updatedAt,
            userId: '',
            messages: sharedData.messages || []
          };
        }
      } catch (e) {
        console.error('Fallback shared chat fetch failed:', e);
      }
      throw chatError;
    }

    // 2. Get Messages for this chat
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*, file_uploads(*)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return {
      id: chat.id,
      title: chat.title,
      starred: chat.starred || false,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
      userId: chat.user_id,
      messages: messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
        chatId: msg.chat_id,
        files: (msg.file_uploads && msg.file_uploads.length > 0)
          ? msg.file_uploads
          : (msg.metadata?.files || []),
        metadata: msg.metadata || null,
      }))
    };
  },

  async deleteMessage(
    supabase: SupabaseClient,
    messageId: string,
    pairedAssistantMessageId?: string,
    chatId?: string
  ) {
    const ids = [messageId];
    if (pairedAssistantMessageId) {
      ids.push(pairedAssistantMessageId);
    }

    // 1. Try server endpoint which uses supabaseAdmin with service role privileges
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/chat", {
        method: "DELETE",
        headers,
        body: JSON.stringify({
          messageId,
          pairedAssistantId: pairedAssistantMessageId,
          chatId,
        }),
      });

      if (res.ok) {
        return;
      }
    } catch (apiErr) {
      console.warn("API message delete failed, falling back to direct delete:", apiErr);
    }

    // 2. Direct client fallback
    try {
      await supabase.from("file_uploads").delete().in("message_id", ids);
    } catch (e) {}

    const { error } = await supabase
      .from("messages")
      .delete()
      .in("id", ids);

    if (error) throw error;
  },

  async deleteChat(supabase: SupabaseClient, chatId: string) {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) throw error;
  },

  async toggleChatStar(supabase: SupabaseClient, chatId: string, starred: boolean) {
    const { error } = await supabase
      .from('chats')
      .update({ starred })
      .eq('id', chatId);

    if (error) throw error;
  },

  async toggleChatArchive(supabase: SupabaseClient, chatId: string, archived: boolean) {
    // 1. Synchronize cookie state as fallback/persisted state
    if (typeof document !== 'undefined') {
      let currentIds: string[] = [];
      const match = document.cookie.match(/(?:^|; )archived_chats=([^;]*)/);
      if (match && match[1]) {
        currentIds = match[1].split(',').filter(Boolean);
      }
      const updatedSet = new Set(currentIds);
      if (archived) {
        updatedSet.add(chatId);
      } else {
        updatedSet.delete(chatId);
      }
      const cookieValue = Array.from(updatedSet).join(',');
      document.cookie = `archived_chats=${cookieValue}; path=/; max-age=31536000; SameSite=Lax`;
    }

    // 2. Try DB update if column exists in Supabase schema
    try {
      const { error } = await supabase
        .from('chats')
        .update({ archived })
        .eq('id', chatId);

      if (error && error.code !== 'PGRST204') {
        console.warn('DB archive update warning:', error.message);
      }
    } catch (e) {
      // Safely ignore PGRST204 (missing column in Supabase schema)
    }
  }
};
