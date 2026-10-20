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
import { X } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useModalTheme } from "@/hooks/use-modal-theme";
import { MessageAttachmentItem } from "@/components/chat/message-attachment";
import { cn } from "@/lib/utils";
import toast from "@/lib/toast";

export interface SharePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptText: string;
  files?: any[];
  isGuest?: boolean;
}

export function SharePromptModal({
  open,
  onOpenChange,
  promptText,
  files,
  isGuest: isGuestProp,
}: SharePromptModalProps) {
  const { isGuest, modalBgClass } = useModalTheme(isGuestProp, open);
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

  const shareButtonRing = cn(
    "group-focus-visible:ring-2 group-focus-visible:ring-black dark:group-focus-visible:ring-white group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-white",
    isGuest
      ? "dark:group-focus-visible:ring-offset-[#2f2f2f]"
      : "dark:group-focus-visible:ring-offset-card"
  );

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      className={cn(
        "max-w-[600px]",
        modalBgClass
      )}
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
            className={cn(
              "hidden min-[1025px]:flex p-3 rounded-sm items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-colors cursor-pointer shrink-0",
              isGuest
                ? "hover:bg-[#383838] dark:focus-visible:ring-offset-[#2f2f2f]"
                : " hover:bg-secondary dark:focus-visible:ring-offset-card"
            )}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Card — renders the prompt exactly like a real sent message */}
        <div ref={cardRef} className="relative w-full rounded-[25px] sm:rounded-3xl overflow-hidden bg-background border border-border/80 dark:border-none">
          {/* Max Prompt Viewport — content shows without scrollbar, non-scrollable preview */}
          <div
            className={cn(
              "relative z-0 max-h-[200px] sm:max-h-[400px] min-h-[150px] sm:min-h-[300px] overflow-hidden flex flex-col items-end justify-start gap-2.5 px-5 sm:px-6 pt-5 sm:pt-6 pb-16 sm:pb-28 select-text"
            )}
          >
            <div ref={contentRef} className="w-full flex flex-col items-end justify-start">
              {/* Files Preview — exact same styling & dimensions as message-list */}
              {hasFiles && (
                <div className="flex flex-wrap gap-2.5 mb-2.5 justify-end items-end select-none">
                  {files!.map((file: any, i: number) => (
                    <MessageAttachmentItem
                      key={file.id || file.url || file.publicUrl || i}
                      file={file}
                      interactive={false}
                    />
                  ))}
                </div>
              )}

              {/* Prompt Text — identical bubble styling (bg / rounding / padding / max-w) to message-list */}
              {promptText && (
                <div className="relative bg-bubble text-bubble-foreground text-[15px] sm:text-[15.5px] leading-relaxed rounded-[25px] sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap select-text break-words">
                  {promptText}
                </div>
              )}
            </div>
          </div>

          {/* Bottom gradient overlay — 25% full fade across entire card width */}
          <div className="absolute bottom-0 left-0 right-0 h-[25%] min-h-[95px] sm:min-h-[105px] z-10 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent" />

          {/* CloseAI Branding */}
          <div
            className="absolute right-5 sm:right-6 bottom-4 sm:bottom-5 z-20 pointer-events-none transition-[right] duration-75"
            style={brandingRightOffset !== null ? { right: `${brandingRightOffset}px` } : undefined}
          >
            <span className="text-2xl font-bold text-foreground tracking-tight select-none">
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
            className="flex flex-col items-center gap-2 group cursor-pointer focus-visible:outline-none"
          >
            <div className={cn("w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center active:scale-[0.99] transition-opacity group-hover:opacity-90", shareButtonRing)}>
              {linkCopied ? (
                <CheckIcon className="w-6 h-6" />
              ) : (
                <LinkIcon className="w-6 h-6" />
              )}
            </div>
            <span className="text-base font-normal text-foreground select-none">
              {linkCopied ? "Copied" : "Copy"}
            </span>
          </button>

          {/* X (Twitter) */}
          <button
            type="button"
            onClick={handleShareX}
            className="flex flex-col items-center gap-2 group cursor-pointer focus-visible:outline-none"
          >
            <div className={cn("w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center active:scale-[0.99] transition-opacity group-hover:opacity-90", shareButtonRing)}>
              <XLogoIcon className="w-6 h-6" />
            </div>
            <span className="text-base font-normal text-foreground select-none">X</span>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={handleShareLinkedIn}
            className="flex flex-col items-center gap-2 group cursor-pointer focus-visible:outline-none"
          >
            <div className={cn("w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center active:scale-[0.99] transition-opacity group-hover:opacity-90", shareButtonRing)}>
              <LinkedinLogoIcon className="w-6 h-6" />
            </div>
            <span className="text-base font-normal text-foreground select-none">
              LinkedIn
            </span>
          </button>

          {/* More (system share) */}
          <button
            type="button"
            onClick={handleShareMore}
            className="flex flex-col items-center gap-2 group cursor-pointer focus-visible:outline-none"
          >
            <div className={cn("w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center active:scale-[0.99] transition-opacity group-hover:opacity-90", shareButtonRing)}>
              <DotsThreeIcon className="w-6 h-6" />
            </div>
            <span className="text-base font-normal text-foreground select-none">
              More
            </span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}