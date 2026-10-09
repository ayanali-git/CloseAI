"use client";

import React from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { AlertTriangle, PinOff, ArchiveX } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { isImageFile, getFileIconInfo } from "@/lib/file-utils";
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
  const { user } = useAuth();
  const isGuest = isGuestProp !== undefined ? isGuestProp : !user;
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
        isGuest
          ? "bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none"
          : "bg-card border border-border/90 dark:border-none"
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
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-background border border-border/80 dark:border-none">
          {/* Bottom gradient overlay — full width, no scrollbar */}
          <div className="absolute bottom-0 left-0 right-0 h-[30%] min-h-[48px] max-h-[64px] z-10 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent" />

          <div
            className={cn(
              "relative z-0 min-h-[140px] sm:min-h-[160px] max-h-[200px] flex flex-col items-end justify-start gap-2.5 p-5 sm:p-6 overflow-hidden select-text"
            )}
          >
            {/* Files Preview */}
            {hasFiles && (
              <div className="flex flex-wrap gap-1.5 justify-end items-end select-none">
                {files!.map((file: any, i: number) => {
                  const fileUrl = file.url || file.publicUrl;
                  const isImg = isImageFile(file);
                  const { Icon, label } = getFileIconInfo(file);
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

            {/* Chat Bubble — exact same size, rounding, padding, and typography as delete message modal */}
            <div
              className={cn(
                "max-w-[85%] flex items-start justify-between gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl text-[15px] sm:text-[15.5px] leading-relaxed select-none transition-colors break-words whitespace-pre-wrap",
                "bg-bubble text-bubble-foreground"
              )}
            >
              <div className="relative flex-1 min-w-0">
                <span className="inline-block break-words whitespace-pre-wrap select-none">
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
