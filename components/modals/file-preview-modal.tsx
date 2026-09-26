"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ExternalLink,
  Download,
  FileText,
  Loader,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  isImageFile,
  isPdfFile,
  isTextOrCodeFile,
  getFileIconInfo,
  getFileUrl,
} from "@/lib/file-utils";
import { cn } from "@/lib/utils";

export interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: any;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  file,
}: FilePreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobileScreen(window.innerWidth < 1025);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!open || !file) {
      setFileUrl("");
      setTextContent(null);
      return;
    }

    let createdBlobUrl = "";
    const resolvedUrl =
      file instanceof File
        ? (createdBlobUrl = URL.createObjectURL(file))
        : getFileUrl(file);
    setFileUrl(resolvedUrl);

    // If text or code file, attempt to read content
    if (isTextOrCodeFile(file)) {
      if (file instanceof File) {
        setIsLoadingText(true);
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextContent((e.target?.result as string) || "");
          setIsLoadingText(false);
        };
        reader.onerror = () => setIsLoadingText(false);
        reader.readAsText(file);
      } else if (resolvedUrl && resolvedUrl.startsWith("http")) {
        setIsLoadingText(true);
        fetch(resolvedUrl)
          .then((res) => (res.ok ? res.text() : Promise.reject()))
          .then((text) => {
            setTextContent(text);
            setIsLoadingText(false);
          })
          .catch(() => {
            setIsLoadingText(false);
            setTextContent(null);
          });
      }
    }

    return () => {
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [open, file]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open || !file) return null;

  const fileName = file.name || file.filename || "Attachment";
  const { Icon, label, colorClass, badgeBg } = getFileIconInfo(file);
  const isImg = isImageFile(file);
  const isPdf = isPdfFile(file);
  const isText = isTextOrCodeFile(file);

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const previewContent = (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center">
      {!fileUrl && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground py-16">
          <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {isImg && fileUrl && (
        <div className="w-full h-full flex-1 flex items-center justify-center p-0 overflow-hidden bg-black/5 dark:bg-black/20">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-h-full max-w-full object-contain select-none"
          />
        </div>
      )}

      {isPdf && fileUrl && (
        <div className="w-full h-full flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900">
          <iframe
            src={fileUrl}
            title={fileName}
            className="w-full h-full flex-1 border-0"
          />
        </div>
      )}

      {isText && (
        <div className="w-full h-full flex-1 flex flex-col overflow-y-auto bg-secondary/15 p-5 sm:p-6 font-mono text-xs sm:text-sm text-foreground whitespace-pre select-text">
          {isLoadingText ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader className="w-7 h-7 animate-spin text-muted-foreground" />
            </div>
          ) : textContent !== null ? (
            <code>{textContent}</code>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText className="w-10 h-10 opacity-60" />
              <span>Preview not available for this text file.</span>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90"
                >
                  Open in new tab
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {!isImg && !isPdf && !isText && (
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 sm:py-12 px-4">
          <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center", badgeBg)}>
            <Icon className={cn("w-8 h-8", colorClass)} weight="fill" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">{fileName}</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Direct browser preview is not supported for this file format. You can download or open it in your system.
            </p>
          </div>
          {fileUrl && (
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-secondary text-foreground text-xs font-medium transition-colors"
              >
                Open
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isMobileScreen) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={[0.75]}
        defaultSnap={0}
        className="w-full max-w-2xl h-[75dvh] max-h-[75dvh] flex flex-col"
      >
        <div className="flex flex-col h-full -mx-6 -mt-2 -mb-6">
          {/* Mobile BottomSheet Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 select-none bg-card shrink-0">
            <span className="text-sm font-semibold truncate max-w-[240px] text-foreground">
              {fileName}
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Close preview"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Content Viewer Area */}
          <div className="flex-1 w-full h-full overflow-hidden p-0 flex flex-col min-h-0">
            {previewContent}
          </div>
        </div>
      </BottomSheet>
    );
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm cursor-default"
    >
      {/* Top-Right Toolbar matching Share & More buttons position */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-4 flex items-center justify-end select-none pointer-events-none bg-transparent">
        <div
          className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto mt-3 pr-3 sm:pr-1 select-none"
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 rounded-xl bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none"
            title="Close preview"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </header>

      <div
        className="relative w-[85vw] max-w-[85vw] h-[85vh] max-h-[85vh] flex flex-col bg-background/95 dark:bg-[#1e1e1e]/95 rounded-2xl overflow-hidden"
      >
        {/* Content Viewer Area */}
        <div className="flex-1 w-full h-full overflow-hidden p-0 flex flex-col min-h-0">
          {previewContent}
        </div>
      </div>
    </div>,
    document.body
  );
}
