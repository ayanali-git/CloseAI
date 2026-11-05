"use client";

import React, { useState } from "react";
import { X, Download } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useModalTheme } from "@/hooks/use-modal-theme";
import { cn } from "@/lib/utils";

export interface ImagePreviewProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isGuest?: boolean;
}

export function ImagePreview({
  src,
  alt = "Preview image",
  width = 400,
  height = 400,
  className = "cursor-pointer rounded-xl hover:opacity-80 transition-opacity",
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  isGuest: controlledIsGuest,
}: ImagePreviewProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const { isGuest: isGuestMode } = useModalTheme(controlledIsGuest, isOpen);

  const setIsOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    controlledOnOpenChange?.(next);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = alt || "image";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex leading-[0] self-end max-w-full">
      {children ? (
        <div onClick={() => setIsOpen(true)} className="flex leading-[0] cursor-pointer">
          {children}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn("block m-0 cursor-pointer select-none", className)}
          draggable={false}
          onClick={() => setIsOpen(true)}
        />
      )}

      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Portal>
          {/* Simple dark backdrop without animation */}
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-50 bg-background/80 cursor-default"
          />

          {/* Simple content container covering full screen */}
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 w-full h-[100dvh] px-3 sm:px-6 pt-14 pb-[max(env(safe-area-inset-bottom,0px),1rem)] bg-transparent border-0 outline-none focus:outline-none flex items-center justify-center pointer-events-auto cursor-default"
            onClick={() => setIsOpen(false)}
          >
            <DialogPrimitive.Title className="sr-only">
              {alt || "Image preview"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Preview image full size
            </DialogPrimitive.Description>

            {/* Header toolbar matching Share & More buttons position */}
            <header className="fixed top-0 left-0 right-0 z-50 h-14 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-4 flex items-center justify-end select-none pointer-events-none bg-transparent">
              <div
                className="flex items-center pointer-events-auto mt-3 pr-3 sm:pr-1 select-none gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {src && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className={cn(
                      "group h-11 w-11 rounded-full xl:rounded-sm flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0",
                      isGuestMode
                        ? "bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-none hover:bg-secondary dark:hover:bg-[#2f2f2f] active:bg-secondary dark:active:bg-[#2f2f2f] text-muted-foreground hover:text-foreground"
                        : "bg-background border border-border/80 dark:border-none hover:bg-secondary active:bg-secondary text-foreground"
                    )}
                    title="Download image"
                    aria-label="Download image"
                  >
                    <Download className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                    <span className="sr-only">Download</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "group h-11 w-11 rounded-full xl:rounded-sm flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0",
                    isGuestMode
                      ? "bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-none hover:bg-secondary dark:hover:bg-[#2f2f2f] active:bg-secondary dark:active:bg-[#2f2f2f] text-muted-foreground hover:text-foreground"
                      : "bg-background border border-border/80 dark:border-none hover:bg-secondary active:bg-secondary text-foreground"
                  )}
                  title="Close image preview"
                  aria-label="Close image preview"
                >
                  <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </header>

            {/* Centered Image Container */}
            <div
              className="relative inline-block max-w-full max-h-[75dvh] overflow-hidden rounded-2xl border border-border/80 dark:border-none"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src}
                alt={alt}
                className="max-h-[75dvh] max-w-full object-contain select-none block"
              />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

export default ImagePreview;
