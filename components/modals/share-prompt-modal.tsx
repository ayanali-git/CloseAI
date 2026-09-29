"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  LinkedinLogoIcon,
  XLogoIcon,
  LinkIcon,
  CheckIcon,
  XIcon,
  DotsThreeIcon,
  PaperclipIcon,
} from "@phosphor-icons/react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { getFileIconInfo } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import toast from "@/lib/toast";

export interface SharePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptText: string;
  files?: any[];
}

/** Same image-detection logic used for real message attachments (by mime type or filename/url extension) */
function isImageFile(file: any, fileUrl?: string): boolean {
  if (
    file?.type &&
    typeof file.type === "string" &&
    file.type.toLowerCase().startsWith("image/")
  ) {
    return true;
  }
  const name = file?.filename || file?.name || fileUrl || "";
  return (
    typeof name === "string" &&
    /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif)(\?.*)?$/i.test(name)
  );
}

/** Resolve the file's extension from mime type or filename/url, lowercased and without the dot */
function getFileExtension(file: any, fileUrl?: string): string {
  const mime = file?.type && typeof file.type === "string" ? file.type : "";
  const mimeMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/csv": "csv",
    "application/vnd.ms-excel": "csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
  };
  if (mime && mimeMap[mime]) return mimeMap[mime];
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";

  const name = file?.filename || file?.name || fileUrl || "";
  const match = typeof name === "string" ? name.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/) : null;
  return match ? match[1].toLowerCase() : "";
}

export function SharePromptModal({
  open,
  onOpenChange,
  promptText,
  files,
}: SharePromptModalProps) {
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
  }, [open, promptText, files]);

  // Mirrors BottomSheet's own breakpoint so the header X only shows on desktop,
  // where BottomSheet renders as a centered modal with no other close affordance.
  // On mobile it renders as a bottom sheet with a drag handle + backdrop tap to dismiss.
  useEffect(() => {
    const checkMobile = () => setIsMobileScreen(window.innerWidth < 1025);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = promptText.length > 200 ? promptText.slice(0, 200) + "…" : promptText;

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
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareMore = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Shared prompt — CloseAI",
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      // Fallback: just copy
      handleCopyLink();
    }
  };

  const hasFiles = files && files.length > 0;

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
            Share prompt
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-3 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <XIcon className="w-4 h-4" weight="bold" />
          </button>
        </div>

        {/* Preview Card — renders the prompt exactly like a real sent message */}
        <div ref={cardRef} className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden dark:bg-neutral-800 border border-border/80 dark:border-none">
          {/* Scrollable / Max Prompt Viewport */}
          <div
            className={cn(
              "relative z-0 max-h-[200px] sm:max-h-[400px] min-h-[150px] sm:min-h-[300px] overflow-y-auto flex flex-col items-end justify-start gap-2.5 px-5 sm:px-6 pt-5 sm:pt-6 pb-16 sm:pb-28 select-text"
            )}
          >
            <div ref={contentRef} className="w-full flex flex-col items-end justify-start gap-2.5">
              {/* Files Preview — same small-thumbnail treatment as a real message attachment, not a big stretched square */}
              {hasFiles && (
                <div className="flex flex-wrap gap-1.5 justify-end items-end select-none">
                  {files!.map((file: any, i: number) => {
                    const fileUrl = file.url || file.publicUrl;
                    const isImage = isImageFile(file, fileUrl);
                    const { Icon, colorClass, badgeBg } = getFileIconInfo(file);
                    const displayName = file.name || file.filename || "File";
                    return (
                      <div
                        key={file.id || i}
                        className={cn(
                          "overflow-hidden bg-secondary border border-border/80",
                          isImage
                            ? "rounded-xl max-w-[100px] sm:max-w-[150px]"
                            : "rounded-full max-w-full"
                        )}
                      >
                        {isImage && fileUrl ? (
                          <img
                            src={fileUrl}
                            alt={displayName}
                            className="w-full max-h-[180px] sm:max-h-[220px] object-cover rounded-xl"
                          />
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm text-foreground">
                            <Icon className="w-4 h-4 shrink-0 text-muted-foreground" weight="fill" />
                            <span className="truncate max-w-[140px] sm:max-w-[180px] font-medium">
                              {displayName}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Prompt Text — identical bubble styling (bg / rounding / padding) to a real sent message bubble */}
              {promptText && (
                <p className="bg-bubble text-bubble-foreground text-[15px] sm:text-[15.5px] leading-relaxed rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] whitespace-pre-wrap break-words">
                  {promptText}
                </p>
              )}
            </div>
          </div>

          {/* Bottom gradient overlay — 25% full fade, stops before scrollbar like c/id and s/id */}
          <div className="absolute bottom-0 left-0 right-4 sm:right-5 h-[25%] min-h-[95px] sm:min-h-[105px] z-10 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent dark:from-neutral-800 dark:via-neutral-800/95 to-transparent" />

          {/* CloseAI Branding */}
          <div
            className="absolute right-5 sm:right-6 bottom-4 sm:bottom-5 z-20 pointer-events-none transition-[right] duration-75"
            style={brandingRightOffset !== null ? { right: `${brandingRightOffset}px` } : undefined}
          >
            <span className="text-2xl font-bold text-muted-foreground tracking-tight select-none">
              CloseAI
            </span>
          </div>
        </div>

        {/* Share Buttons Row */}
        <div className="flex items-center justify-center gap-5 sm:gap-10 pt-5 sm:pt-10">
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
            <span className="text-md font-normal text-foreground select-none">X</span>
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