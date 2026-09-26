"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Message } from "@/lib/chat-service";
import { CloseAIIcon } from "@/components/brand/logo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Prism from "prismjs";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-css";
import "prismjs/components/prism-java";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Share2,
  Paperclip,
  ArrowDown,
  Volume2,
  VolumeX,
  Loader,
  MoreHorizontal,
  Pencil,
  Upload,
  Trash2,
  BookOpen,
  GitBranch,
  Package,
  ArrowUp,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { AnimatedComingSoonText } from "@/components/ui/animated";
import { cn } from "@/lib/utils";
import toast from "@/lib/toast";
import { SharePromptModal } from "@/components/modals/share-prompt-modal";
import { ShareResponseModal } from "@/components/modals/share-response-modal";
import { DeleteMessageModal } from "@/components/modals/delete-message-modal";
import { ThinkReasoning } from "@/components/chat/think-reasoning";
import { FilePreviewModal } from "@/components/modals/file-preview-modal";
import { ImagePreview } from "@/components/ui/image-preview";
import { getFileIconInfo } from "@/lib/file-utils";

export interface MessageListProps {
  messages: Message[];
  user: User | null;
  isTyping: boolean;
  isGuest?: boolean;
  pendingMessage: {
    content: string;
    files: any[];
    isThinkMode?: boolean;
  } | null;
  onRegenerate?: (message?: Message, index?: number) => void;
  onSendMessage?: (content: string) => void;
  onEditMessage?: (content: string) => void;
  onEditAndResend?: (
    messageId: string,
    newContent: string,
    messageIndex: number
  ) => void;
  onDeleteMessage?: (messageId: string, messageIndex: number) => void;
  showMessageActions?: boolean;
}

const LANG_ALIAS: Record<string, string> = {
  "c++": "cpp",
  cpp: "cpp",
  c: "c",
  py: "python",
  python: "python",
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  jsx: "jsx",
  tsx: "tsx",
  sh: "bash",
  shell: "bash",
  bash: "bash",
  zsh: "bash",
  json: "json",
  sql: "sql",
  css: "css",
  html: "markup",
  xml: "markup",
  svg: "markup",
  markup: "markup",
  java: "java",
  cs: "csharp",
  csharp: "csharp",
  "c#": "csharp",
  go: "go",
  golang: "go",
  rust: "rust",
  rs: "rust",
};

function highlightCode(code: string, lang: string): string {
  const cleanLang = (lang || "").toLowerCase().trim();
  const normalized = LANG_ALIAS[cleanLang] || cleanLang;
  const grammar =
    Prism.languages[normalized] ||
    Prism.languages.clike ||
    Prism.languages.javascript;
  if (!grammar) {
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  try {
    return Prism.highlight(code, grammar, normalized);
  } catch (e) {
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

/** Preprocesses LaTeX formula markers, currency dollar signs, table formatting, and unclosed delimiters */
function preprocessContent(text: string): string {
  if (!text) return "";

  let result = text;

  // 1. Convert pipe-pipe separated lines into proper markdown table rows with newlines
  result = result.replace(/\|\s*\|\s*/g, "|\n| ");

  // 2. Prevent currency dollar signs ($100, $1 Trillion, $2.5B) from being incorrectly parsed as LaTeX math
  // In KaTeX / remark-math, any $ followed immediately by a digit is a monetary amount, not a formula
  result = result.replace(/(?<!\\)\$(?=\d)/g, "\\$");

  // 3. Normalize LaTeX display/inline brackets \[ \] and \( \)
  result = result
    .replace(/\\\[([\s\S]*?)\\\]/g, "$$$$$1$$$$")
    .replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$");

  // 4. Fix unescaped underscores inside \text{...} in math formulas
  result = result.replace(/\\text\{([^}]+)\}/g, (_, inner) => {
    return `\\text{${inner.replace(/(?<!\\)_/g, "\\_")}}`;
  });

  // 5. Clean up awkward spaced asterisks like "* *, **"
  result = result.replace(/\*\s+\*,\s+\*\*/g, ", **");

  // 6. Auto-close dangling unclosed code blocks (```) during streaming/interrupted generation
  const codeBlockCount = (result.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    result += "\n```";
  }

  // 7. Auto-close dangling bold (**) during streaming/interrupted generation
  const boldCount = (result.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    result += "**";
  }

  return result;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  let displayLang = language ? language.toLowerCase().trim() : "";

  if (!displayLang) {
    const firstLine = code.trim().split("\n")[0].trim();

    if (
      /^(sudo|brew|apt|dnf|pacman|yum|npm|npx|pnpm|yarn|git|docker|curl|wget|cd|mkdir|chmod|chown|systemctl|export|source|sh|bash)\b/.test(
        firstLine
      )
    ) {
      displayLang = "bash";
    } else {
      displayLang = "code";
    }
  }

  const highlightedHtml = useMemo(() => {
    return highlightCode(code, displayLang);
  }, [code, displayLang]);

  // Detect when the sticky header is actually "stuck" vs in its normal flow position
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel (placed just above the header) scrolls out of view,
        // the header has become stuck to the top.
        setIsStuck(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "0px 0px 0px 0px",
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="
        relative my-4
        rounded-2xl sm:rounded-3xl
        bg-bubble dark:bg-[#2F2F2F]
        text-left
        isolate
        overflow-visible
      "
    >
      {/* Sentinel: sits right before the header, used to detect stuck state */}
      <div
        ref={sentinelRef}
        className="absolute -top-10 h-px w-full"
        aria-hidden="true"
      />

      <div
        className={cn(
          `
          sticky -top-3.5 z-10
          flex items-center justify-between
          px-4 py-2
          bg-bubble dark:bg-[#2F2F2F]
          text-xs font-sans
        text-neutral-600 dark:text-neutral-300
          select-none
          `,
          isStuck
            ? "rounded-b-2xl sm:rounded-b-3xl shadow-[0_1px_0_0_rgba(229,229,229,0.8)] dark:shadow-[0_1px_0_0_rgba(64,64,64,0.6)]"
            : "rounded-t-2xl sm:rounded-t-3xl"
        )}
      >
        <span className="font-mono text-base lowercase font-medium tracking-wide text-foreground">
          {displayLang}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="
            group/copy-btn
            flex items-center gap-1.5
            px-2 py-2
            rounded-2xl sm:rounded-3xl
            text-base
            hover:bg-neutral-200/80
            dark:hover:bg-white/10
            transition-colors
            cursor-pointer
            outline-none
          "
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-muted-foreground group-hover/copy-btn:text-foreground transition-colors" />
              <span className="font-medium text-foreground">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-muted-foreground group-hover/copy-btn:text-foreground transition-colors" />
              <span className="font-medium text-foreground">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="rounded-b-2xl sm:rounded-b-3xl overflow-hidden bg-bubble dark:bg-[#2F2F2F]">
        <div
          className="
           p-3.5 sm:p-4
            overflow-x-auto
            code-scroll
            text-[15px] sm:text-[14px]
            font-mono
            leading-relaxed
            select-text
          "
        >
          <pre className="!m-0 !p-0 bg-transparent border-0 font-mono whitespace-pre w-max min-w-full">
            <code
              className={`!bg-transparent !p-0 font-mono whitespace-pre block language-${displayLang}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}

function isImageFile(file: any): boolean {
  if (
    file?.type &&
    typeof file.type === "string" &&
    file.type.toLowerCase().startsWith("image/")
  ) {
    return true;
  }
  const name = file?.filename || file?.name || file?.url || "";
  if (typeof name === "string") {
    return (
      /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif)(\?.*)?$/i.test(name) ||
      /^pasted_image/i.test(name)
    );
  }
  return false;
}

function MessageAttachmentItem({
  file,
  onPreview,
}: {
  file: any;
  onPreview?: (file: any) => void;
}) {
  const isImg = isImageFile(file);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (file?.url && typeof file.url === "string") return file.url;
    if (typeof window !== "undefined" && file instanceof File) {
      try {
        return URL.createObjectURL(file);
      } catch (e) {
        return "";
      }
    }
    return "";
  });

  useEffect(() => {
    if (file?.url && typeof file.url === "string") {
      setImgSrc(file.url);
    } else if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setImgSrc(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const displayName = file?.filename || file?.name || "File";
  const { Icon, label, colorClass, badgeBg } = getFileIconInfo(file);

  if (isImg && imgSrc) {
    return (
      <ImagePreview src={imgSrc} alt={displayName}>
        <div
          className="relative flex leading-[0] overflow-clip rounded-2xl sm:rounded-3xl bg-bubble dark:bg-[#2F2F2F] border border-border/80 max-w-[100px] sm:max-w-[200px] cursor-pointer select-none hover:opacity-90 transition-opacity"
          title={`Preview ${displayName}`}
        >
          <img
            src={imgSrc}
            alt={displayName}
            className="block m-0 w-full max-h-[100px] sm:max-h-[200px] object-cover pointer-events-none"
            draggable={false}
          />
        </div>
      </ImagePreview>
    );
  }

  // Non-image file pill with simple Phosphor icon and ext badge
  return (
    <button
      type="button"
      onClick={() => onPreview?.(file)}
      className="flex self-end items-center gap-2.5 bg-bubble dark:bg-[#2F2F2F] hover:opacity-90 text-foreground text-xs sm:text-sm px-3 py-2.5 rounded-2xl sm:rounded-3xl border border-border/80 transition-colors cursor-pointer group select-none text-left"
      title={`Preview ${displayName}`}
    >
      <Icon className="w-5 h-5 shrink-0 text-muted-foreground" weight="fill" />
      <span className="truncate max-w-[100px] sm:max-w-[200px] font-normal">
        {displayName}
      </span>
    </button>
  );
}

function getFeedbackCookie(): Record<string, "up" | "down"> {
  if (typeof document === "undefined") return {};
  try {
    const cookies = document.cookie.split("; ");
    const feedbackCookie = cookies.find((row) =>
      row.trim().startsWith("feedback_response=")
    );
    if (feedbackCookie) {
      const rawVal = feedbackCookie.split("=")[1] || "";
      if (!rawVal) return {};
      const res: Record<string, "up" | "down"> = {};
      rawVal.split(",").forEach((pair) => {
        const [id, type] = pair.split(":");
        if (id && (type === "up" || type === "down")) {
          res[id] = type;
        }
      });
      return res;
    }
  } catch (e) {
    console.error("Error reading feedback cookie:", e);
  }
  return {};
}

function setFeedbackCookie(data: Record<string, "up" | "down">) {
  if (typeof document === "undefined") return;
  try {
    const entries = Object.entries(data).filter(
      ([_, type]) => type === "up" || type === "down"
    );
    if (entries.length === 0) {
      document.cookie = "feedback_response=; path=/; max-age=0";
      return;
    }
    const val = entries.map(([id, type]) => `${id}:${type}`).join(",");
    document.cookie = `feedback_response=${val}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {
    console.error("Error writing feedback cookie:", e);
  }
}

function formatMessageTime(dateInput?: string | Date): string {
  try {
    if (!dateInput) {
      const now = new Date();
      return `Today, ${now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    }
    const cleanInput =
      typeof dateInput === "string" ? dateInput.replace(" ", "T") : dateInput;
    const d = new Date(cleanInput);
    if (isNaN(d.getTime())) {
      const now = new Date();
      return `Today, ${now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    }
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    const isThisYear = d.getFullYear() === now.getFullYear();
    const dateStr = isThisYear
      ? d.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })
      : d.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

    return `${dateStr}, ${timeStr}`;
  } catch {
    const now = new Date();
    return `Today, ${now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }
}

export function MessageList({
  messages,
  user,
  isTyping,
  isGuest,
  pendingMessage,
  onRegenerate,
  onSendMessage,
  onEditMessage,
  onEditAndResend,
  onDeleteMessage,
  showMessageActions = true,
}: MessageListProps) {
  const isGuestMode = isGuest ?? (!user);
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [changePrompts, setChangePrompts] = useState<Record<string, string>>(
    {}
  );
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const [loadingFeedbackId, setLoadingFeedbackId] = useState<string | null>(
    null
  );
  const [loadingSpeechId, setLoadingSpeechId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraftText, setEditDraftText] = useState<string>("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [sharePromptMsg, setSharePromptMsg] = useState<{
    text: string;
    files?: any[];
  } | null>(null);
  const [shareResponseMsg, setShareResponseMsg] = useState<{
    text: string;
    model?: string;
  } | null>(null);
  const [loadingShareId, setLoadingShareId] = useState<string | null>(null);
  const [deleteMessageTarget, setDeleteMessageTarget] = useState<{
    id: string;
    index: number;
    content: string;
    files?: any[];
  } | null>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [dropdownSubView, setDropdownSubView] = useState<"main" | "try-again">(
    "main"
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 1025);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync feedback state from cookie on mount
  useEffect(() => {
    const initialFeedback = getFeedbackCookie();
    setFeedback(initialFeedback);
  }, []);

  // Stop speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSendChangePrompt = (msgId: string) => {
    const text = (changePrompts[msgId] || "").trim();
    if (!text) return;
    setChangePrompts((prev) => ({ ...prev, [msgId]: "" }));
    if (typeof document !== "undefined") {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    }
    if (onSendMessage) {
      onSendMessage(text);
    } else if (onRegenerate) {
      onRegenerate();
    }
  };

  const handleReadAloud = (msgId: string, content: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Text-to-speech is not supported in this browser");
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      setLoadingSpeechId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setLoadingSpeechId(msgId);

    const plainText = content
      .replace(/```[\s\S]*?```/g, "Code block.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#*_-]/g, "")
      .trim();

    if (!plainText) {
      setLoadingSpeechId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(plainText);

    utterance.onstart = () => {
      setLoadingSpeechId(null);
      setSpeakingMessageId(msgId);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
      setLoadingSpeechId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
      setLoadingSpeechId(null);
    };

    try {
      window.speechSynthesis.speak(utterance);
      // Fallback timer if browser speech engine doesn't fire onstart callback immediately
      setTimeout(() => {
        setLoadingSpeechId((prev) => (prev === msgId ? null : prev));
        setSpeakingMessageId((prev) => (prev ? prev : msgId));
      }, 400);
    } catch (e) {
      setLoadingSpeechId(null);
      setSpeakingMessageId(null);
    }
  };

  // Auto-focus and resize textarea when entering edit mode
  useEffect(() => {
    if (editingMessageId && editTextareaRef.current) {
      editTextareaRef.current.focus();
      const valLength = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(valLength, valLength);
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height = `${Math.min(
        editTextareaRef.current.scrollHeight,
        280
      )}px`;
    }
  }, [editingMessageId]);

  const startEditing = (msgId: string, content: string) => {
    setEditingMessageId(msgId);
    setEditDraftText(content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditDraftText("");
  };

  const submitEdit = (msg: Message, index: number) => {
    if (!editDraftText.trim() || isTyping) return;
    const newContent = editDraftText.trim();
    setEditingMessageId(null);
    setEditDraftText("");
    if (onEditAndResend) {
      onEditAndResend(msg.id, newContent, index);
    } else if (onEditMessage) {
      onEditMessage(newContent);
    }
  };

  // Auto-scroll on new messages or typing
  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({
        behavior: "auto",
        block: "end",
      });
    }
  }, [messages.length, isTyping, pendingMessage]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: "up" | "down") => {
    const isCurrentlyActive = feedback[id] === type;

    // Clicking active feedback button again to remove feedback — no loader
    if (isCurrentlyActive) {
      setFeedback((prev) => {
        const next = { ...prev };
        delete next[id];
        setFeedbackCookie(next);
        return next;
      });
      return;
    }

    // Submitting new feedback — show loader
    const key = `${id}-${type}`;
    setLoadingFeedbackId(key);

    setTimeout(() => {
      setFeedback((prev) => {
        const next = { ...prev };
        next[id] = type;
        setFeedbackCookie(next);
        return next;
      });

      setLoadingFeedbackId(null);
      toast.success(type === "up" ? "Feedback submitted" : "Feedback recorded");
    }, 200);
  };

  let userMessageCounter = 0;

  const isThinking =
    isTyping &&
    (Boolean(pendingMessage) ||
      !messages.length ||
      messages[messages.length - 1]?.role === "user" ||
      (messages[messages.length - 1]?.role === "assistant" &&
        !messages[messages.length - 1]?.content));

  return (
    <>
      <div
        data-message-actions={showMessageActions ? "visible" : "hidden"}
        className="w-full max-w-3xl mx-auto pt-10 pb-2 space-y-5 px-6 selection:bg-secondary selection:text-foreground [&[data-message-actions=hidden]_[data-message-action=copy]]:hidden [&[data-message-actions=hidden]_[data-message-action=share]]:hidden"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const userMsgIndex = isUser ? userMessageCounter++ : null;
          const msgId = msg.id || `msg-${index}`;
          const isCopied = copiedId === msgId;
          const mId = msg.id
            ? msg.id.startsWith("m-")
              ? msg.id
              : `m-${msg.id}`
            : isUser
            ? `m-${userMsgIndex}`
            : `m-${index}`;

          if (isUser) {
            const isEditing = editingMessageId === msgId;
            const isLastUserMsg =
              !pendingMessage && index === messages.length - 1;
            const isThisMsgThinking = isLastUserMsg && isThinking;

            return (
              <div
                key={msgId}
                id={mId}
                className={cn(
                  "flex flex-col group [transform:translateZ(0)]",
                  isEditing ? "w-full items-stretch" : "items-end"
                )}
              >
                {/* Attached Files & Image Previews */}
                {msg.files && msg.files.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mb-2.5 justify-end items-end">
                    {msg.files.map((file: any, i: number) => (
                      <MessageAttachmentItem
                        key={file.id || file.url || i}
                        file={file}
                        onPreview={setPreviewFile}
                      />
                    ))}
                  </div>
                )}

                {isEditing ? (
                  /* Inline Editor */
                  <div className="w-full bg-bubble dark:bg-[#2F2F2F] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border">
                    <textarea
                      ref={editTextareaRef}
                      value={editDraftText}
                      onChange={(e) => {
                        setEditDraftText(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(
                          e.target.scrollHeight,
                          280
                        )}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          submitEdit(msg, index);
                        } else if (e.key === "Escape") {
                          cancelEditing();
                        }
                      }}
                      rows={Math.min(
                        Math.max(editDraftText.split("\n").length, 2),
                        8
                      )}
                      className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 resize-none text-[15px] sm:text-[15.5px] leading-relaxed text-background dark:text-foreground placeholder:text-muted-foreground select-text"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2 mt-2 pt-1 select-none">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-3.5 py-1.5 rounded-full text-[15px] font-medium bg-white/10 hover:bg-white/20 active:bg-white/25 text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => submitEdit(msg, index)}
                        disabled={!editDraftText.trim()}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[15px] font-medium transition-all",
                          editDraftText.trim()
                            ? "bg-white text-black hover:opacity-90 active:scale-95 cursor-pointer"
                            : "bg-white/20 text-white/40 cursor-not-allowed"
                        )}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* User Bubble Capsule */}
                    <div className="bg-bubble dark:bg-[#2F2F2F] text-foreground text-[15px] sm:text-[15.5px] leading-relaxed rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap select-text break-words">
                      {msg.content}
                    </div>

                    {/* User Hover Actions Toolbar */}
                    <div className="flex items-center gap-1 mt-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                      {/* 1. Copy message */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.content, msgId)}
                            className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            aria-label="Copy message"
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          sideOffset={4}
                          className="text-md"
                        >
                          Copy message
                        </TooltipContent>
                      </Tooltip>

                      {/* 2. Share prompt */}
                      {!isThisMsgThinking && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              data-message-action="share"
                              onClick={() => {
                                setLoadingShareId(msgId);
                                setTimeout(() => {
                                  setLoadingShareId(null);
                                  setSharePromptMsg({
                                    text: msg.content,
                                    files: msg.files,
                                  });
                                }, 300);
                              }}
                              className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              aria-label="Share prompt"
                            >
                              {loadingShareId === msgId ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            sideOffset={4}
                            className="text-md"
                          >
                            Share prompt
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* For authorized users only: Copy, Edit, Share, Delete */}
                      {user && (
                        <>
                          {/* 3. Edit prompt */}
                          {(onEditAndResend || onEditMessage) &&
                            !isThisMsgThinking && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditing(msgId, msg.content)
                                    }
                                    className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    aria-label="Edit prompt"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="bottom"
                                  sideOffset={4}
                                  className="text-md"
                                >
                                  Edit prompt
                                </TooltipContent>
                              </Tooltip>
                            )}

                          {/* 4. Delete message */}
                          {onDeleteMessage && !isThisMsgThinking && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteMessageTarget({
                                      id: msgId,
                                      index,
                                      content: msg.content,
                                      files: msg.files,
                                    })
                                  }
                                  className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                  aria-label="Delete message"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                sideOffset={4}
                                className="text-md"
                              >
                                Delete message
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          }

          // Assistant Message View
          return (
            <div key={msgId} id={mId} className="w-full group space-y-2">
              <div className="w-full space-y-3">
                {/* Collapsed Thought for Xs if this message was generated in think mode */}
                {msg.metadata?.think && (
                  <div className="pt-1 pb-1">
                    <ThinkReasoning
                      isThinking={false}
                      promptText={
                        index > 0 && messages[index - 1]?.role === "user"
                          ? messages[index - 1]?.content
                          : undefined
                      }
                      thinkingSteps={msg.metadata?.thinkingSteps}
                      elapsedSeconds={msg.metadata?.thinkTime || 5}
                    />
                  </div>
                )}
                {/* Message Content */}
                <div className="chat-markdown text-foreground select-text text-[15px] sm:text-[15.5px] leading-7 break-words w-full">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[
                      [rehypeKatex, { strict: false, throwOnError: false }],
                    ]}
                    components={{
                      table({ children }: any) {
                        return (
                          <div className="my-4 w-full overflow-x-auto rounded-xl border border-border/80 bg-card/40 [&_tr:hover_td]:!bg-transparent">
                            <table className="w-full text-left border-collapse text-sm !m-0">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children }: any) {
                        return (
                          <thead className="bg-secondary/70 dark:bg-[#1f1f1f] border-b border-border/80 text-foreground font-semibold text-xs tracking-wider uppercase">
                            {children}
                          </thead>
                        );
                      },
                      th({ children }: any) {
                        return (
                          <th className="px-4 py-2.5 font-semibold text-foreground text-xs uppercase tracking-wider">
                            {children}
                          </th>
                        );
                      },
                      td({ children }: any) {
                        return (
                          <td className="px-4 py-2.5 border-t border-border/80 text-foreground/90 text-sm align-top leading-relaxed">
                            {children}
                          </td>
                        );
                      },
                      tr({ children }: any) {
                        return <tr>{children}</tr>;
                      },
                      p({ children }: any) {
                        return (
                          <p className="mb-3.5 last:mb-0 leading-7 text-foreground/95">
                            {children}
                          </p>
                        );
                      },
                      h1({ children }: any) {
                        return (
                          <h1 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-foreground mt-7 mb-3 first:mt-0">
                            {children}
                          </h1>
                        );
                      },
                      h2({ children }: any) {
                        return (
                          <h2 className="text-xl sm:text-[22px] font-semibold tracking-tight text-foreground mt-6 mb-2.5 first:mt-0">
                            {children}
                          </h2>
                        );
                      },
                      h3({ children }: any) {
                        return (
                          <h3 className="text-lg sm:text-[19px] font-semibold tracking-tight text-foreground mt-5 mb-2 first:mt-0">
                            {children}
                          </h3>
                        );
                      },
                      h4({ children }: any) {
                        return (
                          <h4 className="text-base font-semibold text-foreground mt-4 mb-1.5 first:mt-0">
                            {children}
                          </h4>
                        );
                      },
                      ul({ children }: any) {
                        return (
                          <ul className="my-3 pl-6 list-disc space-y-1.5 text-foreground/95 leading-7">
                            {children}
                          </ul>
                        );
                      },
                      ol({ children }: any) {
                        return (
                          <ol className="my-3 pl-6 list-decimal space-y-1.5 text-foreground/95 leading-7">
                            {children}
                          </ol>
                        );
                      },
                      li({ children }: any) {
                        return <li className="leading-7 pl-0.5">{children}</li>;
                      },
                      blockquote({ children }: any) {
                        return (
                          <blockquote className="my-4 border-l-2 border-border/80 pl-4 italic text-muted-foreground leading-7">
                            {children}
                          </blockquote>
                        );
                      },
                      hr() {
                        return <hr className="my-6 border-border/80" />;
                      },
                      strong({ children }: any) {
                        return (
                          <strong className="font-semibold text-foreground">
                            {children}
                          </strong>
                        );
                      },
                      pre({ children }: any) {
                        if (React.isValidElement(children)) {
                          const childProps: any = children.props || {};
                          const match = /language-(\w+)/.exec(
                            childProps.className || ""
                          );
                          const lang = match ? match[1] : "";
                          const rawCode = Array.isArray(childProps.children)
                            ? childProps.children.join("")
                            : String(childProps.children || "");
                          return (
                            <CodeBlock
                              language={lang}
                              code={rawCode.replace(/\n$/, "")}
                            />
                          );
                        }
                        return (
                          <div className="my-3 sm:my-4 rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50 dark:bg-[#1e1e1e] p-3 code-scroll">
                            <pre className="text-[15px] font-mono text-neutral-900 dark:text-neutral-100 whitespace-pre w-max min-w-full">
                              {children}
                            </pre>
                          </div>
                        );
                      },
                      code({ className, children, ...props }: any) {
                        return (
                          <code
                            className="bg-neutral-200/60 dark:bg-white/10 text-foreground px-1.5 py-0.5 rounded-md font-mono text-[15px] font-normal select-text"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      img({ src, alt }: any) {
                        if (!src) return null;
                        return (
                          <div className="my-4 max-w-lg overflow-clip rounded-xl [transform:translateZ(0)] [backface-visibility:hidden]">
                            <ImagePreview
                              src={src}
                              alt={alt || "Image preview"}
                              className="block rounded-xl border border-border/60 max-h-[420px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          </div>
                        );
                      },
                    }}
                  >
                    {preprocessContent(msg.content)}
                  </ReactMarkdown>
                </div>

                {/* Assistant Action Toolbar — revealed when typing completes */}
                {(!isTyping ||
                  Boolean(pendingMessage) ||
                  index !== messages.length - 1) && (
                  <div className="flex items-center gap-1.5 pt-1 text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.content, msgId)}
                          className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          aria-label="Copy response"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        sideOffset={4}
                        className="text-md"
                      >
                        Copy response
                      </TooltipContent>
                    </Tooltip>

                    {/* Share response (Available for guest and authenticated) */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          data-message-action="share-response"
                          onClick={() => {
                            setLoadingShareId(msgId);
                            setTimeout(() => {
                              setLoadingShareId(null);
                              setShareResponseMsg({
                                text: msg.content,
                                model:
                                  (msg.metadata as any)?.model || "CloseAI",
                              });
                            }, 300);
                          }}
                          className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          aria-label="Share response"
                        >
                          {loadingShareId === msgId ? (
                            <Loader className="w-4 h-4 animate-spin text-foreground shrink-0" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        sideOffset={4}
                        className="text-md"
                      >
                        Share response
                      </TooltipContent>
                    </Tooltip>

                    {/* Authorized user actions: ThumbsUp, ThumbsDown, More Options */}
                    {user && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msgId, "up")}
                              disabled={loadingFeedbackId === `${msgId}-up`}
                              className={cn(
                                "p-1.5 rounded-sm transition-colors cursor-pointer disabled:opacity-70 disabled:pointer-events-auto disabled:cursor-not-allowed",
                                feedback[msgId] === "up"
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              )}
                              aria-label="Good response"
                            >
                              {loadingFeedbackId === `${msgId}-up` ? (
                                <Loader className="w-4 h-4 animate-spin text-foreground shrink-0" />
                              ) : (
                                <ThumbsUp
                                  className={cn(
                                    "w-4 h-4 transition-all",
                                    feedback[msgId] === "up" && "fill-current"
                                  )}
                                />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            sideOffset={4}
                            className="text-md"
                          >
                            Good response
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msgId, "down")}
                              disabled={loadingFeedbackId === `${msgId}-down`}
                              className={cn(
                                "p-1.5 rounded-sm transition-colors cursor-pointer disabled:opacity-70 disabled:pointer-events-auto disabled:cursor-not-allowed",
                                feedback[msgId] === "down"
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              )}
                              aria-label="Bad response"
                            >
                              {loadingFeedbackId === `${msgId}-down` ? (
                                <Loader className="w-4 h-4 animate-spin text-foreground shrink-0" />
                              ) : (
                                <ThumbsDown
                                  className={cn(
                                    "w-4 h-4 transition-all",
                                    feedback[msgId] === "down" && "fill-current"
                                  )}
                                />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            sideOffset={4}
                            className="text-md"
                          >
                            Bad response
                          </TooltipContent>
                        </Tooltip>

                        {/* More options Dropdown (Read aloud, Try again, Models, Sources) */}
                        <DropdownMenu
                          onOpenChange={(open) => {
                            if (!open) {
                              setDropdownSubView("main");
                            }
                          }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className={cn(
                                    "p-1.5 rounded-sm transition-colors cursor-pointer",
                                    speakingMessageId === msgId
                                      ? "text-foreground bg-secondary"
                                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                  )}
                                  aria-label="More options"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              sideOffset={4}
                              className="text-md"
                            >
                              More options
                            </TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent
                            side="top"
                            align="start"
                            sideOffset={4}
                            avoidCollisions={true}
                            collisionPadding={12}
                            className="w-56 rounded-2xl p-1.5 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none outline-none select-none z-50"
                          >
                            {isMobileScreen &&
                            dropdownSubView === "try-again" ? (
                              <div className="space-y-0.5 p-0.5">
                                {/* Back to main menu header */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    (e.currentTarget as HTMLElement)?.blur();
                                    e.stopPropagation();
                                    setDropdownSubView("main");
                                  }}
                                  className="flex items-center gap-2 px-2.5 py-1.5 text-md font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
                                >
                                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                                  <span>Try again</span>
                                </button>

                                <div className="h-[1px] bg-neutral-200/80 dark:bg-[#383838] my-1 -mx-0.5" />

                                {/* Top Input Bar: Ask anything to change */}
                                <div
                                  className="px-2 py-1"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  <div className="relative flex items-center justify-between gap-1.5 bg-transparent">
                                    <input
                                      type="text"
                                      placeholder="Ask anything to change"
                                      value={changePrompts[msgId] || ""}
                                      onChange={(e) =>
                                        setChangePrompts((prev) => ({
                                          ...prev,
                                          [msgId]: e.target.value,
                                        }))
                                      }
                                      onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (
                                          e.key === "Enter" &&
                                          (changePrompts[msgId] || "").trim()
                                        ) {
                                          e.preventDefault();
                                          handleSendChangePrompt(msgId);
                                        }
                                      }}
                                      className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm outline-none py-1 font-normal min-w-0"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSendChangePrompt(msgId)
                                      }
                                      disabled={
                                        !(changePrompts[msgId] || "").trim()
                                      }
                                      className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all",
                                        (changePrompts[msgId] || "").trim()
                                          ? "bg-foreground text-background cursor-pointer hover:opacity-90 active:scale-95"
                                          : "bg-neutral-300 dark:bg-[#383838] text-muted-foreground/50 cursor-not-allowed opacity-50"
                                      )}
                                      aria-label="Send change request"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                  </div>
                                </div>

                                <div className="h-[1px] bg-neutral-200/80 dark:bg-[#383838] my-1 -mx-0.5" />

                                {/* Option 1: Try again */}
                                <DropdownMenuItem
                                  onClick={() => {
                                    onRegenerate?.(msg, index);
                                    setDropdownSubView("main");
                                  }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors outline-none"
                                >
                                  <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                  <span>Try again</span>
                                </DropdownMenuItem>

                                {/* Option 2: Web search (Disabled) */}
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  onClick={(e) => e.preventDefault()}
                                  className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left cursor-not-allowed select-none text-muted-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f]"
                                >
                                  <Globe className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                  <AnimatedComingSoonText
                                    label="Web search"
                                    comingSoonText="Coming soon"
                                  />
                                </DropdownMenuItem>
                              </div>
                            ) : (
                              <>
                                <div className="px-3 py-1.5 text-xs text-muted-foreground select-none">
                                  {formatMessageTime(
                                    msg.createdAt || (msg as any).created_at
                                  )}
                                </div>

                                {/* Read aloud / Stop reading */}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleReadAloud(msgId, msg.content)
                                  }
                                  className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors outline-none"
                                >
                                  {speakingMessageId === msgId ? (
                                    <>
                                      <VolumeX className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                      <span>Stop reading</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                      <span>Read aloud</span>
                                    </>
                                  )}
                                </DropdownMenuItem>

                                {/* Try again: Mobile In-Place Row vs Desktop Flyout */}
                                {onRegenerate &&
                                  (isMobileScreen ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        (
                                          e.currentTarget as HTMLElement
                                        )?.blur();
                                        e.stopPropagation();
                                        setDropdownSubView("try-again");
                                      }}
                                      className="w-full flex items-center justify-between px-3 py-2 text-md rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none text-left"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                        <span>Try again</span>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                                    </button>
                                  ) : (
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger className="flex items-center justify-between w-full px-3 py-2 text-md rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#2f2f2f] transition-colors outline-none">
                                        <div className="flex items-center gap-2.5">
                                          <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                          <span>Try again</span>
                                        </div>
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent
                                        sideOffset={4}
                                        alignOffset={-93}
                                        avoidCollisions={true}
                                        collisionPadding={12}
                                        className="w-56 rounded-2xl p-1.5 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none outline-none select-none z-50"
                                      >
                                        {/* Top Input Bar: Ask anything to change */}
                                        <div
                                          className="px-2 py-1"
                                          onClick={(e) => e.stopPropagation()}
                                          onKeyDown={(e) => e.stopPropagation()}
                                        >
                                          <div className="relative flex items-center justify-between gap-1.5 bg-transparent">
                                            <input
                                              type="text"
                                              placeholder="Ask anything to change"
                                              value={changePrompts[msgId] || ""}
                                              onChange={(e) =>
                                                setChangePrompts((prev) => ({
                                                  ...prev,
                                                  [msgId]: e.target.value,
                                                }))
                                              }
                                              onKeyDown={(e) => {
                                                e.stopPropagation();
                                                if (
                                                  e.key === "Enter" &&
                                                  (
                                                    changePrompts[msgId] || ""
                                                  ).trim()
                                                ) {
                                                  e.preventDefault();
                                                  handleSendChangePrompt(msgId);
                                                }
                                              }}
                                              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm outline-none py-1 font-normal min-w-0"
                                              autoFocus
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleSendChangePrompt(msgId)
                                              }
                                              disabled={
                                                !(
                                                  changePrompts[msgId] || ""
                                                ).trim()
                                              }
                                              className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all",
                                                (
                                                  changePrompts[msgId] || ""
                                                ).trim()
                                                  ? "bg-foreground text-background cursor-pointer hover:opacity-90 active:scale-95"
                                                  : "bg-neutral-300 dark:bg-[#383838] text-muted-foreground/50 cursor-not-allowed opacity-50"
                                              )}
                                              aria-label="Send change request"
                                            >
                                              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                                            </button>
                                          </div>
                                        </div>

                                        <div className="h-[1px] bg-neutral-200/80 dark:bg-[#383838] my-1 -mx-0.5" />

                                        {/* Option 1: Try again */}
                                        <DropdownMenuItem
                                          onClick={() =>
                                            onRegenerate(msg, index)
                                          }
                                          className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors outline-none"
                                        >
                                          <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                          <span>Try again</span>
                                        </DropdownMenuItem>

                                        {/* Option 2: Web search (Disabled) */}
                                        <DropdownMenuItem
                                          onSelect={(e) => e.preventDefault()}
                                          onClick={(e) => e.preventDefault()}
                                          className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left cursor-not-allowed select-none text-muted-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f]"
                                        >
                                          <Globe className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                          <AnimatedComingSoonText
                                            label="Web search"
                                            comingSoonText="Coming soon"
                                          />
                                        </DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  ))}

                                {/* View sources (Coming soon) */}
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  onClick={(e) => e.preventDefault()}
                                  className="flex items-center gap-2.5 px-3 py-2 text-md rounded-xl transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left cursor-not-allowed select-none text-muted-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#2f2f2f]"
                                >
                                  <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                  <AnimatedComingSoonText
                                    label="View sources"
                                    comingSoonText="Coming soon"
                                  />
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Optimistic Pending User Message */}
        {pendingMessage && (
          <div className="flex flex-col items-end group [transform:translateZ(0)]">
            {pendingMessage.files.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mb-2.5 justify-end items-end">
                {pendingMessage.files.map((file, i) => (
                  <MessageAttachmentItem
                    key={i}
                    file={file}
                    onPreview={setPreviewFile}
                  />
                ))}
              </div>
            )}
            <div className="bg-bubble dark:bg-[#2F2F2F] text-foreground text-[15px] sm:text-[15.5px] leading-relaxed rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap select-text break-words">
              {pendingMessage.content}
            </div>

            {/* User Hover Actions Toolbar — Copy button during pending/thinking (Edit hidden while thinking) */}
            <div className="flex items-center gap-1 mt-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(pendingMessage.content, "pending-msg")
                    }
                    className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Copy prompt"
                  >
                    {copiedId === "pending-msg" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={4}
                  className="text-md"
                >
                  Copy
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Typing / Thinking Indicator — shown while AI is thinking before first token */}
        {isTyping &&
          (Boolean(pendingMessage) ||
            !messages.length ||
            messages[messages.length - 1]?.role === "user" ||
            (messages[messages.length - 1]?.role === "assistant" &&
              !messages[messages.length - 1]?.content)) && (
            <div className="py-2">
              {pendingMessage?.isThinkMode ? (
                <ThinkReasoning
                  isThinking={true}
                  promptText={
                    pendingMessage?.content ||
                    (messages.length &&
                    messages[messages.length - 1]?.role === "user"
                      ? messages[messages.length - 1]?.content
                      : "")
                  }
                />
              ) : (
                <div className="py-2 flex items-center">
                  <span
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-foreground animate-pulse inline-block"
                    aria-label="Generating"
                  />
                </div>
              )}
            </div>
          )}

        <div ref={scrollBottomRef} />
      </div>

      <SharePromptModal
        open={!!sharePromptMsg}
        onOpenChange={(open) => {
          if (!open) setSharePromptMsg(null);
        }}
        promptText={sharePromptMsg?.text || ""}
        files={sharePromptMsg?.files}
      />

      <ShareResponseModal
        open={!!shareResponseMsg}
        onOpenChange={(open) => {
          if (!open) setShareResponseMsg(null);
        }}
        responseText={shareResponseMsg?.text || ""}
        modelName={shareResponseMsg?.model || "CloseAI"}
      />

      <DeleteMessageModal
        open={!!deleteMessageTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteMessageTarget(null);
        }}
        promptText={deleteMessageTarget?.content || ""}
        files={deleteMessageTarget?.files}
        onConfirm={() => {
          if (deleteMessageTarget && onDeleteMessage) {
            onDeleteMessage(deleteMessageTarget.id, deleteMessageTarget.index);
            setDeleteMessageTarget(null);
          }
        }}
      />

      <FilePreviewModal
        open={!!previewFile}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
        file={previewFile}
      />
    </>
  );
}
