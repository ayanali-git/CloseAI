"use client";

import React, { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { AlertTriangle, X } from "lucide-react";
import { isImageFile, getFileIconInfo } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

export interface DeleteMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  promptText: string;
  files?: any[];
}

export function DeleteMessageModal({
  open,
  onOpenChange,
  onConfirm,
  promptText,
  files,
}: DeleteMessageModalProps) {
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileScreen(window.innerWidth < 1025);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const hasFiles = files && files.length > 0;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      className="max-w-[600px]"
    >
      <div className="flex flex-col space-y-4 pt-1 pb-2">
        {/* Header — Share prompt style with X close button on desktop */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Delete message?
          </h2>
        </div>

        {/* Message Preview Card — same to same as Share Prompt card, without scrollable and without CloseAI text */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden dark:bg-neutral-800 border border-border/80 dark:border-none">
          {/* Bottom gradient overlay — stops before scrollbar */}
          <div className="absolute bottom-0 left-0 right-3 sm:right-4 h-[30%] min-h-[95px] sm:min-h-[105px] z-10 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent dark:from-neutral-800 dark:via-neutral-800/95 to-transparent" />

          <div
            className={cn(
              "relative z-0 max-h-[200px] sm:max-h-[400px] min-h-[150px] sm:min-h-[300px] flex flex-col items-end justify-start gap-2.5 px-5 sm:px-6 pt-5 sm:pt-6 pb-12 sm:pb-14 overflow-y-auto select-text",
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

            {/* Prompt Text Bubble */}
            {promptText && (
              <p className="bg-bubble text-bubble-foreground text-[15px] sm:text-[15.5px] leading-relaxed rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] whitespace-pre-wrap break-words">
                {promptText}
              </p>
            )}
          </div>
        </div>

        {/* Warning / Info Box — from delete-modal style */}
        <div className="w-full flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/50 text-left text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
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
            className="w-full h-11 rounded-full bg-red-600 text-white font-semibold text-sm hover:bg-red-500 active:scale-[0.99] transition-all cursor-pointer select-none"
          >
            Delete message
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
