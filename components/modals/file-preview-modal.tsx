"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  FileText,
  Loader,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useAuth } from "@/hooks/use-auth";
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
  isGuest?: boolean;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  file,
  isGuest: controlledIsGuest,
}: FilePreviewModalProps) {
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch (e) {
    user = null;
  }
  const isGuestMode = controlledIsGuest !== undefined ? controlledIsGuest : !user;

  const [fileUrl, setFileUrl] = useState<string>("");
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

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

  if (!open || !file) return null;

  const fileName = file.name || file.filename || "Attachment";
  const { Icon, label, colorClass, badgeBg } = getFileIconInfo(file);
  const isImg = isImageFile(file);
  const isPdf = isPdfFile(file);
  const isText = isTextOrCodeFile(file);

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
            src={fileUrl.includes("#") ? fileUrl : `${fileUrl}#toolbar=1`}
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
              <FileText className="w-11 h-11 opacity-60" />
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
          <div className="flex items-center gap-2.5 pt-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-secondary text-foreground text-xs font-medium transition-colors"
            >
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Simple dark backdrop without animation */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-background/80 cursor-default"
        />

        {/* Simple content container covering full screen */}
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 w-screen h-screen p-0 bg-transparent border-0 outline-none focus:outline-none flex items-center justify-center pointer-events-auto cursor-default"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onClick={() => onOpenChange(false)}
        >
          <DialogPrimitive.Title className="sr-only">
            {fileName || "File preview"}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Preview file full size
          </DialogPrimitive.Description>

          {/* Header toolbar matching Share & More buttons position */}
          <header className="fixed top-0 left-0 right-0 z-50 h-14 pt-[env(safe-area-inset-top,0px)] px-3 sm:px-4 flex items-center justify-end select-none pointer-events-none bg-transparent">
            <div
              className="flex items-center pointer-events-auto mt-3 pr-3 sm:pr-1 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={cn(
                  "flex items-center h-11 rounded-sm transition-colors",
                  isGuestMode
                    ? "bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-none"
                    : "bg-white/50 dark:bg-[#212121]/50 sm:bg-background/50 sm:dark:bg-background/50 backdrop-blur-sm border border-border/80 dark:border-none"
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "group h-full w-11 rounded-sm flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none select-none shrink-0",
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

          {/* Centered Content Container */}
          {isImg && fileUrl ? (
            <div
              className="relative inline-block max-w-[90vw] max-h-[80vh] overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fileUrl}
                alt={fileName}
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl select-none block"
              />
            </div>
          ) : (
            <div
              className="relative w-[90vw] max-w-[90vw] h-[80vh] max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 w-full h-full overflow-hidden p-0 flex flex-col min-h-0">
                {previewContent}
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default FilePreviewModal;
