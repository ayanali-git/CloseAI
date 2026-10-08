"use client";

import React, { useState } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useAuth } from "@/hooks/use-auth";
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
  className = "cursor-pointer rounded-xl hover:opacity-90 transition-opacity",
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  isGuest: controlledIsGuest,
}: ImagePreviewProps) {
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch (e) {
    user = null;
  }
  const isGuestMode = controlledIsGuest !== undefined ? controlledIsGuest : !user;
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

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
            className="fixed inset-0 z-50 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm cursor-default"
          />

          {/* Simple content container covering full screen */}
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 w-screen h-screen p-0 bg-transparent border-0 outline-none focus:outline-none flex items-center justify-center pointer-events-auto cursor-default"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
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
                className="flex items-center pointer-events-auto mt-3 pr-3 sm:pr-1 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={cn(
                    "flex items-center h-11 p-0.5 gap-0.5 rounded-xl transition-colors",
                    isGuestMode
                      ? "bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none"
                      : "bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none"
                  )}
                >
                  {src && (
                    <button
                      type="button"
                      onClick={handleDownload}
                      className={cn(
                        "group h-full w-10 sm:w-11 rounded-sm flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0",
                        isGuestMode
                          ? "hover:bg-secondary dark:hover:bg-[#383838] focus:bg-secondary dark:focus:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 text-muted-foreground hover:text-foreground"
                          : "hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 text-muted-foreground hover:text-foreground"
                      )}
                      title="Download image"
                      aria-label="Download image"
                    >
                      <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "group h-full w-10 sm:w-11 rounded-sm flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0",
                      isGuestMode
                        ? "hover:bg-secondary dark:hover:bg-[#383838] focus:bg-secondary dark:focus:bg-[#383838] active:bg-secondary/80 dark:active:bg-[#383838]/80 text-muted-foreground hover:text-foreground"
                        : "hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 text-muted-foreground hover:text-foreground"
                    )}
                    title="Close preview"
                    aria-label="Close preview"
                  >
                    <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Centered Image Container */}
            <div
              className="relative inline-block max-w-[85vw] max-h-[85vh] overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src}
                alt={alt}
                className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl select-none block"
              />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

export default ImagePreview;
