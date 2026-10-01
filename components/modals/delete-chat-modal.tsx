"use client";

import React from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { AlertTriangle } from "lucide-react";
import { isImageFile, getFileIconInfo } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

export interface DeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemTitle?: string;
  promptText?: string;
  files?: any[];
}

export function DeleteModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemTitle,
  promptText,
  files,
}: DeleteModalProps) {
  const displayText = promptText || itemTitle || "New chat";
  const hasFiles = files && files.length > 0;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      maxSnap={0.96}
      className="max-w-[440px]"
    >
      <div className="flex flex-col space-y-4 pt-1 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {title || "Delete chat?"}
          </h2>
        </div>

        {/* Message / Chat Preview Card — same to same as Delete Message card */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden dark:bg-neutral-800 border border-border/80 dark:border-none">
          {/* Bottom gradient overlay — stops before scrollbar */}
          <div className="absolute bottom-0 left-0 right-3 sm:right-4 h-[28%] min-h-[48px] max-h-[60px] z-10 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent dark:from-neutral-800 dark:via-neutral-800/95 to-transparent" />

          <div
            className={cn(
              "relative z-0 max-h-[200px] min-h-[160px] flex flex-col items-end justify-start gap-2.5 px-5 sm:px-6 pt-5 sm:pt-6 pb-10 sm:pb-12 overflow-y-auto select-text",
            )}
          >
            {/* Files Preview */}
            {hasFiles && (
              <div className="flex flex-wrap gap-1.5 justify-end items-end select-none">
                {files!.map((file: any, i: number) => {
                  const fileUrl = file.url || file.publicUrl;
                  const isImg = isImageFile(file);
                  const { Icon } = getFileIconInfo(file);
                  const displayName = file.name || file.filename || "File";
                  return (
                    <div
                      key={file.id || i}
                      className={cn(
                        "overflow-hidden bg-secondary border border-border/80",
                        isImg
                          ? "rounded-xl max-w-[100px] sm:max-w-[150px]"
                          : "rounded-full max-w-full"
                      )}
                    >
                      {isImg && fileUrl ? (
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

            {/* Prompt Text / Chat Title Bubble */}
            {displayText && (
              <p className="bg-bubble text-bubble-foreground text-[15px] sm:text-[15.5px] leading-relaxed rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] whitespace-pre-wrap break-words">
                {displayText}
              </p>
            )}
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
            className="w-full h-11 rounded-full bg-red-600 text-white font-semibold text-sm hover:bg-red-500 active:scale-[0.99] transition-all cursor-pointer select-none"
          >
            Delete chat
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full h-11 rounded-full border border-border/80 bg-transparent text-foreground font-normal text-sm hover:bg-secondary transition-all cursor-pointer select-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export const DeleteChatModal = DeleteModal;
