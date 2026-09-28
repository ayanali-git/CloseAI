"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LinkedinLogoIcon,
  XLogoIcon,
  LinkIcon,
  CheckIcon,
  XIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";
import { Copy } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
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
import { cn } from "@/lib/utils";
import toast from "@/lib/toast";

export interface ShareResponseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responseText: string;
  modelName?: string;
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

function CodeBlock({ language, code }: { language: string; code: string }) {
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

  return (
    <div
      className="
        relative my-4
        rounded-2xl sm:rounded-3xl
        bg-[#f4f4f4] dark:bg-[#2F2F2F]
        text-left
        isolate
        overflow-visible
      "
    >
      <div
        className="
          flex items-center justify-between
          px-4 py-2
          bg-[#f4f4f4]/50 dark:bg-[#2F2F2F]/50
          text-xs font-sans
          text-neutral-600 dark:text-neutral-300
          select-none
          rounded-t-2xl sm:rounded-t-3xl
        "
      >
        <span className="font-mono text-base lowercase font-medium tracking-wide text-foreground">
          {displayLang}
        </span>

        {/* Copy button as it is visually, but not in active action */}
        <div
          className="
            flex items-center gap-1.5
            px-2 py-2
            rounded-full
            text-base
            select-none
            pointer-events-none
          "
        >
          <Copy className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Copy</span>
        </div>
      </div>

      {/* Code content */}
      <div className="rounded-b-2xl sm:rounded-b-3xl overflow-hidden bg-[#f4f4f4] dark:bg-[#2F2F2F]">
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

/** Preprocesses LaTeX formula markers, currency dollar signs, table formatting, and unclosed delimiters */
function preprocessContent(text: string): string {
  if (!text) return "";

  let result = text;

  // 1. Convert pipe-pipe separated lines into proper markdown table rows with newlines
  result = result.replace(/\|\s*\|\s*/g, "|\n| ");

  // 2. Prevent currency dollar signs ($100, $1 Trillion, $2.5B) from being incorrectly parsed as LaTeX math
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

export function ShareResponseModal({
  open,
  onOpenChange,
  responseText,
}: ShareResponseModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [brandingRightOffset, setBrandingRightOffset] = useState<number | null>(null);

  // Measure preview card content edge to align CloseAI line-to-line with the rightmost content boundary
  useEffect(() => {
    if (!open) return;

    const updateRightOffset = () => {
      if (cardRef.current && contentRef.current) {
        const cardRect = cardRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        const offset = Math.round(cardRect.right - contentRect.right);
        if (offset > 0) {
          setBrandingRightOffset(offset);
        }
      }
    };

    updateRightOffset();
    const rafId = requestAnimationFrame(updateRightOffset);
    const timerId = setTimeout(updateRightOffset, 60);
    const timerId2 = setTimeout(updateRightOffset, 200);

    const observer = new ResizeObserver(() => {
      updateRightOffset();
    });

    if (cardRef.current) observer.observe(cardRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    window.addEventListener("resize", updateRightOffset);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      clearTimeout(timerId2);
      observer.disconnect();
      window.removeEventListener("resize", updateRightOffset);
    };
  }, [open, responseText]);

  // Mirrors BottomSheet's desktop/mobile breakpoint
  useEffect(() => {
    const checkMobile = () => setIsMobileScreen(window.innerWidth < 1025);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText =
    responseText.length > 200 ? responseText.slice(0, 200) + "…" : responseText;

  const handleCopyLink = async () => {
    if (isCopyingLink) return;
    setIsCopyingLink(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setLinkCopied(false), 2000);
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleShareX = () => {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareMore = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Shared response — CloseAI",
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      className="max-w-[600px]"
    >
      <div className="flex flex-col space-y-5 pt-1 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Share response
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-3 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" weight="bold" />
          </button>
        </div>

        {/* Preview Card — renders the assistant response in full share preview */}
        <div ref={cardRef} className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden dark:bg-neutral-800 border border-border/80 dark:border-none">
          {/* Scrollable / Max Response Viewport */}
          <div
            className={cn(
              "relative z-0 max-h-[200px] sm:max-h-[400px] min-h-[150px] sm:min-h-[300px] overflow-y-auto px-5 py-4 sm:px-7 sm:py-6 pb-16 sm:pb-28 text-foreground select-text"
            )}
          >
            <div
              ref={contentRef}
              className="chat-markdown text-foreground select-text text-[15px] sm:text-[15.5px] leading-7 break-words w-full"
            >
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
                    return <tr className="hover:bg-transparent">{children}</tr>;
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
                }}
              >
                {preprocessContent(responseText)}
              </ReactMarkdown>
            </div>
          </div>

          {/* Bottom Fade Overlay into CloseAI Branding — 25% full fade, stops before scrollbar like c/id and s/id */}
          <div className="absolute bottom-0 left-0 right-4 sm:right-5 h-[25%] min-h-[95px] sm:min-h-[105px] z-10 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent dark:from-neutral-800 dark:via-neutral-800/95 to-transparent" />

          {/* CloseAI Branding Watermark (bottom right) */}
          <div
            className="absolute right-10 sm:right-11 bottom-4 sm:bottom-5 z-20 pointer-events-none transition-[right] duration-75"
            style={brandingRightOffset !== null ? { right: `${brandingRightOffset}px` } : undefined}
          >
            <span className="text-2xl font-bold text-muted-foreground tracking-tight select-none">
              CloseAI
            </span>
          </div>
        </div>

        {/* Share Buttons Row */}
        <div className="flex items-center justify-center gap-4 sm:gap-10 pt-4 sm:pt-10">
          {/* Copy */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center transition-opacity group-hover:opacity-80">
              {linkCopied ? (
                <CheckIcon className="w-6 h-6" />
              ) : (
                <LinkIcon className="w-6 h-6" />
              )}
            </div>
            <span className="text-md font-normal text-foreground select-none">
              {linkCopied ? "Copied" : "Copy"}
            </span>
          </button>

          {/* X (Twitter) */}
          <button
            type="button"
            onClick={handleShareX}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center transition-opacity group-hover:opacity-80">
              <XLogoIcon className="w-6 h-6" />
            </div>
            <span className="text-md font-normal text-foreground select-none">
              X
            </span>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={handleShareLinkedIn}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center transition-opacity group-hover:opacity-80">
              <LinkedinLogoIcon className="w-6 h-6" />
            </div>
            <span className="text-md font-normal text-foreground select-none">
              LinkedIn
            </span>
          </button>

          {/* More (system share) */}
          <button
            type="button"
            onClick={handleShareMore}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center transition-opacity group-hover:opacity-80">
              <DotsThreeIcon className="w-6 h-6" />
            </div>
            <span className="text-md font-normal text-foreground select-none">
              More
            </span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
