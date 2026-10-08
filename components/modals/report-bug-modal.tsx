"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useAuth } from "@/hooks/use-auth";
import toast from "@/lib/toast";
import { cn } from "@/lib/utils";
import { X, Loader } from "lucide-react";
import { AnimatedArrowUpRight, AnimatedPlusCheck } from "@/components/ui/animated";

export const REPORT_BUG_CATEGORIES = [
  "Bug",
  "Bad result",
  "Good result",
  "Safety check",
  "Research failure",
  "Other",
] as const;

export type ReportBugCategory = (typeof REPORT_BUG_CATEGORIES)[number];

export interface ReportBugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Force guest or authenticated styling variant. If omitted, deduced from auth state */
  isGuest?: boolean;
  /** Optional initial pre-selected category */
  initialCategory?: ReportBugCategory | string;
  /** When true, always render as centered modal (not bottom sheet on mobile) */
  forceModal?: boolean;
}

export function openReportBugModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-report-bug-modal"));
  }
}

export function ReportBugModal({
  open,
  onOpenChange,
  isGuest: isGuestProp,
  initialCategory,
  forceModal,
}: ReportBugModalProps) {
  const { user, loading } = useAuth();
  const isGuest = isGuestProp !== undefined ? isGuestProp : (!loading && !user);

  // Single-select category: only one active at a time
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync / reset form when modal opens or closes
  useEffect(() => {
    if (open) {
      setSelectedCategory(initialCategory || null);
      setDetails("");
      setIsSubmitting(false);

      // Focus textarea on modal open
      const timer = window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => window.clearTimeout(timer);
    } else {
      setSelectedCategory(null);
      setDetails("");
      setIsSubmitting(false);
    }
  }, [open, initialCategory]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
  };

  const isSubmitEnabled = details.trim().length > 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isSubmitEnabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          categories: selectedCategory ? [selectedCategory] : [],
          details: details.trim(),
          isGuest,
          email: user?.email || null,
        }),
      });
    } catch {
      // Gracefully continue even if offline
    } finally {
      setIsSubmitting(false);
      toast.success("Thank you for your feedback!");
      onOpenChange(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      maxSnap={0.96}
      forceModal={forceModal}
      className={cn(
        "max-w-[480px]",
        // Guest mode (/gc, /gc/[id]) matches settings-modal and guest chat surfaces
        isGuest
          ? "bg-white dark:bg-[#2f2f2f] border border-border/80"
          : "bg-card border border-border/90 dark:border-none"
      )}
    >
      <div className="flex flex-col space-y-4 pt-1 pb-2">
        {/* Header: Title & Close Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground select-none">
            Share feedback
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "p-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none",
              "focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2",
              isGuest
                ? "rounded-full hover:bg-secondary dark:hover:bg-[#383838] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f]"
                : "rounded-sm hover:bg-secondary dark:hover:bg-[#2f2f2f] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#212121]"
            )}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills (Single selection, zero size increase on select) */}
        <div className="flex flex-wrap gap-2 select-none">
          {REPORT_BUG_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={cn(
                  "group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] sm:text-sm font-normal transition-colors cursor-pointer outline-none select-none border",
                  "focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-1",
                  isGuest
                    ? "dark:focus-visible:ring-offset-[#2f2f2f]"
                    : "dark:focus-visible:ring-offset-[#212121]",
                  isSelected
                    ? "bg-foreground text-background border-foreground dark:bg-white dark:text-neutral-900 dark:border-white"
                    : cn(
                        isGuest
                          ? "bg-secondary text-foreground hover:bg-secondary/80 border-border/50 dark:bg-[#383838] dark:hover:bg-[#424242] dark:text-neutral-200 dark:border-transparent"
                          : "bg-secondary text-foreground hover:bg-secondary/80 border-border/50 dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-neutral-200 dark:border-transparent"
                      )
                )}
              >
                <AnimatedPlusCheck
                  checked={isSelected}
                  size={18}
                  strokeWidth={1.25}
                  className={cn(
                    "shrink-0 transition-colors",
                    isSelected
                      ? "text-background dark:text-neutral-900"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Textarea */}
        <div className="w-full">
          <textarea
            ref={textareaRef}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Share your feedback"
            rows={5}
            className={cn(
              "w-full min-h-[120px] max-h-[240px] p-3 rounded-2xl rounded-br-[4px] text-sm sm:text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:placeholder:text-foreground transition-colors resize-y outline-none border",
              isGuest
                ? "bg-transparent border-border/80 dark:border-white/10"
                : "bg-secondary border-border/80 dark:border-none"
            )}
          />
        </div>

        {/* Disclaimer / Subtext */}
        <p className="text-sm text-muted-foreground select-none leading-normal">
          Your feedback can be used to improve CloseAI.{" "}
          <Link
            href="/support/help"
            target="_blank"
            rel="noopener noreferrer"
            className="group text-foreground transition-colors cursor-pointer"
          >
            Learn more
            <AnimatedArrowUpRight size={15} className="shrink-0 text-muted-foreground group-hover:text-foreground" />
          </Link>
        </p>

        {/* Action Button: Full-width Submit */}
        <div className="w-full pt-1">
          <button
            type="button"
            disabled={!isSubmitEnabled || isSubmitting}
            onClick={handleSubmit}
            className={cn(
              "w-full h-11 rounded-full font-medium text-sm sm:text-base transition-all select-none flex items-center justify-center outline-none",
              "focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2",
              isGuest
                ? "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f]"
                : "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#212121]",
              !isSubmitEnabled || isSubmitting
                ? cn(
                    "cursor-not-allowed opacity-60",
                    isGuest
                      ? "bg-secondary dark:bg-[#383838] text-muted-foreground"
                      : "bg-secondary dark:bg-[#2f2f2f] text-muted-foreground"
                  )
                : cn(
                    "cursor-pointer active:scale-[0.99] hover:opacity-90",
                    "bg-foreground text-background dark:bg-white dark:text-neutral-900"
                  )
            )}
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <span>Submit</span>
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export default ReportBugModal;
