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

        // Support guest / unauthorized chatting with Supabase database persistence using static guest chatId
        if (!user) {
            const guestChatId = process.env.GC_ID;
            const currentChatId = chatId || guestChatId;

            // Ensure guest chat row exists in database
            const { data: existingChat } = await supabaseAdmin
                .from('chats')
                .select('id')
                .eq('id', currentChatId)
                .single();

            if (!existingChat) {
                const { data: anyProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .limit(1)
                    .single();

                await supabaseAdmin
                    .from('chats')
                    .upsert({
                        id: currentChatId,
                        user_id: anyProfile ? anyProfile.id : null,
                        title: 'Guest Chat',
                        starred: false,
                    });
            }

            // Truncate messages if editing / regenerating from a specific point
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
                    console.error('Error truncating guest messages for edit:', truncError);
                }
            }

            // Get previous messages from DB for context
            const { data: previousMessages } = await supabaseAdmin
                .from('messages')
                .select('role, content')
                .eq('chat_id', currentChatId)
                .order('created_at', { ascending: true });

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
                console.error('Error saving guest user message:', userMsgError);
            }

            // Prepare messages for AI
            const historyToUse = previousMessages && previousMessages.length > 0
                ? previousMessages
                : (Array.isArray(clientPreviousMessages) ? clientPreviousMessages : []);

            const aiMessages = [
                ...historyToUse.map((m: any) => ({
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
            const genStartTime = Date.now();
            try {
                aiResponse = await aiService.generateResponse(aiMessages, undefined, imageUrls, chosenModel, !!think, userContext);
            } catch (aiError: any) {
                console.error('Guest AI generation error:', aiError);
                aiResponse = {
                    content: `I encountered an issue while generating a response: ${aiError.message || 'Unknown error'}. Please try again.`,
                };
            }

            const actualGenSeconds = Math.max(1, Math.round((Date.now() - genStartTime) / 1000));
            const assistantMetadata: Record<string, any> = {
                model: chosenModel,
                think: !!think,
            };
            if (think) {
                assistantMetadata.thinkTime = actualGenSeconds;
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
                console.error('Error saving guest assistant message:', assistantMsgError);
            }

            // Update chat's updated_at
            await supabaseAdmin
                .from('chats')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', currentChatId);

            const guestTimestamp = new Date().toISOString();
            return NextResponse.json({
                chatId: currentChatId,
                userMessage: {
                    id: userMessage?.id || `guest_u_${Date.now()}`,
                    role: 'user',
                    content: message,
                    createdAt: userMessage?.created_at || guestTimestamp,
                    chatId: currentChatId,
                    files: files || [],
                },
                assistantMessage: {
                    id: assistantMessage?.id || `guest_a_${Date.now()}`,
                    role: 'assistant',
                    content: aiResponse.content,
                    createdAt: assistantMessage?.created_at || guestTimestamp,
                    chatId: currentChatId,
                    model: chosenModel,
                    metadata: assistantMetadata,
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
        const { messageId, pairedAssistantId, chatId } = await request.json();

        if (!messageId) {
            return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
        }

        const guestChatId = process.env.GC_ID;
        const isGuestRequest = !user && (chatId === guestChatId || !chatId);

        if (!isGuestRequest && (authError || !user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify chat ownership if chatId provided
        if (isGuestRequest) {
            if (chatId && chatId !== guestChatId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        } else if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        } else if (chatId) {
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
