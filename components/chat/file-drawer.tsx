"use client";

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  cloneElement,
  isValidElement,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Loader,
} from "lucide-react";
import {
  isImageFile,
  isPdfFile,
  isTextOrCodeFile,
  getFileIconInfo,
  getFileUrl,
  getFileExtension,
} from "@/lib/file-utils";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type DrawerPlacement = "top" | "bottom" | "left" | "right";
export type DrawerBackdropVariant = "opaque" | "blur" | "transparent";

export type FileItem = {
  id?: string;
  name?: string;
  filename?: string;
  url?: string;
  publicUrl?: string;
  size?: number;
  type?: string;
  createdAt?: string | Date;
  created_at?: string | Date;
  content?: string;
  [key: string]: any;
};

export interface FilesDrawerProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  placement?: DrawerPlacement;
  backdrop?: DrawerBackdropVariant;
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  files?: FileItem[];
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  onFileSelect?: (file: FileItem) => void;
}

// ============================================================================
// HeroUI-Style Drawer Compound Component API
// ============================================================================

interface DrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  placement: DrawerPlacement;
  setPlacement: (p: DrawerPlacement) => void;
  backdrop: DrawerBackdropVariant;
  setBackdrop: (b: DrawerBackdropVariant) => void;
  isDismissable: boolean;
  isKeyboardDismissDisabled: boolean;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

export function useOverlayState(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    setOpen: (open: boolean) => setIsOpen(open),
  };
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error("HeroUI Drawer components must be used within a <Drawer>");
  }
  return ctx;
}

export interface DrawerProps {
  children: React.ReactNode;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  placement?: DrawerPlacement;
  backdrop?: DrawerBackdropVariant;
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  className?: string;
}

function DrawerRoot({
  children,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onOpenChange,
  placement: defaultPlacement = "right",
  backdrop: defaultBackdrop = "blur",
  isDismissable = true,
  isKeyboardDismissDisabled = false,
}: DrawerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const [placement, setPlacement] = useState<DrawerPlacement>(defaultPlacement);
  const [backdrop, setBackdrop] = useState<DrawerBackdropVariant>(defaultBackdrop);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  useEffect(() => {
    if (defaultPlacement) setPlacement(defaultPlacement);
  }, [defaultPlacement]);

  useEffect(() => {
    if (defaultBackdrop) setBackdrop(defaultBackdrop);
  }, [defaultBackdrop]);

  const handleSetOpen = (open: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(open);
    }
    onOpenChange?.(open);
  };

  const open = () => handleSetOpen(true);
  const close = () => handleSetOpen(false);
  const toggle = () => handleSetOpen(!isOpen);

  // Close on ESC key unless disabled
  useEffect(() => {
    if (!isOpen || isKeyboardDismissDisabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isKeyboardDismissDisabled]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const contextValue: DrawerContextValue = {
    isOpen,
    open,
    close,
    toggle,
    setOpen: handleSetOpen,
    placement,
    setPlacement,
    backdrop,
    setBackdrop,
    isDismissable,
    isKeyboardDismissDisabled,
  };

  return (
    <DrawerContext.Provider value={contextValue}>
      {children}
    </DrawerContext.Provider>
  );
}

// ----------------------------------------------------------------------------
// Drawer.Backdrop
// ----------------------------------------------------------------------------
export interface DrawerBackdropProps {
  children?: React.ReactNode;
  variant?: DrawerBackdropVariant;
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  className?: string;
}

function DrawerBackdrop({
  children,
  variant,
  isDismissable,
  className,
}: DrawerBackdropProps) {
  const { isOpen, close, isDismissable: ctxDismissable, backdrop: ctxBackdrop } = useDrawer();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeVariant = variant || ctxBackdrop;
  const dismissable = isDismissable !== undefined ? isDismissable : ctxDismissable;

  if (!mounted) return null;

  const backdropVariants: Record<DrawerBackdropVariant, string> = {
    opaque: "bg-sidebar/50",
    blur: "bg-sidebar/50",
    transparent: "bg-transparent pointer-events-none [&>*]:pointer-events-auto",
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="drawer__wrapper fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (dismissable) close();
            }}
            className={cn(
              "drawer__backdrop fixed inset-0 transition-opacity",
              backdropVariants[activeVariant] || backdropVariants.blur,
              className
            )}
            aria-hidden="true"
          />

          {/* Render Drawer.Content inside wrapper */}
          {children}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ----------------------------------------------------------------------------
// Drawer.Content
// ----------------------------------------------------------------------------
export interface DrawerContentProps {
  children: React.ReactNode;
  placement?: DrawerPlacement;
  className?: string;
}

function DrawerContent({
  children,
  placement: propPlacement,
  className,
}: DrawerContentProps) {
  const { placement: ctxPlacement } = useDrawer();
  const currentPlacement = propPlacement || ctxPlacement;

  const placementConfigs: Record<
    DrawerPlacement,
    {
      containerClasses: string;
      initial: any;
      animate: any;
      exit: any;
    }
  > = {
    right: {
      containerClasses:
        "fixed inset-y-0 right-0 h-full w-[78%] max-w-[78%] sm:w-[400px] sm:max-w-full",
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
    },
    left: {
      containerClasses:
        "fixed inset-y-0 left-0 h-full w-[78%] max-w-[78%] sm:w-[400px] sm:max-w-full",
      initial: { x: "-100%" },
      animate: { x: 0 },
      exit: { x: "-100%" },
    },
    top: {
      containerClasses:
        "fixed inset-x-0 top-0 max-h-[85vh] w-full",
      initial: { y: "-100%" },
      animate: { y: 0 },
      exit: { y: "-100%" },
    },
    bottom: {
      containerClasses:
        "fixed inset-x-0 bottom-0 max-h-[85vh] w-full",
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
    },
  };

  const config = placementConfigs[currentPlacement] || placementConfigs.right;

  return (
    <motion.div
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={{ type: "spring", damping: 30, stiffness: 320 }}
      className={cn(
        "drawer__content pointer-events-auto flex flex-col z-50 bg-background text-foreground",
        config.containerClasses,
        `drawer__content--${currentPlacement}`,
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// Drawer.Dialog
// ----------------------------------------------------------------------------
export interface DrawerDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const DrawerDialog = forwardRef<HTMLDivElement, DrawerDialogProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "drawer__dialog flex flex-col h-full w-full overflow-hidden select-none bg-sidebar",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DrawerDialog.displayName = "Drawer.Dialog";

// ----------------------------------------------------------------------------
// Drawer.Handle
// ----------------------------------------------------------------------------
export interface DrawerHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function DrawerHandle({ className, ...props }: DrawerHandleProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "drawer__handle mx-auto my-2.5 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600 transition-colors shrink-0 cursor-grab active:cursor-grabbing",
        className
      )}
      {...props}
    />
  );
}

// ----------------------------------------------------------------------------
// Drawer.CloseTrigger
// ----------------------------------------------------------------------------
export interface DrawerCloseTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

function DrawerCloseTrigger({
  className,
  children,
  onClick,
  ...props
}: DrawerCloseTriggerProps) {
  const { close } = useDrawer();

  return (
    <button
      type="button"
      onClick={(e) => {
        close();
        onClick?.(e);
      }}
      aria-label="Close drawer"
      className={cn(
        "drawer__close-trigger p-3 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors cursor-pointer outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      {children || <X className="w-5 h-5" />}
    </button>
  );
}

// ----------------------------------------------------------------------------
// Drawer.Header
// ----------------------------------------------------------------------------
export interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function DrawerHeader({ className, children, ...props }: DrawerHeaderProps) {
  return (
    <div
      className={cn(
        "drawer__header flex items-center justify-between px-5 py-4 border-b border-border/80 dark:border-neutral-800/80 shrink-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Drawer.Heading
// ----------------------------------------------------------------------------
export interface DrawerHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

function DrawerHeading({ className, children, ...props }: DrawerHeadingProps) {
  return (
    <h2
      className={cn(
        "drawer__heading text-[17px] font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

// ----------------------------------------------------------------------------
// Drawer.Body
// ----------------------------------------------------------------------------
export interface DrawerBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function DrawerBody({ className, children, ...props }: DrawerBodyProps) {
  return (
    <div
      className={cn(
        "drawer__body flex-1 overflow-y-auto p-4 scrollbar-thin",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Drawer.Footer
// ----------------------------------------------------------------------------
export interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function DrawerFooter({ className, children, ...props }: DrawerFooterProps) {
  const { close } = useDrawer();

  // Recursively inspect and attach close action to elements with slot="close"
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const props = child.props as any;
    if (props.slot === "close") {
      return cloneElement(child, {
        onClick: (e: any) => {
          props.onClick?.(e);
          close();
        },
      } as any);
    }
    return child;
  });

  return (
    <div
      className={cn(
        "drawer__footer px-5 py-3 border-t border-border/80 dark:border-neutral-800/80 flex items-center justify-between gap-2 shrink-0 bg-background backdrop-blur-xs",
        className
      )}
      {...props}
    >
      {enhancedChildren}
    </div>
  );
}

// Compound attachment
export const Drawer = Object.assign(DrawerRoot, {
  Backdrop: DrawerBackdrop,
  Content: DrawerContent,
  Dialog: DrawerDialog,
  Handle: DrawerHandle,
  CloseTrigger: DrawerCloseTrigger,
  Header: DrawerHeader,
  Heading: DrawerHeading,
  Body: DrawerBody,
  Footer: DrawerFooter,
});

// ============================================================================
// File Item Row
// ============================================================================

function FileItemRow({
  file,
  onSelect,
}: {
  file: FileItem;
  onSelect: () => void;
}) {
  const fileName = file.name || file.filename || "File";
  const ext = getFileExtension(file) || "file";
  const { Icon } = getFileIconInfo(file);
  const isImg = isImageFile(file);
  const fileUrl = getFileUrl(file);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-secondary dark:hover:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors text-left cursor-pointer outline-none focus:outline-none focus-visible:ring-1.5 focus-visible:ring-ring"
      title={`Preview ${fileName}`}
    >
      {/* File Icon Squircle */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-border/80 dark:border-none overflow-hidden">
        {isImg && fileUrl ? (
          <img
            src={fileUrl}
            alt={fileName}
            className="w-full h-full object-cover select-none"
          />
        ) : (
          <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" weight="fill" />
        )}
      </div>

      {/* File Title & Subtitle */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className="text-[14.5px] font-medium text-foreground truncate leading-snug group-hover:text-foreground">
          {fileName}
        </span>
        <span className="text-[12.5px] text-muted-foreground truncate uppercase leading-tight">
          {ext}
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// File Preview In-Page Viewer
// Fits inside c/[id] page while keeping sidebar and chat input pill intact
// ============================================================================

export function FilePreviewViewer({
  file,
  onClose,
  showHeader = false,
}: {
  file: File | FileItem | null;
  onClose?: () => void;
  showHeader?: boolean;
}) {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!file) {
      setFileUrl("");
      setTextContent(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let createdBlobUrl = "";
    const resolvedUrl =
      file instanceof File
        ? (createdBlobUrl = URL.createObjectURL(file))
        : getFileUrl(file);
    setFileUrl(resolvedUrl);

    // If text or code file, read content
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
            setTextContent(null);
            setIsLoading(false);
          });
      } else {
        setTextContent(null);
        setIsLoading(false);
      }
    } else {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }

    return () => {
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [file]);

  // ESC closes preview
  useEffect(() => {
    if (!file) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  const fileName =
    file.name ||
    (typeof file === "object" && file && "filename" in file
      ? (file as any).filename
      : "") ||
    "File";
  const fileExt = getFileExtension(file);
  const { Icon, colorClass, badgeBg } = getFileIconInfo(file);
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

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-transparent animate-in fade-in-50 duration-200">
      {/* Optional Top Header (only if showHeader is explicitly true) */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/80 dark:border-neutral-800/80 bg-background backdrop-blur-xs rounded-2xl mx-3 sm:mx-6 mt-1 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <span className="text-foreground font-semibold text-[14.5px] sm:text-base truncate">
              {fileName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {fileUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors cursor-pointer outline-none"
                title="Download file"
                aria-label="Download file"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] transition-colors cursor-pointer outline-none"
              title="Close preview"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Center Viewer Area */}
      <div className="flex-1 w-full overflow-y-auto relative flex flex-col items-center justify-center p-3 sm:p-6 min-h-[350px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-16">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Image Preview */}
            {isImg && fileUrl && (
              <div className="w-full flex-1 flex items-center justify-center overflow-hidden p-2 min-h-[300px]">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl select-none"
                />
              </div>
            )}

            {/* PDF Preview */}
            {isPdf && fileUrl && (
              <div className="w-full h-[65vh] max-w-5xl rounded-2xl overflow-hidden border border-border/80 dark:border-none bg-card my-2">
                <iframe
                  src={fileUrl}
                  title={fileName}
                  className="w-full h-full border-0"
                />
              </div>
            )}

            {/* Text / Markdown / Code Preview */}
            {isText && (
              <div className="w-full max-w-4xl rounded-2xl border border-border/80 dark:border-none bg-[#0d0d0d] overflow-hidden flex flex-col my-2">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#141414] border-b border-neutral-800 text-xs text-muted-foreground font-mono">
                  <span>{fileExt.toUpperCase() || "CODE"}</span>
                </div>
                <div className="flex-1 overflow-auto p-4 sm:p-6 font-mono text-xs sm:text-[13.5px] leading-relaxed text-neutral-200 select-text whitespace-pre max-h-[60vh]">
                  {textContent !== null ? (
                    <code>{textContent}</code>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                      <FileText className="w-8 h-8 opacity-40" />
                      <span>Preview not available for this document.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unsupported Binary Format */}
            {!isImg && !isPdf && !isText && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md p-6 rounded-2xl border border-border/80 dark:border-none bg-card my-6">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center bg-secondary border border-border/80 dark:border-none", badgeBg)}>
                  <Icon className={cn("w-8 h-8", colorClass)} weight="fill" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground truncate max-w-xs">{fileName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {fileExt.toUpperCase()} file
                  </p>
                </div>
                {fileUrl && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Reusable FilesDrawer Component
// ============================================================================

export function FilesDrawer({
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onOpenChange,
  placement = "right",
  backdrop = "blur",
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  files = [],
  title = "Files in chat",
  description,
  trigger,
  footer,
  className,
  onFileSelect,
}: FilesDrawerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1025);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(open);
    }
    onOpenChange?.(open);
  };

  const handleFileClick = (file: FileItem) => {
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <>
      {/* Desktop In-Flow Side Panel (>= 1025px) — Matches Image 3 with visible scrollbar, header buttons, and TOC! */}
      {!isMobile && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="desktop-files-panel"
              initial={{ width: 0 }}
              animate={{ width: 400 }}
              exit={{ width: 0, borderLeftColor: "transparent" }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
              className="h-full flex flex-col shrink-0 border-l border-border/80 bg-sidebar select-none overflow-hidden z-20"
            >
            <div className="w-[400px] h-full flex flex-col shrink-0">
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-border/80 flex items-center justify-between shrink-0">
                <h2 className="text-base font-semibold text-foreground tracking-tight">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="p-3 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer outline-none focus:outline-none"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Optional Description */}
              {description && (
                <div className="px-4 pt-2 text-xs text-muted-foreground">
                  {description}
                </div>
              )}

              {/* Body: Vertically Scrollable List of Files */}
              <div className="flex-1 overflow-y-auto p-2 sidebar-scroll">
                {files.length === 0 ? (
                  <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 select-none">
                    <p className="text-sm sm:text-base text-muted-foreground">
                      No files referenced
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {files.map((file, idx) => (
                      <FileItemRow
                        key={file.id || file.url || `${file.name}-${idx}`}
                        file={file}
                        onSelect={() => handleFileClick(file)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      )}

      {/* Mobile Portal Drawer (< 1025px) */}
      {isMobile && (
        <Drawer
          isOpen={isOpen}
          onOpenChange={handleOpenChange}
          placement={placement}
          backdrop={backdrop}
          isDismissable={isDismissable}
          isKeyboardDismissDisabled={isKeyboardDismissDisabled}
        >
          {trigger}

          <Drawer.Backdrop
            variant={backdrop}
            isDismissable={isDismissable}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled}
          >
            <Drawer.Content placement={placement} className={className}>
              <Drawer.Dialog>
                {(placement === "bottom" || placement === "top") && (
                  <Drawer.Handle />
                )}

                {/* Header */}
                <Drawer.Header>
                  <div className="flex items-center gap-2 min-w-0">
                    <Drawer.Heading>{title}</Drawer.Heading>
                  </div>

                  <Drawer.CloseTrigger />
                </Drawer.Header>

                {/* Optional Description */}
                {description && (
                  <div className="px-5 pt-2 text-xs text-muted-foreground">
                    {description}
                  </div>
                )}

                {/* Body: Vertically Scrollable List of Files */}
                <Drawer.Body>
                  {files.length === 0 ? (
                    <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 select-none">
                      <p className="text-sm sm:text-base text-muted-foreground">
                        No files referenced
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {files.map((file, idx) => (
                        <FileItemRow
                          key={file.id || file.url || `${file.name}-${idx}`}
                          file={file}
                          onSelect={() => handleFileClick(file)}
                        />
                      ))}
                    </div>
                  )}
                </Drawer.Body>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      )}
    </>
  );
}

// Component aliases for HeroUI parity and requirements
export { FilesDrawer as Files };
export default FilesDrawer;
