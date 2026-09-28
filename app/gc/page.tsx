"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/chat/sidebar";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { ChatInput, ChatInputHandle } from "@/components/chat/chat-input";
import { LoginModal } from "@/components/modals/log-in-modal";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { PanelRight } from "lucide-react";
import {
  AnimatedChevron,
  AnimatedArrowUpRight,
} from "@/components/ui/animated";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarContext } from "@/components/chat/sidebar-context";
import { cn } from "@/lib/utils";
import { withCurrentHash } from "@/lib/settings-hash";
import toast from "@/lib/toast";

function GuestChatContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPrompt = searchParams?.get("q")?.trim() || "";

  const {
    sidebarOpen,
    toggleSidebar: handleToggleSidebar,
    chats,
    setChats,
    isChatsLoading,
    loadChats,
    deleteChat,
  } = useSidebarContext();

  const [newChatKey, setNewChatKey] = useState(0);
  const [isSidebarBtnHovered, setIsSidebarBtnHovered] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.8 flash");
  const [selectedModelTier, setSelectedModelTier] = useState(4);
  const [thinkMode, setThinkMode] = useState(false);
  const autoCreateTriggeredRef = useRef(false);
  const chatInputRef = useRef<ChatInputHandle>(null);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  // If authenticated user lands on /gc, redirect to /c
  useEffect(() => {
    if (!loading && user) {
      router.replace(
        withCurrentHash(`/c${window.location.search}`)
      );
    }
  }, [user, loading, router]);

  // Handle URL query prompt auto-send: creates new guest chat session
  useEffect(() => {
    if (queryPrompt && !autoCreateTriggeredRef.current) {
      autoCreateTriggeredRef.current = true;
      handleStartGuestChat(queryPrompt, []);
    }
  }, [queryPrompt]);

  const handleStartGuestChat = (
    promptText: string,
    filesToSend: File[] = []
  ) => {
    if (!promptText.trim() && filesToSend.length === 0) return;
    const guestChatId = crypto.randomUUID();

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `guest_auto_send_${guestChatId}`,
        JSON.stringify({
          prompt: promptText,
          model: selectedModel,
          think: thinkMode,
          files: filesToSend.map((f: any) => ({
            name: f.name,
            size: f.size,
            type: f.type,
            url: f.url || "",
          })),
        })
      );
    }

    router.push(`/gc/${guestChatId}`);
  };

  const handleSend = (promptOverride?: string) => {
    const promptToSend = promptOverride ?? message;
    if (!promptToSend.trim() && uploadedFiles.length === 0) return;
    handleStartGuestChat(promptToSend, uploadedFiles);
    setMessage("");
    setUploadedFiles([]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
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

  useEffect(() => {
    document.title = "CloseAI";
  }, []);

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
        currentChatId={null}
        onChatSelect={() => {}}
        onNewChat={() => {
          setNewChatKey((prev) => prev + 1);
          setMessage("");
          setUploadedFiles([]);
        }}
        onDeleteChat={() => {}}
        onToggleStar={() => {}}
        onToggleArchive={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        isLoading={false}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onOpenWebSearchModal={() => setShowLoginModal(true)}
        onOpenAdvancedFeaturesModal={() => setShowLoginModal(true)}
        onWebSearchHover={() => setModelDropdownOpen(false)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden selection:bg-secondary selection:text-foreground">
        {/* Transparent Floating Header with Unified 28px Alignment */}
        <header className="absolute top-0 left-0 right-0 z-30 h-14 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-4 flex items-center justify-between select-none pointer-events-none bg-transparent">
          {/* Top gradient overlay */}
          <div className="absolute top-0 left-0 right-4 sm:right-5 h-20 pointer-events-none bg-gradient-to-b from-background via-background to-transparent -z-10" />

          {/* Left area */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {!sidebarOpen && (
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
                    className="xl:hidden w-10 h-10 rounded-full bg-white border border-border/80 dark:border-none dark:bg-[#383838] text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none"
                    aria-label="Open sidebar"
                  >
                    <PanelRight className="w-4 h-4" />
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
            )}

            {/* Desktop Only: CloseAI with AnimatedChevron and Popover */}
            <div className="hidden xl:block">
              <Popover
                open={modelDropdownOpen}
                onOpenChange={setModelDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-10 flex items-center gap-1.5 px-4 rounded-full hover:bg-secondary text-foreground text-xl font-semibold transition-colors cursor-pointer data-[state=open]:bg-secondary"
                  >
                    <span className="leading-none">CloseAI</span>
                    <AnimatedChevron
                      open={modelDropdownOpen}
                      disableHover
                      size={18}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={8}
                  animate={false}
                  className="w-[310px] p-0 rounded-2xl bg-white dark:bg-[#212121] border border-border/80 dark:border-neutral-800 overflow-hidden text-left z-50 transition-none animate-none duration-0 !transition-none !animate-none"
                >
                  <div className="h-32 w-full bg-gradient-to-br from-[#9eb1ff] via-[#b6c7ff] to-[#cfe2fe]" />
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
                          setShowLoginModal(true);
                        }}
                        className="h-10 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 text-sm font-medium transition-all cursor-pointer flex items-center justify-center text-center leading-none"
                      >
                        Log in
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModelDropdownOpen(false);
                          setShowLoginModal(true);
                        }}
                        className="h-10 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white text-sm font-normal transition-colors cursor-pointer flex items-center justify-center text-center leading-none"
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
          <div className="xl:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 flex items-center justify-center pointer-events-auto">
            <span className="text-xl font-semibold text-foreground tracking-tight select-none leading-none">
              CloseAI
            </span>
          </div>

          {/* Right area */}
          <div className="flex items-center gap-2 pointer-events-auto pr-1 sm:pr-0">
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="h-10 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 text-sm font-medium transition-all cursor-pointer flex items-center justify-center text-center leading-none"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="hidden sm:flex h-10 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white text-sm font-normal transition-colors cursor-pointer flex items-center justify-center text-center leading-none"
            >
              Sign up for free
            </button>
          </div>
        </header>

        {/* Content Stream (Scrollable but scrollbar hidden) */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto px-2 sm:px-4 pb-2 no-overscroll pt-14 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <WelcomeScreen
            user={null}
            resetKey={newChatKey}
            onPromptSelect={(prompt) => {
              handleStartGuestChat(prompt, []);
            }}
          >
            <div className="w-full flex flex-col items-center gap-6">
              <ChatInput
                ref={chatInputRef}
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
                onOpenLoginModal={() => setShowLoginModal(true)}
                onOpenWebSearchModal={() => setShowLoginModal(true)}
                onOpenAdvancedFeaturesModal={() => setShowLoginModal(true)}
                centered={false}
                showDisclaimer={false}
              />

              {/* Suggestion pill — only visible when input is empty */}
              <div className="w-full flex justify-center h-11">
                {message.trim().length === 0 && uploadedFiles.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const prompt = "What can you do?";
                      setMessage(prompt);
                      requestAnimationFrame(() => {
                        chatInputRef.current?.focus();
                      });
                      setTimeout(() => {
                        handleStartGuestChat(prompt, []);
                      }, 250);
                    }}
                    className="h-11 px-4 rounded-full text-sm sm:text-[14.5px] transition-colors outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ring-0 border border-border/80 dark:border-none select-none cursor-pointer bg-white hover:bg-secondary text-foreground dark:bg-[#2f2f2f] dark:hover:bg-[#383838]"
                  >
                    What can you do?
                  </button>
                )}
              </div>
            </div>
          </WelcomeScreen>
        </div>

        {/* Bottom Disclaimer for Empty State */}
        <div className="w-full text-center pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1 px-4 select-none shrink-0 z-20">
          <p className="max-w-3xl mx-auto text-[11.5px] sm:text-[12px] text-muted-foreground font-normal tracking-tight leading-normal">
            CloseAI is AI. By using, you agree to our{" "}
            <Link
              href="/support/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors align-baseline"
            >
              <span>Terms</span>
              <AnimatedArrowUpRight size={15} className="shrink-0" />
            </Link>{" "}
            &amp;{" "}
            <Link
              href="/support/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors align-baseline"
            >
              <span>Privacy</span>
              <AnimatedArrowUpRight size={15} className="shrink-0" />
            </Link>
            . Chats may be reviewed and used to improve our AI models.{" "}
            <Link
              href="/support/help"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors align-baseline"
            >
              <span>Learn more</span>
              <AnimatedArrowUpRight size={15} className="shrink-0" />
            </Link>
          </p>
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
      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </div>
  );
}

export default function GuestChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full bg-background text-foreground overflow-hidden" />
      }
    >
      <GuestChatContent />
    </Suspense>
  );
}
