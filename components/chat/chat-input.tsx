"use client";

import React, { useRef, useEffect, useLayoutEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  Plus,
  ArrowUp,
  X,
  Mic,
  MicOff,
  Brain,
  FileText,
  Code,
  Image as ImageIcon,
  Film,
  Music,
  Loader,
  Sparkles,
  Check,
  Paperclip,
  Square,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusMenuContent } from "./plus-menu-content";
import { FilePreviewModal } from "@/components/modals/file-preview-modal";
import { ImagePreview } from "@/components/modals/image-preview-modal";
import { TemporaryChatDashedBorder } from "@/components/chat/message-list";
import { isTemporaryChatParam } from "@/lib/temporary-chat";
import { getFileIconInfo } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import toast from "@/lib/toast";
import {
  getDictationEnabled,
  PREFERENCE_EVENT,
} from "@/lib/user-preferences";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface ChatInputProps {
  message: string;
  onMessageChange: (msg: string) => void;
  onSend: () => void;
  onStop?: () => void;
  uploadedFiles: File[];
  onFilesChange: (files: File[]) => void;
  isTyping: boolean;
  isUploading: boolean;
  centered?: boolean;
  showDisclaimer?: boolean;
  children?: React.ReactNode;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  selectedTier?: number;
  onTierChange?: (tier: number) => void;
  thinkMode?: boolean;
  onThinkModeChange?: (enabled: boolean) => void;
  placeholder?: string;
  disableAttach?: boolean;
  autoFocus?: boolean;
  isGuest?: boolean;
  isTemporary?: boolean;
  isWelcomeScreen?: boolean;
  className?: string;
  onOpenLoginModal?: (options?: { description?: string; title?: string }) => void;
  onOpenWebSearchModal?: (options?: { description?: string; title?: string }) => void;
  onOpenAdvancedFeaturesModal?: (options?: { description?: string; title?: string }) => void;
}

/** preview card with thumbnail or code icon */
function FilePreviewCard({
  file,
  onRemove,
  onPreview,
}: {
  file: File;
  onRemove: () => void;
  onPreview?: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg|bmp|ico|avif)$/i.test(file.name);

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, isImage]);

  const { Icon, label, colorClass, badgeBg } = getFileIconInfo(file);

  // For images: show ONLY preview without details
  if (isImage) {
    return (
      <div
        className="relative group inline-block select-none"
        title={`Preview ${file.name}`}
      >
        <ImagePreview src={imageUrl || ""} alt={file.name}>
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 dark:bg-[#262626] flex items-center justify-center shrink-0 hover:opacity-80 transition-all cursor-pointer">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            )}
          </div>
        </ImagePreview>
        {/* Remove button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none text-muted-foreground hover:text-foreground hover:bg-neutral-200/80 dark:hover:bg-[#303030] flex items-center justify-center cursor-pointer transition-transform z-10"
          aria-label="Remove image"
        >
          <X className="w-2.5 h-2.5 stroke-[2]" />
        </button>
      </div>
    );
  }

  // For non-image files: show full details (file icon, name, type)
  return (
    <div
      onClick={onPreview}
      className="relative group flex items-center gap-2.5 bg-white/50 dark:bg-[#212121]/50 hover:bg-white dark:hover:bg-neutral-700 border border-border/80 dark:border-none rounded-2xl p-2.5 text-foreground min-w-0 cursor-pointer select-none transition-colors"
      title={`Preview ${file.name}`}
    >
      {/* File type icon */}
      <div className="w-11 h-11 rounded-xl overflow-hidden border border-border/80 dark:border-none flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" weight="fill" />
      </div>

      {/* File info */}
      <div className="flex flex-col min-w-0 pr-0.5 justify-center">
        <span className="text-[14.5px] font-normal text-foreground truncate max-w-[140px] sm:max-w-[180px] leading-tight">
          {file.name}
        </span>
      </div>

      {/* Remove button — frosted glass circle with same design as scroll-to-bottom button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none text-muted-foreground hover:text-foreground hover:bg-neutral-200/80 dark:hover:bg-[#303030] flex items-center justify-center cursor-pointer transition-transform z-10"
        aria-label="Remove file"
      >
        <X className="w-2.5 h-2.5 stroke-[2]" />
      </button>
    </div>
  );
}

export interface ChatInputHandle {
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput(
  {
    message,
    onMessageChange,
    onSend,
    onStop,
    uploadedFiles,
    onFilesChange,
    isTyping,
    isUploading,
    centered = false,
    showDisclaimer = false,
    children,
    selectedModel = "Gemini 3.8 flash",
    onModelChange,
    selectedTier = 4,
    onTierChange,
    thinkMode = false,
    onThinkModeChange,
    placeholder = "Ask CloseAI",
    disableAttach = false,
    autoFocus = true,
    isGuest = false,
    isTemporary,
    isWelcomeScreen,
    className,
    onOpenLoginModal,
    onOpenWebSearchModal,
    onOpenAdvancedFeaturesModal,
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({
  focus: () => {
    textareaRef.current?.focus();
    const len = textareaRef.current?.value.length ?? 0;
    try {
      textareaRef.current?.setSelectionRange(len, len);
    } catch (e) {}
  },
}), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const [menuSideOffset, setMenuSideOffset] = useState(14);
  const [menuAlignOffset, setMenuAlignOffset] = useState(0);
  const [menuWidth, setMenuWidth] = useState<number | undefined>(undefined);
  const [tooltipSideOffset, setTooltipSideOffset] = useState(8);
  const [isPlusTooltipOpen, setIsPlusTooltipOpen] = useState(false);
  const plusHoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const cursorPositionRef = useRef<number | null>(null);
  const [currentModel, setCurrentModel] = useState(selectedModel);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [dictationEnabled, setDictationEnabled] = useState(true);
  const [urlIsTemporary, setUrlIsTemporary] = useState(false);
  const pathname = usePathname();
  const isWelcomePage = Boolean(
    isWelcomeScreen || pathname === "/c" || pathname === "/gc"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkTemp = () => {
        const params = new URLSearchParams(window.location.search);
        setUrlIsTemporary(isTemporaryChatParam(params));
      };
      checkTemp();
      window.addEventListener("popstate", checkTemp);
      return () => window.removeEventListener("popstate", checkTemp);
    }
  }, []);

  const effectiveIsTemporary = Boolean(isTemporary ?? urlIsTemporary);

  useEffect(() => {
    const syncDictation = () => setDictationEnabled(getDictationEnabled());
    syncDictation();
    window.addEventListener(PREFERENCE_EVENT, syncDictation);
    window.addEventListener("storage", syncDictation);
    return () => {
      window.removeEventListener(PREFERENCE_EVENT, syncDictation);
      window.removeEventListener("storage", syncDictation);
    };
  }, []);

  useEffect(() => {
    if (!dictationEnabled && isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      setIsListening(false);
    }
  }, [dictationEnabled, isListening]);

  useEffect(() => {
    if (selectedModel) {
      setCurrentModel(selectedModel);
    }
  }, [selectedModel]);

  const handleSelectModel = (modelName: string) => {
    setCurrentModel(modelName);
    onModelChange?.(modelName);
    toast.success(`Switched to ${modelName}`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      onFilesChange([...uploadedFiles, ...acceptedFiles]);
    },
    noClick: true,
    noKeyboard: true,
  });

  // Check if content is bigger (e.g. 5-10 lines or one-two paragraphs)
  const lineCount = (message || "").split("\n").length;
  const isBigContent =
    lineCount >= 4 ||
    (message && message.trim().length >= 180) ||
    ((message || "").includes("\n") && (message || "").trim().length >= 80) ||
    isFullyExpanded;

  // Check if content dynamically requires multiline layout
  const isTextMultiLine = Boolean(
    message &&
    message.trim().length > 0 &&
    (message.includes("\n") || message.length > 25 || isMultiLine)
  );

  const isExpandedLayout =
    isFullyExpanded ||
    uploadedFiles.length > 0 ||
    isTextMultiLine;

  // Dynamic max height based on viewport
  const getDynamicMaxHeight = useCallback(() => {
    if (typeof window === "undefined") return 360;
    if (isFullyExpanded) {
      return Math.min(600, Math.max(300, Math.floor(window.innerHeight * 0.7)));
    }
    return Math.min(360, Math.max(180, Math.floor(window.innerHeight * 0.42)));
  }, [isFullyExpanded]);

  const overflowTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea height dynamically with smooth transition like TOC smooth scrolling
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    // When message is cleared or empty, smoothly collapse
    if (!message || message.trim() === "") {
      el.style.transition = "height 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
      el.style.height = "26px";
      el.style.overflowY = "hidden";
      setIsMultiLine(false);
      if (isFullyExpanded) setIsFullyExpanded(false);
      return;
    }

    const prevHeight = el.offsetHeight || 44;
    el.style.transition = "none";
    el.style.height = "auto";
    const scrollH = el.scrollHeight;
    el.style.height = `${prevHeight}px`;
    // Force layout flush so browser registers prevHeight for smooth glide
    void el.offsetHeight;

    el.style.transition = "height 0.28s cubic-bezier(0.16, 1, 0.3, 1)";

    const maxH = getDynamicMaxHeight();

    if (scrollH > 38 || message.includes("\n")) {
      setIsMultiLine(true);
      if (scrollH > maxH) {
        el.style.height = `${maxH}px`;
        el.style.overflowY = "hidden";
        if (overflowTimerRef.current) clearTimeout(overflowTimerRef.current);
        overflowTimerRef.current = setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.overflowY = "auto";
          }
        }, 290);
      } else {
        const dynamicH = Math.max(scrollH, 44);
        el.style.height = `${dynamicH}px`;
        el.style.overflowY = "hidden";
        if (overflowTimerRef.current) clearTimeout(overflowTimerRef.current);
      }
    } else {
      el.style.height = "26px";
      el.style.overflowY = "hidden";
      setIsMultiLine(false);
    }
  }, [message, isFullyExpanded, getDynamicMaxHeight]);

  useIsomorphicLayoutEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  useEffect(() => {
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, [adjustHeight]);

  // Auto-focus textarea on mount / page reload (matching sc/[id] behavior)
  useEffect(() => {
    if (!autoFocus) return;
    const focusTextarea = () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        try {
          textareaRef.current.setSelectionRange(len, len);
        } catch (e) {}
      }
    };

    focusTextarea();
    const rafId = requestAnimationFrame(focusTextarea);
    const timer = setTimeout(focusTextarea, 50);
    const fallbackTimer = setTimeout(focusTextarea, 150);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [autoFocus]);

  // Keep focus and restore exact cursor position when layout expands or collapses
  useEffect(() => {
    const focusAndRestoreCursor = () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const targetPos =
          cursorPositionRef.current !== null
            ? cursorPositionRef.current
            : textareaRef.current.value.length;
        try {
          textareaRef.current.setSelectionRange(targetPos, targetPos);
        } catch (e) {}
      }
    };

    focusAndRestoreCursor();
    const timer = setTimeout(focusAndRestoreCursor, 0);
    return () => clearTimeout(timer);
  }, [isExpandedLayout]);

  // Calculate dynamic menu & tooltip sideOffsets so they are ALWAYS positioned above the chat input pill
  // Dynamic menu position and width
  const updateMenuPosition = useCallback(() => {
    if (pillRef.current) {
      const pillRect = pillRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;

      const refButton = plusButtonRef.current;
      if (refButton) {
        const buttonRect = refButton.getBoundingClientRect();
        if (isMobile) {
          // On small screens: open directly above the plus button with a small gap
          setMenuSideOffset(10);
          setTooltipSideOffset(8);
        } else {
          // On desktop: position above the top edge of the chat input pill
          const distToPillTop = Math.max(0, buttonRect.top - pillRect.top);
          setMenuSideOffset(Math.round(distToPillTop + 10));
          setTooltipSideOffset(Math.round(distToPillTop + 8));
        }

        // Always align cleanly with the left edge of the chat input pill:
        const distToPillLeft = Math.max(0, buttonRect.left - pillRect.left);
        setMenuAlignOffset(-Math.round(distToPillLeft));
      } else {
        if (isMobile) {
          setMenuSideOffset(10);
          setTooltipSideOffset(8);
        } else {
          const estimatedDist = Math.max(0, pillRect.height - 44);
          setMenuSideOffset(Math.round(estimatedDist + 10));
          setTooltipSideOffset(Math.round(estimatedDist + 8));
        }
      }

      if (isMobile) {
        // On small screen devices (< 640px), match the exact width of the input pill so left & right edges align
        setMenuWidth(Math.round(pillRect.width));
      } else if (isWelcomePage && (window.innerWidth >= 1024 || pillRect.width >= 720)) {
        const colWidth = Math.round((pillRect.width + 9) / 3);
        setMenuWidth(colWidth);
      } else {
        // On other pages (/c/[id], /gc/[id], etc.) keep standard width
        setMenuWidth(undefined);
      }
    }
  }, [isWelcomePage]);

  useEffect(() => {
    updateMenuPosition();
  }, [message, isExpandedLayout, uploadedFiles.length, plusMenuOpen, updateMenuPosition]);

  useEffect(() => {
    if (!pillRef.current) return;
    const ro = new ResizeObserver(() => {
      updateMenuPosition();
    });
    ro.observe(pillRef.current);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [updateMenuPosition]);

  // Speech Recognition (Web Speech API)
  const toggleDictation = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      // First prompt for microphone permission if needed
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err: any) {
      console.error("Microphone access error:", err);
      toast.error("Microphone access denied. Please allow microphone permission in your browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      const baseText = message.trim();

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const updated = baseText ? `${baseText} ${transcript}` : transcript;
        onMessageChange(updated);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
          if (event.error === "not-allowed") {
            toast.error("Microphone permission denied.");
          }
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      toast.success("Listening");
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      toast.error("Could not start speech recognition.");
      setIsListening(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (plusHoverTimerRef.current) clearTimeout(plusHoverTimerRef.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && isFullyExpanded) {
      e.preventDefault();
      setIsFullyExpanded(false);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (
        (message.trim() || uploadedFiles.length > 0) &&
        !isTyping &&
        !isUploading
      ) {
        setIsFullyExpanded(false);
        onSend();
      }
    }
  };

  // Support clipboard image pasting (Ctrl+V screenshots/images)
  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    const filesToAdd: File[] = [];

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/") || item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            const ext = file.type.split("/")[1] || "png";
            const namedFile =
              file.name && file.name !== "image.png"
                ? file
                : new File([file], `Pasted_Image_${Date.now()}.${ext}`, {
                    type: file.type || "image/png",
                  });
            filesToAdd.push(namedFile);
          }
        }
      }
    }

    if (filesToAdd.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file.type.startsWith("image/")) {
          filesToAdd.push(file);
        }
      }
    }

    if (filesToAdd.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      onFilesChange([...uploadedFiles, ...filesToAdd]);
      toast.success(
        filesToAdd.length === 1
          ? "Image attached from clipboard"
          : `${filesToAdd.length} images attached from clipboard`
      );
      return;
    }

    // Immediately handle long or multiline text paste to expand dynamically and smoothly
    const pastedText = clipboardData.getData("text");
    if (pastedText && (pastedText.includes("\n") || pastedText.length > 25)) {
      setIsMultiLine(true);
    }

    // Always preserve focus on text paste
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const hasContent = message.trim().length > 0 || uploadedFiles.length > 0;

  const handlePillButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      const btn = e.currentTarget;
      setTimeout(() => {
        btn?.blur();
      }, 0);
    }
  };

  const pillButtonFocusRing = cn(
    "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2",
    isGuest
      ? "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f]"
      : "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#212121]"
  );

  const renderPlusButton = () => (
    <DropdownMenu
      open={plusMenuOpen}
      onOpenChange={(open) => {
        if (open) updateMenuPosition();
        if (plusHoverTimerRef.current) clearTimeout(plusHoverTimerRef.current);
        setIsPlusTooltipOpen(false);
        setPlusMenuOpen(open);
      }}
    >
      <Tooltip open={!plusMenuOpen && isPlusTooltipOpen}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              ref={plusButtonRef}
              type="button"
              disabled={isTyping || isUploading}
              onMouseEnter={() => {
                updateMenuPosition();
                if (plusMenuOpen) return;
                if (plusHoverTimerRef.current) clearTimeout(plusHoverTimerRef.current);
                plusHoverTimerRef.current = setTimeout(() => {
                  setIsPlusTooltipOpen(true);
                }, 150);
              }}
              onMouseLeave={() => {
                if (plusHoverTimerRef.current) clearTimeout(plusHoverTimerRef.current);
                setIsPlusTooltipOpen(false);
              }}
              onClick={(e) => {
                if (plusHoverTimerRef.current) clearTimeout(plusHoverTimerRef.current);
                setIsPlusTooltipOpen(false);
                (e.currentTarget as HTMLElement)?.blur();
              }}
              onKeyDown={handlePillButtonKeyDown}
              className={cn(
                "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer",
                pillButtonFocusRing,
                plusMenuOpen
                  ? "bg-secondary dark:bg-[#2f2f2f] text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#383838]"
              )}
              aria-label="Attach files and more"
            >
              <Plus className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={tooltipSideOffset} className="text-base">
          Attach and more
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        isGuest={isGuest}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
        side="top"
        align="start"
        sideOffset={menuSideOffset}
        alignOffset={menuAlignOffset}
        avoidCollisions={false}
        className={cn(
          "rounded-2xl p-1.5 select-none outline-none max-h-[calc(100dvh-120px)] overflow-y-auto",
          isGuest
            ? "bg-white dark:bg-[#2f2f2f] border border-border/80 dark:border-white/10"
            : "bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80",
          menuWidth ? "" : "w-[244px] max-w-[calc(100vw-24px)]"
        )}
        style={{
          width: menuWidth ? `${menuWidth}px` : undefined,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <PlusMenuContent
          onAddFiles={() => {
            fileInputRef.current?.click();
            setPlusMenuOpen(false);
          }}
          onAddPhotos={() => {
            photoInputRef.current?.click();
            setPlusMenuOpen(false);
          }}
          selectedModel={currentModel}
          onModelChange={(newModel) => {
            handleSelectModel(newModel);
          }}
          selectedTier={selectedTier}
          onTierChange={onTierChange}
          isOpen={plusMenuOpen}
          disableAttach={disableAttach}
          menuWidth={menuWidth}
          isGuest={isGuest}
          onOpenLoginModal={(opts) => {
            setPlusMenuOpen(false);
            onOpenLoginModal?.(opts);
          }}
          onOpenWebSearchModal={(opts) => {
            setPlusMenuOpen(false);
            onOpenWebSearchModal?.(opts);
          }}
          onOpenAdvancedFeaturesModal={(opts) => {
            setPlusMenuOpen(false);
            onOpenAdvancedFeaturesModal?.(opts);
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderThinkButton = (isMobile = false) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            if (isGuest) {
              if (onOpenLoginModal) onOpenLoginModal({ description: "To continue with Think" });
              else onOpenAdvancedFeaturesModal?.({ description: "To continue with Think" });
              return;
            }
            onThinkModeChange?.(!thinkMode);
          }}
          onMouseEnter={updateMenuPosition}
          onKeyDown={handlePillButtonKeyDown}
          className={cn(
            "rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer select-none",
            isMobile
              ? "w-10 h-10"
              : "h-10 sm:h-11 px-2.5 sm:px-5 gap-1.5 text-[13px] sm:text-[14px] font-medium",
            pillButtonFocusRing,
            thinkMode
              ? "bg-send-btn text-send-btn-foreground hover:opacity-80"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#383838]"
          )}
          aria-label="Think harder"
        >
          <Brain className="w-5 h-5 transition-colors" />
          {!isMobile && <span className="hidden sm:inline">Think</span>}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={tooltipSideOffset} className="text-base">
        Think harder
      </TooltipContent>
    </Tooltip>
  );

  const renderSmallScreenThinkGroup = () => (
    <div className="flex sm:hidden items-center">
      <div className="h-5 w-px bg-border/80 dark:bg-white/10 mx-1 shrink-0 select-none" />
      {renderThinkButton(true)}
    </div>
  );

  const renderRightActions = () => (
    <>
      {/* Think Harder Pill Button (Desktop only) */}
      <div className="hidden sm:flex items-center">
        {renderThinkButton(false)}
      </div>

      {/* Dictate / Mic */}
      {dictationEnabled ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-dictation-button="true"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              toggleDictation();
            }}
            onMouseEnter={updateMenuPosition}
            onKeyDown={handlePillButtonKeyDown}
            className={cn(
              "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0",
              pillButtonFocusRing,
              isListening
                ? "bg-red-500/15 text-red-500 hover:bg-red-500/25 ring-red-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#383838]"
            )}
            aria-label={isListening ? "Stop dictation" : "Start dictation"}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-red-500" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={tooltipSideOffset} className="text-base">
          {isListening ? "Stop dictation" : "Start dictation"}
        </TooltipContent>
      </Tooltip>
      ) : null}

      {/* Send / Stop Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              if (isTyping) {
                onStop?.();
              } else {
                setIsFullyExpanded(false);
                onSend();
              }
            }}
            onMouseEnter={updateMenuPosition}
            onKeyDown={handlePillButtonKeyDown}
            disabled={(!hasContent && !isTyping) || isUploading}
            className={cn(
              "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all shrink-0",
              pillButtonFocusRing,
              isTyping
                ? "bg-send-btn text-send-btn-foreground cursor-pointer hover:opacity-80 active:scale-[0.99]"
                : isUploading
                ? "bg-secondary dark:bg-neutral-800 text-foreground cursor-wait opacity-90"
                : hasContent
                ? "bg-send-btn text-send-btn-foreground cursor-pointer hover:opacity-80 active:scale-[0.99]"
                : isGuest
                ? "bg-neutral-300 dark:bg-[#2f2f2f] text-muted-foreground cursor-not-allowed opacity-50"
                : "bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none text-foreground cursor-not-allowed opacity-50"
            )}
            aria-label={isTyping ? "Stop generating" : "Send message"}
          >
            {isTyping ? (
              <Square className="w-5 h-5 fill-current" />
            ) : isUploading ? (
              <Loader className="w-5 h-5 animate-spin text-foreground" />
            ) : (
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={tooltipSideOffset} className="text-base">
          {isTyping ? "Stop generating" : isUploading ? "Uploading files" : "Send message"}
        </TooltipContent>
      </Tooltip>
    </>
  );

  return (
    <div
      className={cn(
        "w-full select-none transition-colors duration-200 relative",
        isWelcomePage
          ? "max-w-[820px] mx-auto px-6"
          : centered
          ? "max-w-2xl mx-auto px-6"
          : "max-w-3xl mx-auto px-6",
        className
      )}
    >
      {children}
      <div
        {...getRootProps({
          onClick: (e: React.MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
              !target.closest("button") &&
              !target.closest("a") &&
              !target.closest("[role='menu']") &&
              !target.closest("[data-radix-popper-content-wrapper]")
            ) {
              textareaRef.current?.focus();
            }
          },
        })}
        ref={pillRef}
        className={cn(
          "relative transition-all duration-200",
          isGuest
            ? "bg-white dark:bg-[#2f2f2f]"
            : "bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm",
          effectiveIsTemporary
            ? "border border-transparent"
            : isGuest
            ? "border border-border/80 dark:border-white/10"
            : "border border-border/80",
          "focus-within:text-foreground dark:focus-within:text-foreground",
          isExpandedLayout
            ? "rounded-[25px] sm:rounded-3xl"
            : "rounded-[25px] sm:rounded-full",
          isExpandedLayout
            ? "pt-2.5 px-2 pb-3 sm:p-2"
            : "pt-2.5 px-2 pb-3 sm:px-1 sm:py-1 sm:min-h-[50px] sm:flex sm:items-center",
          isDragActive && "ring-2 ring-primary border-primary"
        )}
      >
        {effectiveIsTemporary && (
          <TemporaryChatDashedBorder
            className="-inset-[1px] w-[calc(100%+2px)] h-[calc(100%+2px)]"
            rectClassName={cn(
              "temporary-chat-input-dashed-rect",
              isExpandedLayout && "expanded"
            )}
            rx={isExpandedLayout ? 24 : 26}
            ry={isExpandedLayout ? 24 : 26}
          />
        )}
        <input {...getInputProps()} />
        {/* Attachment Button */}
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) {
              onFilesChange([
                ...uploadedFiles,
                ...Array.from(e.target.files),
              ]);
            }
          }}
        />

        {/* Photos Only Input (for guests) */}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={photoInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const selected = Array.from(e.target.files).filter((f) =>
                f.type.startsWith("image/")
              );
              if (selected.length > 0) {
                onFilesChange([...uploadedFiles, ...selected]);
                toast.success(
                  selected.length === 1 ? "Photo attached" : `${selected.length} photos attached`
                );
              }
              e.target.value = "";
            }
          }}
        />

        {/* Attached Files Preview —  cards (Image 3) */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 pt-1 pb-2">
            {uploadedFiles.map((file, i) => (
              <FilePreviewCard
                key={i}
                file={file}
                onRemove={() => removeFile(i)}
                onPreview={() => setPreviewFile(file)}
              />
            ))}
          </div>
        )}

        {isExpandedLayout ? (
          /* Multiline Layout: full-width textarea on top, bottom toolbar with + on left and tools on right */
          <div className="flex flex-col w-full">
            <div className="w-full px-1.5 sm:px-2 pt-0.5 pb-1 relative">
              <textarea
                ref={textareaRef}
                autoFocus={autoFocus}
                value={message}
                onChange={(e) => {
                  cursorPositionRef.current = e.target.selectionEnd;
                  onMessageChange(e.target.value);
                }}
                onSelect={(e) => {
                  cursorPositionRef.current = e.currentTarget.selectionEnd;
                }}
                onClick={(e) => {
                  cursorPositionRef.current = e.currentTarget.selectionEnd;
                }}
                onKeyUp={(e) => {
                  cursorPositionRef.current = e.currentTarget.selectionEnd;
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={placeholder}
                rows={1}
                disabled={isTyping || isUploading}
                className={cn(
                  "w-full min-w-0 bg-transparent border-0 p-0 text-[16px] sm:text-[16.5px] placeholder:text-muted-foreground transition-[height,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-0 resize-none leading-relaxed select-text",
                  isFullyExpanded ? "min-h-[280px]" : "min-h-[44px]",
                  isBigContent && "pr-14 sm:pr-16"
                )}
              />

              {/* Expand / Collapse button: matches Attach files & Dictate button style & tooltip */}
              {isBigContent && (
                <div className="absolute top-0.5 right-6 sm:right-8 z-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => {
                          (e.currentTarget as HTMLElement)?.blur();
                          setIsFullyExpanded((prev) => !prev);
                        }}
                        onKeyDown={handlePillButtonKeyDown}
                        className={cn(
                          "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#383838] transition-all shrink-0 cursor-pointer",
                          pillButtonFocusRing
                        )}
                        aria-label={isFullyExpanded ? "Collapse" : "Expand"}
                      >
                        {isFullyExpanded ? (
                          <Minimize2 className="w-5 h-5 sm:w-5 sm:h-5" />
                        ) : (
                          <Maximize2 className="w-5 h-5 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-base">
                      {isFullyExpanded ? "Collapse" : "Expand"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Bottom Toolbar Row: + button placed down side like others buttons */}
            <div className="flex items-center justify-between w-full pt-1">
              <div className="flex items-center pl-0.5">
                {renderPlusButton()}
                {renderSmallScreenThinkGroup()}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pr-0.5">
                {renderRightActions()}
              </div>
            </div>
          </div>
        ) : (
          /* Single-line Layout on desktop, Two-row layout on small screen devices */
          <div className="grid grid-cols-2 gap-y-1.5 w-full sm:flex sm:items-center sm:gap-1 sm:gap-x-2">
            <div className="col-start-1 row-start-2 flex items-center justify-self-start pl-0.5 sm:pl-1 sm:order-1 sm:shrink-0">
              {renderPlusButton()}
              {renderSmallScreenThinkGroup()}
            </div>

            <div
              className="col-span-2 row-start-1 w-full px-1.5 sm:px-0 flex items-center cursor-text sm:order-2 sm:flex-1 sm:min-w-0"
              onClick={() => textareaRef.current?.focus()}
            >
              <textarea
                ref={textareaRef}
                autoFocus={autoFocus}
                value={message}
                onChange={(e) => {
                  cursorPositionRef.current = e.target.selectionEnd;
                  const val = e.target.value;
                  onMessageChange(val);
                  if (val.includes("\n") || val.length > 25 || e.target.scrollHeight > 38) {
                    setIsMultiLine(true);
                  }
                }}
                onSelect={(e) => {
                  cursorPositionRef.current = e.currentTarget.selectionEnd;
                }}
                onClick={(e) => {
                  cursorPositionRef.current = e.currentTarget.selectionEnd;
                }}
                onKeyUp={(e) => {
                  cursorPositionRef.current = e.currentTarget.selectionEnd;
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={placeholder}
                rows={1}
                disabled={isTyping || isUploading}
                className="w-full min-w-0 bg-transparent border-0 px-0.5 sm:px-1 py-0 text-[16px] sm:text-[16.5px] placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-0 resize-none h-[26px] leading-[26px] overflow-hidden scrollbar-none select-text"
              />
            </div>

            <div className="col-start-2 row-start-2 flex items-center justify-self-end gap-1.5 sm:gap-2 shrink-0 pr-0.5 sm:pr-1 sm:order-3">
              {renderRightActions()}
            </div>
          </div>
        )}
      </div>

      {/* Responsive Disclaimer */}
      {showDisclaimer && (
        <div className="text-center pt-2 pb-0.5 px-3 select-none">
          <p className="text-sm text-muted-foreground font-normal tracking-tight leading-tight">
            CloseAI can make mistakes. Please double-check responses.
          </p>
        </div>
      )}

      <FilePreviewModal
        open={!!previewFile}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
        file={previewFile}
      />
    </div>
  );
});

export default ChatInput;
