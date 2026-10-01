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
import { Loader, PanelRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnimatedArrowUpRight } from "@/components/ui/animated";
import { useSidebarContext } from "@/components/chat/sidebar-context";
import toast from "@/lib/toast";

function NewChatContent() {
  const { user, loading, isSigningOut } = useAuth();
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
  const [selectedModel, setSelectedModel] = useState("gemini-3.8 flash");
  const [selectedModelTier, setSelectedModelTier] = useState(4);
  const [thinkMode, setThinkMode] = useState(false);
  const autoCreateTriggeredRef = useRef(false);

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

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `auto_send_${newChat.id}`,
          JSON.stringify({
            prompt: promptText,
            model: selectedModel,
            think: thinkMode,
          })
        );
      }

      router.replace(`/c/${newChat.id}`);
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

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `auto_send_${newChat.id}`,
          JSON.stringify({
            prompt: messageText,
            model: selectedModel,
            think: thinkMode,
          })
        );
      }

      if (thinkMode) {
        setThinkMode(false);
      }

      router.push(`/c/${newChat.id}`);
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
        isLoading={isChatsLoading || loading}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden selection:bg-secondary selection:text-foreground">
        {/* Transparent Floating Header */}
        <header className="absolute top-0 left-0 right-0 z-30 h-14 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-4 flex items-center justify-between select-none pointer-events-none bg-transparent">
          {/* Top gradient overlay */}
          <div className="absolute top-0 left-0 right-4 sm:right-5 h-20 pointer-events-none bg-gradient-to-b from-background via-background to-transparent -z-10" />

          <div className="flex items-center gap-2 pointer-events-auto mt-3 pl-3 sm:pl-0">
            {!sidebarOpen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleToggleSidebar()}
                    className="xl:hidden w-11 h-11 rounded-xl bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/50 dark:border-none text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none"
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
          </div>
        </header>

        {/* Content Stream */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto px-2 sm:px-4 pb-2 no-overscroll pt-14">
          {isAutoCreating ||
          (queryPrompt && !autoCreateTriggeredRef.current) ? (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center space-y-3 pb-12 text-muted-foreground">
              <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <WelcomeScreen
              user={user}
              resetKey={newChatKey}
              onPromptSelect={(prompt) => setMessage(prompt)}
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

        {/* Bottom Disclaimer for Empty State */}
        <div className="w-full text-center pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1 px-4 select-none shrink-0 z-20">
          <p className="max-w-3xl mx-auto text-sm text-muted-foreground font-normal tracking-tighter leading-tight">
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
            . Chats may be reviewed and used to improve AI models.{" "}
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
