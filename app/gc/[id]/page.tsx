"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Message } from "@/lib/chat-service";
import { Sidebar } from "@/components/chat/sidebar";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { LoginModal } from "@/components/modals/log-in-modal";
import { ClearChatModal } from "@/components/modals/clear-chat-modal";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { PanelRight, ArrowDown, ChevronDown, SquarePen } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarContext } from "@/components/chat/sidebar-context";
import { withChatPreferences } from "@/lib/user-preferences";
import { withCurrentHash } from "@/lib/settings-hash";
import { cn } from "@/lib/utils";
import toast from "@/lib/toast";

export default function GuestChatSessionPage() {
  const params = useParams();
  const chatId = params?.id as string;
  const router = useRouter();
  const { user, loading } = useAuth();
  const isGuest = !user;

  const {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar: handleToggleSidebar,
  } = useSidebarContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<any>(null);
  const [isSidebarBtnHovered, setIsSidebarBtnHovered] = useState(false);

  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState("Gemini 3.8 flash");
  const [selectedModelTier, setSelectedModelTier] = useState(4);
  const [thinkMode, setThinkMode] = useState(false);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalDescription, setLoginModalDescription] = useState<string | undefined>(undefined);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const handleOpenLogin = (opts?: { description?: string; title?: string } | string) => {
    const desc = typeof opts === "string" ? opts : opts?.description;
    setLoginModalDescription(desc);
    setShowLoginModal(true);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const autoSendTriggeredRef = useRef(false);
  const streamAbortControllerRef = useRef<boolean>(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isAutoScrollPinnedRef = useRef(true);

  // Handle scroll events to show/hide scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceToBottom <= 25;
    isAutoScrollPinnedRef.current = isAtBottom;
    setShowScrollBottom((prev) => (prev !== !isAtBottom ? !isAtBottom : prev));
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
      if (behavior === "auto") {
        setShowScrollBottom(false);
        isAutoScrollPinnedRef.current = true;
      }
    }
  };

  const forceScrollToBottom = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop =
      scrollContainerRef.current.scrollHeight;
    setShowScrollBottom(false);
    isAutoScrollPinnedRef.current = true;
  };

  // Recompute scroll-to-bottom visibility when dock height changes
  useEffect(() => {
    if (!dockRef.current) return;
    const ro = new ResizeObserver(() => handleScroll());
    ro.observe(dockRef.current);
    return () => ro.disconnect();
  }, []);

  // Recompute scroll-to-bottom visibility whenever content height changes
  useEffect(() => {
    if (!contentRef.current) return;
    const ro = new ResizeObserver(() => {
      handleScroll();
      if (isAutoScrollPinnedRef.current) {
        forceScrollToBottom();
      }
    });
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, []);

  // Ensure view stays pinned to bottom on messages/pendingMessage update when pinned
  useEffect(() => {
    if (isAutoScrollPinnedRef.current) {
      forceScrollToBottom();
      const t1 = setTimeout(forceScrollToBottom, 60);
      const t2 = setTimeout(forceScrollToBottom, 180);
      const t3 = setTimeout(forceScrollToBottom, 320);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [messages, pendingMessage]);

  // If authenticated user lands on guest chat, redirect to /c
  useEffect(() => {
    if (!loading && user) {
      router.replace(withCurrentHash(`/c${window.location.search}`));
    }
  }, [user, loading, router]);

  // Set document title from first message
  useEffect(() => {
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg?.content) {
      document.title = `${firstUserMsg.content.slice(0, 30)} - CloseAI`;
    } else {
      document.title = "CloseAI";
    }
  }, [messages]);

  // On mount: check for initial auto-send handoff from /gc.
  // If no handoff data exists (e.g. on page reload or direct visit), redirect back to /gc.
  useEffect(() => {
    if (!chatId || autoSendTriggeredRef.current) return;
    autoSendTriggeredRef.current = true;

    try {
      const autoSendKey = `guest_auto_send_${chatId}`;
      const autoSendData = sessionStorage.getItem(autoSendKey);
      if (autoSendData) {
        sessionStorage.removeItem(autoSendKey);
        const data = JSON.parse(autoSendData);
        if (data && data.prompt) {
          if (data.model) setSelectedModel(data.model);
          if (data.think !== undefined) setThinkMode(data.think);

          executeGuestSendMessage(
            data.prompt,
            data.files || [],
            [],
            data.model || selectedModel,
            data.think ?? thinkMode
          );
          return;
        }
      }

      // No active session handoff found (reload or direct visit) -> redirect to /gc
      router.replace("/gc");
    } catch (e) {
      console.error("Error processing guest session:", e);
      router.replace("/gc");
    }
  }, [chatId, router]);

  const handleStop = () => {
    streamAbortControllerRef.current = true;
    setIsTyping(false);
  };

  const streamAssistantResponse = async (
    userMessage: Message,
    fullAssistantMessage: Message,
    baseMessages?: Message[]
  ) => {
    streamAbortControllerRef.current = false;
    const fullText = fullAssistantMessage?.content || "";
    const assistantId = fullAssistantMessage?.id;

    // Remove optimistic pending message
    setPendingMessage(null);

    setMessages((prev) => {
      const list = baseMessages ? [...baseMessages] : [...prev];
      const filtered = list.filter(
        (m) =>
          m.id !== userMessage.id &&
          !(
            m.role === "user" &&
            m.content === userMessage.content &&
            (m.id?.startsWith("guest_u_") || m.id?.startsWith("pending-"))
          )
      );
      return [
        ...filtered,
        userMessage,
        { ...fullAssistantMessage, content: "" },
      ];
    });

    setIsTyping(true);

    const tokens = fullText.split(/(\s+)/);
    if (tokens.length === 0) {
      setIsTyping(false);
      return;
    }

    let displayed = "";
    const step = Math.max(1, Math.min(4, Math.ceil(tokens.length / 60)));
    const intervalMs = 10;

    for (let i = 0; i < tokens.length; i += step) {
      if (streamAbortControllerRef.current) {
        displayed = fullText;
        break;
      }

      displayed += tokens.slice(i, i + step).join("");
      const snapshot = displayed;

      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (copy[lastIdx] && copy[lastIdx].id === assistantId) {
          copy[lastIdx] = { ...copy[lastIdx], content: snapshot };
        }
        return copy;
      });

      if (isAutoScrollPinnedRef.current && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    // Final update with complete content (in-memory only, non-persistent)
    setMessages((prev) => {
      const copy = [...prev];
      const lastIdx = copy.length - 1;
      if (copy[lastIdx] && copy[lastIdx].id === assistantId) {
        copy[lastIdx] = { ...copy[lastIdx], content: fullText };
      }
      return copy;
    });

    setIsTyping(false);
  };

  const executeGuestSendMessage = async (
    promptText: string,
    filesToSend: any[] = [],
    history: Message[] = messages,
    modelToUse = selectedModel,
    thinkToUse = thinkMode
  ) => {
    if (!promptText.trim() && filesToSend.length === 0) return;
    setIsTyping(true);
    isAutoScrollPinnedRef.current = true;
    setShowScrollBottom(false);

    const userMsgObj: Message = {
      id: `guest_u_${Date.now()}`,
      role: "user",
      content: promptText,
      files: filesToSend.map((f: any) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.url || "",
      })),
      createdAt: new Date().toISOString(),
      chatId: chatId,
    };

    setPendingMessage({
      content: promptText,
      files: filesToSend,
      isThinkMode: thinkToUse,
    });
    setMessage("");
    setUploadedFiles([]);

    // Scroll once to show the sent message — nothing scrolls after this
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    });

    const reqStart = Date.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          withChatPreferences({
            message: promptText,
            model: modelToUse,
            think: thinkToUse,
            files: filesToSend.map((f: any) => ({
              name: f.name,
              size: f.size,
              type: f.type,
              url: f.url,
            })),
            previousMessages: history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          })
        ),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate response");
      }

      const data = await res.json();
      const actualElapsedSecs = Math.max(
        1,
        Math.round((Date.now() - reqStart) / 1000)
      );

      if (data.assistantMessage) {
        const newAssistantMsg: Message = {
          id: data.assistantMessage.id || `guest_a_${Date.now()}`,
          role: "assistant",
          content: data.assistantMessage.content,
          createdAt: new Date().toISOString(),
          chatId: chatId,
          metadata: {
            model: modelToUse,
            think: thinkToUse,
            thinkTime: actualElapsedSecs,
            reasoning_content: data.assistantMessage.reasoning_content,
          },
        };

        await streamAssistantResponse(userMsgObj, newAssistantMsg, history);
      }
    } catch (err: any) {
      console.error("Guest chat error:", err);
      toast.error(err.message || "Failed to send message");
      setMessage(promptText);
      setIsTyping(false);
      setPendingMessage(null);
    }
  };

  const handleEditAndResend = async (
    messageId: string,
    newContent: string,
    messageIndex: number
  ) => {
    if (!newContent.trim() || isTyping) return;
    streamAbortControllerRef.current = true;
    const remainingMessages = messages.slice(0, messageIndex);
    setMessages(remainingMessages);
    executeGuestSendMessage(
      newContent,
      [],
      remainingMessages,
      selectedModel,
      thinkMode
    );
  };

  const handleRegenerate = async (
    assistantMsg?: Message,
    assistantIndex?: number
  ) => {
    if (isTyping) return;
    let targetIdx =
      typeof assistantIndex === "number" ? assistantIndex : messages.length - 1;

    let userMsgIdx = -1;
    for (let i = targetIdx - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userMsgIdx = i;
        break;
      }
    }

    if (userMsgIdx === -1) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          userMsgIdx = i;
          break;
        }
      }
    }

    if (userMsgIdx === -1) {
      toast.error("No prompt found to regenerate.");
      return;
    }

    const userMsg = messages[userMsgIdx];
    await handleEditAndResend(userMsg.id, userMsg.content, userMsgIdx);
  };

  const handleDeleteMessage = (messageId: string, messageIndex: number) => {
    if (isTyping) return;
    let actualIndex = messages.findIndex((m) => m.id === messageId);
    if (
      actualIndex === -1 &&
      typeof messageIndex === "number" &&
      messages[messageIndex]
    ) {
      actualIndex = messageIndex;
    }
    const targetMsg = actualIndex !== -1 ? messages[actualIndex] : null;
    if (!targetMsg) return;

    let pairedAssistantId: string | undefined = undefined;
    if (
      targetMsg.role === "user" &&
      actualIndex + 1 < messages.length &&
      messages[actualIndex + 1]?.role === "assistant"
    ) {
      pairedAssistantId = messages[actualIndex + 1].id;
    }

    const idsToRemove = new Set([targetMsg.id]);
    if (pairedAssistantId) {
      idsToRemove.add(pairedAssistantId);
    }
    const remaining = messages.filter((m) => !idsToRemove.has(m.id));
    setMessages(remaining);

    toast.success("Message deleted");
    if (remaining.length === 0) {
      router.push("/gc");
    }
  };

  const handleSend = (customPrompt?: string | React.FormEvent) => {
    if (customPrompt && typeof customPrompt !== "string") {
      customPrompt.preventDefault();
    }
    const promptToSend =
      typeof customPrompt === "string" ? customPrompt : message;
    if (!promptToSend.trim() && uploadedFiles.length === 0) return;
    executeGuestSendMessage(promptToSend, uploadedFiles, messages);
  };

  const handleNewChat = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setSidebarOpen(false);
    }
    if (messages.length > 0 || isTyping) {
      setShowClearChatModal(true);
      return;
    }
    router.push("/gc");
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imageFiles.length === 0) {
      toast.error("Please select image files only");
      return;
    }
    setIsUploading(true);
    try {
      const uploaded: any[] = [];
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          const customFile = Object.assign(file, { url: data.url });
          uploaded.push(customFile);
        }
      }
      setUploadedFiles((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error("Photo upload error:", err);
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  if (!loading && user) {
    return (
      <div className="flex h-full w-full bg-background text-foreground overflow-hidden" />
    );
  }

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden">
      <title>CloseAI</title>
      {/* Sidebar (Guest mode) */}
      <Sidebar
        user={null}
        chats={[]}
        currentChatId={chatId}
        onChatSelect={() => {}}
        onNewChat={handleNewChat}
        onDeleteChat={() => {}}
        onToggleStar={() => {}}
        onToggleArchive={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        isLoading={false}
        onOpenLoginModal={handleOpenLogin}
        onOpenWebSearchModal={() => handleOpenLogin({ description: "To continue with Web search" })}
        onOpenAdvancedFeaturesModal={handleOpenLogin}
        onWebSearchHover={() => setModelDropdownOpen(false)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden selection:bg-secondary selection:text-foreground">
        {/* Transparent Floating Header with Unified 28px Alignment */}
        <header className="absolute top-0 left-0 right-0 z-30 max-xl:pt-[max(env(safe-area-inset-top),0.75rem)] max-xl:pb-3 max-xl:h-auto xl:h-14 xl:pt-[env(safe-area-inset-top,0px)] px-3 max-xl:px-3 xl:px-4 flex items-center justify-between select-none pointer-events-none bg-transparent">
          {/* Top gradient overlay */}
          <div className="absolute top-0 left-0 right-4 sm:right-5 h-20 pointer-events-none bg-gradient-to-b from-background via-background to-transparent -z-10" />

          {/* Left area */}
          <div className="flex items-center gap-2 pointer-events-auto max-xl:h-12">
            {!sidebarOpen && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSidebarBtnHovered(false);
                        handleToggleSidebar();
                      }}
                      onMouseEnter={() => setIsSidebarBtnHovered(true)}
                      onMouseLeave={() => setIsSidebarBtnHovered(false)}
                      onBlur={() => setIsSidebarBtnHovered(false)}
                      className="xl:hidden w-12 h-12 rounded-full bg-white hover:bg-secondary dark:bg-[#2f2f2f] dark:hover:bg-[#383838] border border-border/80 dark:border-none text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none shrink-0 active:scale-[0.98]"
                      aria-label="Open sidebar"
                    >
                      <PanelRight className="w-5 h-5 shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="text-md"
                  >
                    Open sidebar
                  </TooltipContent>
                </Tooltip>

                {/* New chat button for small screen devices */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleNewChat}
                      className="sm:hidden w-12 h-12 rounded-full bg-white hover:bg-secondary dark:bg-[#2f2f2f] dark:hover:bg-[#383838] border border-border/80 dark:border-none text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none shrink-0 active:scale-[0.98]"
                      aria-label="New chat"
                    >
                      <SquarePen className="w-5 h-5 shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="text-md"
                  >
                    New chat
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Desktop Only: CloseAI with AnimatedChevron and Popover */}
            <div className="group hidden xl:block -ml-2">
              <Popover
                open={modelDropdownOpen}
                onOpenChange={setModelDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-11 flex items-center gap-1.5 px-3 rounded-sm hover:bg-secondary text-foreground text-xl font-semibold transition-colors cursor-pointer data-[state=open]:bg-secondary"
                  >
                    <span className="leading-none">CloseAI</span>
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={5}
                  animate={false}
                  className="w-[350px] p-0 rounded-2xl bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none overflow-hidden text-left z-50 transition-none animate-none duration-0 !transition-none !animate-none"
                >
                  <div className="h-32 w-full relative overflow-hidden bg-gradient-to-br from-[#9eb1ff] via-[#b6c7ff] to-[#cfe2fe]">
                    <img
                      src="https://api.dicebear.com/10.x/glass/svg?tags=animation&seed=Try%20advanced%20features%20for%20free"
                      alt="Try advanced features for free"
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="text-[15.5px] font-semibold text-foreground dark:text-white tracking-tight leading-snug">
                      Try advanced features for free
                    </h4>
                    <p className="text-[13px] text-muted-foreground dark:text-neutral-300 mt-1.5 leading-relaxed">
                      Get smarter responses, upload files, create images, and
                      more by logging in.
                    </p>
                    <div className="flex items-center gap-2.5 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setModelDropdownOpen(false);
                          handleOpenLogin();
                        }}
                        className="h-11 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 text-base font-medium transition-colors cursor-pointer flex items-center justify-center text-center leading-none"
                      >
                        Log in
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModelDropdownOpen(false);
                          handleOpenLogin();
                        }}
                        className="h-11 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#383838] dark:hover:bg-[#424242] dark:text-white text-base font-normal transition-colors cursor-pointer flex items-center justify-center text-center leading-none"
                      >
                        Sign up for free
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Centered CloseAI title without animated open on small and medium screens */}
          <div className="xl:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 flex items-center justify-center pointer-events-auto">
            <span className="text-xl font-bold tracking-tight text-foreground select-none leading-none">
              CloseAI
            </span>
          </div>

          {/* Right area */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => handleOpenLogin()}
              className="h-11 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.98] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 text-[15px] font-semibold transition-all cursor-pointer flex items-center justify-center text-center leading-none shrink-0 select-none"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => handleOpenLogin()}
              className="hidden xl:flex h-11 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white text-base font-normal transition-colors cursor-pointer items-center justify-center text-center leading-none"
            >
              Sign up for free
            </button>
          </div>
        </header>

        {/* Full-Height Scrollable Message Stream — scrollbar runs full height without heading strip */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 w-full overflow-x-hidden relative flex flex-col max-xl:pt-[4.75rem] xl:pt-14 overflow-y-scroll overscroll-y-contain [scrollbar-gutter:stable]"
        >
          <div className="flex-1 flex flex-col min-h-full">
            <div ref={contentRef} className="flex-1 pb-4 sm:pb-6">
              <MessageList
                messages={messages}
                user={null}
                isTyping={isTyping}
                isGuest={true}
                autoScroll={false}
                pendingMessage={pendingMessage}
                onRegenerate={handleRegenerate}
                onSendMessage={handleSend}
                onEditAndResend={handleEditAndResend}
                onDeleteMessage={handleDeleteMessage}
              />
            </div>

            {/* Sticky input dock at bottom */}
            <div
              ref={dockRef}
              className="sticky bottom-0 inset-x-0 z-20 pointer-events-none pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] bg-gradient-to-t from-background via-background/80 to-transparent pt-4 mt-auto"
            >
              <div className="pointer-events-auto">
                <ChatInput
                  message={message}
                  onMessageChange={setMessage}
                  onSend={handleSend}
                  onStop={handleStop}
                  uploadedFiles={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  isTyping={isTyping}
                  isUploading={isUploading}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  selectedTier={selectedModelTier}
                  onTierChange={setSelectedModelTier}
                  thinkMode={thinkMode}
                  onThinkModeChange={setThinkMode}
                  isGuest={true}
                  onOpenLoginModal={handleOpenLogin}
                  onOpenWebSearchModal={() => handleOpenLogin({ description: "To continue with Web search" })}
                  onOpenAdvancedFeaturesModal={handleOpenLogin}
                  centered={false}
                  showDisclaimer={true}
                >
                  {/* Dynamic Floating Scroll-to-Bottom Button — stays right above input pill */}
                  <AnimatePresence>
                    {showScrollBottom && (
                      <div className="absolute bottom-full mb-3 inset-x-0 flex justify-center pointer-events-none z-30">
                        <div className="pointer-events-auto">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => {
                                  isAutoScrollPinnedRef.current = true;
                                  scrollToBottom("smooth");
                                }}
                                className={cn(
                                  "group w-11 h-11 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer",
                                  isGuest
                                    ? " bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none"
                                    : "bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none"
                                )}
                                aria-label="Scroll to bottom"
                              >
                                <ArrowDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              sideOffset={8}
                              className="text-md"
                            >
                              Scroll to bottom
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </ChatInput>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Photo Picker */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={(open) => {
          setShowLoginModal(open);
          if (!open) setLoginModalDescription(undefined);
        }}
        description={loginModalDescription}
      />

      {/* Clear Chat Confirmation Modal */}
      <ClearChatModal
        open={showClearChatModal}
        onOpenChange={setShowClearChatModal}
        onNewChat={() => {
          setShowClearChatModal(false);
          router.push("/gc");
        }}
        onOpenLogin={(opts) => {
          setShowClearChatModal(false);
          handleOpenLogin(opts?.description || "To continue with Saved chats");
        }}
        onOpenSignup={(opts) => {
          setShowClearChatModal(false);
          handleOpenLogin(opts?.description || "To continue with Saved chats");
        }}
      />
    </div>
  );
}
