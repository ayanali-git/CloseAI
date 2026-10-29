"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { Chat } from "@/lib/chat-service";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/components/subscription-provider";
import { CloseAIIcon } from "@/components/brand/logo";
import {
  Plus,
  Search,
  Trash2,
  Pin,
  PinOff,
  Settings,
  LogOut,
  PanelLeft,
  PanelRight,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Check,
  User as UserIcon,
  HelpCircle,
  Clock,
  PenLine,
  ArrowDownCircle,
  Command,
  FileText,
  Info,
  Bug,
  LifeBuoy,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Archive,
  ArchiveX,
  Download,
  ArrowUpRight,
  Store,
  SquarePen,
  Image as ImageIcon,
  Globe,
  X,
  CreditCard,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  AnimatedChevron,
  AnimatedComingSoonText,
  AnimatedSearchClose,
} from "@/components/ui/animated";
import { LogoutModal } from "@/components/modals/log-out-modal";
import { DeleteModal } from "@/components/modals/delete-chat-modal";
import { ReportBugModal } from "@/components/modals/report-bug-modal";
import { SearchModal } from "@/components/modals/search-modal";
import toast from "@/lib/toast";
import { openSettings, isSettingsHash, SettingsSection } from "@/lib/settings-hash";
import { useSidebarContext } from "@/components/chat/sidebar-context";
import { EASE_DRAWER } from "@/lib/ease";
import { motion, useDragControls, type PanInfo } from "framer-motion";

const DRAWER = { duration: 0.35, ease: EASE_DRAWER } as const;
const SIDEBAR_SPRING = { type: "spring", damping: 30, stiffness: 320 } as const;

interface SidebarProps {
  user: User | null;
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onToggleStar: (chatId: string, starred: boolean) => void;
  onToggleArchive?: (chatId: string, archived: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  isGuest?: boolean;
  onOpenLoginModal?: (options?: { description?: string; title?: string }) => void;
  onOpenWebSearchModal?: (options?: { description?: string; title?: string }) => void;
  onOpenAdvancedFeaturesModal?: (options?: { description?: string; title?: string }) => void;
  onWebSearchHover?: () => void;
}

/**
 * Auto-scrolling title on hover
 */
function ChatTitleMarquee({
  title,
  isHovered,
  isSelected,
}: {
  title: string;
  isHovered: boolean;
  isSelected: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowWidth, setOverflowWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (textRef.current && containerRef.current) {
        const diff =
          textRef.current.scrollWidth -
          containerRef.current.clientWidth;

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
  }, [title, isHovered, isSelected]);

  const isScrolling = overflowWidth > 0 && isHovered;

  const duration = Math.max(3.2, overflowWidth / 35 + 1.8);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 min-w-0 overflow-hidden pr-1 max-xl:mr-[78px] group-hover:xl:mr-[78px]",
        (isHovered || isSelected) && "xl:mr-[78px]"
      )}
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
      {/* Chat title */}
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
        className="inline-block whitespace-nowrap text-[15px] leading-snug select-none will-change-transform"
      >
        {title || "New chat"}
      </span>
    </div>
  );
}

const groupChats = (chats: Chat[]) => {
  const groups: Record<string, Chat[]> = {
    Pinned: [],
    Archived: [],
    Recents: [],
  };

  chats.forEach((chat) => {
    if (chat.starred) {
      groups["Pinned"].push(chat);
      return;
    }

    if (chat.archived) {
      groups["Archived"].push(chat);
      return;
    }

    groups["Recents"].push(chat);
  });

  return groups;
};

interface SidebarChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onChatSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onToggleStar: (id: string, starred: boolean) => void;
  onToggleArchive?: (id: string, archived: boolean) => void;
  setChatToDelete: (chat: Chat) => void;
}

/**
 * Top-level memoized item. Immune to AI stream re-renders in ChatPage.
 * Does not unmount/remount on parent render, completely eliminating hover flicker.
 */
const SidebarChatItem = React.memo(
  function SidebarChatItem({
    chat,
    isSelected,
    onChatSelect,
    isOpen,
    onToggle,
    onToggleStar,
    onToggleArchive,
    setChatToDelete,
  }: SidebarChatItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const itemRef = useRef<HTMLDivElement>(null);

    const onChatSelectRef = useRef(onChatSelect);
    onChatSelectRef.current = onChatSelect;
    const onToggleRef = useRef(onToggle);
    onToggleRef.current = onToggle;
    const onToggleStarRef = useRef(onToggleStar);
    onToggleStarRef.current = onToggleStar;
    const onToggleArchiveRef = useRef(onToggleArchive);
    onToggleArchiveRef.current = onToggleArchive;
    const setChatToDeleteRef = useRef(setChatToDelete);
    setChatToDeleteRef.current = setChatToDelete;

    useEffect(() => {
      if (itemRef.current?.matches(":hover")) {
        setIsHovered(true);
      }
    }, []);

    const showActions = isHovered || isSelected;

    return (
      <div
        ref={itemRef}
        onClick={() => {
          setIsHovered(true);
          onChatSelectRef.current(chat.id);
          if (
            isOpen &&
            typeof window !== "undefined" &&
            window.innerWidth < 1280
          ) {
            onToggleRef.current();
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={() => {
          if (!isHovered) setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
        className={cn(
          "group relative flex items-center justify-between px-2 py-2.5 rounded-sm text-base cursor-pointer transition-all duration-150",
          isSelected
            ? "bg-secondary text-foreground"
            : cn(
                "text-muted-foreground hover:bg-secondary active:bg-secondary",
                isPressed && "bg-secondary"
              )
        )}
      >
        {/* Title with Smooth Marquee on Hover */}
        <ChatTitleMarquee
          title={chat.title || "New chat"}
          isHovered={isHovered}
          isSelected={isSelected}
        />

        {/* Status indicators when not hovered and not selected (hidden on mobile where action buttons are always visible) */}
        {chat.starred && !showActions && (
          <PinOff className="w-5 h-5 text-muted-foreground shrink-0 ml-1.5 max-xl:hidden xl:group-hover:hidden" />
        )}
        {chat.archived && !chat.starred && !showActions && (
          <ArchiveX className="w-5 h-5 text-muted-foreground shrink-0 ml-1.5 max-xl:hidden xl:group-hover:hidden" />
        )}

        {/* Actions */}
        <div
          className={cn(
            "absolute right-2 inset-y-0 flex items-center gap-0.5 z-10 transition-opacity duration-150",
            // Desktop (>= 1280px): position at right edge, completely transparent background so it matches the row seamlessly!
            "xl:right-0 xl:pl-1 xl:pr-1 xl:rounded-r-xl",
            // Small screens (< 1280px): completely transparent, no gradient box, seamless with hover box!
            "max-xl:bg-transparent max-xl:bg-none",
            // Visibility: on small screens always visible; on desktop visible when hovered, selected, or on group-hover!
            "max-xl:opacity-100 max-xl:pointer-events-auto",
            showActions
              ? "opacity-100 pointer-events-auto"
              : "xl:opacity-0 xl:pointer-events-none xl:group-hover:opacity-100 xl:group-hover:pointer-events-auto"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStarRef.current(chat.id, !chat.starred);
                }}
                className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer pointer-events-auto outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
              >
                {chat.starred ? (
                  <PinOff className="w-5 h-5 text-foreground" />
                ) : (
                  <Pin className="w-5 h-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-base">
              {chat.starred ? "Unpin" : "Pin"}
            </TooltipContent>
          </Tooltip>

          {onToggleArchive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleArchiveRef.current?.(chat.id, !chat.archived);
                  }}
                  className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer pointer-events-auto outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
                >
                  {chat.archived ? (
                    <ArchiveX className="w-5 h-5" />
                  ) : (
                    <Archive className="w-5 h-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-base">
                {chat.archived ? "Unarchive" : "Archive"}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setChatToDeleteRef.current(chat);
                }}
                className="p-1 rounded-sm text-muted-foreground hover:text-red-500 transition-colors cursor-pointer pointer-events-auto outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-base">Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.chat.id === next.chat.id &&
    prev.chat.title === next.chat.title &&
    prev.chat.starred === next.chat.starred &&
    prev.chat.archived === next.chat.archived &&
    prev.isSelected === next.isSelected &&
    prev.isOpen === next.isOpen
);

export function Sidebar({
  user,
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onToggleStar,
  onToggleArchive,
  searchQuery,
  onSearchChange,
  isOpen,
  onToggle,
  isLoading = false,
  isGuest: isGuestProp,
  onOpenLoginModal,
  onOpenWebSearchModal,
  onOpenAdvancedFeaturesModal,
  onWebSearchHover,
}: SidebarProps) {
  const isGuestMode = isGuestProp !== undefined ? isGuestProp : !user;
  const isAuthenticated = !isGuestMode && Boolean(user);

  const pathname = usePathname();
  const isNewChat =
    !currentChatId &&
    (pathname === "/c" ||
      pathname === "/gc" ||
      pathname === "/c/" ||
      pathname === "/gc/");
  const { signOut, loading: authLoading } = useAuth();
  // True while the session is still being restored on reload (user not known yet).
  const isAuthLoading = authLoading && !user;
  // Show the profile skeleton at the same time as the chat skeleton
  const showProfileSkeleton = isAuthLoading || (!!user && isLoading);
  const { plan: userPlan } = useSubscription();
  const { theme, setTheme } = useTheme();
  const { setSidebarOpen } = useSidebarContext();
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [chatStreamScrolled, setChatStreamScrolled] = useState(false);
  const [chatStreamCanScrollDown, setChatStreamCanScrollDown] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);

  const updateChatListScrollBorders = useCallback(
    (target?: HTMLElement | null) => {
      const el = target || chatListRef.current;
      if (!el) return;
      const isScrolled = el.scrollTop > 0;
      const canScrollDown = el.scrollHeight - el.scrollTop - el.clientHeight > 2;
      setChatStreamScrolled(isScrolled);
      setChatStreamCanScrollDown(canScrollDown);
    },
    []
  );

  useEffect(() => {
    const el = chatListRef.current;
    if (!el) return;
    updateChatListScrollBorders(el);
    const ro = new ResizeObserver(() => {
      updateChatListScrollBorders(el);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [chats, isLoading, collapsedSections, searchQuery, isOpen, updateChatListScrollBorders]);

  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isBorderHovered, setIsBorderHovered] = useState(false);
  const [isEmptySpaceHovered, setIsEmptySpaceHovered] = useState(false);
  const [isCloseBtnHovered, setIsCloseBtnHovered] = useState(false);

  const shouldShowPanelIcon = isAuthenticated
    ? isLogoHovered || (!isOpen && (isBorderHovered || isEmptySpaceHovered))
    : true;

  useEffect(() => {
    if (false) {
      const timer = window.setTimeout(() => {
        // Search modal handles its own input focus
      }, 50);

      return () => window.clearTimeout(timer);
    }
  }, []);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showReportBugModal, setShowReportBugModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const isAnyModalOpen = showLogoutModal || showReportBugModal || !!chatToDelete || showSearchModal;
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [collapsedAccountMenuOpen, setCollapsedAccountMenuOpen] = useState(false);
  const [guestHelpMenuOpen, setGuestHelpMenuOpen] = useState(false);
  const [mobileHelpMenuOpen, setMobileHelpMenuOpen] = useState(false);
  const [railHelpOpen, setRailHelpOpen] = useState(false);
  const [webSearchHoverOpen, setWebSearchHoverOpen] = useState(false);
  const [railWebSearchHoverOpen, setRailWebSearchHoverOpen] = useState(false);
  const [guestPopoverOpen, setGuestPopoverOpen] = useState(false);
  const isWebSearchMouseHoveringRef = useRef(false);
  const ignoreNextWebSearchOpenRef = useRef(false);

  const prevSidebarOpenForModalRef = useRef<boolean | null>(null);
  const prevSidebarOpenForSettingsRef = useRef<boolean | null>(null);
  const prevSidebarOpenForLoginRef = useRef<boolean | null>(null);

  const openModalWithSidebarClose = useCallback(
    (openFn: () => void) => {
      if (isOpen) {
        prevSidebarOpenForModalRef.current = true;
        setSidebarOpen(false);
      } else {
        prevSidebarOpenForModalRef.current = false;
      }
      openFn();
    },
    [isOpen, setSidebarOpen]
  );

  const closeModalWithSidebarRestore = useCallback(
    (closeFn?: () => void) => {
      closeFn?.();
      const shouldReopen = prevSidebarOpenForModalRef.current === true;
      if (shouldReopen) {
        requestAnimationFrame(() => {
          setSidebarOpen(true);
        });
      }
      prevSidebarOpenForModalRef.current = null;
    },
    [setSidebarOpen]
  );

  const handleOpenSettings = useCallback(
    (section?: SettingsSection | "root") => {
      setAccountMenuOpen(false);
      setCollapsedAccountMenuOpen(false);
      setRailHelpOpen(false);
      setGuestHelpMenuOpen(false);
      setMobileHelpMenuOpen(false);
      if (isOpen) {
        prevSidebarOpenForSettingsRef.current = true;
        setSidebarOpen(false);
      }
      openSettings(section);
    },
    [isOpen, setSidebarOpen]
  );

  const handleOpenLoginModal = useCallback(
    (options?: { description?: string; title?: string }) => {
      setGuestPopoverOpen(false);
      setAccountMenuOpen(false);
      setCollapsedAccountMenuOpen(false);
      setRailHelpOpen(false);
      setGuestHelpMenuOpen(false);
      setMobileHelpMenuOpen(false);
      if (isOpen) {
        prevSidebarOpenForLoginRef.current = true;
        setSidebarOpen(false);
      }
      if (onOpenLoginModal) {
        onOpenLoginModal(options);
      } else if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("closeai-open-login", { detail: options })
        );
      }
    },
    [isOpen, onOpenLoginModal, setSidebarOpen]
  );

  const handleOpenSearchModal = useCallback(() => {
    setAccountMenuOpen(false);
    setCollapsedAccountMenuOpen(false);
    setRailHelpOpen(false);
    setGuestHelpMenuOpen(false);
    setMobileHelpMenuOpen(false);
    if (!user) {
      handleOpenLoginModal({
        description: "To continue with Search chats",
      });
      return;
    }
    openModalWithSidebarClose(() => setShowSearchModal(true));
  }, [user, handleOpenLoginModal, openModalWithSidebarClose]);

  const handleSearchChatSelect = useCallback(
    (chatId: string) => {
      prevSidebarOpenForModalRef.current = null;
      setShowSearchModal(false);
      onChatSelect(chatId);
      if (typeof window !== "undefined" && window.innerWidth < 1280 && isOpen) {
        onToggle();
      }
    },
    [onChatSelect, isOpen, onToggle]
  );

  const handleOpenLogout = useCallback(() => {
    setAccountMenuOpen(false);
    setCollapsedAccountMenuOpen(false);
    setRailHelpOpen(false);
    setGuestHelpMenuOpen(false);
    setMobileHelpMenuOpen(false);
    openModalWithSidebarClose(() => setShowLogoutModal(true));
  }, [openModalWithSidebarClose]);

  const handleOpenDeleteModal = useCallback(
    (chat: Chat) => {
      openModalWithSidebarClose(() => setChatToDelete(chat));
    },
    [openModalWithSidebarClose]
  );

  const handleOpenReportBug = useCallback(() => {
    setAccountMenuOpen(false);
    setCollapsedAccountMenuOpen(false);
    setRailHelpOpen(false);
    setGuestHelpMenuOpen(false);
    setMobileHelpMenuOpen(false);
    setAccountSubView("main");
    openModalWithSidebarClose(() => setShowReportBugModal(true));
  }, [openModalWithSidebarClose]);

  const handleOpenAddAccount = useCallback(() => {
    setAccountMenuOpen(false);
    setCollapsedAccountMenuOpen(false);
    setRailHelpOpen(false);
    setGuestHelpMenuOpen(false);
    setMobileHelpMenuOpen(false);
    setAccountSubView("main");
    handleOpenLoginModal();
  }, [handleOpenLoginModal]);

  const handleLogoutConfirm = useCallback(async () => {
    try {
      prevSidebarOpenForModalRef.current = null;
      setShowLogoutModal(false);
      await signOut();
    } catch (e) {
      console.error(e);
    }
  }, [signOut]);

  useEffect(() => {
    const handleHashChange = () => {
      const isSettings = isSettingsHash(window.location.hash);
      if (isSettings) {
        if (isOpen) {
          prevSidebarOpenForSettingsRef.current = true;
          setSidebarOpen(false);
        }
      } else {
        if (prevSidebarOpenForSettingsRef.current === true) {
          requestAnimationFrame(() => {
            setSidebarOpen(true);
          });
        }
        prevSidebarOpenForSettingsRef.current = null;
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [isOpen, setSidebarOpen]);

  useEffect(() => {
    const handleLoginClosed = () => {
      if (prevSidebarOpenForLoginRef.current === true) {
        requestAnimationFrame(() => {
          setSidebarOpen(true);
        });
      }
      prevSidebarOpenForLoginRef.current = null;
    };
    window.addEventListener("closeai-close-login", handleLoginClosed);
    return () =>
      window.removeEventListener("closeai-close-login", handleLoginClosed);
  }, [setSidebarOpen]);

  useEffect(() => {
    setWebSearchHoverOpen(false);
    setRailWebSearchHoverOpen(false);
    setIsLogoHovered(false);
    setIsBorderHovered(false);
    setIsEmptySpaceHovered(false);
    if (!isOpen) {
      setMobileHelpMenuOpen(false);
    }
  }, [isOpen]);

  // Close sidebar drawer on Escape key (matching FilesDrawer behavior)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showLogoutModal || chatToDelete || showReportBugModal || showSearchModal) return;
        onToggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showLogoutModal, chatToDelete, showReportBugModal, showSearchModal, onToggle]);

  useEffect(() => {
    const handleOpen = () => handleOpenReportBug();
    window.addEventListener("open-report-bug-modal", handleOpen);
    return () => window.removeEventListener("open-report-bug-modal", handleOpen);
  }, [isOpen, onToggle]);

  const toggleSection = (group: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const filteredChats = chats.filter((chat) =>
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedChats = groupChats(filteredChats);
  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const planDisplay =
    userPlan === "ultra" ? "Ultra Pro" : userPlan === "pro" ? "Pro" : "Free";
  const username =
    user?.user_metadata?.username?.trim() ||
    user?.user_metadata?.user_name?.trim() ||
    user?.email?.split("@")[0] ||
    "user";
  const userEmail = user?.email || (user ? "" : "Not signed in");
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const [accountSubView, setAccountSubView] = useState<
    "main" | "theme" | "help" | "accounts"
  >("main");
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1280;
    }
    return false;
  });
  const [mounted, setMounted] = useState(false);
  const [isReadyToAnimate, setIsReadyToAnimate] = useState(false);

  const dragControls = useDragControls();

  const handleNewChatAction = useCallback(() => {
    onNewChat();
    if (isGuestMode) {
      setSidebarOpen(false);
      if (isOpen) {
        onToggle();
      }
    } else if (
      isOpen &&
      typeof window !== "undefined" &&
      window.innerWidth < 1280
    ) {
      setSidebarOpen(false);
      onToggle();
    }
  }, [onNewChat, isGuestMode, isOpen, onToggle, setSidebarOpen]);

  const onSidebarDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (!isMobileScreen) return;
      const velocity = info.velocity.x;
      const offset = info.offset.x;

      // Consistent with bottom-sheet logic adapted for horizontal dismiss:
      // Moving half-way towards left (offset < -25) or swiping left (velocity < -80) automatically closes the sidebar.
      if (velocity < -80 || offset < -25) {
        if (isOpen) {
          onToggle();
        }
        setSidebarOpen(false);
        return;
      }
    },
    [isMobileScreen, isOpen, onToggle, setSidebarOpen]
  );

  useEffect(() => {
    setIsMobileScreen(window.innerWidth < 1280);
    setMounted(true);

    const timer = setTimeout(() => {
      setIsReadyToAnimate(true);
    }, 120);

    const checkMobile = () => {
      const isMob = window.innerWidth < 1280;
      setIsMobileScreen(isMob);
      if (isMob) {
        setGuestHelpMenuOpen(false);
      } else {
        setMobileHelpMenuOpen(false);
      }
    };
    window.addEventListener("resize", checkMobile);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const renderHelpMenuItems = () => (
    <div className="space-y-0.5 p-0.5">
      <DropdownMenuItem asChild>
        <Link
          href="/support/help"
          className="flex items-center gap-2.5 px-3 py-2 text-base rounded-sm font-normal cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors outline-none whitespace-nowrap text-left group"
        >
          <HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          <span>Help center</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
        <Link
          href="/company/blog"
          className="flex items-center gap-2.5 px-3 py-2 text-base rounded-sm font-normal cursor-pointer text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors outline-none whitespace-nowrap text-left group"
        >
          <PenLine className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          <span>Release notes</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem
        asChild
        onSelect={(e) => e.preventDefault()}
        className="!cursor-not-allowed [&_*]:!cursor-not-allowed opacity-50"
      >
        <div className="flex items-center gap-2.5 px-3 py-2 text-base rounded-sm font-normal text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors outline-none whitespace-nowrap text-left group">
          <Download className="w-5 h-5 text-muted-foreground group-hover:text-foreground !cursor-not-allowed" />
          <AnimatedComingSoonText
            label="Download app"
            comingSoonText="Coming soon"
            className="!cursor-not-allowed"
          />
        </div>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1 bg-neutral-200 dark:bg-[#2f2f2f]" />

      <DropdownMenuItem asChild>
        <Link
          href="/support/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm text-base font-normal text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors outline-none whitespace-nowrap text-left"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
            <span>Terms of Service</span>
          </div>
          <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
        <Link
          href="/support/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm text-base font-normal text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors outline-none whitespace-nowrap text-left"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
            <span>Privacy Policy</span>
          </div>
          <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1 bg-neutral-200 dark:bg-[#2f2f2f]" />

      <DropdownMenuItem
        onClick={handleOpenReportBug}
        className="group flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm text-base font-normal text-foreground hover:bg-secondary dark:hover:bg-[#2f2f2f] dark:focus:bg-[#2f2f2f] data-[highlighted]:bg-secondary dark:data-[highlighted]:bg-[#2f2f2f] active:bg-secondary/80 dark:active:bg-[#2f2f2f]/80 transition-colors outline-none whitespace-nowrap text-left"
      >
        <div className="flex items-center gap-2.5">
          <Bug className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          <span>Report a bug</span>
        </div>
      </DropdownMenuItem>
    </div>
  );

  const renderWebSearchHoverCardContent = (
    closeCard: () => void,
    side: "bottom" | "right" = "bottom"
  ) => (
    <HoverCardContent
      side={side}
      align="start"
      sideOffset={side === "bottom" ? 6 : 20}
      collisionPadding={9}
      className="w-[calc(100vw-2rem)] sm:w-[330px] max-w-[330px] p-0 rounded-sm bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-white/10 overflow-hidden text-left z-50 select-none transition-none animate-none duration-0 !transition-none !animate-none"
    >
      {/* Web Search Simple Sky Blue & Soft Lilac Gradient Banner with DiceBear Glass SVG */}
      <div className="h-32 w-full relative overflow-hidden bg-gradient-to-tr from-[#ebb8f7] via-[#5bb5f8] via-25% to-[#72ccfd]">
        <img
          src="https://api.dicebear.com/10.x/glass/svg?seed=Search%20the%20web"
          alt="Search the web"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>
      <div className="p-4">
        <h4 className="text-[15.5px] font-semibold text-foreground dark:text-white tracking-tight leading-snug">
          Search the web
        </h4>
        <p className="text-[13px] text-muted-foreground dark:text-neutral-300 mt-1.5 leading-relaxed">
          Search the web, synthesize multiple sources, and get up-to-date
          answers with citations.
        </p>
        <div className="flex items-center gap-2.5 mt-4">
          <button
            type="button"
            onClick={() => {
              closeCard();
              (handleOpenLoginModal || onOpenWebSearchModal)?.({ description: "To continue with Web search" });
            }}
            className="h-11 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-80 text-base font-medium transition-colors cursor-pointer flex items-center justify-center text-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              closeCard();
              (handleOpenLoginModal || onOpenWebSearchModal)?.({ description: "To continue with Web search" });
            }}
            className="h-11 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-white/10 dark:bg-[#1f1f1f] dark:hover:bg-[#2f2f2f] dark:text-white text-base font-normal transition-colors cursor-pointer flex items-center justify-center text-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          >
            Sign up for free
          </button>
        </div>
      </div>
    </HoverCardContent>
  );

  /**
   * Account Popover Menu Items (Responsive: Flyout on Desktop, In-Place on Mobile)
   */
  const renderAccountMenuItems = () => {
    // Mobile In-Place Subviews
    if (isMobileScreen && accountSubView === "help") {
      return (
        <div className="space-y-1 p-0.5">
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              setAccountSubView("main");
            }}
            className="flex items-center gap-2 px-2 py-2 text-base font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 rounded-sm cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
            <span>Help</span>
          </button>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#2f2f2f] my-1" />
          <DropdownMenuItem asChild>
            <Link
              href="/support/help"
              onClick={() => {
                setAccountMenuOpen(false);
                if (isOpen && typeof window !== "undefined" && window.innerWidth < 1280) {
                  onToggle();
                }
              }}
              className="group flex items-center gap-2.5 px-2 py-2 rounded-sm text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none cursor-pointer"
            >
              <HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              <span>Help center</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/company/blog"
              onClick={() => {
                setAccountMenuOpen(false);
                if (isOpen && typeof window !== "undefined" && window.innerWidth < 1280) {
                  onToggle();
                }
              }}
              className="group flex items-center gap-2.5 px-2 py-2 rounded-sm text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none cursor-pointer"
            >
              <PenLine className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              <span>Release notes</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            onSelect={(e) => e.preventDefault()}
            className="!cursor-not-allowed [&_*]:!cursor-not-allowed opacity-50"
          >
            <div className="group w-full flex items-center gap-2.5 px-2 py-2 rounded-sm text-base font-normal transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left !cursor-not-allowed [&_*]:!cursor-not-allowed select-none text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#1f1f1f]">
              <Download className="w-5 h-5 text-muted-foreground group-hover:text-foreground !cursor-not-allowed" />
              <AnimatedComingSoonText
                label="Download app"
                comingSoonText="Coming soon"
                className="!cursor-not-allowed"
              />
            </div>
          </DropdownMenuItem>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#2f2f2f] my-1" />
          <DropdownMenuItem asChild>
            <Link
              href="/support/terms"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAccountMenuOpen(false)}
              className="group flex items-center justify-between px-2 py-2 rounded-sm text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <span>Terms of Use</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/support/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAccountMenuOpen(false)}
              className="group flex items-center justify-between px-2 py-2 rounded-sm text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <span>Privacy Policy</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
            </Link>
          </DropdownMenuItem>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#2f2f2f] my-1" />
          <DropdownMenuItem
            onClick={handleOpenReportBug}
            className="group flex items-center justify-between px-2 py-2 rounded-sm text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none w-full text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Bug className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <span>Report a bug</span>
            </div>
          </DropdownMenuItem>
        </div>
      );
    }

    if (isMobileScreen && accountSubView === "accounts") {
      return (
        <div className="space-y-1 p-0.5">
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              setAccountSubView("main");
            }}
            className="flex items-center gap-2 px-2 py-2 text-base font-medium text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 rounded-sm cursor-pointer w-full text-left transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
            <span>Accounts</span>
          </button>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#2f2f2f] my-1" />
          <div className="flex items-center gap-2 px-2 py-1.5 text-base text-muted-foreground hover:text-foreground select-none">
            <UserIcon className="w-5 h-5 shrink-0" />
            <span className="truncate">{userEmail}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-2 rounded-sm bg-secondary/50">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-[14px] font-semibold bg-secondary text-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-base font-medium truncate text-foreground leading-tight pt-0.5">
                  {displayName}
                </p>
                <p
                  className="text-sm text-muted-foreground leading-tight truncate"
                  suppressHydrationWarning
                >
                  @{username}
                </p>
              </div>
            </div>
            <Check className="w-5 h-5 text-foreground shrink-0 ml-2" />
          </div>
          <div className="h-[1px] bg-neutral-200 dark:bg-[#2f2f2f] my-1" />
          <button
            type="button"
            onClick={handleOpenAddAccount}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-sm text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors cursor-pointer outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span>Add account</span>
          </button>
        </div>
      );
    }

    // Default Main View (Desktop uses DropdownMenuSub, Mobile uses Clickable Rows)
    return (
      <div className="space-y-0.5 p-0.5">
        {/* Account Info Button */}
        {isMobileScreen ? (
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              setAccountSubView("accounts");
            }}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-sm [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 text-left transition-colors cursor-pointer outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-base font-semibold bg-secondary text-foreground">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium truncate text-foreground leading-tight">
                {displayName}
              </p>
              <p
                className="text-sm text-muted-foreground leading-tight truncate"
                suppressHydrationWarning
              >
                {planDisplay}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto shrink-0" />
          </button>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-2 py-2 text-base rounded-sm cursor-pointer">
              <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-base font-semibold bg-secondary text-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-base font-medium truncate text-foreground leading-tight">
                  {displayName}
                </p>
                <p
                  className="text-sm text-muted-foreground leading-tight truncate"
                  suppressHydrationWarning
                >
                  {planDisplay}
                </p>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={5}
              alignOffset={-108}
              className="w-64 max-w-[calc(100vw-24px)] rounded-sm p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none"
            >
              <div className="flex items-center gap-2 px-2 py-2 text-base text-muted-foreground hover:text-foreground select-none">
                <UserIcon className="w-5 h-5 shrink-0" />
                <span className="truncate">{userEmail}</span>
              </div>
              <DropdownMenuItem className="flex items-center justify-between px-2 py-2 rounded-sm cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-[14px] font-semibold bg-secondary text-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-base font-medium truncate text-foreground leading-tight pt-0.5">
                      {displayName}
                    </p>
                    <p
                      className="text-sm text-muted-foreground leading-tight truncate"
                      suppressHydrationWarning
                    >
                      @{username}
                    </p>
                  </div>
                </div>
                <Check className="w-5 h-5 text-foreground shrink-0 ml-2" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleOpenAddAccount}
                className="flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-sm text-base"
              >
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                <span>Add account</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <div className="h-[1px] bg-neutral-200 dark:bg-[#2f2f2f] my-1 -mx-1.5" />

        {/* Upgrade plan */}
        <DropdownMenuItem
          onClick={() => handleOpenSettings("plans")}
          className="flex items-center gap-2.5 px-2 py-2 rounded-sm text-base cursor-pointer"
        >
          <CreditCard className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          <span>Plans</span>
        </DropdownMenuItem>

        {/* Data */}
        <DropdownMenuItem
          onClick={() => handleOpenSettings("data")}
          className="flex items-center gap-2.5 px-2 py-2 rounded-sm text-base cursor-pointer"
        >
          <Database className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          <span>Data</span>
        </DropdownMenuItem>

        {/* Profile */}
        <DropdownMenuItem
          onClick={() => handleOpenSettings("profile")}
          className="flex items-center gap-2.5 px-2 py-2 rounded-sm text-base cursor-pointer"
        >
          <UserIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          <span>Profile</span>
        </DropdownMenuItem>

        {/* Settings */}
        <DropdownMenuItem
          onClick={() =>
            handleOpenSettings(isMobileScreen ? undefined : "general")
          }
          className="flex items-center gap-2.5 px-2 py-2 rounded-sm text-base cursor-pointer"
        >
          <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>

        <div className="h-[1px] bg-neutral-200 dark:bg-[#2f2f2f] my-1 -mx-1.5" />

        {/* Help Button / Dropdown */}
        {isMobileScreen ? (
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement)?.blur();
              setAccountSubView("help");
            }}
            className="w-full flex items-center justify-between px-2 py-2 rounded-sm text-base text-foreground [@media(hover:hover)]:hover:bg-secondary active:bg-secondary/80 transition-colors cursor-pointer outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none"
          >
            <div className="flex items-center gap-2.5">
              <LifeBuoy className="w-5 h-5 text-muted-foreground" />
              <span>Help</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2.5 px-2 py-2 text-base rounded-sm cursor-pointer">
              <LifeBuoy className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              <span>Help</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={5}
              alignOffset={-238}
              className="w-64 max-w-[calc(100vw-24px)] rounded-sm p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none"
            >
              <DropdownMenuItem asChild>
                <Link
                  href="/support/help"
                  className="flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-sm text-base"
                >
                  <HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                  <span>Help center</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/company/blog"
                  className="flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-sm text-base"
                >
                  <PenLine className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                  <span>Release notes</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="flex items-center gap-2.5 px-2 py-2 rounded-sm text-base font-normal transition-colors outline-none focus:outline-none focus:bg-transparent focus-visible:outline-none whitespace-nowrap text-left !cursor-not-allowed [&_*]:!cursor-not-allowed opacity-50 select-none text-foreground [@media(hover:hover)]:hover:bg-secondary dark:[@media(hover:hover)]:hover:bg-[#1f1f1f]"
              >
                <Download className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 !cursor-not-allowed" />
                <AnimatedComingSoonText
                  label="Download app"
                  comingSoonText="Coming soon"
                  className="!cursor-not-allowed"
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/support/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between px-2 py-2 cursor-pointer rounded-sm text-base text-foreground"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    <span>Terms of Use</span>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/support/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between px-2 py-2 cursor-pointer rounded-sm text-base text-foreground"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    <span>Privacy Policy</span>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 ml-auto transition-opacity duration-150 opacity-100 xl:opacity-0 xl:group-hover:opacity-100" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleOpenReportBug}
                className="group flex items-center justify-between px-2 py-2 cursor-pointer rounded-sm text-base text-foreground"
              >
                <div className="flex items-center gap-2.5">
                  <Bug className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  <span>Report a bug</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {/* Log out */}
        <DropdownMenuItem
          onClick={handleOpenLogout}
          className="flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-sm text-base"
        >
          <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          <span>Log out</span>
        </DropdownMenuItem>
      </div>
    );
  };

  const renderChatItem = (chat: Chat) => (
    <SidebarChatItem
      key={chat.id}
      chat={chat}
      isSelected={currentChatId === chat.id}
      onChatSelect={onChatSelect}
      isOpen={isOpen}
      onToggle={onToggle}
      onToggleStar={onToggleStar}
      onToggleArchive={onToggleArchive}
      setChatToDelete={handleOpenDeleteModal}
    />
  );

  const renderAvatarContent = () => (
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-secondary flex items-center justify-center select-none">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover select-none"
          loading="eager"
          decoding="sync"
        />
      ) : (
        <span className="text-base font-semibold text-foreground select-none">
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 xl:hidden transition-opacity duration-200",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={onToggle}
      />

      {/* Main Sidebar (Expands smoothly from 50px to 250px on Desktop, slides over on Mobile) */}
      <motion.aside
        suppressHydrationWarning
        initial={!isMobileScreen ? false : { x: isOpen ? 0 : "-100%" }}
        animate={{ x: isMobileScreen ? (isOpen ? 0 : "-100%") : 0 }}
        drag={isMobileScreen && isOpen ? "x" : false}
        dragControls={dragControls}
        dragListener={isMobileScreen && isOpen}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.4, right: 0.02 }}
        dragMomentum={false}
        dragSnapToOrigin={true}
        onDragEnd={onSidebarDragEnd}
        transition={
          !isMobileScreen
            ? { duration: 0 }
            : DRAWER
        }
        className={cn(
          "h-[100dvh] max-h-[100dvh] bg-sidebar border-r border-border/80 dark:border-white/10 flex flex-col shrink-0 select-none overflow-hidden relative group/sidebar",
          isGuestMode && "max-xl:bg-white dark:max-xl:bg-[#1f1f1f]",
          mounted &&
            "xl:transition-[width] xl:duration-300 xl:ease-in-out xl:will-change-[width]",
          // Small screens: always a fixed drawer (never `hidden`) so it can slide out.
          // xl and up: normal in-flow sidebar (60px rail / 250px open), same as before.
          "fixed xl:relative inset-y-0 left-0 w-[78%] max-w-[78%] sm:w-[250px] sm:max-w-[250px]",
          isOpen ? "z-50 xl:z-20" : "max-xl:z-50 xl:w-[60px]",
          // Before mount, hide mobile drawer completely so it never flashes, overlaps, or sits at 0 on reload
          !mounted && "max-xl:hidden"
        )}
      >
        {/* Full-height border resize/toggle handle (desktop only) */}
        <div
          onClick={(e) => {
            if (isAuthenticated && !isMobileScreen) {
              (e.currentTarget as HTMLElement)?.blur();
              setIsBorderHovered(false);
              setIsLogoHovered(false);
              setIsEmptySpaceHovered(false);
              onToggle();
            }
          }}
          onMouseEnter={() => {
            if (isAuthenticated && !isOpen) {
              setIsBorderHovered(true);
            }
          }}
          onMouseLeave={() => {
            if (isAuthenticated) {
              setIsBorderHovered(false);
            }
          }}
          style={isAuthenticated ? { cursor: "ew-resize" } : undefined}
          className={cn(
            "absolute -right-[3px] top-0 bottom-0 w-[6px] z-30 transition-colors max-xl:hidden",
            isAuthenticated
              ? "hover:bg-foreground/15 cursor-ew-resize !cursor-ew-resize"
              : "pointer-events-none cursor-default"
          )}
        />

        {/* Persistent Non-Blinking Profile Avatar for Authenticated Users.
            left-[14px] = (60px rail - 32px avatar) / 2 → centered in the 44px (w-11) button
            when collapsed, and lines up with the profile row when expanded. */}
        {user && !showProfileSkeleton && (
          <div
            suppressHydrationWarning
            className="absolute left-[14px] z-30 pointer-events-none select-none transition-none"
            style={{
              bottom: "calc(max(env(safe-area-inset-bottom), 0.5rem) + 8px)",
            }}
          >
            {renderAvatarContent()}
          </div>
        )}

        {/* Middle Navigation & Chats Area */}
        <div className="w-full h-full relative overflow-hidden flex-1">
          {/* Collapsed Rail Body (60px) */}
          <div
            data-sidebar-rail
            suppressHydrationWarning
            className={cn(
              "w-[60px] h-full flex flex-col items-center shrink-0 absolute top-0 left-0 z-10 max-xl:hidden",
              mounted && "transition-opacity duration-200",
              !isOpen
                ? "opacity-100 pointer-events-auto visible"
                : "opacity-0 pointer-events-none invisible"
            )}
            aria-hidden={isOpen}
            onMouseLeave={() => {
              setIsLogoHovered(false);
              setIsBorderHovered(false);
              setIsEmptySpaceHovered(false);
            }}
          >
            <div className="flex flex-col items-center relative z-20">
              {/* Brand Emblem / Expand (h-14 container matching header h-14) */}
              <div className="w-[60px] h-14 pt-[env(safe-area-inset-top,0px)] flex items-center justify-center shrink-0">
                <Tooltip open={isOpen || isAnyModalOpen ? false : undefined}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        (e.currentTarget as HTMLElement)?.blur();
                        setIsLogoHovered(false);
                        setIsBorderHovered(false);
                        setIsEmptySpaceHovered(false);
                        onToggle();
                      }}
                      onMouseEnter={() => setIsLogoHovered(true)}
                      onMouseLeave={() => setIsLogoHovered(false)}
                      onBlur={() => setIsLogoHovered(false)}
                      style={{ cursor: isAuthenticated ? "ew-resize" : "pointer" }}
                      className={cn(
                        "group w-11 h-11 rounded-sm flex items-center justify-center text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                        isAuthenticated
                          ? "!cursor-ew-resize [&_*]:!cursor-ew-resize"
                          : "cursor-pointer [&_*]:cursor-pointer"
                      )}
                      aria-label="Open sidebar"
                    >
                      {isAuthenticated && !shouldShowPanelIcon ? (
                        <CloseAIIcon
                          size={26}
                          className="w-5 h-5 pointer-events-none"
                        />
                      ) : (
                        <PanelRight
                          className={cn(
                            "w-5 h-5 pointer-events-none transition-colors",
                            isBorderHovered || isEmptySpaceHovered
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={5}
                    className="text-base"
                  >
                    Open sidebar
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Rail Navigation Items */}
              <div className="flex flex-col items-center gap-1.5 pt-1">
                {/* New Chat */}
                <Tooltip open={isOpen || isAnyModalOpen ? false : undefined}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        handleNewChatAction();
                      }}
                      className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                      aria-label="New chat"
                    >
                      <SquarePen className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={5}
                    className="text-base"
                  >
                    New chat
                  </TooltipContent>
                </Tooltip>

                {user ? (
                  <>
                    {/* Search */}
                    <Tooltip open={isOpen || isAnyModalOpen ? false : undefined}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            handleOpenSearchModal();
                          }}
                          className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                          aria-label="Search chats"
                        >
                          <Search className="w-5 h-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={5}
                        className="text-base"
                      >
                        Search chats
                      </TooltipContent>
                    </Tooltip>

                    {/* Pinned Shortcut */}
                    <Tooltip open={isOpen || isAnyModalOpen ? false : undefined}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={onToggle}
                          className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                          aria-label="Pinned chats"
                        >
                          <Pin className="w-5 h-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={5}
                        className="text-base"
                      >
                        Pinned chats
                      </TooltipContent>
                    </Tooltip>

                    {/* Archived Shortcut */}
                    <Tooltip open={isOpen || isAnyModalOpen ? false : undefined}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={onToggle}
                          className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                          aria-label="Archived chats"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={5}
                        className="text-base"
                      >
                        Archived chats
                      </TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    {/* Create Images */}
                    <Tooltip open={isOpen || isAnyModalOpen ? false : undefined}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenLoginModal({
                              description: "To continue with Create images",
                            });
                          }}
                          className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                          aria-label="Create images"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={5}
                        className="text-base"
                      >
                        Create images
                      </TooltipContent>
                    </Tooltip>

                    {/* Web search */}
                    <HoverCard
                      open={railWebSearchHoverOpen}
                      onOpenChange={(open) => {
                        setRailWebSearchHoverOpen(open);
                        if (open) {
                          onWebSearchHover?.();
                        }
                      }}
                      openDelay={100}
                      closeDelay={300}
                    >
                      <HoverCardTrigger asChild>
                        <button
                          type="button"
                          onMouseEnter={() => {
                            onWebSearchHover?.();
                          }}
                          onClick={() => {
                            handleOpenSearchModal();
                            setRailWebSearchHoverOpen(false);
                            (handleOpenLoginModal || onOpenWebSearchModal)?.({ description: "To continue with Web search" });
                          }}
                          className={cn(
                            "w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                            railWebSearchHoverOpen &&
                              "bg-secondary text-foreground"
                          )}
                          aria-label="Web search"
                        >
                          <Globe className="w-5 h-5" />
                        </button>
                      </HoverCardTrigger>
                      {renderWebSearchHoverCardContent(
                        () => setRailWebSearchHoverOpen(false),
                        "bottom"
                      )}
                    </HoverCard>
                  </>
                )}
              </div>
            </div>

            {/* Middle Empty Space in Collapsed Rail (Expandable for authenticated users) */}
            <div
              data-sidebar-rail-empty
              onClick={(e) => {
                if (isAuthenticated) {
                  (e.currentTarget as HTMLElement)?.blur();
                  setIsEmptySpaceHovered(false);
                  setIsLogoHovered(false);
                  setIsBorderHovered(false);
                  onToggle();
                }
              }}
              onMouseEnter={() => {
                if (isAuthenticated) {
                  setIsEmptySpaceHovered(true);
                }
              }}
              onMouseLeave={() => {
                if (isAuthenticated) {
                  setIsEmptySpaceHovered(false);
                }
              }}
              style={isAuthenticated ? { cursor: "ew-resize" } : undefined}
              className={cn(
                "w-full flex-1 min-h-0 select-none relative z-10",
                isAuthenticated
                  ? "cursor-ew-resize !cursor-ew-resize"
                  : "cursor-default pointer-events-none"
              )}
              aria-hidden="true"
            />

            {/* Rail Bottom Dock (mt-auto) */}
            <div className="mt-auto w-full pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 flex flex-col items-center gap-1.5 relative z-20">
              {isAuthLoading ? (
                <div className="w-11 h-11 flex items-center justify-center animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-secondary/80 dark:bg-neutral-800/80" />
                </div>
              ) : user ? (
                <>
                  {/* Collapsed View Download Button */}
                  <Tooltip open={isOpen || isAnyModalOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          toast.info("App coming soon");
                        }}
                        className="w-11 h-11 rounded-sm flex items-center justify-center shrink-0 transition-colors select-none text-muted-foreground bg-transparent hover:bg-secondary hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                        aria-label="Download app"
                      >
                        <Store className="w-5 h-5 shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={5}
                      className="text-base"
                    >
                      Download app
                    </TooltipContent>
                  </Tooltip>

                  {/* Collapsed Avatar Trigger */}
                  <DropdownMenu
                    open={collapsedAccountMenuOpen}
                    onOpenChange={(open) => {
                      setCollapsedAccountMenuOpen(open);
                      if (!open) setAccountSubView("main");
                    }}
                  >
                    <Tooltip open={isOpen || collapsedAccountMenuOpen || isAnyModalOpen ? false : undefined}>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "w-12 h-12 rounded-sm flex items-center justify-center hover:bg-secondary data-[state=open]:bg-secondary transition-colors cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                              collapsedAccountMenuOpen && "bg-secondary"
                            )}
                            aria-label="Account menu"
                          >
                            {showProfileSkeleton ? (
                              <div className="w-8 h-8 rounded-full bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
                            ) : (
                              <div className="relative z-50 shrink-0 opacity-0">
                                {renderAvatarContent()}
                              </div>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={5}
                        className="text-base"
                      >
                        {displayName}
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                      side="right"
                      align="end"
                      sideOffset={5}
                      className="w-64 max-w-[calc(100vw-24px)] rounded-sm p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none outline-none focus:outline-none ring-0"
                    >
                      {renderAccountMenuItems()}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {/* Rail Plans */}
                  <Tooltip open={isOpen || isAnyModalOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                      <Link
                        href="/product/plans"
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={isOpen ? -1 : 0}
                        className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                        aria-label="Plans"
                      >
                        <CreditCard className="w-5 h-5 shrink-0" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={5}
                      className="text-base"
                    >
                      Plans
                    </TooltipContent>
                  </Tooltip>

                  {/* Rail Help (Middle) */}
                  <DropdownMenu
                    open={railHelpOpen}
                    onOpenChange={setRailHelpOpen}
                  >
                    <Tooltip open={isOpen || railHelpOpen || isAnyModalOpen ? false : undefined}>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            tabIndex={isOpen ? -1 : 0}
                            className={cn(
                              "w-11 h-11 rounded-sm flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                              "text-muted-foreground hover:text-foreground hover:bg-secondary",
                              railHelpOpen && "bg-secondary text-foreground"
                            )}
                            aria-label="Help"
                          >
                            <LifeBuoy className="w-5 h-5 shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        sideOffset={5}
                        className="text-base"
                      >
                        Help
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                      side="right"
                      align="end"
                      sideOffset={12}
                      onCloseAutoFocus={(e) => {
                        e.preventDefault();
                      }}
                      className="w-64 max-w-[calc(100vw-24px)] rounded-sm p-1.5 bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-white/10 select-none outline-none focus:outline-none ring-0 space-y-0.5"
                    >
                      {renderHelpMenuItems()}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Rail Settings */}
                  <Tooltip open={isOpen || isAnyModalOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        tabIndex={isOpen ? -1 : 0}
                        onClick={() =>
                          handleOpenSettings(
                            isMobileScreen ? undefined : "general"
                          )
                        }
                        className="w-11 h-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                        aria-label="Settings"
                      >
                        <Settings className="w-5 h-5 shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={5}
                      className="text-base"
                    >
                      Settings
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>

          {/* Expanded Sidebar View (250px) */}
          <div
            data-sidebar-expanded
            suppressHydrationWarning
            className={cn(
              "w-full xl:w-[250px] xl:min-w-[250px] h-full flex flex-col shrink-0 absolute top-0 left-0 z-10",
              mounted && "xl:transition-[opacity,visibility] xl:duration-200",
              isOpen
                ? "opacity-100 pointer-events-auto visible"
                : "max-xl:opacity-100 max-xl:visible max-xl:pointer-events-none xl:opacity-0 xl:pointer-events-none xl:invisible"
            )}
            aria-hidden={!isOpen}
          >
            <div
              className={cn(
                "h-14 pt-[env(safe-area-inset-top,0px)] flex items-center justify-between relative z-20 shrink-0",
                "px-2 max-xl:px-6 sm:max-xl:px-8"
              )}
            >
              {!user ? (
                <>
                  <Link
                    href="/"
                    className="xl:hidden flex items-center gap-2 max-xl:-ml-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none"
                    aria-label="CloseAI"
                  >
                    <span className="font-medium text-2xl tracking-tight text-foreground transition-opacity hover:opacity-80">
                      CloseAI
                    </span>
                  </Link>
                  <div className="hidden xl:block">
                    <Popover
                      open={guestPopoverOpen}
                      onOpenChange={(open) => {
                        setGuestPopoverOpen(open);
                        if (open) {
                          setWebSearchHoverOpen(false);
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="h-11 px-3 flex items-center rounded-sm hover:bg-secondary data-[state=open]:bg-secondary text-foreground text-xl font-medium tracking-tight transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background group select-none"
                        >
                          <span className="leading-none">CloseAI</span>
                          <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        sideOffset={6}
                        collisionPadding={9}
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        className="w-[330px] p-0 rounded-sm bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-white/10 overflow-hidden text-left z-50 transition-none animate-none duration-0 !transition-none !animate-none outline-none focus:outline-none focus:ring-0"
                      >
                        <div className="h-32 w-full relative overflow-hidden bg-gradient-to-br from-[#9eb1ff] via-[#b6c7ff] to-[#cfe2fe]">
                          <img
                            src="https://api.dicebear.com/10.x/glass/svg?seed=Try%20advanced%20features%20for%20free"
                            alt="Try advanced features for free"
                            className="w-full h-full object-cover select-none pointer-events-none"
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="text-[15.5px] font-semibold text-foreground dark:text-white tracking-tight leading-snug">
                            Try advanced features for free
                          </h4>
                          <p className="text-[13px] text-muted-foreground dark:text-neutral-300 mt-1.5 leading-relaxed">
                            Get smarter responses, upload files, create images, and
                            more by logging in.
                          </p>
                          <div className="flex items-center gap-2.5 mt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setGuestPopoverOpen(false);
                                handleOpenLoginModal();
                              }}
                              className="h-11 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-80 text-base font-medium transition-colors cursor-pointer flex items-center justify-center text-center leading-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background select-none"
                            >
                              Log in
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGuestPopoverOpen(false);
                                handleOpenLoginModal();
                              }}
                              className="h-11 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-white/10 dark:bg-[#1f1f1f] dark:hover:bg-[#2f2f2f] dark:text-white text-base font-normal transition-colors cursor-pointer flex items-center justify-center text-center leading-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background select-none"
                            >
                              Sign up for free
                            </button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              ) : (
                <Link
                  href="/"
                  className="flex items-center gap-2 max-xl:-ml-1.5 px-1.5 py-0.5 rounded-full outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
                  aria-label="CloseAI"
                >
                  <span className="font-medium text-2xl tracking-tight text-foreground transition-opacity hover:opacity-80">
                    CloseAI
                  </span>
                </Link>
              )}

              <div
                className={cn(
                  "flex items-center",
                  user ? "gap-0.5" : "gap-1 xl:gap-0.5"
                )}
              >
                {user ? (
                  <Tooltip open={isOpen && !isAnyModalOpen ? undefined : false}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-11 h-11 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
                        onClick={handleOpenSearchModal}
                      >
                        <Search className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      sideOffset={5}
                      className="text-base"
                    >
                      Search chats
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <>
                    {/* Big Screen Devices: Desktop Search Button for Guest Mode */}
                    <Tooltip open={isOpen && !isAnyModalOpen ? undefined : false}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden xl:inline-flex w-11 h-11 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer outline-none focus:outline-none focus-visible:outline-none xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
                          onClick={() => {
                            handleOpenSearchModal();
                          }}
                        >
                          <Search className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        sideOffset={5}
                        className="text-base"
                      >
                        Search chats
                      </TooltipContent>
                    </Tooltip>

                    {/* Small Screen Devices: Search chats button */}
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenLoginModal({
                          description: "To continue with Search chats",
                        });
                      }}
                      className="xl:hidden w-11 h-11 rounded-full bg-white dark:bg-[#1f1f1f] hover:bg-secondary dark:hover:bg-[#2f2f2f] text-muted-foreground hover:text-foreground border border-border/80 dark:border-white/10 flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none shrink-0"
                      aria-label="Search chats"
                    >
                      <Search className="w-5 h-5 shrink-0" />
                    </button>

                    {/* Small Screen Devices: Sidebar Close Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        (e.currentTarget as HTMLElement)?.blur();
                        setIsCloseBtnHovered(false);
                        setIsLogoHovered(false);
                        setIsBorderHovered(false);
                        setIsEmptySpaceHovered(false);
                        onToggle();
                      }}
                      className="xl:hidden w-11 h-11 rounded-full bg-white dark:bg-[#1f1f1f] hover:bg-secondary dark:hover:bg-[#2f2f2f] text-muted-foreground hover:text-foreground border border-border/80 dark:border-white/10 flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none shrink-0"
                      aria-label="Close sidebar"
                    >
                      <X className="w-5 h-5 shrink-0" />
                    </button>
                  </>
                )}

                <Tooltip open={isOpen && !isAnyModalOpen ? undefined : false}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      style={{ cursor: isAuthenticated ? "ew-resize" : "pointer" }}
                      className={cn(
                        "w-11 h-11 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary outline-none focus:outline-none focus-visible:outline-none xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background",
                        isAuthenticated
                          ? "!cursor-ew-resize [&_*]:!cursor-ew-resize"
                          : "cursor-pointer [&_*]:cursor-pointer",
                        !user && "hidden xl:inline-flex"
                      )}
                      onClick={(e) => {
                        (e.currentTarget as HTMLElement)?.blur();
                        setIsCloseBtnHovered(false);
                        setIsLogoHovered(false);
                        setIsBorderHovered(false);
                        setIsEmptySpaceHovered(false);
                        onToggle();
                      }}
                      onMouseEnter={() => setIsCloseBtnHovered(true)}
                      onMouseLeave={() => setIsCloseBtnHovered(false)}
                    >
                      <PanelLeft className="w-5 h-5 pointer-events-none" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={5}
                    className="text-base"
                  >
                    Close sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* New Chat & Guest Items
                Icon rows use pl-3 (12px): 8px container padding + 12px = icon at x 20 (center x 30),
                the exact same x as the 60px collapsed rail icons. */}
            <div className="px-2 pt-1 pb-2 space-y-1.5 relative z-20">
              {false && (
                <div className="relative group mb-1">
                  <input
                    type="text"
                    placeholder="Search chats"
                    value={searchQuery}
                  />
                </div>
              )}

              <button
                onClick={() => {
                  handleNewChatAction();
                }}
                className={cn(
                  "w-full flex items-center justify-between h-11 pl-3 pr-2.5 rounded-sm hover:bg-secondary text-foreground text-base group cursor-pointer transition-all duration-150 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background",
                  isNewChat && "max-xl:bg-secondary/70",
                  isGuestMode && "max-xl:hidden"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <SquarePen className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                  <span className="whitespace-nowrap">New chat</span>
                </div>
              </button>

              {!user && (
                <>
                  {/* Create Images */}
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenLoginModal({
                        description: "To continue with Create images",
                      });
                    }}
                    className="w-full flex items-center justify-between h-11 pl-3 pr-2.5 rounded-sm hover:bg-secondary text-foreground text-base group cursor-pointer transition-all duration-150 text-left outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
                  >
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="whitespace-nowrap">Create images</span>
                    </div>
                  </button>

                  {/* Web search */}
                  <HoverCard
                    open={webSearchHoverOpen}
                    onOpenChange={(open) => {
                      if (
                        typeof window !== "undefined" &&
                        window.innerWidth < 1280
                      ) {
                        setWebSearchHoverOpen(false);
                        return;
                      }
                      setWebSearchHoverOpen(open);
                      if (open) {
                        setGuestPopoverOpen(false);
                        onWebSearchHover?.();
                      }
                    }}
                    openDelay={100}
                    closeDelay={200}
                  >
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => {
                          if (
                            typeof window !== "undefined" &&
                            window.innerWidth < 1280
                          ) {
                            e.preventDefault();
                            setWebSearchHoverOpen(false);
                            (handleOpenLoginModal || onOpenWebSearchModal)?.({
                              description: "To continue with Search",
                            });
                            return;
                          }
                          setWebSearchHoverOpen(false);
                          (handleOpenLoginModal || onOpenWebSearchModal)?.({
                            description: "To continue with Web search",
                          });
                        }}
                        className={cn(
                          "w-full flex items-center justify-between h-11 pl-3 pr-2.5 rounded-sm hover:bg-secondary text-foreground text-base group cursor-pointer transition-all duration-150 data-[state=open]:bg-secondary outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background",
                          webSearchHoverOpen && "bg-secondary"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Globe
                            className={cn(
                              "w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors",
                              webSearchHoverOpen && "text-foreground"
                            )}
                          />
                          <span className="whitespace-nowrap">Web search</span>
                        </div>
                      </button>
                    </HoverCardTrigger>
                    {renderWebSearchHoverCardContent(
                      () => setWebSearchHoverOpen(false),
                      "bottom"
                    )}
                  </HoverCard>

                  {/* Small Screen Devices: Guest Items moved under Web search */}
                  <div className="xl:hidden w-full flex flex-col space-y-1 select-none pt-0.5">
                    {/* Plans */}
                    <Link
                      href="/product/plans"
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={!isOpen ? -1 : 0}
                      onClick={() => {
                        if (
                          isOpen &&
                          typeof window !== "undefined" &&
                          window.innerWidth < 1280
                        ) {
                          onToggle();
                        }
                      }}
                      className="w-full h-11 pl-3 pr-2.5 flex items-center justify-between rounded-sm hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden outline-none focus:outline-none focus-visible:outline-none"
                      aria-label="Plans"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CreditCard className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                        <span className="text-[14.5px] font-normal leading-normal whitespace-nowrap">
                          Plans
                        </span>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 opacity-100 transition-opacity duration-150" />
                    </Link>

                    {/* Help (last one) */}
                    <DropdownMenu
                      open={mobileHelpMenuOpen && isMobileScreen}
                      onOpenChange={(open) => {
                        setMobileHelpMenuOpen(open);
                        if (open) setGuestHelpMenuOpen(false);
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          tabIndex={!isOpen ? -1 : 0}
                          className={cn(
                            "w-full h-11 pl-3 pr-2.5 flex items-center justify-between rounded-sm hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden outline-none focus:outline-none focus-visible:outline-none",
                            mobileHelpMenuOpen && isMobileScreen && "bg-secondary"
                          )}
                          aria-label="Help"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <LifeBuoy className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                            <span className="text-[14.5px] font-normal leading-normal whitespace-nowrap">
                              Help
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-opacity duration-150" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="start"
                        sideOffset={5}
                        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-trigger-width)] rounded-sm p-1.5 bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-white/10 select-none outline-none focus:outline-none ring-0 space-y-0.5"
                      >
                        {renderHelpMenuItems()}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Divider above 'Get efficient responses' */}
                    <div className="w-full border-t border-border/80 dark:border-white/10 my-1" />

                    {/* Guest Callout Card */}
                    <div className="w-full pt-1 pb-1 px-1 space-y-1.5 select-text text-left">
                      <div className="text-[15.5px] font-semibold text-foreground text-left leading-snug">
                        Get efficient responses
                      </div>
                      <div className="text-[13px] text-muted-foreground leading-snug text-left">
                        Log in to get efficient answers, plus thinking
                        capabilities, upload files and more.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenLoginModal()}
                        className="w-full mt-3 h-11 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-80 text-[15px] font-medium transition-colors cursor-pointer flex items-center justify-center text-center leading-none outline-none focus:outline-none focus-visible:outline-none"
                      >
                        Log in
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Chat History Stream (Only for authenticated users) */}
            {user ? (
              <div
                ref={chatListRef}
                onScroll={(e) => {
                  updateChatListScrollBorders(e.currentTarget);
                }}
                className={cn(
                  "flex-1 px-2 overflow-y-auto border-t transition-colors duration-200 sidebar-scroll min-h-0",
                  chatStreamScrolled
                    ? "border-border/80 dark:border-white/10"
                    : "border-transparent"
                )}
              >
                {isLoading ? (
                  <div className="space-y-5 py-3 px-1 select-none">
                    {/* PINNED Skeleton Group */}
                    <div className="space-y-2">
                      <div className="h-3 w-20 bg-muted-foreground/20 rounded animate-pulse ml-2" />
                      <div className="space-y-1.5">
                        <div className="h-8 w-full bg-secondary/80 dark:bg-neutral-800/60 rounded-sm animate-pulse" />
                      </div>
                    </div>

                    {/* ARCHIVED Skeleton Group */}
                    <div className="space-y-2 pt-1">
                      <div className="h-3 w-24 bg-muted-foreground/20 rounded animate-pulse ml-2" />
                      <div className="space-y-1.5">
                        <div className="h-8 w-full bg-secondary/70 dark:bg-neutral-800/50 rounded-sm animate-pulse" />
                      </div>
                    </div>

                    {/* CHATS Skeleton Group */}
                    <div className="space-y-2 pt-1">
                      <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse ml-2" />
                      <div className="space-y-1.5">
                        <div className="h-8 w-full bg-secondary/70 dark:bg-neutral-800/50 rounded-sm animate-pulse" />
                        <div className="h-8 w-full bg-secondary/70 dark:bg-neutral-800/50 rounded-sm animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    {/* Pinned Section */}
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleSection("Pinned")}
                        className="w-full flex items-center justify-between px-2 py-1 rounded-sm text-[15px] font-semibold tracking-wider text-foreground select-none cursor-pointer transition-colors group/section text-left outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
                      >
                        <span>Pinned</span>
                        <AnimatedChevron
                          open={!collapsedSections["Pinned"]}
                          disableHover
                          orientation="right-down"
                          size={20}
                          className="text-muted-foreground group-hover/section:text-foreground shrink-0 xl:opacity-0 xl:group-hover/section:opacity-100 transition-opacity duration-150"
                        />
                      </button>
                      {!collapsedSections["Pinned"] && (
                        <>
                          {(groupedChats["Pinned"] || []).length === 0 ? (
                            <div className="px-2 py-1 text-[13.5px] text-muted-foreground/60 select-none font-normal">
                              No pinned chats
                            </div>
                          ) : (
                            groupedChats["Pinned"].map((chat) =>
                              renderChatItem(chat)
                            )
                          )}
                        </>
                      )}
                    </div>

                    {/* Archived Section */}
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleSection("Archived")}
                        className="w-full flex items-center justify-between px-2 py-1 rounded-sm text-[15px] font-semibold tracking-wider text-foreground select-none cursor-pointer transition-colors group/section text-left outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
                      >
                        <span>Archived</span>
                        <AnimatedChevron
                          open={!collapsedSections["Archived"]}
                          disableHover
                          orientation="right-down"
                          size={20}
                          className="text-muted-foreground group-hover/section:text-foreground shrink-0 xl:opacity-0 xl:group-hover/section:opacity-100 transition-opacity duration-150"
                        />
                      </button>
                      {!collapsedSections["Archived"] && (
                        <>
                          {(groupedChats["Archived"] || []).length === 0 ? (
                            <div className="px-2 py-1 text-[13.5px] text-muted-foreground/60 select-none font-normal">
                              No archived chats
                            </div>
                          ) : (
                            groupedChats["Archived"].map((chat) =>
                              renderChatItem(chat)
                            )
                          )}
                        </>
                      )}
                    </div>

                    {/* Recents Section */}
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleSection("Recents")}
                        className="w-full flex items-center justify-between px-2 py-1 rounded-sm text-[15px] font-semibold tracking-wider text-foreground select-none cursor-pointer transition-colors group/section text-left outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
                      >
                        <span>Recents</span>
                        <AnimatedChevron
                          open={!collapsedSections["Recents"]}
                          disableHover
                          orientation="right-down"
                          size={20}
                          className="text-muted-foreground group-hover/section:text-foreground shrink-0 xl:opacity-0 xl:group-hover/section:opacity-100 transition-opacity duration-150"
                        />
                      </button>

                      {!collapsedSections["Recents"] && (
                        <>
                          {groupedChats["Recents"].length === 0 ? (
                            <div className="px-2 py-1 text-[13.5px] text-muted-foreground/60 select-none font-normal">
                              {searchQuery ? "No chats found" : "No chats"}
                            </div>
                          ) : (
                            groupedChats["Recents"].map((chat) =>
                              renderChatItem(chat)
                            )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 min-h-0" />
            )}

            {/* Expanded Bottom Dock (mt-auto)
                Signed in: px-2 so the profile row box starts at x 8 and the avatar sits 6px inside it (8 + 6 = 14,
                matching the persistent avatar at x 14 in the 60px rail). Guest: px-2 + pl-3 (12px) rows put icons at x 20 (center x 30). */}
            <div
              className={cn(
                "mt-auto w-full relative z-20 select-none",
                user || isAuthLoading
                  ? cn(
                      "px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] border-t transition-colors duration-200",
                      chatStreamCanScrollDown
                        ? "border-border/80 dark:border-white/10"
                        : "border-transparent"
                    )
                  : "px-2 max-xl:px-6 sm:max-xl:px-8 pt-2 max-xl:pt-0 max-xl:pb-0 pb-[max(env(safe-area-inset-bottom),0.5rem)]"
              )}
            >
              {isAuthLoading ? (
                /* Profile skeleton while the session loads */
                <div className="w-full h-10 flex items-center gap-2.5 pl-[6px] pr-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-secondary/80 dark:bg-neutral-800/80 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 rounded bg-secondary/80 dark:bg-neutral-800/80" />
                    <div className="h-2.5 w-10 rounded bg-secondary/70 dark:bg-neutral-800/60" />
                  </div>
                </div>
              ) : user ? (
                /* Authenticated User Profile Row */
                <div className="w-full h-12 flex items-center justify-between relative">
                  <DropdownMenu
                    open={accountMenuOpen}
                    onOpenChange={(open) => {
                      setAccountMenuOpen(open);
                      if (!open) setAccountSubView("main");
                    }}
                  >
                    <Tooltip open={accountMenuOpen ? false : undefined}>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setAccountMenuOpen((prev) => !prev);
                              }
                            }}
                            className={cn(
                              "w-full h-12 flex items-center justify-between rounded-sm hover:bg-secondary data-[state=open]:bg-secondary transition-colors duration-200 cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background pl-[6px] pr-1.5 min-w-0",
                              accountMenuOpen && "bg-secondary"
                            )}
                          >
                            {/* Profile Section */}
                            <div className="h-full flex items-center justify-start min-w-0 flex-1 gap-2.5 text-left">
                              {showProfileSkeleton ? (
                                <>
                                  {/* Skeleton: avatar + name + plan */}
                                  <div className="w-8 h-8 rounded-full shrink-0 bg-secondary/80 dark:bg-neutral-800/80 animate-pulse" />
                                  <div className="flex-1 min-w-0 space-y-1.5 animate-pulse">
                                    <div className="h-3 w-24 rounded bg-secondary/80 dark:bg-neutral-800/80" />
                                    <div className="h-2.5 w-12 rounded bg-secondary/70 dark:bg-neutral-800/60" />
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Non-blinking avatar placeholder */}
                                  <div className="relative z-50 shrink-0 opacity-0">
                                    {renderAvatarContent()}
                                  </div>

                                  {/* Expanded User Details */}
                                  <div className="flex-1 min-w-0 transition-all duration-200 flex flex-col justify-center py-0.5">
                                    <p className="text-base font-medium text-foreground truncate leading-tight pt-0.5">
                                      {displayName}
                                    </p>
                                    <p
                                      className="text-sm text-muted-foreground leading-tight truncate pb-0.5"
                                      suppressHydrationWarning
                                    >
                                      @{username}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Download App Button */}
                            <div
                              className="shrink-0"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (user) toast.info("App coming soon");
                                    }}
                                    className="w-11 h-11 rounded-sm flex items-center justify-center shrink-0 transition-colors select-none text-muted-foreground hover:text-foreground bg-transparent hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 xl:focus-visible:ring-2 xl:focus-visible:ring-ring xl:focus-visible:ring-offset-2 xl:ring-offset-background"
                                    aria-label="Download app"
                                  >
                                    <Store className="w-5 h-5 shrink-0" />
                                  </button>
                                </TooltipTrigger>

                                <TooltipContent
                                  side="top"
                                  sideOffset={5}
                                  className="text-base"
                                >
                                  Download app
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                    </Tooltip>

                    {/* Account Dropdown */}
                    <DropdownMenuContent
                      side="top"
                      align="start"
                      sideOffset={5}
                      className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-sm p-2 bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm border border-border/80 dark:border-none outline-none focus:outline-none ring-0"
                    >
                      {renderAccountMenuItems()}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                /* Guest Bottom Dock */
                <div className="w-full space-y-1.5 select-none">
                  {/* Desktop Only: Expanded Help, Plans, Settings, and Callout Card */}
                  <div className="hidden xl:block space-y-1.5">
                    {/* Expanded Plans */}
                    <Link
                      id="guest-sidebar-pricing-plans"
                      href="/product/plans"
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={!isOpen ? -1 : 0}
                      className="w-full h-11 pl-3 pr-2.5 flex items-center justify-between rounded-sm hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                      aria-label="Plans"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CreditCard className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                        <span className="text-base font-normal leading-normal whitespace-nowrap">
                          Plans
                        </span>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-150" />
                    </Link>

                    {/* Expanded Help (Middle) */}
                    <DropdownMenu
                      open={guestHelpMenuOpen && !isMobileScreen}
                      onOpenChange={(open) => {
                        setGuestHelpMenuOpen(open);
                        if (open) setMobileHelpMenuOpen(false);
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          tabIndex={!isOpen ? -1 : 0}
                          className={cn(
                            "w-full h-11 pl-3 pr-2.5 flex items-center justify-between rounded-sm hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                            guestHelpMenuOpen && !isMobileScreen && "bg-secondary"
                          )}
                          aria-label="Help"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <LifeBuoy className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                            <span className="text-base font-normal leading-normal whitespace-nowrap">
                              Help
                            </span>
                          </div>
                          <ChevronRight className={cn(
                            "w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-opacity duration-150",
                            guestHelpMenuOpen && !isMobileScreen ? "opacity-100" : "opacity-100 xl:opacity-0 xl:group-hover:opacity-100"
                          )} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="start"
                        sideOffset={5}
                        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-trigger-width)] rounded-sm p-1.5 bg-white dark:bg-[#1f1f1f] border border-border/80 dark:border-white/10 select-none outline-none focus:outline-none ring-0 space-y-0.5"
                      >
                        {renderHelpMenuItems()}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Expanded Settings */}
                    <button
                      type="button"
                      tabIndex={!isOpen ? -1 : 0}
                      onClick={() =>
                        handleOpenSettings(
                          isMobileScreen ? undefined : "general"
                        )
                      }
                      className="w-full h-11 pl-3 pr-2.5 flex items-center justify-between rounded-sm hover:bg-secondary text-foreground group cursor-pointer transition-colors duration-150 select-none overflow-hidden outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                      aria-label="Settings"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                        <span className="text-base font-normal leading-normal whitespace-nowrap">
                          Settings
                        </span>
                      </div>
                    </button>

                    {/* Divider above 'Get efficient responses' */}
                    <div className="w-full border-t border-border/80 dark:border-white/10 my-2" />

                    {/* Desktop Guest Callout Card */}
                    <div className="w-full pt-1 pb-1 px-1 space-y-1.5 select-text text-left">
                      <div className="text-[15.5px] font-semibold text-foreground text-left leading-snug">
                        Get efficient responses
                      </div>
                      <div className="text-[13px] text-muted-foreground leading-snug text-left">
                        Log in to get efficient answers, plus thinking
                        capabilities, upload files and more.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenLoginModal()}
                        className="w-full mt-3 h-11 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-80 text-[15px] font-medium transition-colors cursor-pointer flex items-center justify-center text-center leading-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                      >
                        Log in
                      </button>
                    </div>
                  </div>

                  {/* Small Screen Devices: Guest Bottom Action Dock (Chat + Settings) */}
                  <div className="xl:hidden w-full h-14 pb-[env(safe-area-inset-bottom,0px)] flex items-center justify-between gap-3">
                    {/* Chat button (accent color) */}
                    <button
                      type="button"
                      onClick={() => {
                        handleNewChatAction();
                      }}
                      className="h-11 px-4 rounded-full bg-send-btn text-send-btn-foreground font-medium text-[15px] flex items-center gap-2 hover:opacity-80 active:scale-[0.99] transition-all cursor-pointer outline-none focus:outline-none select-none"
                    >
                      <SquarePen className="w-5 h-5 shrink-0" />
                      <span>Chat</span>
                    </button>

                    {/* Settings button */}
                    <button
                      type="button"
                      tabIndex={!isOpen ? -1 : 0}
                      onClick={() =>
                        handleOpenSettings(
                          isMobileScreen ? undefined : "general"
                        )
                      }
                      className="w-11 h-11 rounded-full bg-white dark:bg-[#1f1f1f] hover:bg-secondary dark:hover:bg-[#2f2f2f] text-muted-foreground hover:text-foreground border border-border/80 dark:border-white/10 flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none shrink-0"
                      aria-label="Settings"
                    >
                      <Settings className="w-5 h-5 shrink-0" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Logout Confirmation Modal — mounted here, outside the isOpen branch,
          so it renders whether the sidebar is expanded or collapsed to the rail. */}
      <LogoutModal
        open={showLogoutModal}
        onOpenChange={(open) => {
          if (!open) {
            closeModalWithSidebarRestore(() => setShowLogoutModal(false));
          } else {
            setShowLogoutModal(true);
          }
        }}
        onConfirm={handleLogoutConfirm}
        userName={user ? displayName : undefined}
        userEmail={user?.email || undefined}
        userAvatar={user ? avatarUrl : undefined}
      />

      {/* Delete Confirmation Modal — same reasoning as above. */}
      <DeleteModal
        open={!!chatToDelete}
        onOpenChange={(open) => {
          if (!open) {
            closeModalWithSidebarRestore(() => setChatToDelete(null));
          }
        }}
        itemTitle={chatToDelete?.title || "New chat"}
        isActive={chatToDelete?.id === currentChatId}
        starred={chatToDelete?.starred}
        archived={chatToDelete?.archived}
        onConfirm={() => {
          if (chatToDelete) {
            onDeleteChat(chatToDelete.id);
            closeModalWithSidebarRestore(() => setChatToDelete(null));
          }
        }}
      />

      {/* Search Chats Modal */}
      <SearchModal
        open={showSearchModal}
        onOpenChange={(open) => {
          if (!open) {
            closeModalWithSidebarRestore(() => setShowSearchModal(false));
          } else {
            handleOpenSearchModal();
          }
        }}
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={handleSearchChatSelect}
        isGuest={!user}
        onOpenLoginModal={() =>
          handleOpenLoginModal({
            description: "To continue with Search chats",
          })
        }
      />

      {/* Report Bug / Feedback Modal */}
      <ReportBugModal
        open={showReportBugModal}
        onOpenChange={(open) => {
          if (!open) {
            closeModalWithSidebarRestore(() => setShowReportBugModal(false));
          } else {
            setShowReportBugModal(true);
          }
        }}
      />
    </>
  );
}

export default Sidebar;
