"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageList } from "@/components/chat/message-list";
import TocNavigator, { getTargetElement } from "@/components/chat/toc-navigator";
import { ChatInput } from "@/components/chat/chat-input";
import { isSettingsHash } from "@/lib/settings-hash";
import { chatService, Message } from "@/lib/chat-service";
import { supabase } from "@/lib/supabase";
import { CloseAIIcon } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Loader,
  Plus,
  Upload,
  ArrowDown,
  SquarePen,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import toast from "@/lib/toast";

/**
 * Auto-scrolling marquee title for shared chat header on hover
 * Uses fixed container bounds so overflowWidth measures accurately, scrolling full text on hover without showing "..."
 */
function SharedHeaderTitleMarquee({
  title,
  isLoading = false,
  chatId,
}: {
  title: string;
  isLoading?: boolean;
  chatId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowWidth, setOverflowWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    if (chatId && typeof window !== "undefined") {
      const storedW = localStorage.getItem(`shared_title_w_${chatId}`);
      if (storedW) {
        const parsed = parseInt(storedW, 10);
        if (!isNaN(parsed) && parsed > 0) {
          document.documentElement.style.setProperty(
            "--shared-title-w",
            `${parsed}px`
          );
          return;
        }
      }
      const storedTitle = localStorage.getItem(`shared_title_${chatId}`);
      if (storedTitle) {
        const w = Math.min(
          Math.max(48, Math.round(storedTitle.length * 8.5)),
          516
        );
        document.documentElement.style.setProperty(
          "--shared-title-w",
          `${w}px`
        );
      }
    }
  }, [chatId]);

  useEffect(() => {
    if (textRef.current && title && chatId && typeof window !== "undefined") {
      const actualWidth = Math.ceil(textRef.current.scrollWidth);
      if (actualWidth > 0) {
        document.documentElement.style.setProperty(
          "--shared-title-w",
          `${actualWidth}px`
        );
        document.cookie = `st_w_${chatId}=${actualWidth}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem(`shared_title_w_${chatId}`, String(actualWidth));
        localStorage.setItem(`shared_title_${chatId}`, title);
      }
    }
  }, [title, chatId]);

  const measure = useCallback(() => {
    if (textRef.current && containerRef.current) {
      const diff =
        textRef.current.scrollWidth - containerRef.current.clientWidth;
      setOverflowWidth(diff > 0 ? diff : 0);
    }
  }, []);

  useEffect(() => {
    if (isLoading || !title) return;
    measure();
    const timer1 = setTimeout(measure, 100);
    const timer2 = setTimeout(measure, 500);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", measure);
    };
  }, [title, isLoading, measure]);

  const handleMouseEnter = () => {
    measure();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (isLoading || !title) {
    return (
      <div className="relative flex-1 overflow-hidden min-w-0 max-w-[140px] min-[400px]:max-w-[200px] min-[600px]:max-w-[280px] md:max-w-[278px] lg:max-w-[378px] xl:max-w-[478px] py-1 select-none flex items-center">
        <div
          style={{ width: "var(--shared-title-w, 180px)" }}
          className="h-4 rounded-md bg-secondary/80 dark:bg-neutral-800/80 animate-pulse shrink-0 max-w-full"
        />
      </div>
    );
  }

  const isScrolling = overflowWidth > 0 && isHovered;
  const duration = Math.max(3.2, (overflowWidth / 35) + 1.8);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex-1 overflow-hidden min-w-0 max-w-[140px] min-[400px]:max-w-[200px] min-[600px]:max-w-[280px] md:max-w-[278px] lg:max-w-[378px] xl:max-w-[478px] py-1 select-none pr-1"
      style={{
        maskImage:
          overflowWidth > 0
            ? isScrolling
              ? "linear-gradient(to right, transparent 0%, black 5px, black calc(100% - 5px), transparent 100%)"
              : "linear-gradient(to right, black 0%, black calc(100% - 8px), transparent 100%)"
            : "none",

        WebkitMaskImage:
          overflowWidth > 0
            ? isScrolling
              ? "linear-gradient(to right, transparent 0%, black 5px, black calc(100% - 5px), transparent 100%)"
              : "linear-gradient(to right, black 0%, black calc(100% - 8px), transparent 100%)"
            : "none",
      }}
    >
      <span
        ref={textRef}
        style={{
          '--marquee-dist': `${overflowWidth + 10}px`,
          animation: isScrolling
            ? `chat-title-marquee ${duration}s ease-in-out infinite`
            : "none",
          transform: isScrolling ? undefined : "translateX(0px)",
          transition: isScrolling ? "none" : "transform 0.25s ease-out",
        } as React.CSSProperties}
        className="inline-block whitespace-nowrap text-base sm:text-[15px] font-medium text-foreground select-none will-change-transform"
      >
        {title}
      </span>
    </div>
  );
}

export default function PublicSharedChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params?.id as string;

  const [chatTitle, setChatTitle] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // ChatInput states
  const [inputValue, setInputValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [thinkMode, setThinkMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.8 flash");
  const [selectedModelTier, setSelectedModelTier] = useState(4);

  const hasInitialHashRef = useRef(
    typeof window !== "undefined" &&
      Boolean(window.location.hash) &&
      !isSettingsHash(window.location.hash)
  );
  const isAutoScrollPinnedRef = useRef(!hasInitialHashRef.current);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceToBottom <= 25;
    isAutoScrollPinnedRef.current = isAtBottom;
    setShowScrollBottom((prev) => (prev !== !isAtBottom ? !isAtBottom : prev));
  };

  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dockRef.current) return;
    const ro = new ResizeObserver(() => handleScroll());
    ro.observe(dockRef.current);
    return () => ro.disconnect();
  }, []);

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

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed && uploadedFiles.length === 0) return;

    if (chatId) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `auto_send_${chatId}`,
          JSON.stringify({
            prompt: trimmed,
            model: selectedModel,
            think: thinkMode,
          })
        );
      }
      if (thinkMode) {
        setThinkMode(false);
      }
      router.push(`/c/${chatId}`);
    } else {
      router.push("/c");
    }
  };

  // A shared conversation should open at the newest message after a reload.
  // Repeat across layout/asset settling so long markdown and images cannot
  // leave the reader stranded above the actual bottom.
  useEffect(() => {
    if (isLoading || isError || messages.length === 0) return;

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash && !isSettingsHash(hash)) {
      const cleanId = decodeURIComponent(hash.replace(/^#/, "")).trim();
      if (cleanId) {
        const scrollToTarget = () => {
          if (!scrollContainerRef.current) return false;
          const elem = getTargetElement(cleanId);
          if (elem) {
            const container = scrollContainerRef.current;
            const containerRect = container.getBoundingClientRect();
            const elemRect = elem.getBoundingClientRect();
            const targetScrollTop =
              container.scrollTop + (elemRect.top - containerRect.top) - 96;
            const maxScroll = Math.max(
              0,
              container.scrollHeight - container.clientHeight
            );
            const boundedTarget = Math.min(maxScroll, Math.max(0, targetScrollTop));

            container.scrollTo({
              top: boundedTarget,
              behavior: "smooth",
            });
            return true;
          }
          return false;
        };

        scrollToTarget();
        const timers = [
          window.setTimeout(scrollToTarget, 80),
          window.setTimeout(scrollToTarget, 250),
          window.setTimeout(scrollToTarget, 600),
          window.setTimeout(() => {
            scrollToTarget();
            hasInitialHashRef.current = false;
          }, 900),
        ];
        return () => {
          timers.forEach(clearTimeout);
        };
      }
    }

    const scroll = () => scrollToBottom();
    scroll();
    const frames = [
      requestAnimationFrame(scroll),
      requestAnimationFrame(() => requestAnimationFrame(scroll)),
    ];
    const timers = [
      window.setTimeout(scroll, 80),
      window.setTimeout(scroll, 250),
      window.setTimeout(scroll, 600),
    ];
    return () => {
      frames.forEach(cancelAnimationFrame);
      timers.forEach(clearTimeout);
    };
  }, [isLoading, isError, messages.length]);

  useEffect(() => {
    if (!chatId) return;

    const fetchSharedChat = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        let loadedMessages: Message[] = [];
        let loadedTitle = "";

        try {
          const details = await chatService.getChatDetails(supabase, chatId);
          if (details && details.messages && details.messages.length > 0) {
            loadedTitle = details.title;
            loadedMessages = details.messages;
          }
        } catch (e) {
          // Ignore RLS error for non-owner public shared users
        }

        if (loadedMessages.length === 0) {
          const res = await fetch(`/api/share/${chatId}`);
          if (res.ok) {
            const data = await res.json();
            loadedTitle = data.chat?.title || "";
            loadedMessages = data.messages || [];
          }
        }

        if (loadedMessages.length === 0) {
          throw new Error("Chat not found");
        }

        setChatTitle(loadedTitle);
        setMessages(loadedMessages);
      } catch (err) {
        console.error("Error loading chat:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedChat();
  }, [chatId]);

  const handleShareClick = async () => {
    setIsSharing(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Public link copied to your clipboard", {
        description: "Anyone with this link can see this conversation",
      });
    } catch (e) {
      toast.error("Failed to copy link");
    } finally {
      setTimeout(() => setIsSharing(false), 300);
    }
  };

  // Extract full user prompt text if available to prevent truncated trailing "..." from DB titles
  const firstUserMsg = messages.find((m) => m.role === "user")?.content?.trim();
  const displayTitle = (firstUserMsg || chatTitle)
    .replace(/(\.\.\.|\u2026)\s*$/, "")
    .trim();
  const cleanTitle = displayTitle.replace(/\s+/g, " ").trim();

  useEffect(() => {
    if (cleanTitle) {
      document.title = `CloseAI \u007C Shared Chat\u003A ${cleanTitle}`;
    } else {
      document.title = "CloseAI";
    }
    return () => {
      document.title = "CloseAI";
    };
  }, [cleanTitle]);

  // Keep scroll glued to bottom on iOS Safari virtual keyboard resize without jumping on zoom
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const onResize = () => {
      if (isAutoScrollPinnedRef.current) {
        forceScrollToBottom();
      }
    };
    window.visualViewport.addEventListener("resize", onResize);
    return () => window.visualViewport?.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground overflow-hidden relative">
      <title>
        {cleanTitle
          ? `CloseAI \u007C Shared Chat\u003A ${cleanTitle}`
          : "CloseAI"}
      </title>

      {/* Transparent Floating Header - Buttons float cleanly on top, matching c/[id] exactly */}
      <header className="absolute top-0 left-0 right-0 z-30 h-14 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-4 flex items-center justify-between select-none pointer-events-none bg-transparent">
        <div className="absolute top-0 left-0 right-4 sm:right-5 h-20 pointer-events-none bg-gradient-to-b from-background via-background/95 to-transparent -z-10" />
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pointer-events-auto ml-3 mt-3 mr-3 sm:ml-0.5">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-85 transition-opacity shrink-0"
          >
            <span className="font-semibold text-xl tracking-tight text-foreground">
              CloseAI
            </span>
          </Link>
          <Separator
            orientation="vertical"
            className="h-4 bg-border mx-0.5 sm:mx-1 shrink-0"
          />
          <SharedHeaderTitleMarquee
            title={displayTitle}
            isLoading={isLoading}
            chatId={chatId}
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto mt-3 pr-3 sm:pr-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={isSharing}
                onClick={handleShareClick}
                className="group w-11 sm:w-auto h-11 px-0 sm:px-4 gap-0 sm:gap-1.5 rounded-xl bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none text-foreground flex items-center justify-center text-base font-medium transition-colors cursor-pointer outline-none focus:outline-none disabled:opacity-70 disabled:pointer-events-auto disabled:cursor-not-allowed"
              >
                {isSharing ? (
                  <Loader className="w-4 h-4 shrink-0 animate-spin text-muted-foreground group-hover:text-foreground" />
                ) : (
                  <Upload className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                )}
                <span className="hidden sm:inline">Share</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="text-md">
              Share conversation
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => window.open("/c", "_blank")}
                className="group w-11 h-11 rounded-xl bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none text-neutral-700 dark:text-neutral-200 hover:text-foreground dark:hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none"
                aria-label="New chat"
              >
                <SquarePen className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="end"
              sideOffset={6}
              className="text-md"
            >
              New chat
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Full-Height Scrollable Content Area */}
      <div
        ref={scrollContainerRef}
        data-chat-scroll="true"
        onScroll={handleScroll}
        className="flex-1 w-full overflow-x-hidden relative flex flex-col pt-14 overflow-y-scroll overscroll-y-contain [scrollbar-gutter:stable]"
      >
        {/* Message Stream & Content */}
        <div className="flex-1 flex flex-col min-h-full">
          {isError ? (
            <div className="flex-1 w-full flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="space-y-1">
                <p className="text-2xl font-semibold">Conversation not found</p>
                <p className="text-base text-muted-foreground max-w-base">
                  This shared link may have been deleted or is unavailable.
                </p>
              </div>
              <Button
                onClick={() => router.push("/c")}
                className="rounded-xl cursor-pointer"
              >
                Start new chat
              </Button>
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="flex-1 w-full h-full flex flex-col items-center justify-center pb-16 text-muted-foreground">
                  <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="w-full max-w-4xl flex-1 pb-4 sm:pb-6 mx-auto">
                  <MessageList
                    messages={messages}
                    user={null}
                    isTyping={false}
                    pendingMessage={null}
                    showMessageActions={false}
                  />
                </div>
              )}

              {/* Floating Input Dock inside scroll container for 100% scrollbar-aware width alignment */}
              <div
                ref={dockRef}
                className="sticky bottom-0 left-0 right-4 sm:right-5 z-20 pointer-events-none pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] bg-gradient-to-t from-background via-background/80 to-transparent pt-4 mt-auto"
              >
                <div className="pointer-events-auto">
                  <ChatInput
                    message={inputValue}
                    onMessageChange={setInputValue}
                    onSend={handleSend}
                    uploadedFiles={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                    isTyping={false}
                    isUploading={false}
                    showDisclaimer={true}
                    placeholder="Continue chatting"
                    disableAttach={true}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    selectedTier={selectedModelTier}
                    onTierChange={setSelectedModelTier}
                    thinkMode={thinkMode}
                    onThinkModeChange={setThinkMode}
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
                                    scrollToBottom();
                                  }}
                                  className="group w-11 h-11 rounded-full bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none text-neutral-700 dark:text-neutral-200 hover:text-foreground dark:hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
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
            </>
          )}
        </div>
        {/* TOC Navigator — Table of Contents on Desktop */}
        <TocNavigator messages={messages} containerRef={scrollContainerRef} />
      </div>
    </div>
  );
}
