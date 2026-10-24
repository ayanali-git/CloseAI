"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useModalTheme } from "@/hooks/use-modal-theme";
import { Chat } from "@/lib/chat-service";
import { cn } from "@/lib/utils";
import {
  Search,
  X,
  MessageCircle,
  Pin,
  Archive,
  Image as ImageIcon,
} from "lucide-react";
import { getFileIconInfo } from "@/lib/file-utils";
import {
  useSidebarContext,
  setGlobalPendingPreview,
} from "@/components/chat/sidebar-context";

export type SearchCategory = "all" | "chats" | "images" | "files";

export interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chats: Chat[];
  currentChatId?: string | null;
  onChatSelect: (chatId: string) => void;
  isGuest?: boolean;
  onOpenLoginModal?: () => void;
}

const DARK_HOVER_BG = {
  guest: "dark:hover:bg-[#383838]",
  auth: "dark:hover:bg-secondary",
} as const;

/**
 * Settings-modal consistent focus ring classes
 */
const getFocusRingClasses = (isGuest?: boolean) =>
  cn(
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2",
    isGuest
      ? "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#2f2f2f]"
      : "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#212121]"
  );

const CATEGORIES: { id: SearchCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "chats", label: "Chats" },
  { id: "images", label: "Images" },
  { id: "files", label: "Files" },
];

export function openSearchModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("closeai-open-search"));
  }
}

/**
 * Formats dates for file items (e.g. "Oct 18")
 */
function formatFileDate(dateStr?: string | Date): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return "";
  }
}

/**
 * Auto-scrolling title on hover — matches exact marquee behavior in sidebar chats
 */
function ChatTitleMarquee({
  title,
  isHovered,
}: {
  title: string;
  isHovered: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowWidth, setOverflowWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (textRef.current && containerRef.current) {
        const diff =
          textRef.current.scrollWidth - containerRef.current.clientWidth;
        setOverflowWidth(Math.max(diff, 0));
      }
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);
    if (textRef.current) ro.observe(textRef.current);

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(measure);
    }

    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [title, isHovered]);

  const isScrolling = overflowWidth > 0 && isHovered;
  const duration = Math.max(3.2, overflowWidth / 35 + 1.8);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-w-0 overflow-hidden pr-1 h-full flex items-center"
      style={{
        animation: isScrolling
          ? `chat-title-marquee-mask ${duration}s ease-in-out infinite`
          : undefined,
        maskImage: isScrolling
          ? undefined
          : "linear-gradient(to right, black 0%, black calc(100% - 10px), transparent 100%)",

        WebkitMaskImage: isScrolling
          ? undefined
          : "linear-gradient(to right, black 0%, black calc(100% - 10px), transparent 100%)",
      }}
    >
      <span
        ref={textRef}
        style={
          {
            "--marquee-dist": `${overflowWidth}px`,
            animation: isScrolling
              ? `chat-title-marquee ${duration}s ease-in-out infinite`
              : "none",
            transform: isScrolling ? undefined : "translateX(0px)",
            transition: isScrolling ? "none" : "transform 0.25s ease-out",
          } as React.CSSProperties
        }
        className="inline-block whitespace-nowrap text-[14.5px] sm:text-[15px] leading-none select-none will-change-transform text-foreground font-normal"
      >
        {title || "New chat"}
      </span>
    </div>
  );
}

const SearchChatItem = React.memo(function SearchChatItem({
  chat,
  globalIdx,
  query = "",
  isKeyboardActive,
  darkHover,
  isGuest,
  onSelect,
  onHover,
  itemRef,
  isContainerScrollingRef,
}: {
  chat: Chat;
  globalIdx: number;
  query?: string;
  isKeyboardActive: boolean;
  darkHover: string;
  isGuest?: boolean;
  onSelect: () => void;
  onHover: () => void;
  itemRef: (el: HTMLButtonElement | null) => void;
  isContainerScrollingRef: React.MutableRefObject<boolean>;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (isContainerScrollingRef.current) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
    onHover();
  };

  const handleMouseMove = () => {
    if (!isHovered && !isContainerScrollingRef.current) {
      setIsHovered(true);
      onHover();
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  const showHoverBox = isHovered || isKeyboardActive;

  return (
    <button
      ref={itemRef}
      type="button"
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative w-full h-[42px] flex items-center gap-3 px-3 rounded-xl text-left cursor-pointer transition-colors text-[14.5px] sm:text-[15px] select-none shrink-0 focus-visible:z-10",
        getFocusRingClasses(isGuest),
        showHoverBox
          ? cn("bg-secondary text-foreground", darkHover)
          : "text-foreground hover:bg-secondary"
      )}
    >
      {/* Chats icon: strictly locked dimensions */}
      <div className="w-5 h-5 min-w-[16px] max-w-[16px] shrink-0 flex items-center justify-center pointer-events-none select-none">
        <MessageCircle
          className={cn(
            "w-5 h-5 shrink-0 transition-colors",
            showHoverBox
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />
      </div>

      {/* Marquee Title */}
      <div className="flex-1 min-w-0 pr-1 h-full overflow-hidden flex items-center">
        <ChatTitleMarquee
          title={chat.title || "New chat"}
          isHovered={isHovered}
        />
      </div>

      {/* Pinned & Archived Status Indicators */}
      {chat.starred && (
        <Pin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      )}
      {chat.archived && !chat.starred && (
        <Archive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      )}
    </button>
  );
});

/**
 * Document / File item row matching consistent Phosphor icons from file-drawer & chat
 */
function SearchFileItem({
  file,
  query,
  darkHover,
  isGuest,
  onSelect,
}: {
  file: any;
  query: string;
  darkHover: string;
  isGuest?: boolean;
  onSelect: () => void;
}) {
  const { Icon } = getFileIconInfo(file);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full h-[46px] flex items-center justify-between px-3 rounded-xl transition-colors text-left select-none cursor-pointer shrink-0 focus-visible:z-10",
        getFocusRingClasses(isGuest),
        "hover:bg-secondary text-foreground",
        darkHover
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
        <Icon
          className="w-5 h-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
          weight="fill"
        />
        <div className="flex-1 min-w-0 truncate text-[14.5px] sm:text-[15px] font-normal text-foreground">
          {file.name || "File"}
        </div>
      </div>
    </button>
  );
}

function SearchImageItem({
  img,
  isGuest,
  onSelect,
}: {
  img: any;
  isGuest?: boolean;
  onSelect: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative aspect-square w-full rounded-xl overflow-hidden bg-secondary dark:bg-[#212121] border border-border/80 cursor-pointer transition-all flex items-center justify-center select-none outline-none focus:outline-none",
        // Focus rings like settings modal type on focus-visible
        "focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:z-10",
        // Always show focus rings on hover (settings modal type)
        "hover:ring-2 hover:ring-black dark:hover:ring-white hover:ring-offset-2 hover:z-10",
        isGuest
          ? "ring-offset-white dark:ring-offset-[#2f2f2f]"
          : "ring-offset-white dark:ring-offset-[#212121]"
      )}
    >
      {img.url && !imgError ? (
        <img
          src={img.url}
          alt={img.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-2 text-center">
          <ImageIcon className="w-6 h-6 text-muted-foreground/80" />
          <span className="mt-1 text-[11px] text-muted-foreground truncate max-w-full px-1">
            {img.name}
          </span>
        </div>
      )}
    </button>
  );
}

/**
 * Skeletons for searching loading state across all categories
 * Skeletons show only for chats text and plain boxes, with NO image inner logo icon.
 */
function SearchSkeletons({ category }: { category: SearchCategory }) {
  if (category === "chats") {
    return (
      <div className="space-y-1 py-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-full h-[42px] flex items-center px-3 rounded-xl animate-pulse"
          >
            <div
              className="h-3.5 rounded bg-secondary dark:bg-[#212121]"
              style={{ width: `${55 + ((i * 9) % 35)}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (category === "images") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-secondary dark:bg-[#212121] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (category === "files") {
    return (
      <div className="space-y-1 py-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-full h-[46px] flex items-center justify-between px-3 rounded-xl animate-pulse"
          >
            <div className="flex-1 pr-4">
              <div
                className="h-3.5 rounded bg-secondary dark:bg-[#212121]"
                style={{ width: `${50 + ((i * 11) % 40)}%` }}
              />
            </div>
            <div className="h-3 w-12 rounded bg-secondary dark:bg-[#212121] shrink-0 ml-4" />
          </div>
        ))}
      </div>
    );
  }

  // category === "all"
  return (
    <div className="space-y-4 py-1">
      {/* Chats section skeleton - text lines only */}
      <div className="space-y-1">
        <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse ml-3 mb-2" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full h-[42px] flex items-center px-3 rounded-xl animate-pulse"
          >
            <div
              className="h-3.5 rounded bg-secondary dark:bg-[#212121]"
              style={{ width: `${55 + ((i * 13) % 35)}%` }}
            />
          </div>
        ))}
      </div>

      {/* Images section skeleton - plain cards with NO inner logo */}
      <div className="space-y-2">
        <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse ml-3 mb-2" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-secondary dark:bg-[#212121] animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Files section skeleton - text lines only */}
      <div className="space-y-1">
        <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse ml-3 mb-2" />
        {[1, 2].map((i) => (
          <div
            key={i}
            className="w-full h-[46px] flex items-center justify-between px-3 rounded-xl animate-pulse"
          >
            <div className="flex-1 pr-4">
              <div className="h-3.5 w-44 rounded bg-secondary dark:bg-[#212121]" />
            </div>
            <div className="h-3 w-12 rounded bg-secondary dark:bg-[#212121] shrink-0 ml-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchModal({
  open,
  onOpenChange,
  chats = [],
  currentChatId,
  onChatSelect,
  isGuest: isGuestProp,
  onOpenLoginModal,
}: SearchModalProps) {
  const router = useRouter();
  const { setPendingPreviewFile } = useSidebarContext();
  const { isGuest } = useModalTheme(isGuestProp, open);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all");
  const [keyboardNavIndex, setKeyboardNavIndex] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Dynamic media data (images and files) loaded from chats
  const [mediaData, setMediaData] = useState<{ images: any[]; files: any[] }>({
    images: [],
    files: [],
  });
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const darkHover = isGuest ? DARK_HOVER_BG.guest : DARK_HOVER_BG.auth;

  // Header bottom border only shows when content is scrolled underneath
  const showHeaderBorder = isOverflowing && scrolled;

  // Fetch media from user's chats when modal opens
  useEffect(() => {
    if (!open || isGuest) return;
    let isCancelled = false;
    setIsMediaLoading(true);

    fetch("/api/search/media")
      .then((res) => (res.ok ? res.json() : { images: [], files: [] }))
      .then((data) => {
        if (!isCancelled) {
          setMediaData({
            images: Array.isArray(data.images) ? data.images : [],
            files: Array.isArray(data.files) ? data.files : [],
          });
          setIsMediaLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsMediaLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [open, isGuest]);

  // Reset state and autofocus on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveCategory("all");
      setKeyboardNavIndex(null);
      setScrolled(false);
      setIsSearching(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Immediately reset search state when modal is closed
      setQuery("");
      setActiveCategory("all");
      setKeyboardNavIndex(null);
      setScrolled(false);
      setIsSearching(false);
    }
  }, [open]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isGuest && !open) {
          onOpenLoginModal?.();
          return;
        }
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, isGuest, onOpenLoginModal]);

  // Custom event listener to open from anywhere
  useEffect(() => {
    const handleOpenEvent = () => {
      if (isGuest) {
        onOpenLoginModal?.();
        return;
      }
      onOpenChange(true);
    };
    window.addEventListener("closeai-open-search", handleOpenEvent);
    return () =>
      window.removeEventListener("closeai-open-search", handleOpenEvent);
  }, [onOpenChange, isGuest, onOpenLoginModal]);

  // Filter chats & determine sections
  const { recentChats, matchingChats, allVisibleChats } = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (trimmedQuery) {
      const matches = chats.filter((c) =>
        (c.title || "New chat").toLowerCase().includes(trimmedQuery)
      );
      return {
        recentChats: [],
        matchingChats: matches,
        allVisibleChats: matches,
      };
    }

    // Default empty query: only two recent chats show, others found by searching
    const recents = chats.slice(0, 2);

    return {
      recentChats: recents,
      matchingChats: [],
      allVisibleChats: recents,
    };
  }, [chats, query]);

  // Filter images & files based on search query
  const matchingImages = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return mediaData.images.filter(
      (img) =>
        (img.name || "").toLowerCase().includes(trimmed) ||
        (img.chatTitle || "").toLowerCase().includes(trimmed)
    );
  }, [mediaData.images, query]);

  const matchingFiles = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return mediaData.files.filter(
      (f) =>
        (f.name || "").toLowerCase().includes(trimmed) ||
        (f.chatTitle || "").toLowerCase().includes(trimmed)
    );
  }, [mediaData.files, query]);

  // Dynamically detect overflow to show/hide the upper divider when scrolled
  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) {
      setIsOverflowing(false);
      return;
    }

    const check = () => {
      setIsOverflowing(contentEl.scrollHeight > scrollEl.clientHeight + 1);
    };

    check();

    const observer = new ResizeObserver(check);
    observer.observe(scrollEl);
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [
    matchingChats.length,
    matchingImages.length,
    matchingFiles.length,
    recentChats.length,
    activeCategory,
    open,
  ]);

  // Reset scroll position on query or category change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      setScrolled(false);
    }
  }, [query, activeCategory]);

  // Auto-scroll the keyboard-navigated item into view
  useEffect(() => {
    if (keyboardNavIndex !== null) {
      const activeEl = itemRefs.current.get(keyboardNavIndex);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [keyboardNavIndex]);

  // Handle keyboard navigation inside the input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = allVisibleChats.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (total > 0) {
        setKeyboardNavIndex((prev) =>
          prev === null ? 0 : (prev + 1) % total
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (total > 0) {
        setKeyboardNavIndex((prev) =>
          prev === null ? total - 1 : (prev - 1 + total) % total
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetChat =
        keyboardNavIndex !== null
          ? allVisibleChats[keyboardNavIndex]
          : allVisibleChats[0];
      if (targetChat) {
        handleSelect(targetChat.id);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (query) {
        setQuery("");
        setKeyboardNavIndex(null);
      } else {
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setQuery("");
    setActiveCategory("all");
    setKeyboardNavIndex(null);
    setScrolled(false);
    setIsSearching(false);
    onOpenChange(false);
  };

  const handleSelect = (chatId: string) => {
    handleClose();
    onChatSelect(chatId);
  };

  // Open in-page preview inside the chat page matching file drawer behavior (clean URL, no search params)
  const handleOpenMediaPreview = (item: any) => {
    handleClose();
    const targetChatId = item.chatId || item.chat_id || currentChatId;
    if (targetChatId) {
      const fileToOpen = {
        ...item,
        chatId: targetChatId,
      };
      if (setPendingPreviewFile) {
        setPendingPreviewFile(fileToOpen);
      } else {
        setGlobalPendingPreview(fileToOpen);
      }
      if (currentChatId && String(targetChatId) === String(currentChatId)) {
        // Already on this chat, context/global pending file will open preview immediately
      } else {
        router.push(`/c/${targetChatId}`);
      }
    }
  };

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 0);
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setKeyboardNavIndex(null);

    if (val.trim()) {
      setIsSearching(true);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        setIsSearching(false);
      }, 160);
    } else {
      setIsSearching(false);
    }
  };

  // Whether to show searching loading skeleton
  const isSearchLoading =
    isSearching ||
    (isMediaLoading &&
      (activeCategory === "images" ||
        activeCategory === "files" ||
        activeCategory === "all"));

  return (
    <BottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
      snapPoints={[0.92]}
      maxSnap={0.92}
      unpadded
      contentClassName="flex flex-col h-full min-h-0"
      className={cn(
        // Consistent surface with Settings modal
        isGuest
          ? "min-[1280px]:max-w-[900px] min-[1280px]:h-[min(500px,90vh)]"
          : "min-[1280px]:max-w-[800px] min-[1280px]:h-[min(500px,90vh)]",
        isGuest && "bg-white dark:bg-[#2f2f2f] border border-border/80"
      )}
    >
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        {/* Top Search Input Bar */}
        <div
          className={cn(
            "relative shrink-0 flex items-center gap-3 px-4 py-3 h-[68px] min-h-[68px] transition-colors duration-200",
            query.trim().length === 0 && showHeaderBorder
              ? "border-b border-border/80 dark:border-white/10"
              : "border-b border-transparent"
          )}
        >
          <Search className="w-5 h-5 text-muted-foreground shrink-0 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search chats"
            aria-label="Search chats"
            className="flex-1 min-w-0 bg-transparent text-[15px] sm:text-[16px] text-foreground placeholder:text-muted-foreground outline-none border-none focus:outline-none focus:ring-0 leading-normal"
          />

          {/* Right Actions: Clear Text Button + Divider + Close Button */}
          <div className="flex items-center shrink-0 gap-1 h-11">
            {query && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleQueryChange("");
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "h-11 px-4 rounded-sm flex items-center justify-center text-[13.5px] font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none shrink-0 hover:bg-secondary focus-visible:z-10",
                    getFocusRingClasses(isGuest),
                    darkHover
                  )}
                  aria-label="Clear search"
                >
                  Clear search
                </button>
                <div className="hidden min-[1280px]:block h-4 w-px bg-border/80 dark:bg-white/10 mx-1 shrink-0 select-none" />
              </>
            )}

            {/* Desktop Close Button: no permanent background, only hover bg */}
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                "hidden min-[1280px]:flex w-11 h-11 rounded-sm items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer focus-visible:z-10",
                getFocusRingClasses(isGuest),
                darkHover
              )}
              aria-label="Close search modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar when searching */}
        {query.trim().length > 0 && (
          <div
            className={cn(
              "px-4 pt-2 pb-2.5 flex items-center gap-2 shrink-0 overflow-x-auto select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b transition-colors duration-200",
              showHeaderBorder
                ? "border-border/80 dark:border-white/10"
                : "border-transparent"
            )}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setKeyboardNavIndex(null);
                }}
                className={cn(
                  "h-11 px-4 rounded-sm flex items-center justify-center text-[13px] sm:text-[13.5px] transition-all cursor-pointer select-none shrink-0 font-medium focus-visible:z-10",
                  getFocusRingClasses(isGuest),
                  activeCategory === cat.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

          {/* Results Container with Native OS Scrollbar */}
          <div
            ref={scrollRef}
            onScroll={handleContainerScroll}
            onMouseMove={() => {
              if (keyboardNavIndex !== null) setKeyboardNavIndex(null);
            }}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable]"
          >
            <div ref={contentRef} className="px-2 py-2 select-none">
              {query.trim() ? (
                // Search Active State
                isSearchLoading ? (
                  <SearchSkeletons category={activeCategory} />
                ) : activeCategory === "chats" ? (
                  // Only Chats Category
                  matchingChats.length > 0 ? (
                    <div className="space-y-0.5">
                      <div className="h-6 flex items-center text-[12px] font-medium text-muted-foreground px-3 select-none shrink-0">
                        Chats
                      </div>
                      {matchingChats.map((chat, idx) => (
                        <SearchChatItem
                          key={chat.id}
                          chat={chat}
                          globalIdx={idx}
                          query={query}
                          isKeyboardActive={keyboardNavIndex === idx}
                          darkHover={darkHover}
                          isGuest={isGuest}
                          onSelect={() => handleSelect(chat.id)}
                          onHover={() => {
                            if (keyboardNavIndex !== null) {
                              setKeyboardNavIndex(null);
                            }
                          }}
                          itemRef={(el) => {
                            if (el) itemRefs.current.set(idx, el);
                            else itemRefs.current.delete(idx);
                          }}
                          isContainerScrollingRef={isScrollingRef}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground select-none">
                      No chats found
                    </div>
                  )
                ) : activeCategory === "images" ? (
                  // Only Images Category
                  matchingImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2">
                      {matchingImages.map((img) => (
                        <SearchImageItem
                          key={img.id}
                          img={img}
                          isGuest={isGuest}
                          onSelect={() => handleOpenMediaPreview(img)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground select-none">
                      No images found
                    </div>
                  )
                ) : activeCategory === "files" ? (
                  // Only Files Category (Consistent Phosphor file icons)
                  matchingFiles.length > 0 ? (
                    <div className="space-y-0.5">
                      {matchingFiles.map((f) => (
                        <SearchFileItem
                          key={f.id}
                          file={f}
                          query={query}
                          darkHover={darkHover}
                          isGuest={isGuest}
                          onSelect={() => handleOpenMediaPreview(f)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground select-none">
                      No files found
                    </div>
                  )
                ) : (
                  // "All" Category (Unified view: Chats + Images + Files)
                  matchingChats.length === 0 &&
                  matchingImages.length === 0 &&
                  matchingFiles.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground select-none">
                      No results found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Matching Chats */}
                      {matchingChats.length > 0 && (
                        <div className="space-y-0.5">
                          <div className="h-6 flex items-center text-[12px] font-medium text-muted-foreground px-3 select-none shrink-0">
                            Chats
                          </div>
                          {matchingChats.slice(0, 6).map((chat, idx) => (
                            <SearchChatItem
                              key={chat.id}
                              chat={chat}
                              globalIdx={idx}
                              query={query}
                              isKeyboardActive={keyboardNavIndex === idx}
                              darkHover={darkHover}
                              isGuest={isGuest}
                              onSelect={() => handleSelect(chat.id)}
                              onHover={() => {
                                if (keyboardNavIndex !== null) {
                                  setKeyboardNavIndex(null);
                                }
                              }}
                              itemRef={(el) => {
                                if (el) itemRefs.current.set(idx, el);
                                else itemRefs.current.delete(idx);
                              }}
                              isContainerScrollingRef={isScrollingRef}
                            />
                          ))}
                        </div>
                      )}

                      {/* Matching Images */}
                      {matchingImages.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="h-6 flex items-center text-[12px] font-medium text-muted-foreground px-3 select-none shrink-0">
                            Images
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2">
                            {matchingImages.slice(0, 8).map((img) => (
                              <SearchImageItem
                                key={img.id}
                                img={img}
                                isGuest={isGuest}
                                onSelect={() => handleOpenMediaPreview(img)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Matching Files */}
                      {matchingFiles.length > 0 && (
                        <div className="space-y-0.5">
                          <div className="h-6 flex items-center text-[12px] font-medium text-muted-foreground px-3 select-none shrink-0">
                            Files
                          </div>
                          {matchingFiles.slice(0, 5).map((f) => (
                            <SearchFileItem
                              key={f.id}
                              file={f}
                              query={query}
                              darkHover={darkHover}
                              isGuest={isGuest}
                              onSelect={() => handleOpenMediaPreview(f)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )
              ) : (
                // Default State: only two recent chats show, others are accessed by searching
                <>
                  {recentChats.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="h-6 flex items-center text-[12px] font-medium text-muted-foreground px-3 select-none shrink-0">
                        Recent chats
                      </div>
                      {recentChats.map((chat, idx) => {
                        const isKeyboardActive = keyboardNavIndex === idx;

                        return (
                          <SearchChatItem
                            key={chat.id}
                            chat={chat}
                            globalIdx={idx}
                            query=""
                            isKeyboardActive={isKeyboardActive}
                            darkHover={darkHover}
                            isGuest={isGuest}
                            onSelect={() => handleSelect(chat.id)}
                            onHover={() => {
                              if (keyboardNavIndex !== null) {
                                setKeyboardNavIndex(null);
                              }
                            }}
                            itemRef={(el) => {
                              if (el) itemRefs.current.set(idx, el);
                              else itemRefs.current.delete(idx);
                            }}
                            isContainerScrollingRef={isScrollingRef}
                          />
                        );
                      })}
                    </div>
                  )}

                  {allVisibleChats.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground select-none">
                      No chats yet
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </BottomSheet>
    );
}
