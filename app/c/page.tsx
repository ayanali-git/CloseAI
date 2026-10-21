"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { chatService } from "@/lib/chat-service";
import { Sidebar } from "@/components/chat/sidebar";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { ChatInput } from "@/components/chat/chat-input";
import { Loader, PanelRight, ChevronDown, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AnimatedArrowUpRight,
  AnimatedTempChat,
} from "@/components/ui/animated";
import { useSidebarContext } from "@/components/chat/sidebar-context";
import { isTemporaryChatParam, addTemporaryChat } from "@/lib/temporary-chat";
import { cn } from "@/lib/utils";
import toast from "@/lib/toast";

function NewChatContent() {
  const { user, token, loading, isSigningOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPrompt =
    searchParams?.get("p")?.trim() ||
    searchParams?.get("q")?.trim() ||
    "";

  const {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar: handleToggleSidebar,
    chats,
    isChatsLoading,
    loadChats,
    deleteChat,
  } = useSidebarContext();

  const [newChatKey, setNewChatKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Gemini 3.8 flash");
  const [selectedModelTier, setSelectedModelTier] = useState(4);
  const [thinkMode, setThinkMode] = useState(false);
  const autoCreateTriggeredRef = useRef(false);

  const [isTemporary, setIsTemporary] = useState(() =>
    isTemporaryChatParam(searchParams)
  );
  const isPersonalized = searchParams?.get("personalized") !== "false";

  useEffect(() => {
    setIsTemporary(isTemporaryChatParam(searchParams));
  }, [searchParams]);

  const handleSetPersonalized = (val: boolean) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (!val) {
      params.set("personalized", "false");
    } else {
      params.delete("personalized");
    }
    const q = params.toString();
    router.replace(`/c${q ? `?${q}` : ""}`, { scroll: false });
  };

  const handleToggleTemporaryChat = () => {
    const next = !isTemporary;
    setIsTemporary(next);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (next) {
      params.set("tc", "true");
    } else {
      params.delete("tc");
      params.delete("personalized");
    }
    const q = params.toString();
    router.replace(`/c${q ? `?${q}` : ""}`, { scroll: false });
  };

  // If unauthorized, redirect to /gc immediately
  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (isSigningOut) return;
      const search = typeof window !== "undefined" ? window.location.search : "";
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      router.replace(`/gc${search}${hash}`);
      return;
    }

    loadChats();

    const promptToSend =
      queryPrompt ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("pending_prompt")
        : null);

    if (
      promptToSend &&
      promptToSend.trim() &&
      !autoCreateTriggeredRef.current
    ) {
      autoCreateTriggeredRef.current = true;
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pending_prompt");
      }
      handleAutoCreateAndSend(promptToSend.trim());
    }
  }, [user, loading, isSigningOut, queryPrompt, router]);

  const handleNewChat = () => {
    setMessage("");
    setUploadedFiles([]);
    setNewChatKey((k) => k + 1);
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setSidebarOpen(false);
    }
  };

  const handleAutoCreateAndSend = async (promptText: string) => {
    if (!user) return;
    setIsAutoCreating(true);
    try {
      const cleanPrompt = promptText.trim().replace(/\s+/g, " ");
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({
          user_id: user.id,
          title: cleanPrompt,
          starred: false,
        })
        .select()
        .single();

      if (chatError || !newChat) {
        throw new Error(chatError?.message || "Failed to create chat");
      }

      if (isTemporary) {
        addTemporaryChat(newChat.id);
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `auto_send_${newChat.id}`,
          JSON.stringify({
            prompt: promptText,
            model: selectedModel,
            think: thinkMode,
            isTemporary,
            isPersonalized,
          })
        );
      }

      const tcQuery = isTemporary
        ? `?tc=true${!isPersonalized ? "&personalized=false" : ""}`
        : "";
      router.replace(`/c/${newChat.id}${tcQuery}`);
    } catch (error: any) {
      console.error("Error auto-starting chat:", error);
      toast.error(error.message || "Failed to start chat");
      setIsAutoCreating(false);
      setMessage(promptText);
    }
  };

  const handleToggleArchive = async (id: string, archived: boolean) => {
    try {
      if (archived) {
        await chatService.toggleChatStar(supabase, id, false);
      }
      await chatService.toggleChatArchive(supabase, id, archived);
      await loadChats();
      toast.success(archived ? "Chat archived" : "Chat unarchived");
    } catch (e) {
      console.error("Error toggling archive:", e);
      toast.error("Failed to update chat archive status");
    }
  };

  const handleSend = async () => {
    if (!message.trim() && uploadedFiles.length === 0) return;
    if (!user) return;

    const messageText = message;
    const filesToSend = [...uploadedFiles];
    setMessage("");
    setUploadedFiles([]);
    setIsTyping(true);

    try {
      let fileData: any[] = [];
      if (filesToSend.length > 0) {
        setIsUploading(true);
        for (const file of filesToSend) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadHeaders: Record<string, string> = {};
          let authToken = token;
          if (!authToken) {
            const { data: sessionData } = await supabase.auth.getSession();
            authToken = sessionData?.session?.access_token || null;
          }
          if (authToken) {
            uploadHeaders["Authorization"] = `Bearer ${authToken}`;
          }

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: uploadHeaders,
            body: formData,
          });

          if (uploadRes.ok) {
            const result = await uploadRes.json();
            fileData.push(result.file);
          }
        }
        setIsUploading(false);
      }

      const cleanPrompt = messageText.trim().replace(/\s+/g, " ");
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({
          user_id: user.id,
          title: cleanPrompt,
          starred: false,
        })
        .select()
        .single();

      if (chatError || !newChat) {
        throw new Error(chatError?.message || "Failed to create chat");
      }

      if (isTemporary) {
        addTemporaryChat(newChat.id);
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `auto_send_${newChat.id}`,
          JSON.stringify({
            prompt: messageText,
            model: selectedModel,
            think: thinkMode,
            files: fileData,
            isTemporary,
            isPersonalized,
          })
        );
      }

      if (thinkMode) {
        setThinkMode(false);
      }

      const tcQuery = isTemporary
        ? `?tc=true${!isPersonalized ? "&personalized=false" : ""}`
        : "";
      router.push(`/c/${newChat.id}${tcQuery}`);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
      setMessage(messageText);
      setUploadedFiles(filesToSend);
      setIsTyping(false);
      setIsUploading(false);
    }
  };

  useEffect(() => {
    document.title = "CloseAI";
  }, []);

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden">
      <title>CloseAI</title>

      {/* Sidebar (Authenticated) */}
      <Sidebar
        user={user}
        chats={chats}
        currentChatId={null}
        onChatSelect={(id) => router.push(`/c/${id}`)}
        onNewChat={handleNewChat}
        onDeleteChat={(id) => {
          deleteChat(id)
            .then(() => toast.success("Chat deleted"))
            .catch(() => toast.error("Failed to delete chat"));
        }}
        onToggleStar={async (id, starred) => {
          if (starred) {
            await chatService.toggleChatArchive(supabase, id, false);
          }
          await chatService.toggleChatStar(supabase, id, starred);
          loadChats();
          toast.success(starred ? "Chat pinned" : "Chat unpinned");
        }}
        onToggleArchive={handleToggleArchive}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        isLoading={isChatsLoading || loading || isSigningOut}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden selection:bg-secondary selection:text-foreground">
        {/* Transparent Floating Header */}
        <header className="absolute top-0 left-0 right-0 z-30 h-14 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-4 flex items-center justify-between select-none pointer-events-none bg-transparent">
          {/* Top gradient overlay */}
          <div className="absolute top-0 left-0 right-4 sm:right-5 h-20 pointer-events-none bg-gradient-to-b from-background via-background to-transparent -z-10" />

          {/* Left Header Area: Sidebar toggle on small screens */}
          <div className="flex items-center pointer-events-auto mt-3 pl-3 sm:pl-0">
            {!sidebarOpen && (
              <div className="xl:hidden flex items-center h-11 gap-0.5 rounded-sm bg-white/50 dark:bg-[#212121]/50 sm:bg-background/50 sm:dark:bg-background/50 backdrop-blur-sm border border-border/80 dark:border-none">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleToggleSidebar()}
                      className="group h-full w-11 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0"
                      aria-label="Open sidebar"
                    >
                      <PanelRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="text-base"
                  >
                    Open sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Right Header Area: Temporary Chat Controls */}
          <div className="flex items-center pointer-events-auto mt-3 pr-3 sm:pr-1">
            <div className="flex items-center h-11 gap-0.5 rounded-sm bg-white/50 dark:bg-[#212121]/50 sm:bg-background/50 sm:dark:bg-background/50 backdrop-blur-sm border border-border/80 dark:border-none">
              {isTemporary && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="group h-full px-2.5 sm:px-3 gap-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 data-[state=open]:bg-black/5 dark:data-[state=open]:bg-white/10 text-foreground flex items-center justify-center text-xs sm:text-[13px] font-medium transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0"
                      aria-label="Personalization settings"
                    >
                      <span>{isPersonalized ? "Personalized" : "Unpersonalized"}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={6}
                    className="w-80 rounded-xl p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none z-50"
                  >
                    <DropdownMenuItem
                      onClick={() => handleSetPersonalized(true)}
                      className="group flex items-start justify-between gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 focus:bg-black/5 dark:focus:bg-white/10 data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/10 transition-colors"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-foreground">
                          Personalized
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          This chat can reference memory, plugins, and custom instructions
                        </span>
                      </div>
                      {isPersonalized && (
                        <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleSetPersonalized(false)}
                      className="group flex items-start justify-between gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 focus:bg-black/5 dark:focus:bg-white/10 data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/10 transition-colors"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-foreground">
                          Unpersonalized
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          This chat will ignore memory, plugins, and custom instructions
                        </span>
                      </div>
                      {!isPersonalized && (
                        <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleToggleTemporaryChat}
                    className={cn(
                      "group h-full w-11 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0",
                      isTemporary
                        ? "bg-black/10 dark:bg-white/15 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Temporary chat"
                  >
                    <AnimatedTempChat
                      open={isTemporary}
                      size={18}
                      className={cn(
                        "transition-colors",
                        isTemporary
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="end"
                  sideOffset={6}
                  className="text-base"
                >
                  Temporary chat
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Content Stream */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto px-2 sm:px-4 pt-14 pb-14 no-overscroll">
          {isAutoCreating ||
          (queryPrompt && !autoCreateTriggeredRef.current) ||
          isSigningOut ||
          (loading && !user) ? (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center space-y-3 pb-12 text-muted-foreground">
              <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <WelcomeScreen
              user={user}
              resetKey={newChatKey}
              onPromptSelect={(prompt) => setMessage(prompt)}
              customTitle={isTemporary ? "Temporary chat" : undefined}
              customSubtitle={
                isTemporary
                  ? isPersonalized
                    ? "This chat can reference memory, and plugins, but it won't appear in your history"
                    : "This chat will ignore memory, and plugins, and it won't appear in your history"
                  : undefined
              }
            >
              <ChatInput
                message={message}
                onMessageChange={setMessage}
                onSend={handleSend}
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
                centered={false}
                showDisclaimer={false}
              />
            </WelcomeScreen>
          )}
        </div>

        {/* Bottom Disclaimer for Empty State — Constant height and absolute position so content area never changes size */}
        <div className="absolute bottom-0 left-0 right-0 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 select-none pointer-events-none z-20 flex items-center justify-center text-center">
          <div className="pointer-events-auto">
            {isTemporary ? (
              <p className="max-w-4xl mx-auto text-xs sm:text-sm text-muted-foreground font-normal tracking-tight leading-tight select-none whitespace-normal sm:whitespace-nowrap">
                For safety, we may keep a copy of this chat for up to 30 days.
              </p>
            ) : (
              <div className="max-w-4xl mx-auto text-xs sm:text-sm text-muted-foreground font-normal tracking-tight leading-tight flex flex-col items-center justify-center gap-0.5">
                <div>
                  CloseAI is AI. By using it, you agree to our{" "}
                  <Link
                    href="/support/terms"
                    className="text-foreground hover:opacity-90 transition-colors whitespace-nowrap"
                  >
                    <span>Terms</span>
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/support/privacy"
                    className="text-foreground hover:opacity-90 transition-colors whitespace-nowrap"
                  >
                    <span>Privacy</span>
                  </Link>
                  .
                </div>
                <div>
                  Chats may be reviewed and used to improve our AI models.{" "}
                  <Link
                    href="/support/help"
                    className="text-foreground hover:opacity-90 transition-colors whitespace-nowrap"
                  >
                    <span>Learn more</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewChatPage() {
  return (
    <Suspense fallback={null}>
      <NewChatContent />
    </Suspense>
  );
}
