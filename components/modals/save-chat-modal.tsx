"use client";

import React, { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Bookmark, Loader } from "lucide-react";
import { MessageAttachmentItem } from "@/components/chat/message-attachment";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { TemporaryChatDashedBorder } from "@/components/chat/message-list";

export interface SaveChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  itemTitle?: string;
  promptText?: string;
  files?: any[];
  isGuest?: boolean;
}

export function SaveChatModal({
  open,
  onOpenChange,
  onConfirm,
  itemTitle,
  promptText,
  files,
  isGuest: isGuestProp,
}: SaveChatModalProps) {
  const { user } = useAuth();
  const isGuest = isGuestProp !== undefined ? isGuestProp : !user;
  const displayText = promptText || itemTitle || "New chat";
  const hasFiles = files && files.length > 0;
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save chat:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(v) => {
        if (!isSaving) onOpenChange(v);
      }}
      snapPoints={["auto"]}
      maxSnap={0.96}
      className={cn(
        "max-w-[440px]",
        isGuest
          ? "bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none"
          : "bg-card border border-border/80 dark:border-none"
      )}
    >
      <div className="flex flex-col space-y-4 pt-1 pb-2">
        {/* Header matching delete chat modal */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Save chat?
          </h2>
        </div>

        {/* Preview Card — consistent with delete chat modal and delete message modal */}
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

            {/* Chat Bubble with dashed border for temporary chat */}
            <div
              className={cn(
                "relative max-w-[85%] sm:max-w-[75%] flex items-start justify-between gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[25px] sm:rounded-3xl text-[15px] sm:text-[15.5px] leading-relaxed select-text transition-colors break-words whitespace-pre-wrap",
                "bg-bubble text-bubble-foreground"
              )}
            >
              <div className="relative flex-1 min-w-0">
                <span className="inline-block break-words whitespace-pre-wrap">
                  {displayText}
                </span>
              </div>
              <TemporaryChatDashedBorder />
            </div>
          </div>
        </div>

        {/* Info Box matching delete modal warning box style */}
        <div className="w-full flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/50 text-left text-xs text-muted-foreground">
          <Bookmark className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
          <span className="leading-normal">
            This chat will now be included in your history. It will follow your
            memory and model training settings used for regular chats.
          </span>
        </div>

        {/* Action Buttons — Stacked Full-Width Pills same to same as delete chat modal */}
        <div className="w-full space-y-2 pt-1">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className={cn(
              "w-full h-11 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-all cursor-pointer select-none flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none",
              isGuest
                ? "dark:focus-visible:ring-offset-[#2f2f2f]"
                : "dark:focus-visible:ring-offset-card"
            )}
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-background" />
                <span>Saving chat</span>
              </>
            ) : (
              "Save chat"
            )}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            className={cn(
              "w-full h-11 rounded-full border border-border/80 bg-transparent text-foreground font-normal text-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-all cursor-pointer select-none disabled:opacity-50",
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

export default SaveChatModal;
