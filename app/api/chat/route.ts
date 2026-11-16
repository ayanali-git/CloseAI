import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthUser, supabaseAdmin } from '@/lib/supabase-server';
import { aiService } from '@/lib/ai-service';
import { subscriptionService } from '@/lib/subscription-service';

export async function POST(request: NextRequest) {
    try {
        const { user, error: authError } = await getServerAuthUser(request);

        const { message, chatId, files, truncateMessageId, model, think, previousMessages: clientPreviousMessages, assistantContext } = await request.json();
        const userContext = typeof assistantContext === 'string'
            ? assistantContext.trim().slice(0, 4000)
            : undefined;

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Support guest / unauthorized chatting without Supabase database persistence
        if (!user) {
            const aiMessages = [
                ...(Array.isArray(clientPreviousMessages) ? clientPreviousMessages : []).map((m: any) => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content || '',
                })),
                { role: 'user' as const, content: message },
            ];

            const imageUrls = files
                ?.filter((f: any) => f.type?.startsWith('image/'))
                ?.map((f: any) => f.url) || [];

            let aiResponse;
            const chosenModel = model || "Gemini 3.8 flash";
            try {
                aiResponse = await aiService.generateResponse(aiMessages, undefined, imageUrls, chosenModel, !!think, userContext);
            } catch (aiError: any) {
                console.error('Guest AI generation error:', aiError);
                aiResponse = {
                    content: `I encountered an issue while generating a response: ${aiError.message || 'Unknown error'}. Please try again.`,
                };
            }

            const guestTimestamp = new Date().toISOString();
            return NextResponse.json({
                chatId: 'guest',
                userMessage: {
                    id: `guest_u_${Date.now()}`,
                    role: 'user',
                    content: message,
                    createdAt: guestTimestamp,
                    chatId: 'guest',
                    files: files || [],
                },
                assistantMessage: {
                    id: `guest_a_${Date.now()}`,
                    role: 'assistant',
                    content: aiResponse.content,
                    createdAt: guestTimestamp,
                    chatId: 'guest',
                    model: chosenModel,
                    metadata: { model: chosenModel, think: !!think },
                },
            });
        }

        // Check usage limits for authenticated user
        const usageCheck = await subscriptionService.checkUsageLimit(user.id, 'messages');
        if (!usageCheck.allowed) {
            return NextResponse.json({
                error: 'Daily message limit reached',
                code: 'LIMIT_EXCEEDED',
                limit: usageCheck.limit,
                remaining: usageCheck.remaining,
                upgradeUrl: '/product/plans',
            }, { status: 429 });
        }

        let currentChatId = chatId;
        let chatTitle = message.trim().replace(/\s+/g, ' ');

        // If no chatId, create a new chat
        if (!currentChatId) {
            const { data: newChat, error: chatError } = await supabaseAdmin
                .from('chats')
                .insert({
                    user_id: user.id,
                    title: chatTitle,
                    starred: false,
                })
                .select()
                .single();

            if (chatError) {
                console.error('Error creating chat:', chatError);
                return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
            }

            currentChatId = newChat.id;
        }

        // If editing/regenerating from a specific message, delete that message and subsequent messages
        if (truncateMessageId) {
            try {
                const { data: targetMsg } = await supabaseAdmin
                    .from('messages')
                    .select('created_at')
                    .eq('id', truncateMessageId)
                    .single();

                if (targetMsg?.created_at) {
                    await supabaseAdmin
                        .from('messages')
                        .delete()
                        .eq('chat_id', currentChatId)
                        .gte('created_at', targetMsg.created_at);
                }
            } catch (truncError) {
                console.error('Error truncating messages for edit:', truncError);
            }
        }

        // Get previous messages for context
        const { data: previousMessages, error: msgError } = await supabaseAdmin
            .from('messages')
            .select('role, content')
            .eq('chat_id', currentChatId)
            .order('created_at', { ascending: true });

        if (msgError) {
            console.error('Error fetching messages:', msgError);
        }

        // Create user message in database
        const { data: userMessage, error: userMsgError } = await supabaseAdmin
            .from('messages')
            .insert({
                chat_id: currentChatId,
                role: 'user',
                content: message,
                metadata: files && files.length > 0 ? { files } : null,
            })
            .select()
            .single();

        if (userMsgError) {
            console.error('Error saving user message:', userMsgError);
            return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
        }

        // Prepare messages for AI
        const aiMessages = [
            ...(previousMessages || []).map((msg: any) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
            { role: 'user' as const, content: message },
        ];

        // Extract image URLs from files if any
        const imageUrls = files
            ?.filter((f: any) => f.type?.startsWith('image/'))
            ?.map((f: any) => f.url) || [];

        // Generate AI response
        const genStartTime = Date.now();
        let aiResponse;
        try {
            aiResponse = await aiService.generateResponse(aiMessages, undefined, imageUrls, model || "Gemini 3.8 flash", !!think, userContext);
        } catch (aiError: any) {
            console.error('AI generation error:', aiError);
            aiResponse = {
                content: `I encountered an issue while generating a response: ${aiError.message || 'Unknown error'}. Please try again.`,
            };
        }

        // Save assistant message with dynamic think metadata
        const actualGenSeconds = Math.max(1, Math.round((Date.now() - genStartTime) / 1000));
        const thinkTime = think ? actualGenSeconds : undefined;
        const assistantMetadata: Record<string, any> = {
            model: model || "Gemini 3.8 flash",
            think: !!think,
        };
        if (thinkTime) {
            assistantMetadata.thinkTime = thinkTime;
        }

        const { data: assistantMessage, error: assistantMsgError } = await supabaseAdmin
            .from('messages')
            .insert({
                chat_id: currentChatId,
                role: 'assistant',
                content: aiResponse.content,
                metadata: assistantMetadata,
            })
            .select()
            .single();

        if (assistantMsgError) {
            console.error('Error saving assistant message:', assistantMsgError);
            return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
        }

        // Update chat's updated_at
        await supabaseAdmin
            .from('chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', currentChatId);

        return NextResponse.json({
            chatId: currentChatId,
            userMessage: {
                id: userMessage.id,
                role: 'user',
                content: message,
                createdAt: userMessage.created_at,
                chatId: currentChatId,
                files: files || [],
            },
            assistantMessage: {
                id: assistantMessage.id,
                role: 'assistant',
                content: aiResponse.content,
                createdAt: assistantMessage.created_at,
                chatId: currentChatId,
                model: model || "Gemini 3.8 flash",
                metadata: assistantMetadata,
            },
        });

    } catch (error: any) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { user, error: authError } = await getServerAuthUser(request);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId, pairedAssistantId, chatId } = await request.json();

        if (!messageId) {
            return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
        }

        // Verify chat ownership if chatId provided
        if (chatId) {
            const { data: chat, error: chatError } = await supabaseAdmin
                .from('chats')
                .select('id')
                .eq('id', chatId)
                .eq('user_id', user.id)
                .single();

            if (chatError || !chat) {
                return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
            }
        } else {
            // Verify message ownership through chat
            const { data: msg } = await supabaseAdmin
                .from('messages')
                .select('chat_id')
                .eq('id', messageId)
                .single();

            if (msg) {
                const { data: chat } = await supabaseAdmin
                    .from('chats')
                    .select('id')
                    .eq('id', msg.chat_id)
                    .eq('user_id', user.id)
                    .single();

                if (!chat) {
                    return NextResponse.json({ error: 'Unauthorized to delete this message' }, { status: 403 });
                }
            }
        }

        const ids = [messageId];
        if (pairedAssistantId) {
            ids.push(pairedAssistantId);
        }

        // Delete associated file uploads
        try {
            await supabaseAdmin
                .from('file_uploads')
                .delete()
                .in('message_id', ids);
        } catch (fileErr) {
            console.warn('Error deleting message files:', fileErr);
        }

        // Delete message(s)
        const { error: delError } = await supabaseAdmin
            .from('messages')
            .delete()
            .in('id', ids);

        if (delError) {
            console.error('Error deleting messages:', delError);
            return NextResponse.json({ error: delError.message || 'Failed to delete message' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete message error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
