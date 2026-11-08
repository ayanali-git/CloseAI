"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  SquareMousePointer,
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
import { SharePromptModal } from "@/components/modals/share-message-modal";
import { ShareResponseModal } from "@/components/modals/share-response-modal";
import { DeleteMessageModal } from "@/components/modals/delete-message-modal";
import { ThinkReasoning } from "@/components/chat/think-reasoning";
import { FilePreviewModal } from "@/components/modals/file-preview-modal";
import {
  MessageAttachmentItem,
  isImageFile,
} from "@/components/chat/message-attachment";
import { ImagePreview } from "@/components/modals/image-preview-modal";
import { getFileIconInfo } from "@/lib/file-utils";
import { preprocessContent } from "@/lib/preprocess-markdown";

export function TemporaryChatDashedBorder({
  className,
  rectClassName,
  rx,
  ry,
}: {
  className?: string;
  rectClassName?: string;
  rx?: number | string;
  ry?: number | string;
}) {
  return (
    <svg
      className={cn("temporary-chat-dashed-pill pointer-events-none", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="0.75"
        y="0.75"
        rx={rx ?? 25}
        ry={ry ?? 25}
        className={cn("temporary-chat-dashed-rect", rectClassName)}
        style={{
          width: "calc(100% - 1.5px)",
          height: "calc(100% - 1.5px)",
          ...(rx !== undefined ? { rx } : {}),
          ...(ry !== undefined ? { ry } : {}),
        }}
      />
    </svg>
  );
}

export interface MessageListProps {
  messages: Message[];
  user: User | null;
  isTyping: boolean;
  isGuest?: boolean;
  autoScroll?: boolean;
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
  isTemporary?: boolean;
  isShared?: boolean;
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

/** Strips common leading whitespace from all non-empty lines while preserving relative indentation */
function dedentCode(code: string): string {
  if (!code) return "";
  const normalized = code.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  let minIndent = Infinity;
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/^[ \t]*/);
    const indent = match ? match[0].length : 0;
    if (indent < minIndent) minIndent = indent;
  }
  if (minIndent === 0 || minIndent === Infinity) return normalized;
  return lines
    .map((line) =>
      line.length >= minIndent
        ? line.slice(minIndent)
        : line.trim()
        ? line
        : ""
    )
    .join("\n");
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const CodeBlock = React.memo(
  function CodeBlock({
    language,
    code,
    isGuest = false,
  }: {
    language: string;
    code: string;
    isGuest?: boolean;
  }) {
    const cleanCode = useMemo(() => dedentCode(code), [code]);
    const [copied, setCopied] = useState(false);
    const [headerState, setHeaderState] = useState<"top" | "stuck" | "bottom">(
      "top"
    );
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTooltipOpen(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  let displayLang = language ? language.toLowerCase().trim() : "";

  if (!displayLang) {
    const firstLine = cleanCode.trim().split("\n")[0].trim();

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
    return highlightCode(cleanCode, displayLang);
  }, [cleanCode, displayLang]);

    // Detect when the sticky header is at the top, stuck in middle, or reached bottom (max touch)
    useIsomorphicLayoutEffect(() => {
      if (isGuest) return;
      let rafId: number | null = null;

      const checkHeaderPosition = () => {
        const container = containerRef.current;
        const header = headerRef.current;
        if (!container || !header) return;

        const containerRect = container.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        if (containerRect.height === 0 || headerRect.height === 0) return;

        // Header is at the top when its top is at/near the container's top
        const isAtTop = headerRect.top - containerRect.top <= 4;

        // Header has reached the bottom when its bottom is at/near the container's bottom
        const isAtBottom = containerRect.bottom - headerRect.bottom <= 4;

        let nextState: "top" | "stuck" | "bottom" = "top";
        if (isAtTop) {
          nextState = "top";
        } else if (isAtBottom) {
          nextState = "bottom";
        } else {
          nextState = "stuck";
        }

        setHeaderState((prev) => (prev !== nextState ? nextState : prev));
      };

      const handleScroll = () => {
        if (rafId !== null) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          checkHeaderPosition();
        });
      };

      window.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true,
      });
      window.addEventListener("resize", handleScroll, { passive: true });
      checkHeaderPosition();

      return () => {
        if (rafId !== null) window.cancelAnimationFrame(rafId);
        window.removeEventListener("scroll", handleScroll, { capture: true });
        window.removeEventListener("resize", handleScroll);
      };
    }, [isGuest]);

    return (
      <div
        ref={containerRef}
        className=
          "relative my-4 rounded-[25px] sm:rounded-3xl bg-bubble text-bubble-foreground text-left isolate overflow-visible"
      >
        <div
          ref={headerRef}
          className={cn(
            isGuest
              ? "flex items-center justify-between px-4 py-2 text-xs font-sans text-foreground select-none bg-transparent rounded-t-[25px] sm:rounded-t-3xl"
              : cn(
                  "sticky top-0 z-10 flex items-center justify-between px-4 py-2 text-xs font-sans text-foreground select-none border-b border-transparent",
                  headerState === "stuck"
                    ? "bg-bubble rounded-b-[25px] sm:rounded-b-3xl border-bubble"
                    : headerState === "bottom"
                    ? "bg-bubble rounded-b-[25px] sm:rounded-b-3xl"
                    : "bg-transparent rounded-t-[25px] sm:rounded-t-3xl"
                )
          )}
        >
          <span className="font-mono text-base lowercase font-normal tracking-wide text-foreground">
            {displayLang}
          </span>

          <Tooltip
            open={tooltipOpen}
            onOpenChange={(open) => {
              // While "Copied" is showing, ignore close events so it stays visible
              if (!open && copied) return;
              setTooltipOpen(open);
            }}
          >
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                className="p-3 rounded-full hover:bg-secondary text-foreground transition-colors cursor-pointer"
                aria-label={copied ? "Copied" : "Copy"}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-base">
              {copied ? "Copied" : "Copy"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Code content */}
        <div className="rounded-b-[25px] sm:rounded-b-3xl overflow-hidden bg-transparent">
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
  },
  (prev, next) =>
    prev.code === next.code &&
    prev.language === next.language &&
    prev.isGuest === next.isGuest
);

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
  autoScroll = true,
  pendingMessage,
  onRegenerate,
  onSendMessage,
  onEditMessage,
  onEditAndResend,
  onDeleteMessage,
  showMessageActions = true,
  isTemporary = false,
  isShared = false,
}: MessageListProps) {
  const isGuestMode = isGuest ?? !user;
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
  const [openMoreOptionsId, setOpenMoreOptionsId] = useState<string | null>(null);

  const markdownComponents = useMemo(
    () => ({
      table({ children }: any) {
        return (
          <div className="my-4 w-full overflow-x-auto rounded-xl border border-bubble bg-background [&_tr:hover_td]:!bg-transparent">
            <table className="w-full text-left border-collapse text-sm !m-0">
              {children}
            </table>
          </div>
        );
      },
      thead({ children }: any) {
        return (
          <thead
            className="border-b border-bubble bg-bubble text-bubble-foreground font-semibold text-xs tracking-wider uppercase"
          >
            {children}
          </thead>
        );
      },
      th({ children }: any) {
        return (
          <th className="px-4 py-2.5 font-semibold text-bubble-foreground text-xs uppercase tracking-wider border-b border-bubble">
            {children}
          </th>
        );
      },
      td({ children }: any) {
        return (
          <td className="px-4 py-2.5 border-t border-bubble text-bubble-foreground/90 text-sm align-top leading-relaxed">
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
          const match = /language-(\w+)/.exec(childProps.className || "");
          const lang = match ? match[1] : "";
          const rawCode = Array.isArray(childProps.children)
            ? childProps.children.join("")
            : String(childProps.children || "");
          return (
            <CodeBlock
              language={lang}
              code={rawCode.replace(/\n$/, "")}
              isGuest={isGuestMode}
            />
          );
        }
        return (
          <div
            className={cn(
              "my-3 sm:my-4 rounded-xl overflow-hidden border border-border/80 dark:border-none p-3 code-scroll",
              isGuestMode
                ? "bg-white dark:bg-[#1f1f1f]"
                : "bg-white dark:bg-[#111111]"
            )}
          >
            <pre className="text-[15px] font-mono text-foreground whitespace-pre w-max min-w-full">
              {children}
            </pre>
          </div>
        );
      },
      code({ className, children, ...props }: any) {
        return (
          <code
            className={cn(
              "px-1.5 py-0.5 rounded-md font-mono text-[15px] font-normal select-text text-foreground",
              isGuestMode
                ? "bg-white dark:bg-[#1f1f1f]"
                : "bg-white dark:bg-[#111111]"
            )}
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
              className="block rounded-xl border border-border/60 max-h-[420px] object-contain cursor-pointer hover:opacity-80 transition-opacity"
            />
          </div>
        );
      },
    }),
    [isGuestMode]
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 1280);
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
    const trimmedDraft = editDraftText.trim();
    const originalTrimmed = (msg.content || "").trim();
    if (!trimmedDraft || trimmedDraft === originalTrimmed || isTyping) return;
    setEditingMessageId(null);
    setEditDraftText("");
    if (onEditAndResend) {
      onEditAndResend(msg.id, trimmedDraft, index);
    } else if (onEditMessage) {
      onEditMessage(trimmedDraft);
    }
  };

  // Auto-scroll is handled by the parent scroll container in app/c/[id]/page.tsx

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [selectedTarget, setSelectedTarget] = useState<{
    id: string;
    content?: string;
  } | null>(null);

  const selectedMessageTargetRef = useRef<{
    id: string;
    content?: string;
  } | null>(null);

  // Clear tracked selected target when user clicks anywhere else in the document
  useEffect(() => {
    const handleGlobalClear = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('[data-message-action="select-text"]')) {
        return;
      }
      setSelectedTarget(null);
      selectedMessageTargetRef.current = null;
    };

    window.addEventListener("mousedown", handleGlobalClear, true);
    window.addEventListener("touchstart", handleGlobalClear, true);
    return () => {
      window.removeEventListener("mousedown", handleGlobalClear, true);
      window.removeEventListener("touchstart", handleGlobalClear, true);
    };
  }, []);

  const applyTextSelection = useCallback((targetEl: HTMLElement | null) => {
    if (!targetEl) return;
    try {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(targetEl);
        selection.removeAllRanges();
        selection.addRange(range);

        // Inform extensions (e.g. Google Translate) that text selection changed
        try {
          document.dispatchEvent(new Event("selectionchange", { bubbles: true }));
        } catch {}
      }
    } catch (err) {
      console.error("Error applying text selection:", err);
    }
  }, []);

  const handleSelectText = useCallback(
    (targetMsgId: string, content?: string) => {
      const targetData = { id: targetMsgId, content };
      selectedMessageTargetRef.current = targetData;
      setSelectedTarget(targetData);

      const el = document.getElementById(`msg-text-${targetMsgId}`);
      if (el) {
        applyTextSelection(el);
      }
    },
    [applyTextSelection]
  );

  // Keep selection alive during streaming re-renders and handle pending-msg → real msg transitions
  useIsomorphicLayoutEffect(() => {
    const target = selectedTarget || selectedMessageTargetRef.current;
    if (!target) return;
    let targetId = target.id;
    let el = document.getElementById(`msg-text-${targetId}`);

    // If target was pending-msg but transitioned to messages list, find it by content
    if (!el && target.content) {
      const matchingMsg = [...messages]
        .reverse()
        .find(
          (m) =>
            m.content?.trim() === target.content?.trim()
        );
      if (matchingMsg) {
        const newMsgId = matchingMsg.id || `msg-${messages.indexOf(matchingMsg)}`;
        targetId = newMsgId;
        if (selectedMessageTargetRef.current) {
          selectedMessageTargetRef.current.id = newMsgId;
        }
        el = document.getElementById(`msg-text-${newMsgId}`);
      }
    }

    if (!el) return;

    const sel = typeof window !== "undefined" ? window.getSelection() : null;
    let isAlreadySelected = false;
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      try {
        if (typeof sel.containsNode === "function") {
          isAlreadySelected = sel.containsNode(el, true);
        } else if (sel.anchorNode) {
          isAlreadySelected = el.contains(sel.anchorNode);
        }
      } catch {}
    }

    if (!isAlreadySelected) {
      applyTextSelection(el);
    }
  });

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
        className="w-full max-w-3xl mx-auto pt-10 pb-2 space-y-5 px-6 selection:bg-secondary selection:text-foreground [&[data-message-actions=hidden]_[data-message-action=copy]]:hidden [&[data-message-actions=hidden]_[data-message-action=share]]:hidden [&[data-message-actions=hidden]_[data-message-action=select-text]]:hidden"
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
                  <div
                    className={cn(
                      "relative w-full bg-bubble rounded-[25px] sm:rounded-3xl p-3 sm:p-4"
                    )}
                  >
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
                          const trimmedDraft = editDraftText.trim();
                          const originalTrimmed = (msg.content || "").trim();
                          if (trimmedDraft && trimmedDraft !== originalTrimmed && !isTyping) {
                            submitEdit(msg, index);
                          }
                        } else if (e.key === "Escape") {
                          cancelEditing();
                        }
                      }}
                      rows={Math.min(
                        Math.max(editDraftText.split("\n").length, 2),
                        8
                      )}
                      className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 resize-none text-[15px] sm:text-[15.5px] leading-relaxed text-bubble-foreground placeholder:text-bubble-foreground/50 select-text"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2 mt-2 pt-1 select-none">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-3.5 py-1.5 rounded-full text-[15px] font-normal bg-bubble-foreground/10 hover:bg-bubble-foreground/20 active:bg-bubble-foreground/25 text-bubble-foreground transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      {(() => {
                        const trimmedDraft = editDraftText.trim();
                        const originalTrimmed = (msg.content || "").trim();
                        const isUnchangedOrEmpty =
                          !trimmedDraft || trimmedDraft === originalTrimmed;
                        return (
                          <button
                            type="button"
                            onClick={() => submitEdit(msg, index)}
                            disabled={isUnchangedOrEmpty || isTyping}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-[15px] font-medium transition-all select-none",
                              !isUnchangedOrEmpty && !isTyping
                                ? "bg-bubble-foreground text-bubble hover:opacity-80 active:scale-[0.99] cursor-pointer"
                                : "bg-bubble-foreground/20 text-bubble-foreground/40 cursor-not-allowed opacity-50"
                            )}
                          >
                            Send
                          </button>
                        );
                      })()}
                    </div>
                    {isTemporary && <TemporaryChatDashedBorder />}
                  </div>
                ) : (
                  <>
                    {/* User Bubble Capsule */}
                    <div
                      id={`msg-text-${msgId}`}
                      className={cn(
                        "relative bg-bubble text-bubble-foreground text-[15px] sm:text-[15.5px] leading-relaxed rounded-[25px] sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap select-text break-words"
                      )}
                    >
                      {msg.content}
                      {isTemporary && <TemporaryChatDashedBorder />}
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
                          className="text-base"
                        >
                          Copy message
                        </TooltipContent>
                      </Tooltip>

                      {/* Select message */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            data-message-action="select-text"
                            onMouseDown={(e) => {
                              e.preventDefault();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectText(msgId, msg.content);
                            }}
                            className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            aria-label="Select message"
                          >
                            <SquareMousePointer className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          sideOffset={4}
                          className="text-base"
                        >
                          Select message
                        </TooltipContent>
                      </Tooltip>

                      {/* In temporary chat: ONLY Edit shows next to Copy. In regular chat: Share, Edit, Delete show for authorized users */}
                      {isTemporary
                        ? (onEditAndResend || onEditMessage) &&
                          !isThisMsgThinking && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEditing(msgId, msg.content)
                                  }
                                  className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  aria-label="Edit message"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                sideOffset={4}
                                className="text-base"
                              >
                                Edit message
                              </TooltipContent>
                            </Tooltip>
                          )
                        : !isGuestMode && user && (
                            <>
                              {/* 2. Share message */}
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
                                      aria-label="Share message"
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
                                    className="text-base"
                                  >
                                    Share message
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {/* Edit & Delete are hidden in shared chat, only visible for authenticated users in regular chats */}
                              {!isShared && (
                                <>
                                  {/* 3. Edit message */}
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
                                            aria-label="Edit message"
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="bottom"
                                          sideOffset={4}
                                          className="text-base"
                                        >
                                          Edit message
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
                                        className="text-base"
                                      >
                                        Delete message
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </>
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
                {/* Collapsed Worked for Xs if this message was generated in think harder */}
                {msg.metadata?.think && (
                  <div className="pt-1 pb-1">
                    <ThinkReasoning
                      isThinking={false}
                      promptText={
                        (() => {
                          for (let i = index - 1; i >= 0; i--) {
                            if (messages[i]?.role === "user") {
                              return messages[i]?.content;
                            }
                          }
                          return undefined;
                        })()
                      }
                      thinkingSteps={msg.metadata?.thinkingSteps}
                      elapsedSeconds={msg.metadata?.thinkTime || 5}
                    />
                  </div>
                )}
                {/* Message Content */}
                <div
                  id={`msg-text-${msgId}`}
                  className="chat-markdown text-foreground select-text text-[15px] sm:text-[15.5px] leading-7 break-words w-full">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[
                      [rehypeKatex, { strict: false, throwOnError: false }],
                    ]}
                    components={markdownComponents}
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
                        className="text-base"
                      >
                        Copy response
                      </TooltipContent>
                    </Tooltip>

                    {/* Select response */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          data-message-action="select-text"
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectText(msgId, msg.content);
                          }}
                          className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          aria-label="Select response"
                        >
                          <SquareMousePointer className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        sideOffset={4}
                        className="text-base"
                      >
                        Select response
                      </TooltipContent>
                    </Tooltip>

                    {/* In temporary chat: ONLY show Read aloud button next to Copy. In regular chat: show Share, ThumbsUp, ThumbsDown, More Options for authorized users */}
                    {isTemporary ? (
                      /* In Temporary Chat: ONLY show Read Aloud button next to Copy */
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleReadAloud(msgId, msg.content)}
                            className={cn(
                              "p-1.5 rounded-sm hover:bg-secondary transition-colors cursor-pointer",
                              speakingMessageId === msgId
                                ? "text-foreground bg-secondary"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            aria-label={
                              speakingMessageId === msgId
                                ? "Stop reading"
                                : "Read aloud"
                            }
                          >
                            {speakingMessageId === msgId ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          sideOffset={4}
                          className="text-base"
                        >
                          {speakingMessageId === msgId
                            ? "Stop reading"
                            : "Read aloud"}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      !isGuestMode && user && (
                        <>
                          {/* 2. Share response */}
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
                                        (msg.metadata as any)?.model ||
                                        "CloseAI",
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
                              className="text-base"
                            >
                              Share response
                            </TooltipContent>
                          </Tooltip>

                          {/* Good response, Bad response, More options are ONLY shown for authenticated users in non-shared chats */}
                          {!isShared && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msgId, "up")}
                                disabled={loadingFeedbackId === `${msgId}-up`}
                                className={cn(
                                  "p-1.5 rounded-sm transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-auto disabled:cursor-not-allowed",
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
                              className="text-base"
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
                                  "p-1.5 rounded-sm transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-auto disabled:cursor-not-allowed",
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
                                      feedback[msgId] === "down" &&
                                        "fill-current"
                                    )}
                                  />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              sideOffset={4}
                              className="text-base"
                            >
                              Bad response
                            </TooltipContent>
                          </Tooltip>

                          {/* More options Dropdown (Read aloud, Try again, Models, Sources) */}
                          <DropdownMenu
                            open={openMoreOptionsId === msgId}
                            onOpenChange={(open) => {
                              if (!open) {
                                setDropdownSubView("main");
                                setOpenMoreOptionsId(null);
                              } else {
                                setOpenMoreOptionsId(msgId);
                              }
                            }}
                          >
                            <Tooltip open={openMoreOptionsId === msgId ? false : undefined}>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className={cn(
                                      "p-1.5 rounded-sm transition-colors cursor-pointer data-[state=open]:bg-secondary data-[state=open]:text-foreground",
                                      speakingMessageId === msgId || openMoreOptionsId === msgId
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
                                className="text-base"
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
                              isGuest={isGuestMode}
                              className={cn(
                                "w-56 rounded-2xl p-1.5 outline-none select-none z-50",
                                isGuestMode
                                  ? "bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-none"
                                  : "bg-white dark:bg-[#111111] border border-border/80 dark:border-none"
                              )}
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
                                    className="flex items-center gap-2 px-2.5 py-1.5 text-base font-medium text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] active:bg-secondary dark:active:bg-[#2f2f2f]/80 rounded-xl cursor-pointer w-full text-left transition-colors outline-none"
                                  >
                                    <ChevronLeft className="w-4 h-4 stroke-[2]" />
                                    <span>Try again</span>
                                  </button>

                                  <div className={cn("h-[1px] bg-neutral-200 my-1 -mx-0.5", isGuestMode ? "dark:bg-[#2f2f2f]" : "dark:bg-[#212121]")} />

                                  {/* Top Input Bar: Ask CloseAI to change */}
                                  <div
                                    className="px-2 py-1"
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  >
                                    <div className="relative flex items-center justify-between gap-1.5 bg-transparent">
                                      <input
                                        type="text"
                                        placeholder="Ask CloseAI to change"
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
                                        className="w-full bg-transparent placeholder:text-muted-foreground text-sm outline-none py-1 font-normal min-w-0"
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
                                            ? "bg-send-btn text-send-btn-foreground cursor-pointer hover:opacity-80 active:scale-[0.99]"
                                            : "bg-neutral-300 dark:bg-[#212121] border border-border/80 dark:border-none text-muted-foreground cursor-not-allowed opacity-50"
                                        )}
                                        aria-label="Send change request"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5 stroke-[2]" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className={cn("h-[1px] bg-neutral-200 my-1 -mx-0.5", isGuestMode ? "dark:bg-[#2f2f2f]" : "dark:bg-[#212121]")} />

                                  {/* Option 1: Try again */}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      onRegenerate?.(msg, index);
                                      setDropdownSubView("main");
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2 text-base rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors outline-none"
                                  >
                                    <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                    <span>Try again</span>
                                  </DropdownMenuItem>

                                  {/* Option 2: Web search (Disabled) */}
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={(e) => e.preventDefault()}
                                    className="flex items-center gap-2.5 px-3 py-2 text-base rounded-xl transition-colors outline-none whitespace-nowrap text-left cursor-not-allowed opacity-50 select-none text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f]"
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
                                    className="flex items-center gap-2.5 px-3 py-2 text-base rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors outline-none"
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
                                        className="w-full flex items-center justify-between px-3 py-2 text-base rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors outline-none text-left"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                          <span>Try again</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                                      </button>
                                    ) : (
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="flex items-center justify-between w-full px-3 py-2 text-base rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] data-[state=open]:bg-secondary dark:data-[state=open]:bg-[#2f2f2f] transition-colors outline-none">
                                          <div className="flex items-center gap-2.5">
                                            <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                            <span>Try again</span>
                                          </div>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent
                                          sideOffset={4}
                                          alignOffset={-95}
                                          avoidCollisions={true}
                                          collisionPadding={12}
                                          isGuest={isGuestMode}
                                          className={cn(
                                            "w-56 rounded-2xl p-1.5 outline-none select-none z-50",
                                            isGuestMode
                                              ? "bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-none"
                                              : "bg-white dark:bg-[#111111] border border-border/80 dark:border-none"
                                          )}
                                        >
                                          {/* Top Input Bar: Ask CloseAI to change */}
                                          <div
                                            className="px-2 py-1"
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) =>
                                              e.stopPropagation()
                                            }
                                          >
                                            <div className="relative flex items-center justify-between gap-1.5 bg-transparent">
                                              <input
                                                type="text"
                                                placeholder="Ask CloseAI to change"
                                                value={
                                                  changePrompts[msgId] || ""
                                                }
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
                                                    handleSendChangePrompt(
                                                      msgId
                                                    );
                                                  }
                                                }}
                                                className="w-full bg-transparent placeholder:text-muted-foreground text-sm outline-none py-1 font-normal min-w-0"
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
                                                    ? "bg-send-btn text-send-btn-foreground cursor-pointer hover:opacity-80 active:scale-[0.99]"
                                                    : "bg-neutral-300 dark:bg-[#212121] border border-border/80 dark:border-none text-muted-foreground cursor-not-allowed opacity-50"
                                                )}
                                                aria-label="Send change request"
                                              >
                                                <ArrowUp className="w-3.5 h-3.5 stroke-[2]" />
                                              </button>
                                            </div>
                                          </div>

                                          <div className={cn("h-[1px] bg-neutral-200 my-1 -mx-0.5", isGuestMode ? "dark:bg-[#2f2f2f]" : "dark:bg-[#212121]")} />

                                          {/* Option 1: Try again */}
                                          <DropdownMenuItem
                                            onClick={() =>
                                              onRegenerate(msg, index)
                                            }
                                            className="flex items-center gap-2.5 px-3 py-2 text-base rounded-xl cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors outline-none"
                                          >
                                            <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                                            <span>Try again</span>
                                          </DropdownMenuItem>

                                          {/* Option 2: Web search (Disabled) */}
                                          <DropdownMenuItem
                                            onSelect={(e) => e.preventDefault()}
                                            onClick={(e) => e.preventDefault()}
                                            className="flex items-center gap-2.5 px-3 py-2 text-base rounded-xl transition-colors outline-none whitespace-nowrap text-left cursor-not-allowed opacity-50 select-none text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f]"
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
                                    className="flex items-center gap-2.5 px-3 py-2 text-base rounded-xl transition-colors outline-none whitespace-nowrap text-left cursor-not-allowed opacity-50 select-none text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f]"
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
                    </>
                  )
                )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Optimistic Pending User Message */}
        {pendingMessage &&
          !messages.some(
            (m) =>
              m.role === "user" &&
              m.content?.trim() === pendingMessage.content?.trim()
          ) && (
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
              <div
                id="msg-text-pending-msg"
                className={cn(
                  "relative bg-bubble text-bubble-foreground text-[15px] sm:text-[15.5px] leading-relaxed rounded-[25px] sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap select-text break-words"
                )}
              >
                {pendingMessage.content}
                {isTemporary && <TemporaryChatDashedBorder />}
              </div>

              {/* User Hover Actions Toolbar — Copy and Select buttons during pending/thinking (Edit hidden while thinking) */}
              <div className="flex items-center gap-1 mt-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(pendingMessage.content, "pending-msg")
                      }
                      className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label="Copy message"
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
                    className="text-base"
                  >
                    Copy message
                  </TooltipContent>
                </Tooltip>

                {/* Select message */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-message-action="select-text"
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectText("pending-msg", pendingMessage.content);
                      }}
                      className="p-1.5 rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label="Select message"
                    >
                      <SquareMousePointer className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={4}
                    className="text-base"
                  >
                    Select message
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
        isGuest={isGuestMode}
      />

      <ShareResponseModal
        open={!!shareResponseMsg}
        onOpenChange={(open) => {
          if (!open) setShareResponseMsg(null);
        }}
        responseText={shareResponseMsg?.text || ""}
        modelName={shareResponseMsg?.model || "CloseAI"}
        isGuest={isGuestMode}
      />

      <DeleteMessageModal
        open={!!deleteMessageTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteMessageTarget(null);
        }}
        promptText={deleteMessageTarget?.content || ""}
        files={deleteMessageTarget?.files}
        isGuest={isGuestMode}
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
