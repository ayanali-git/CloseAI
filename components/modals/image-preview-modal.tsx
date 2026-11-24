"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PreviewDialog } from "@/components/ui/dialog";
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
  className = "cursor-pointer rounded-xl hover:opacity-90 transition-opacity",
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

  const handleDownload = () => {
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

      <AnimatePresence>
        {isOpen && (
          <PreviewDialog
            kind="image"
            title={alt || "Image preview"}
            isGuest={isGuestMode}
            onOpenChange={setIsOpen}
            onDownload={src ? handleDownload : undefined}
          >
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
          </PreviewDialog>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ImagePreview;
