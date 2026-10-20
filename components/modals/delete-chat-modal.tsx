"use client";

import React from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { AlertTriangle, PinOff, ArchiveX } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useModalTheme } from "@/hooks/use-modal-theme";
import { MessageAttachmentItem } from "@/components/chat/message-attachment";
import { cn } from "@/lib/utils";

export interface DeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemTitle?: string;
  isActive?: boolean;
  starred?: boolean;
  archived?: boolean;
  promptText?: string;
  files?: any[];
  isGuest?: boolean;
}

export function DeleteModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemTitle,
  isActive = false,
  starred = false,
  archived = false,
  promptText,
  files,
  isGuest: isGuestProp,
}: DeleteModalProps) {
  const { isGuest, modalBgClass } = useModalTheme(isGuestProp, open);
  const displayText = promptText || itemTitle || "New chat";
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
            {title || "Delete chat?"}
          </h2>
        </div>

        {/* Preview Card — outer container like logout modal / delete message modal */}
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

            {/* Chat Bubble — exact same size, rounding, padding, and typography as message-list */}
            <div
              className={cn(
                "max-w-[85%] sm:max-w-[75%] flex items-start justify-between gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[25px] sm:rounded-3xl text-[15px] sm:text-[15.5px] leading-relaxed select-text transition-colors break-words whitespace-pre-wrap",
                "bg-bubble text-bubble-foreground"
              )}
            >
              <div className="relative flex-1 min-w-0">
                <span className="inline-block break-words whitespace-pre-wrap">
                  {displayText}
                </span>
              </div>

              {starred && (
                <PinOff className="w-4 h-4 text-muted-foreground shrink-0 ml-1.5 mt-1" />
              )}
              {archived && !starred && (
                <ArchiveX className="w-4 h-4 text-muted-foreground shrink-0 ml-1.5 mt-1" />
              )}
            </div>
          </div>
        </div>

        {/* Warning / Info Box */}
        <div className="w-full flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/50 text-left text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
          <span className="leading-normal">
            {description || "This will permanently delete this conversation."}
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
                ? "dark:focus-visible:ring-offset-[#2f2f2f]"
                : "dark:focus-visible:ring-offset-card"
            )}
          >
            Delete chat
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "w-full h-11 rounded-full border border-border/80 bg-transparent text-foreground font-normal text-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-all cursor-pointer select-none",
              isGuest
                ? "dark:focus-visible:ring-offset-[#2f2f2f]"
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

export const DeleteChatModal = DeleteModal;
