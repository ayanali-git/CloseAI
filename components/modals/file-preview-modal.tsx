"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FileText, Loader } from "lucide-react";
import { PreviewDialog } from "@/components/ui/dialog";
import { useModalTheme } from "@/hooks/use-modal-theme";
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
  file,
  ...props
}: FilePreviewModalProps) {
  return (
    <AnimatePresence>
      {open && file && <FilePreview file={file} {...props} />}
    </AnimatePresence>
  );
}

function FilePreview({
  file,
  onOpenChange,
  isGuest: controlledIsGuest,
}: Omit<FilePreviewModalProps, "open">) {
  const { isGuest: isGuestMode } = useModalTheme(controlledIsGuest, true);

  const [fileUrl, setFileUrl] = useState<string>("");
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let createdBlobUrl = "";
    let loadingTimer: number | undefined;
    const resolvedUrl =
      file instanceof File
        ? (createdBlobUrl = URL.createObjectURL(file))
        : getFileUrl(file);
    setFileUrl(resolvedUrl);

    // If text or code file, attempt to read content
    if (isTextOrCodeFile(file)) {
      if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextContent((e.target?.result as string) || "");
          setIsLoading(false);
        };
        reader.onerror = () => setIsLoading(false);
        reader.readAsText(file);
      } else if (
        typeof file === "object" &&
        file !== null &&
        "content" in file &&
        typeof (file as any).content === "string"
      ) {
        setTextContent((file as any).content);
        setIsLoading(false);
      } else if (resolvedUrl && resolvedUrl.startsWith("http")) {
        fetch(resolvedUrl)
          .then((res) => (res.ok ? res.text() : Promise.reject()))
          .then((text) => {
            setTextContent(text);
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
            setTextContent(null);
          });
      } else {
        setTextContent(null);
        setIsLoading(false);
      }
    } else {
      loadingTimer = window.setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }

    return () => {
      window.clearTimeout(loadingTimer);
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [file]);

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fileName = file.name || file.filename || "Attachment";
  const { Icon, label, colorClass, badgeBg } = getFileIconInfo(file);
  const isImg = isImageFile(file);
  const isPdf = isPdfFile(file);
  const isText = isTextOrCodeFile(file);

  const previewContent = (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center">
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
        <div className="w-full h-full flex-1 flex flex-col overflow-y-auto bg-secondary p-5 sm:p-6 font-mono text-xs sm:text-sm text-foreground whitespace-pre select-text">
          {textContent !== null ? (
            <code>{textContent}</code>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText className="w-10 h-10 opacity-50" />
              <span>Preview not available for this text file.</span>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-75 active:opacity-50"
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
          <div className="flex items-center gap-2 pt-2">
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
    <PreviewDialog
      kind="file"
      title={fileName}
      isGuest={isGuestMode}
      onOpenChange={onOpenChange}
      onDownload={fileUrl ? handleDownload : undefined}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-16">
          <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : isImg && fileUrl ? (
        <div
          className="relative inline-block max-w-full max-h-[75dvh] overflow-hidden rounded-2xl border border-border/80 dark:border-none"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={fileUrl}
            alt={fileName}
            className="max-h-[75dvh] max-w-full object-contain select-none block"
          />
        </div>
      ) : (
        <div
          className="relative w-full max-w-5xl h-[75dvh] max-h-[75dvh] flex flex-col bg-background/95 dark:bg-[#1e1e1e]/95 rounded-2xl border border-border/80 dark:border-none overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 w-full h-full overflow-hidden p-0 flex flex-col min-h-0">
            {previewContent}
          </div>
        </div>
      )}
    </PreviewDialog>
  );
}

export default FilePreviewModal;
