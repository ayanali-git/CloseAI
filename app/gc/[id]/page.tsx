"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Message } from "@/lib/chat-service";
import { Sidebar } from "@/components/chat/sidebar";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { LoginModal } from "@/components/modals/log-in-modal";
import { NewChatModal } from "@/components/modals/new-chat-modal";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { PanelRight, ArrowDown, ChevronDown, SquarePen, Loader } from "lucide-react";
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
  const [isChatLoading, setIsChatLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<any>(null);
  const [isSidebarBtnHovered, setIsSidebarBtnHovered] = useState(false);

  const [newChatKey, setNewChatKey] = useState(0);
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState("Gemini 3.8 flash");
  const [selectedModelTier, setSelectedModelTier] = useState(4);
  const [thinkMode, setThinkMode] = useState(false);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalDescription, setLoginModalDescription] = useState<string | undefined>(undefined);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const prevSidebarOpenForLoginRef = useRef<boolean | null>(null);
  const prevSidebarOpenForClearRef = useRef<boolean | null>(null);

  useEffect(() => {
    setIsMobileScreen(window.innerWidth < 1280);
    const handleResize = () => setIsMobileScreen(window.innerWidth < 1280);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleOpenLogin = (opts?: { description?: string; title?: string } | string) => {
    const desc = typeof opts === "string" ? opts : opts?.description;
    setLoginModalDescription(desc);
    prevSidebarOpenForLoginRef.current = sidebarOpen;
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
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

  const targetGcId = process.env.GC_ID;

  // If chatId in URL doesn't match the static GC_ID, normalize it
  useEffect(() => {
    if (chatId && chatId !== targetGcId) {
      router.replace(`/gc/${targetGcId}`);
    }
  }, [chatId, targetGcId, router]);

  // Load messages from Supabase DB on mount
  useEffect(() => {
    if (!chatId) {
      setIsChatLoading(false);
      return;
    }

    let isMounted = true;
    const loadGuestChatMessages = async () => {
      setIsChatLoading(true);
      try {
        const res = await fetch(`/api/guest-chat?chatId=${chatId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error("Error loading guest chat from DB:", err);
      } finally {
        if (isMounted) {
          setIsChatLoading(false);
        }
      }
    };

    loadGuestChatMessages();

    return () => {
      isMounted = false;
    };
  }, [chatId]);

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
    thinkToUse = thinkMode,
    truncateMessageId?: string
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
            chatId: chatId,
            truncateMessageId,
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

      if (data.userMessage?.id) {
        userMsgObj.id = data.userMessage.id;
      }

      if (data.assistantMessage) {
        const newAssistantMsg: Message = {
          id: data.assistantMessage.id || `guest_a_${Date.now()}`,
          role: "assistant",
          content: data.assistantMessage.content,
          createdAt: data.assistantMessage.createdAt || new Date().toISOString(),
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
      thinkMode,
      messageId
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

  const handleDeleteMessage = async (messageId: string, messageIndex: number) => {
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

    try {
      await fetch("/api/chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          pairedAssistantId,
          chatId,
        }),
      });
    } catch (e) {
      console.error("Error deleting guest message:", e);
    }

    toast.success("Message deleted");
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
    if (messages.length > 0 || isTyping) {
      prevSidebarOpenForClearRef.current = sidebarOpen;
      if (sidebarOpen) {
        setSidebarOpen(false);
      }
      setShowNewChatModal(true);
      return;
    }
    setMessage("");
    setUploadedFiles([]);
    setNewChatKey((k) => k + 1);
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setSidebarOpen(false);
    }
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
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden selection:bg-secondary selection:text-foreground">
        {/* Transparent Floating Header - Buttons float cleanly on top, matching c/[id] and sc/[id] */}
        <header className="absolute top-0 left-0 right-0 z-30 h-14 pt-[env(safe-area-inset-top,0px)] px-2 xl:px-5 flex items-center justify-between select-none pointer-events-none bg-transparent">
          <div className="absolute top-0 left-0 right-4 sm:right-5 h-20 pointer-events-none -z-10" />

          {/* Left area */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                setIsSidebarBtnHovered(false);
                handleToggleSidebar();
              }}
              className={cn(
                "xl:hidden w-11 h-11 rounded-full text-muted-foreground hover:text-foreground border border-border/80 dark:border-white/10 flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none shrink-0",
                user
                  ? "bg-background hover:bg-secondary active:bg-secondary"
                  : "bg-white dark:bg-[#303030] hover:bg-secondary dark:hover:bg-[#404040] active:bg-secondary dark:active:bg-[#404040]"
              )}
              aria-label="Open sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-6 h-6 shrink-0"
                aria-hidden="true"
              >
                <path d="M11.666 12.669a.665.665 0 0 1 0 1.33H3.333a.665.665 0 0 1 0-1.33zM16.666 6.002a.665.665 0 0 1 0 1.33H3.333a.665.665 0 0 1 0-1.33z" />
              </svg>
            </button>

            {/* New chat button — small screen devices only */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className={cn(
                    "xl:hidden group w-11 h-11 rounded-full text-muted-foreground hover:text-foreground border border-border/80 dark:border-white/10 flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none shrink-0",
                    user
                      ? "bg-background hover:bg-secondary active:bg-secondary"
                      : "bg-white dark:bg-[#303030] hover:bg-secondary dark:hover:bg-[#404040] active:bg-secondary dark:active:bg-[#404040]"
                  )}
                  aria-label="New chat"
                >
                  <SquarePen className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={5}
                className="text-base"
              >
                New chat
              </TooltipContent>
            </Tooltip>

            {/* CloseAI with ChevronDown and Popover — small screen devices only (xl:hidden) */}
            {/* <div className="xl:hidden group -ml-1">
              <Popover
                open={modelDropdownOpen}
                onOpenChange={setModelDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-11 px-2 sm:px-4 flex items-center gap-1.5 rounded-sm hover:bg-secondary text-foreground text-2xl font-medium tracking-tight transition-colors cursor-pointer data-[state=open]:bg-secondary"
                  >
                    <span className="leading-none">CloseAI</span>
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align={'start'}
                  sideOffset={isMobileScreen ? 6 : 5}
                  collisionPadding={isMobileScreen ? 16 : 8}
                  animate={false}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  className={cn(
                    "p-0 rounded-sm bg-white dark:bg-[#303030] border border-border/80 dark:border-none overflow-hidden text-left z-50 transition-none animate-none duration-0 !transition-none !animate-none outline-none focus:outline-none focus:ring-0",
                    isMobileScreen ? "w-[calc(100vw-2rem)] max-w-[350px]" : "w-[350px]"
                  )}
                >
                  <div className="hidden xl:block h-32 w-full relative overflow-hidden bg-gradient-to-br from-[#9eb1ff] via-[#b6c7ff] to-[#cfe2fe]">
                    <img
                      src="https://api.dicebear.com/10.x/glass/svg?seed=Try%20advanced%20features%20for%20free"
                      alt="Try advanced features for free"
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="text-[15.5px] font-semibold text-foreground dark:text-white tracking-tight leading-snug">
                      Try advanced features for free
                    </h4>
                    <p className="text-[13px] text-muted-foreground dark:text-neutral-300 mt-1.5 leading-relaxed">
                      Get efficient responses, upload files, plus thinking capabilities, upload files, and more by logging in.
                    </p>
                    <div className="flex items-center gap-2.5 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setModelDropdownOpen(false);
                          handleOpenLogin();
                        }}
                        className="h-11 px-4 rounded-full bg-black hover:bg-neutral-800 text-white border border-transparent dark:bg-white dark:text-black dark:border-none hover:opacity-90 active:opacity-60 text-base font-medium transition-colors cursor-pointer flex items-center justify-center text-center leading-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background select-none"
                      >
                        Log in
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModelDropdownOpen(false);
                          handleOpenLogin();
                        }}
                        className="h-11 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#303030] dark:hover:bg-[#404040] dark:text-white text-base font-normal transition-colors cursor-pointer flex items-center justify-center text-center leading-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background select-none"
                      >
                        Sign up for free
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div> */}
          </div>

          {/* Center Brand Text — small screen devices only */}
          {/* <div className="xl:hidden absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto">
            <span className="font-medium text-2xl tracking-tight text-foreground select-none">
              CloseAI
            </span>
          </div> */}

          {/* Right area */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => handleOpenLogin()}
              className="h-11 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#303030] dark:hover:bg-[#404040] dark:text-white text-base font-normal transition-colors cursor-pointer items-center justify-center text-center leading-none outline-none focus:outline-none focus-visible:outline-none xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
            >
              Sign up for free
            </button>
            
            <button
              type="button"
              onClick={() => handleOpenLogin()}
              className="h-11 px-4 rounded-full bg-black hover:bg-neutral-800 text-white border border-transparent dark:bg-white dark:text-black dark:border-none hover:opacity-90 active:opacity-60 text-[15px] font-semibold transition-all cursor-pointer flex items-center justify-center text-center leading-none shrink-0 select-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
            >
              Log in
            </button>
          </div>
        </header>

        {/* Messages Container or Loader */}
        {isChatLoading ? (
          <div className="flex-1 w-full h-full flex flex-col items-center justify-center pb-16 text-muted-foreground">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 && !pendingMessage && !isTyping ? (
          <div className="flex-1 flex flex-col justify-center overflow-y-auto px-2 sm:px-4 pb-2 no-overscroll pt-14">
            <WelcomeScreen
              user={null}
              resetKey={newChatKey}
              maxWidthClass="max-w-[820px]"
              onPromptSelect={(prompt) => {
                handleSend(prompt);
              }}
            >
              <div className="w-full flex flex-col items-center gap-6">
                <ChatInput
                  className="max-w-[820px]"
                  isWelcomeScreen={true}
                  message={message}
                  onMessageChange={setMessage}
                  onSend={handleSend}
                  uploadedFiles={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  isTyping={false}
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
                  showDisclaimer={false}
                />

                {/* Suggestion pill — only visible when input is empty */}
                <div className="w-full flex justify-center h-11">
                  {message.trim().length === 0 && uploadedFiles.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSend("What can you do?");
                      }}
                      className="h-11 px-4 rounded-full text-base sm:text-[14.5px] transition-colors outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ring-0 border border-border/80 dark:border-none select-none cursor-pointer bg-white hover:bg-secondary text-muted-foreground dark:bg-[#303030] dark:hover:bg-[#404040]"
                    >
                      What can you do?
                    </button>
                  )}
                </div>
              </div>
            </WelcomeScreen>
          </div>
        ) : (
          /* Full-Height Scrollable Message Stream — smooth scrolling with native OS scrollbar */
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 w-full overflow-x-hidden relative flex flex-col overflow-y-auto overscroll-y-contain"
          >
            <div className="flex-1 flex flex-col min-h-full pt-14">
              <div ref={contentRef} className="flex-1 pb-4 sm:pb-6">
                <MessageList
                  messages={messages}
                  user={null}
                  chatId={chatId}
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
                                    "group w-11 h-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-all cursor-pointer",
                                    isGuest
                                      ? "bg-white dark:bg-[#303030] dark:hover:bg-[#404040] border border-border/80 dark:border-white/10"
                                      : "bg-white dark:bg-[#101010] dark:hover:bg-[#202020] border border-border/80"
                                  )}
                                  aria-label="Scroll to bottom"
                                >
                                  <ArrowDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                sideOffset={5}
                                className="text-base"
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
        )}

        {/* Bottom Disclaimer for Empty State */}
        {!isChatLoading && messages.length === 0 && !pendingMessage && !isTyping && (
          <div className="absolute bottom-0 left-0 right-0 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 select-none pointer-events-none z-20 flex items-center justify-center text-center">
            <p className="pointer-events-auto max-w-4xl mx-auto text-xs sm:text-sm text-muted-foreground font-normal tracking-tight leading-tight select-none whitespace-normal sm:whitespace-nowrap">
              CloseAI is AI. By using it, you agree to our{" "}
              <Link
                href="/support/terms"
                className="text-foreground hover:opacity-90 active:opacity-60 transition-opacity whitespace-nowrap"
              >
                <span>Terms</span>
              </Link>{" "}
              and{" "}
              <Link
                href="/support/privacy"
                className="text-foreground hover:opacity-90 active:opacity-60 transition-opacity whitespace-nowrap"
              >
                <span>Privacy</span>
              </Link>
              . Chats may be reviewed and used to improve AI models.{" "}
              <Link
                href="/support/help"
                className="text-foreground hover:opacity-90 active:opacity-60 transition-opacity whitespace-nowrap"
              >
                <span>Learn more</span>
              </Link>
            </p>
          </div>
        )}
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
          if (!open) {
            setLoginModalDescription(undefined);
            if (prevSidebarOpenForLoginRef.current === true) {
              requestAnimationFrame(() => {
                setSidebarOpen(true);
              });
            }
            prevSidebarOpenForLoginRef.current = null;
          }
        }}
        description={loginModalDescription}
      />

      {/* New Chat Confirmation Modal */}
      <NewChatModal
        open={showNewChatModal}
        onOpenChange={(open) => {
          setShowNewChatModal(open);
          if (!open) {
            if (prevSidebarOpenForClearRef.current === true) {
              requestAnimationFrame(() => {
                setSidebarOpen(true);
              });
            }
            prevSidebarOpenForClearRef.current = null;
          }
        }}
        onNewChat={async () => {
          prevSidebarOpenForClearRef.current = null;
          setShowNewChatModal(false);
          setMessages([]);
          setIsChatLoading(false);
          setMessage("");
          setUploadedFiles([]);
          setNewChatKey((k) => k + 1);
          try {
            await fetch("/api/guest-chat", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId }),
            });
          } catch (e) {
            console.error("Error clearing guest chat:", e);
          }
        }}
        onOpenLogin={(opts) => {
          const wasOpen = prevSidebarOpenForClearRef.current;
          prevSidebarOpenForClearRef.current = null;
          setShowNewChatModal(false);
          if (wasOpen) {
            prevSidebarOpenForLoginRef.current = true;
          }
          handleOpenLogin(opts?.description || "To continue with Saved chats");
        }}
        onOpenSignup={(opts) => {
          const wasOpen = prevSidebarOpenForClearRef.current;
          prevSidebarOpenForClearRef.current = null;
          setShowNewChatModal(false);
          if (wasOpen) {
            prevSidebarOpenForLoginRef.current = true;
          }
          handleOpenLogin(opts?.description || "To continue with Saved chats");
        }}
      />
    </div>
  );
}
