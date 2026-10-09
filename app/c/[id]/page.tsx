"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { chatService, Chat, Message } from "@/lib/chat-service";
import { Sidebar } from "@/components/chat/sidebar";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import {
  TocNavigator,
  getTargetElement,
} from "@/components/chat/toc-navigator";
import { FilesDrawer, FilePreviewViewer } from "@/components/chat/file-drawer";
import {
  ChevronDown,
  Share2,
  Upload,
  MoreHorizontal,
  Folder,
  Pin,
  PinOff,
  Archive,
  ArchiveX,
  Trash2,
  Loader,
  ArrowDown,
  PanelRight,
  SquarePen,
  X,
  Download,
  ExternalLink,
} from "lucide-react";
import { getFileUrl } from "@/lib/file-utils";
import { CloseAIIcon } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
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
import { useSidebarContext } from "@/components/chat/sidebar-context";
import { cn } from "@/lib/utils";
import { withChatPreferences } from "@/lib/user-preferences";
import { isSettingsHash, withCurrentHash } from "@/lib/settings-hash";
import toast from "@/lib/toast";
import { DeleteModal } from "@/components/modals/delete-chat-modal";

export default function ActiveChatPage() {
  const { user, token, loading, isSigningOut } = useAuth();
  const isGuest = !user;
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;

  const {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar: handleToggleSidebar,
    chats,
    setChats,
    isChatsLoading,
    loadChats,
    deleteChat,
  } = useSidebarContext();

  useEffect(() => {
    router.prefetch("/c");
  }, [router]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("Gemini 3.8 flash");
  const [selectedModelTier, setSelectedModelTier] = useState(4);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSidebarBtnHovered, setIsSidebarBtnHovered] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(true);
  const [pendingMessage, setPendingMessage] = useState<{
    content: string;
    files: any[];
    isThinkMode?: boolean;
  } | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [thinkMode, setThinkMode] = useState(false);
  const [isFilesDrawerOpen, setIsFilesDrawerOpen] = useState(false);
  const [activePreviewFile, setActivePreviewFile] = useState<any | null>(null);

  // Extract all files referenced in this chat (from all messages and pending message)
  const chatFiles = React.useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    const addFile = (file: any) => {
      if (!file) return;
      const key =
        file.id ||
        file.url ||
        file.publicUrl ||
        file.name ||
        file.filename ||
        JSON.stringify(file);
      if (!seen.has(key)) {
        seen.add(key);
        list.push(file);
      }
    };

    messages.forEach((msg) => {
      if (Array.isArray(msg.files)) {
        msg.files.forEach(addFile);
      }
    });

    if (pendingMessage?.files && Array.isArray(pendingMessage.files)) {
      pendingMessage.files.forEach(addFile);
    }

    return list;
  }, [messages, pendingMessage]);

  const previewFileUrl = React.useMemo(() => {
    if (!activePreviewFile) return "";
    return getFileUrl(activePreviewFile);
  }, [activePreviewFile]);

  const handleDownloadActiveFile = () => {
    if (!previewFileUrl) return;
    const a = document.createElement("a");
    a.href = previewFileUrl;
    a.download =
      activePreviewFile?.name || activePreviewFile?.filename || "file";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const prevSidebarOpenRef = useRef<boolean | null>(null);
  const prevFilesDrawerOpenRef = useRef<boolean | null>(null);
  const savedChatScrollTopRef = useRef<number | null>(null);
  const wasAutoScrollPinnedRef = useRef<boolean>(false);
  const savedAnchorElementRef = useRef<{
    id: string;
    topOffset: number;
  } | null>(null);
  const prevActivePreviewFileRef = useRef<any>(null);
  const isRestoringScrollRef = useRef<boolean>(false);

  const handleOpenPreview = (file: any, fromDrawer = false) => {
    setShowScrollBottom(false);
    if (!activePreviewFile && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      savedChatScrollTopRef.current = container.scrollTop;
      wasAutoScrollPinnedRef.current = isAutoScrollPinnedRef.current;

      const containerRect = container.getBoundingClientRect();
      const messageElements = container.querySelectorAll("[id^='m-']");
      let anchor: { id: string; topOffset: number } | null = null;
      for (let i = 0; i < messageElements.length; i++) {
        const el = messageElements[i] as HTMLElement;
        const rect = el.getBoundingClientRect();
        if (rect.bottom > containerRect.top + 60) {
          if (el.id) {
            anchor = {
              id: el.id,
              topOffset: rect.top - containerRect.top,
            };
            break;
          }
        }
      }
      savedAnchorElementRef.current = anchor;
    }

    prevSidebarOpenRef.current = sidebarOpen;
    prevFilesDrawerOpenRef.current = fromDrawer || isFilesDrawerOpen;
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
    if (isFilesDrawerOpen) {
      setIsFilesDrawerOpen(false);
    }
    setActivePreviewFile(file);
  };

  const handleClosePreview = () => {
    setActivePreviewFile(null);
    const shouldReopenSidebar =
      prevSidebarOpenRef.current !== null
        ? prevSidebarOpenRef.current
        : typeof window !== "undefined" && window.innerWidth >= 1280;
    const shouldReopenDrawer = prevFilesDrawerOpenRef.current === true;

    requestAnimationFrame(() => {
      if (shouldReopenSidebar) {
        setSidebarOpen(true);
      }
      if (shouldReopenDrawer) {
        setIsFilesDrawerOpen(true);
      }
    });

    prevSidebarOpenRef.current = null;
    prevFilesDrawerOpenRef.current = null;
  };

  useEffect(() => {
    if (!activePreviewFile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClosePreview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePreviewFile]);
  const autoSendTriggeredRef = useRef(false);
  const hasInitialHashRef = useRef(
    typeof window !== "undefined" &&
      Boolean(window.location.hash) &&
      !isSettingsHash(window.location.hash)
  );
  const isAutoScrollPinnedRef = useRef(!hasInitialHashRef.current);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll events to show/hide scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    if (activePreviewFile || isFilesDrawerOpen || isRestoringScrollRef.current) return;
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

  // Restore exact scroll position when file preview closes
  useEffect(() => {
    if (prevActivePreviewFileRef.current && !activePreviewFile) {
      const targetScroll = savedChatScrollTopRef.current;
      const wasPinned = wasAutoScrollPinnedRef.current;
      const savedAnchor = savedAnchorElementRef.current;

      if ((targetScroll !== null || savedAnchor) && scrollContainerRef.current) {
        isRestoringScrollRef.current = true;

        const restoreScroll = () => {
          const container = scrollContainerRef.current;
          if (!container) return;

          if (wasPinned) {
            container.scrollTop = container.scrollHeight;
            isAutoScrollPinnedRef.current = true;
            setShowScrollBottom(false);
            return;
          }

          let restored = false;
          if (savedAnchor?.id) {
            const anchorEl = getTargetElement(savedAnchor.id);
            if (anchorEl) {
              const containerRect = container.getBoundingClientRect();
              const elemRect = anchorEl.getBoundingClientRect();
              const currentDiff = elemRect.top - containerRect.top;
              const delta = currentDiff - savedAnchor.topOffset;
              container.scrollTop += delta;
              restored = true;
            }
          }

          if (!restored && targetScroll !== null) {
            container.scrollTop = targetScroll;
          }

          isAutoScrollPinnedRef.current = false;
          const { scrollTop, scrollHeight, clientHeight } = container;
          const distanceToBottom = scrollHeight - scrollTop - clientHeight;
          setShowScrollBottom(distanceToBottom > 25);
        };

        // Immediate restore
        restoreScroll();

        // Multi-stage frame restore to account for drawer resize animation and layout settles
        requestAnimationFrame(() => {
          restoreScroll();
        });

        const t1 = setTimeout(restoreScroll, 40);
        const t2 = setTimeout(restoreScroll, 100);
        const t3 = setTimeout(restoreScroll, 200);
        const t4 = setTimeout(() => {
          restoreScroll();
          isRestoringScrollRef.current = false;
          handleScroll();
        }, 350);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
          isRestoringScrollRef.current = false;
        };
      }
      savedChatScrollTopRef.current = null;
      savedAnchorElementRef.current = null;
    }
    prevActivePreviewFileRef.current = activePreviewFile;
  }, [activePreviewFile]);

  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (activePreviewFile || isRestoringScrollRef.current) return;
      if (isAutoScrollPinnedRef.current) {
        forceScrollToBottom();
      } else {
        handleScroll();
      }
    });
    ro.observe(scrollContainerRef.current);
    return () => ro.disconnect();
  }, [activePreviewFile]);

  // Auto-scroll pinning effect when messages, typing, or pending prompt update
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
  }, [messages.length, isTyping, pendingMessage]);

  // On initial load with hash: scroll directly to the targeted prompt section
  useEffect(() => {
    if (!hasInitialHashRef.current || messages.length === 0) return;

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || isSettingsHash(hash)) return;
    const cleanId = decodeURIComponent(hash.replace(/^#/, "")).trim();
    if (!cleanId) return;

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
    const t1 = setTimeout(scrollToTarget, 80);
    const t2 = setTimeout(scrollToTarget, 250);
    const t3 = setTimeout(scrollToTarget, 500);
    const t4 = setTimeout(() => {
      scrollToTarget();
      hasInitialHashRef.current = false;
    }, 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [messages.length]);

  // Keep scroll glued to bottom on iOS Safari virtual keyboard resize
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

  // Optimistically show pending message immediately if this chat was just auto-created
  useEffect(() => {
    if (typeof window !== "undefined" && chatId) {
      const autoKey = `auto_send_${chatId}`;
      const autoDataStr = sessionStorage.getItem(autoKey);
      if (autoDataStr) {
        try {
          const autoData = JSON.parse(autoDataStr);
          if (autoData?.model) {
            setSelectedModel(autoData.model);
          }
          if (autoData?.think) {
            setThinkMode(true);
          }
          if (autoData?.prompt) {
            setPendingMessage({
              content: autoData.prompt,
              files: [],
              isThinkMode: !!autoData?.think,
            });
            setIsTyping(true);
          }
        } catch (e) {}
      }
    }
  }, [chatId]);

  useEffect(() => {
    setIsChatLoading(true);
    setMessages([]);
    setCurrentChatTitle("");
    setActivePreviewFile(null);
    setIsFilesDrawerOpen(false);
    savedChatScrollTopRef.current = null;
    savedAnchorElementRef.current = null;
  }, [chatId]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (isSigningOut) return;
      router.replace(withCurrentHash("/gc"));
      return;
    }
    if (chatId) {
      loadChat();
      loadChats();
    }
  }, [user?.id, loading, isSigningOut, chatId, router]);

  // Auto-focus chat input on load / reload (matching s/[id] behavior)
  useEffect(() => {
    if (!isChatLoading) {
      const timer = setTimeout(() => {
        const textarea = document.querySelector(
          "textarea"
        ) as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus({ preventScroll: true });
          const len = textarea.value.length;
          textarea.setSelectionRange(len, len);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isChatLoading]);

  // When previewing a file, focus input so user can immediately type
  useEffect(() => {
    if (activePreviewFile) {
      const timer = setTimeout(() => {
        const textarea = document.querySelector(
          "textarea"
        ) as HTMLTextAreaElement | null;
        textarea?.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activePreviewFile]);

  const handleToggleArchive = async (id: string, archived: boolean) => {
    if (archived) {
      await chatService.toggleChatStar(supabase, id, false);
    }
    await chatService.toggleChatArchive(supabase, id, archived);
    await loadChats();
    toast.success(archived ? "Chat archived" : "Chat unarchived");
  };

  const loadChat = async () => {
    if (!user || !chatId) return;
    try {
      const details = await chatService.getChatDetails(supabase, chatId);
      if (!details) {
        router.push("/c");
        return;
      }
      setCurrentChatTitle(details.title || "");
      const dbMessages = details.messages || [];
      setMessages(dbMessages);
      setPendingMessage((prev) => {
        if (!prev) return null;
        const existsInDb = dbMessages.some(
          (m: any) =>
            m.role === "user" && m.content?.trim() === prev.content?.trim()
        );
        return existsInDb ? null : prev;
      });

      // Auto-heal truncated titles for existing chats
      const firstMsg = details.messages
        ?.find((m: any) => m.role === "user")
        ?.content?.trim();
      if (
        firstMsg &&
        details.title !== firstMsg &&
        (details.title?.endsWith("...") ||
          details.title?.endsWith("…") ||
          details.title?.length < firstMsg.length)
      ) {
        supabase
          .from("chats")
          .update({ title: firstMsg })
          .eq("id", chatId)
          .then(() => {});
        setCurrentChatTitle(firstMsg);
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, title: firstMsg } : c))
        );
      }

      // Check if this chat was just created with a pending auto-send prompt
      if (typeof window !== "undefined" && !autoSendTriggeredRef.current) {
        const autoKey = `auto_send_${chatId}`;
        const autoDataStr = sessionStorage.getItem(autoKey);
        if (autoDataStr) {
          sessionStorage.removeItem(autoKey);
          autoSendTriggeredRef.current = true;
          const autoData = JSON.parse(autoDataStr);
          if (autoData?.prompt) {
            if (autoData?.model) {
              setSelectedModel(autoData.model);
            }
            if (autoData?.think) {
              setThinkMode(true);
            }
            triggerAiGeneration(
              autoData.prompt,
              autoData?.model,
              !!autoData?.think
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading chat:", error);
      toast.error("Failed to load chat");
      router.push("/c");
    } finally {
      setIsChatLoading(false);
    }
  };

  const streamAbortControllerRef = useRef<boolean>(false);

  const handleStop = () => {
    streamAbortControllerRef.current = true;
    setIsTyping(false);
  };

  const streamAssistantResponse = async (
    userMessage: any,
    fullAssistantMessage: any,
    baseMessages?: any[]
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
          m.id !== assistantId &&
          !(
            m.role === "user" &&
            m.content === userMessage.content &&
            (m.id?.startsWith("msg-") || m.id?.startsWith("pending-"))
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

    // Final update with complete content
    setMessages((prev) => {
      const copy = [...prev];
      const lastIdx = copy.length - 1;
      if (copy[lastIdx] && copy[lastIdx].id === assistantId) {
        copy[lastIdx] = { ...copy[lastIdx], content: fullText };
      }
      return copy;
    });

    setIsTyping(false);
    if (isAutoScrollPinnedRef.current) {
      forceScrollToBottom();
    }
  };

  const triggerAiGeneration = async (
    promptText: string,
    modelOverride?: string,
    thinkOverride?: boolean
  ) => {
    const isThink = thinkOverride !== undefined ? thinkOverride : thinkMode;
    if (thinkMode) {
      setThinkMode(false);
    }
    setIsTyping(true);
    setPendingMessage({ content: promptText, files: [], isThinkMode: isThink });
    isAutoScrollPinnedRef.current = true;
    setShowScrollBottom(false);
    setTimeout(forceScrollToBottom, 0);
    setTimeout(forceScrollToBottom, 60);
    setTimeout(forceScrollToBottom, 180);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      let authToken = token;
      if (!authToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData?.session?.access_token || null;
      }
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const reqStart = Date.now();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify(
          withChatPreferences({
            chatId,
            message: promptText,
            files: [],
            model: modelOverride || selectedModel,
            think: isThink,
          })
        ),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate response");
      }

      const result = await response.json();
      const actualElapsedSecs = Math.max(
        1,
        Math.round((Date.now() - reqStart) / 1000)
      );
      if (result.assistantMessage) {
        if (isThink || result.assistantMessage.metadata?.think) {
          result.assistantMessage.metadata = {
            ...(result.assistantMessage.metadata || {}),
            think: true,
            thinkTime: actualElapsedSecs,
          };
        }
      }

      if (result.assistantMessage && result.userMessage) {
        await streamAssistantResponse(
          result.userMessage,
          result.assistantMessage
        );
      } else {
        const details = await chatService.getChatDetails(supabase, chatId);
        if (details?.messages) {
          setMessages(details.messages);
        }
        setIsTyping(false);
        setPendingMessage(null);
      }
      await loadChats();
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast.error(error.message || "Failed to generate response");
      setInputValue(promptText);
      setIsTyping(false);
      setPendingMessage(null);
    }
  };

  const handleEditAndResend = async (
    messageId: string,
    newContent: string,
    messageIndex: number
  ) => {
    if (!newContent.trim() || !user || !chatId) return;

    // Abort active stream immediately if currently generating
    streamAbortControllerRef.current = true;

    // 1. Truncate local messages array up to messageIndex
    const remainingMessages = messages.slice(0, messageIndex);
    setMessages(remainingMessages);

    // 2. Set pending message and typing indicator
    const currentThinkMode = thinkMode;
    if (thinkMode) {
      setThinkMode(false);
    }
    setPendingMessage({
      content: newContent,
      files: [],
      isThinkMode: currentThinkMode,
    });
    setIsTyping(true);
    isAutoScrollPinnedRef.current = true;
    setShowScrollBottom(false);
    setTimeout(forceScrollToBottom, 0);
    setTimeout(forceScrollToBottom, 60);
    setTimeout(forceScrollToBottom, 180);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      let authToken = token;
      if (!authToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData?.session?.access_token || null;
      }
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // 3. Call /api/chat with truncateMessageId to prune DB messages from that point
      const reqStart = Date.now();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify(
          withChatPreferences({
            chatId,
            message: newContent,
            files: [],
            truncateMessageId: messageId,
            model: selectedModel,
            think: currentThinkMode,
          })
        ),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to regenerate response");
      }

      const result = await response.json();
      const actualElapsedSecs = Math.max(
        1,
        Math.round((Date.now() - reqStart) / 1000)
      );
      if (result.assistantMessage) {
        if (currentThinkMode || result.assistantMessage.metadata?.think) {
          result.assistantMessage.metadata = {
            ...(result.assistantMessage.metadata || {}),
            think: true,
            thinkTime: actualElapsedSecs,
          };
        }
      }
      if (result.userMessage && result.assistantMessage) {
        await streamAssistantResponse(
          result.userMessage,
          result.assistantMessage,
          remainingMessages
        );
      } else {
        await loadChat();
        setIsTyping(false);
        setPendingMessage(null);
      }
      await loadChats();
    } catch (error: any) {
      console.error("Error editing message:", error);
      toast.error(error.message || "Failed to regenerate response");
      await loadChat();
      setIsTyping(false);
      setPendingMessage(null);
    }
  };

  const handleRegenerate = async (
    assistantMsg?: Message,
    assistantIndex?: number
  ) => {
    if (isTyping || !user || !chatId) return;

    let targetIdx =
      typeof assistantIndex === "number" ? assistantIndex : messages.length - 1;

    // Find the nearest preceding user message to regenerate from
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

  const handleSend = async (customMessage?: string) => {
    const isCustom = typeof customMessage === "string";
    const textToSend = isCustom ? customMessage.trim() : inputValue.trim();
    const currentFiles = isCustom ? [] : [...uploadedFiles];
    const previewFileSnapshot = activePreviewFile;

    if (!textToSend && currentFiles.length === 0 && !previewFileSnapshot)
      return;
    if (!user || isTyping) return;

    // If a file preview is open, snapshot it to send with this message and auto-close preview
    let previewFileData: any = null;
    if (previewFileSnapshot) {
      previewFileData = {
        name:
          previewFileSnapshot.name || previewFileSnapshot.filename || "file",
        filename:
          previewFileSnapshot.filename || previewFileSnapshot.name || "file",
        url:
          getFileUrl(previewFileSnapshot) ||
          previewFileSnapshot.url ||
          previewFileSnapshot.publicUrl ||
          "",
        publicUrl:
          previewFileSnapshot.publicUrl ||
          getFileUrl(previewFileSnapshot) ||
          previewFileSnapshot.url ||
          "",
        type: previewFileSnapshot.type || "",
        size: previewFileSnapshot.size || 0,
      };
      handleClosePreview();
    }

    const messageContent = isCustom ? customMessage.trim() : inputValue;

    if (!isCustom) {
      setInputValue("");
      setUploadedFiles([]);
    }
    const currentThinkMode = thinkMode;
    if (thinkMode) {
      setThinkMode(false);
    }

    const allPendingFiles = [...currentFiles];
    if (previewFileData) {
      allPendingFiles.push(previewFileData);
    }

    setPendingMessage({
      content: messageContent,
      files: allPendingFiles,
      isThinkMode: currentThinkMode,
    });
    setIsTyping(true);
    isAutoScrollPinnedRef.current = true;
    setShowScrollBottom(false);

    // Immediate scroll + interval scrolls through iOS Safari keyboard dismissal
    setTimeout(forceScrollToBottom, 0);
    setTimeout(forceScrollToBottom, 60);
    setTimeout(forceScrollToBottom, 150);
    setTimeout(forceScrollToBottom, 320);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let fileData: any[] = [];
      if (previewFileData) {
        fileData.push(previewFileData);
      }
      if (currentFiles.length > 0) {
        setIsUploading(true);
        for (const file of currentFiles) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadHeaders: Record<string, string> = {};
          if (token) {
            uploadHeaders["Authorization"] = `Bearer ${token}`;
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

      const reqStart = Date.now();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify(
          withChatPreferences({
            chatId,
            message: messageContent,
            files: fileData,
            model: selectedModel,
            think: currentThinkMode,
          })
        ),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to send message");
      }

      const result = await response.json();
      const actualElapsedSecs = Math.max(
        1,
        Math.round((Date.now() - reqStart) / 1000)
      );
      if (result.assistantMessage) {
        if (currentThinkMode || result.assistantMessage.metadata?.think) {
          result.assistantMessage.metadata = {
            ...(result.assistantMessage.metadata || {}),
            think: true,
            thinkTime: actualElapsedSecs,
          };
        }
      }

      if (result.userMessage && result.assistantMessage) {
        await streamAssistantResponse(
          result.userMessage,
          result.assistantMessage
        );
      } else {
        await loadChat();
        setIsTyping(false);
        setPendingMessage(null);
      }
      await loadChats();
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
      if (!isCustom) {
        setInputValue(messageContent);
        setUploadedFiles(currentFiles);
      }
      setIsTyping(false);
      setIsUploading(false);
      setPendingMessage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMessage = async (
    messageId: string,
    messageIndex: number
  ) => {
    if (!chatId || isTyping) return;
    try {
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

      const trueId = targetMsg.id;
      let pairedAssistantId: string | undefined = undefined;
      if (
        targetMsg.role === "user" &&
        actualIndex + 1 < messages.length &&
        messages[actualIndex + 1]?.role === "assistant"
      ) {
        pairedAssistantId = messages[actualIndex + 1].id;
      }

      const idsToRemove = new Set([trueId]);
      if (pairedAssistantId) {
        idsToRemove.add(pairedAssistantId);
      }
      const remainingMessages = messages.filter((m) => !idsToRemove.has(m.id));
      setMessages(remainingMessages);

      if (remainingMessages.length === 0) {
        // If chat becomes empty (single message chat), delete whole chat and open new chat instantly
        deleteChat(chatId).catch(console.error);
        toast.success("Chat deleted");
        router.replace("/c");
        return;
      }

      await chatService.deleteMessage(
        supabase,
        trueId,
        pairedAssistantId,
        chatId
      );
      toast.success("Message deleted");
      await loadChats();
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast.error(error.message || "Failed to delete message");
      await loadChat();
    }
  };

  // Dynamic document title: "CloseAI — <chat full message>"
  const firstUserMsg = messages.find((m) => m.role === "user")?.content?.trim();
  const rawTitle =
    firstUserMsg ||
    pendingMessage?.content?.trim() ||
    currentChatTitle ||
    chats.find((c) => c.id === chatId)?.title ||
    "";
  const cleanTitle = rawTitle
    .replace(/(\.\.\.|\u2026)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  useEffect(() => {
    if (cleanTitle) {
      document.title = `CloseAI \u007C ${cleanTitle}`;
    } else {
      document.title = "CloseAI";
    }
    return () => {
      document.title = "CloseAI";
    };
  }, [cleanTitle]);

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden">
      <title>{cleanTitle ? `CloseAI \u007C ${cleanTitle}` : "CloseAI"}</title>
      {/* Sidebar */}
      <Sidebar
        user={user}
        chats={chats}
        currentChatId={chatId}
        onChatSelect={(id) => router.push(`/c/${id}`)}
        onNewChat={() => {
          if (typeof window !== "undefined" && window.innerWidth < 1280) {
            setSidebarOpen(false);
          }
          router.push("/c");
        }}
        onDeleteChat={(id) => {
          deleteChat(id)
            .then(() => toast.success("Chat deleted"))
            .catch(() => toast.error("Failed to delete chat"));
          if (id === chatId) {
            router.replace("/c");
          }
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden selection:bg-secondary selection:text-foreground">
        {/* Transparent Floating Header - Buttons float cleanly on top, no background bar/patti */}
        <header className="absolute top-0 left-0 right-0 z-30 h-14 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-4 flex items-center justify-between select-none pointer-events-none bg-transparent">
          {/* Top gradient overlay — fades scrolled text behind header buttons */}
          <div className="absolute top-0 left-0 right-4 sm:right-5 h-20 pointer-events-none bg-gradient-to-b from-background via-background to-transparent -z-10" />
          {activePreviewFile ? (
            /* PREVIEW HEADER: Filename on left, Download + Close on right */
            <>
              <div className="flex items-center gap-2.5 pointer-events-auto mt-3 pl-3 sm:pl-0 min-w-0 pr-3">
                <span className="text-foreground font-semibold text-[14.5px] sm:text-base truncate max-w-[260px] sm:max-w-md select-none">
                  {activePreviewFile.name ||
                    activePreviewFile.filename ||
                    "File"}
                </span>
              </div>

              <div className="flex items-center pointer-events-auto mt-3 pr-3 sm:pr-1 shrink-0">
                {/* Full Container wrapping both Download and Close buttons */}
                <div className="flex items-center h-11 p-0.5 gap-0.5 rounded-xl bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none">
                  {previewFileUrl && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={handleDownloadActiveFile}
                          className="group h-full w-10 sm:w-11 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0"
                          aria-label="Download file"
                        >
                          <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        sideOffset={6}
                        className="text-md"
                      >
                        Download file
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleClosePreview}
                        className="group h-full w-10 sm:w-11 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0"
                        aria-label="Close preview"
                      >
                        <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      align="end"
                      sideOffset={6}
                      className="text-md"
                    >
                      Close preview
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </>
          ) : (
            /* NORMAL CHAT HEADER: Sidebar toggle on left, Share & More options on right */
            <>
              <div className="flex items-center pointer-events-auto mt-3 pl-3 sm:pl-0">
                {!sidebarOpen && (
                  /* Full Container wrapping both Open sidebar and New chat buttons */
                  <div className="xl:hidden flex items-center h-12 p-0.5 gap-0.5 rounded-sm bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none">
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
                          className="group h-full w-11 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0"
                          aria-label="Open sidebar"
                        >
                          <PanelRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
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
                          onClick={() => {
                            if (typeof window !== "undefined" && window.innerWidth < 1280) {
                              setSidebarOpen(false);
                            }
                            router.push("/c");
                          }}
                          className="sm:hidden group h-full w-11 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0"
                          aria-label="New chat"
                        >
                          <SquarePen className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
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
                  </div>
                )}
              </div>

              <div className="flex items-center pointer-events-auto mt-3 pr-3 sm:pr-1">
                {/* Full Container wrapping both Share and More options buttons */}
                <div className="flex items-center h-12 p-0.5 gap-0.5 rounded-sm bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={isSharing}
                        onClick={async () => {
                          setIsSharing(true);
                          try {
                            const shareUrl = `${window.location.origin}/s/${chatId}`;
                            await navigator.clipboard.writeText(shareUrl);
                            toast.success(
                              "Public link copied to your clipboard",
                              {
                                description:
                                  "Anyone with this link can see this conversation",
                              }
                            );
                          } catch (e) {
                            toast.error("Failed to copy link");
                          } finally {
                            setTimeout(() => setIsSharing(false), 300);
                          }
                        }}
                        className="group h-full w-11 sm:w-auto px-0 sm:px-4 gap-1.5 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 text-foreground flex items-center justify-center text-sm sm:text-base font-medium transition-colors cursor-pointer outline-none focus:outline-none disabled:opacity-70 disabled:pointer-events-auto disabled:cursor-not-allowed select-none"
                      >
                        {isSharing ? (
                          <Loader className="w-4 h-4 shrink-0 animate-spin text-muted-foreground group-hover:text-foreground" />
                        ) : (
                          <Upload className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                        )}
                        <span className="hidden sm:inline">Share</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      sideOffset={6}
                      className="text-md"
                    >
                      Share conversation
                    </TooltipContent>
                  </Tooltip>

                  {/* Three Dots Options Menu */}
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="group h-full w-11 rounded-sm hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 data-[state=open]:bg-black/5 dark:data-[state=open]:bg-white/10 text-neutral-700 dark:text-neutral-200 hover:text-foreground dark:hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0"
                            aria-label="More options"
                          >
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="end"
                        sideOffset={6}
                        className="text-md"
                      >
                        More options
                      </TooltipContent>
                    </Tooltip>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={6}
                      className="w-52 rounded-sm p-1.5 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none"
                    >
                      <DropdownMenuItem
                        onClick={() => setIsFilesDrawerOpen(true)}
                        className="group flex items-center gap-2.5 px-3 py-2 rounded-sm text-[15px] font-normal cursor-pointer text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      >
                        <Folder className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        <span>View files in chat</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={async () => {
                          const currentChat = chats.find((c) => c.id === chatId);
                          const isStarred = !!currentChat?.starred;
                          if (!isStarred) {
                            await chatService.toggleChatArchive(
                              supabase,
                              chatId,
                              false
                            );
                          }
                          await chatService.toggleChatStar(
                            supabase,
                            chatId,
                            !isStarred
                          );
                          loadChats();
                          toast.success(
                            isStarred ? "Chat unpinned" : "Chat pinned"
                          );
                        }}
                        className="group flex items-center gap-2.5 px-3 py-2 rounded-sm text-[15px] font-normal cursor-pointer text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      >
                        {chats.find((c) => c.id === chatId)?.starred ? (
                          <>
                            <PinOff className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                            <span>Unpin</span>
                          </>
                        ) : (
                          <>
                            <Pin className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                            <span>Pin</span>
                          </>
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={async () => {
                          const currentChat = chats.find((c) => c.id === chatId);
                          const isArchived = !!currentChat?.archived;
                          await handleToggleArchive(chatId, !isArchived);
                        }}
                        className="group flex items-center gap-2.5 px-3 py-2 rounded-sm text-[15px] font-normal cursor-pointer text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      >
                        {chats.find((c) => c.id === chatId)?.archived ? (
                          <ArchiveX className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        ) : (
                          <Archive className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        )}
                        <span>
                          {chats.find((c) => c.id === chatId)?.archived
                            ? "Unarchive"
                            : "Archive"}
                        </span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setShowDeleteModal(true)}
                        className="group flex items-center gap-2.5 px-3 py-2 rounded-sm text-[15px] font-normal cursor-pointer text-red-600 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </>
          )}
        </header>

        {/* Full-Height Scrollable Message Stream — scrollbar runs full height without heading strip */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 w-full overflow-x-hidden relative flex flex-col pt-14 overflow-y-scroll overscroll-y-contain [scrollbar-gutter:stable]"
        >
          <div className="flex-1 flex flex-col min-h-full">
            {/* File Preview In-Page Viewer */}
            {activePreviewFile && (
              <div className="flex-1 flex flex-col min-h-0 pb-4">
                <FilePreviewViewer
                  file={activePreviewFile}
                  onClose={handleClosePreview}
                />
              </div>
            )}

            {/* Messages Container or Loader */}
            {isChatLoading && !pendingMessage && messages.length === 0 && !activePreviewFile ? (
              <div className="flex-1 w-full h-full flex flex-col items-center justify-center pb-16 text-muted-foreground">
                <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className={cn("flex-1 pb-4 sm:pb-6", activePreviewFile && "hidden")}>
                <MessageList
                  messages={messages}
                  user={user}
                  isTyping={isTyping}
                  pendingMessage={pendingMessage}
                  onRegenerate={handleRegenerate}
                  onSendMessage={handleSend}
                  onEditAndResend={handleEditAndResend}
                  onDeleteMessage={handleDeleteMessage}
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
                  onStop={handleStop}
                  uploadedFiles={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  isTyping={isTyping}
                  isUploading={isUploading}
                  placeholder={
                    activePreviewFile
                      ? "Ask CloseAI about this"
                      : "Ask CloseAI"
                  }
                  showDisclaimer={true}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  selectedTier={selectedModelTier}
                  onTierChange={setSelectedModelTier}
                  thinkMode={thinkMode}
                  onThinkModeChange={setThinkMode}
                  isGuest={isGuest}
                >
                  {/* Dynamic Floating Scroll-to-Bottom Button — stays right above input pill */}
                  <AnimatePresence>
                    {showScrollBottom && !activePreviewFile && !isFilesDrawerOpen && (
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
                                    ? "bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none"
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

        {/* Right-Edge TOC Navigator — placed relative to Main Chat Area so it glides beside scrollbar when drawer opens */}
        {!isChatLoading && !activePreviewFile && (
          <TocNavigator messages={messages} containerRef={scrollContainerRef} />
        )}
      </div>

      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        itemTitle={currentChatTitle || "Chat"}
        promptText={
          messages.find((m) => m.role === "user")?.content ||
          currentChatTitle ||
          "Chat"
        }
        files={messages.find((m) => m.role === "user")?.files}
        isGuest={isGuest}
        onConfirm={() => {
          setShowDeleteModal(false);
          deleteChat(chatId)
            .then(() => toast.success("Chat deleted"))
            .catch(() => toast.error("Failed to delete chat"));
          router.replace("/c");
        }}
      />

      <FilesDrawer
        isOpen={isFilesDrawerOpen}
        onOpenChange={setIsFilesDrawerOpen}
        files={chatFiles}
        title="Files in chat"
        placement="right"
        backdrop="blur"
        onFileSelect={(file) => {
          handleOpenPreview(file, true);
        }}
      />
    </div>
  );
}
