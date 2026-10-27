"use client";

import React from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { AlertTriangle } from "lucide-react";
import { MessageAttachmentItem } from "@/components/chat/message-attachment";
import { useModalTheme } from "@/hooks/use-modal-theme";
import { cn } from "@/lib/utils";

export interface DeleteMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  promptText: string;
  files?: any[];
  isGuest?: boolean;
}

export function DeleteMessageModal({
  open,
  onOpenChange,
  onConfirm,
  promptText,
  files,
  isGuest: isGuestProp,
}: DeleteMessageModalProps) {
  const { isGuest, modalBgClass } = useModalTheme(isGuestProp, open);

  const hasFiles = files && files.length > 0;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      maxSnap={0.96}
      className={cn(
        "max-w-[440px]",
        modalBgClass
      )}
    >
      <div className="flex flex-col space-y-4 pt-1 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Delete message?
          </h2>
        </div>

        {/* Message Preview Card — same to same consistent with delete chat modal */}
        <div className="relative w-full rounded-[25px] sm:rounded-3xl overflow-hidden bg-background border border-border/80 dark:border-none">
          {/* Bottom gradient overlay — full width, no scrollbar */}
          <div className="absolute bottom-0 left-0 right-0 h-[30%] min-h-[48px] max-h-[64px] z-10 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent" />

          <div
            className={cn(
              "relative z-0 min-h-[140px] sm:min-h-[160px] max-h-[200px] flex flex-col items-end justify-start p-5 sm:p-6 overflow-hidden select-text"
            )}
          >
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

            {/* Prompt Text Bubble — identical styling, dimensions, and rounding to message-list */}
            {promptText && (
              <div className="relative bg-bubble text-bubble-foreground text-[15px] sm:text-[15.5px] leading-relaxed rounded-[25px] sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap select-text break-words">
                {promptText}
              </div>
            )}
          </div>
        </div>

        {/* Warning / Info Box — from delete-modal style */}
        <div className="w-full flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/50 text-left text-xs text-muted-foreground">
          <AlertTriangle className="w-5 h-5 shrink-0 text-muted-foreground mt-0.5" />
          <span className="leading-normal">
            This will permanently delete this prompt, any attached files, and its associated response.
          </span>
        </div>

        {/* Action Buttons — Stacked Full-Width Pills */}
        <div className="w-full space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className={cn(
              "w-full h-11 rounded-full bg-red-600 text-white font-semibold text-sm hover:bg-red-500 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-all cursor-pointer select-none",
              isGuest
                ? "dark:focus-visible:ring-offset-[#1f1f1f]"
                : "dark:focus-visible:ring-offset-card"
            )}
          >
            Delete message
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "w-full h-11 rounded-full border border-border/80 bg-transparent text-foreground font-normal text-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-all cursor-pointer select-none",
              isGuest
                ? "dark:focus-visible:ring-offset-[#1f1f1f]"
                : "dark:focus-visible:ring-offset-card"
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
